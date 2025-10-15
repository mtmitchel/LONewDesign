use crate::task_metadata;
use crate::commands::google::google_workspace_store_get;
use crate::sync::types::{SyncQueueEntry, GOOGLE_TASKS_BASE_URL};
use crate::task_metadata::TaskMetadata;
use reqwest::Client;
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tauri::AppHandle;

#[derive(Debug, Deserialize)]
struct GoogleAuthTokens {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
}

#[derive(Debug, Deserialize)]
struct GoogleTask {
    id: String,
    title: String,
    due: Option<String>,
    notes: Option<String>,
}

pub struct SyncService {
    pool: SqlitePool,
    http_client: Client,
    app_handle: AppHandle,
}

impl SyncService {
    pub fn new(pool: SqlitePool, http_client: Client, app_handle: AppHandle) -> Self {
        Self { pool, http_client, app_handle }
    }

    pub fn start(self: Arc<Self>) {
        let service = self.clone();
        tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(60));
            loop {
                ticker.tick().await;
                if let Err(e) = service.sync_cycle().await {
                    eprintln!("[sync_service] Sync cycle error: {}", e);
                }
            }
        });
    }

    async fn get_access_token(&self) -> Result<String, String> {
        match google_workspace_store_get()? {
            Some(tokens_str) => {
                let tokens: GoogleAuthTokens = serde_json::from_str(&tokens_str).map_err(|e| e.to_string())?;
                Ok(tokens.access_token)
            }
            None => Err("Not logged in".to_string()),
        }
    }

    async fn sync_cycle(&self) -> Result<(), String> {
        self.process_sync_queue().await?;
        self.poll_google_tasks().await?;
        Ok(())
    }

    async fn process_sync_queue(&self) -> Result<(), String> {
        let entries: Vec<SyncQueueEntry> = sqlx::query_as(
            "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY scheduled_at LIMIT 10",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to fetch sync queue entries: {}", e))?;

        for entry in entries {
            let result = match entry.operation.as_str() {
                "create" => self.execute_create(&entry).await,
                "update" => self.execute_update(&entry).await,
                "delete" => self.execute_delete(&entry).await,
                _ => Err(format!("Unknown sync operation: {}", entry.operation)),
            };

            if let Err(e) = result {
                eprintln!("[sync_service] Failed to execute sync entry {}: {}", entry.id, e);
                let attempts = entry.attempts + 1;
                if attempts > 5 {
                    sqlx::query("UPDATE sync_queue SET status = 'failed', last_error = ? WHERE id = ?")
                        .bind(e)
                        .bind(&entry.id)
                        .execute(&self.pool)
                        .await
                        .map_err(|e| e.to_string())?;
                } else {
                    let delay = 2i64.pow(attempts as u32);
                    sqlx::query("UPDATE sync_queue SET attempts = ?, scheduled_at = scheduled_at + ? WHERE id = ?")
                        .bind(attempts)
                        .bind(delay)
                        .bind(&entry.id)
                        .execute(&self.pool)
                        .await
                        .map_err(|e| e.to_string())?;
                }
            }
        }

        Ok(())
    }

    async fn execute_create(&self, entry: &SyncQueueEntry) -> Result<(), String> {
        let access_token = self.get_access_token().await?;

        let metadata: TaskMetadata = serde_json::from_str(&entry.payload).unwrap();
        let google_task = metadata.serialize_for_google();

        let response = self.http_client
            .post(format!("https://tasks.googleapis.com/tasks/v1/lists/{}/tasks", entry.task_id))
            .bearer_auth(access_token)
            .json(&google_task)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                .bind(&entry.id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            // TODO: Handle error
        }

        Ok(())
    }

    async fn execute_update(&self, entry: &SyncQueueEntry) -> Result<(), String> {
        let access_token = self.get_access_token().await?;

        let metadata: TaskMetadata = serde_json::from_str(&entry.payload).unwrap();
        let google_task = metadata.serialize_for_google();

        let response = self.http_client
            .patch(format!("https://tasks.googleapis.com/tasks/v1/lists/{}/tasks/{}", entry.task_id, entry.task_id))
            .bearer_auth(access_token)
            .json(&google_task)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                .bind(&entry.id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            // TODO: Handle error
        }

        Ok(())
    }

    async fn execute_delete(&self, entry: &SyncQueueEntry) -> Result<(), String> {
        let access_token = self.get_access_token().await?;

        let response = self.http_client
            .delete(format!("https://tasks.googleapis.com/tasks/v1/lists/{}/tasks/{}", entry.task_id, entry.task_id))
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if response.status().is_success() {
            sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                .bind(&entry.id)
                .execute(&self.pool)
                .await
                .map_err(|e| e.to_string())?;
        } else {
            // TODO: Handle error
        }

        Ok(())
    }

    async fn poll_google_tasks(&self) -> Result<(), String> {
        println!("[sync_service] Polling Google Tasks API");

        let access_token = self.get_access_token().await?;

        // Fetch task lists
        let mut remote_list_ids = HashSet::new();

        let lists_url = format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL);
        let lists_response = self.http_client
            .get(&lists_url)
            .bearer_auth(&access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

        if !lists_response.status().is_success() {
            let status = lists_response.status();
            let text = lists_response.text().await.unwrap_or_default();
            return Err(format!("Google API error {}: {}", status, text));
        }

        let lists_json: serde_json::Value = lists_response
            .json()
            .await
            .map_err(|e| format!("Failed to parse lists response: {}", e))?;

        let lists = lists_json
            .get("items")
            .and_then(|v| v.as_array())
            .ok_or_else(|| "No task lists found".to_string())?;

        println!("[sync_service] Fetched {} task lists", lists.len());

        // Store task lists in database
        for list in lists {
            if let Err(e) = self.reconcile_task_list(list).await {
                eprintln!("[sync_service] Failed to reconcile task list: {}", e);
            }
        }

        // Fetch tasks from each list
        for list in lists {
            let list_id = match list.get("id").and_then(|v| v.as_str()) {
                Some(id) => id,
                None => {
                    eprintln!("[sync_service] Skipping list with no id");
                    continue;
                }
            };

            remote_list_ids.insert(list_id.to_string());

            println!("[sync_service] Fetching tasks from list {}", list_id);

            let tasks_url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
            let tasks_response = match self.http_client
                .get(&tasks_url)
                .bearer_auth(&access_token)
                .send()
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    eprintln!(
                        "[sync_service] Failed to fetch tasks for list {}: {}",
                        list_id, e
                    );
                    continue;
                }
            };

            if !tasks_response.status().is_success() {
                let status = tasks_response.status();
                let text = tasks_response.text().await.unwrap_or_default();
                eprintln!(
                    "[sync_service] Google API error {} for list {}: {}",
                    status, list_id, text
                );
                continue;
            }

            let tasks_json: serde_json::Value = match tasks_response.json().await {
                Ok(j) => j,
                Err(e) => {
                    eprintln!(
                        "[sync_service] Failed to parse tasks for list {}: {}",
                        list_id, e
                    );
                    continue;
                }
            };

            let tasks = match tasks_json.get("items").and_then(|v| v.as_array()) {
                Some(t) => t,
                None => {
                    println!("[sync_service] No tasks in list {}", list_id);
                    continue;
                }
            };

            println!(
                "[sync_service] Found {} tasks in list {}",
                tasks.len(),
                list_id
            );

            // Reconcile each task with local database
            for task in tasks {
                if let Err(e) = self.reconcile_task(list_id, task).await {
                    eprintln!("[sync_service] Failed to reconcile task: {}", e);
                }
            }
        }

        // Remove task lists that no longer exist remotely
        let local_lists: Vec<(String,)> = sqlx::query_as("SELECT id FROM task_lists")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| format!("Failed to fetch local task lists: {}", e))?;

        for (local_id,) in local_lists {
            if !remote_list_ids.contains(&local_id) {
                println!(
                    "[sync_service] Removing local task list {} not found in Google Tasks",
                    local_id
                );
                sqlx::query("DELETE FROM tasks_metadata WHERE list_id = ?")
                    .bind(&local_id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to delete tasks for removed list: {}", e))?;

                sqlx::query("DELETE FROM task_lists WHERE id = ?")
                    .bind(&local_id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to delete removed task list: {}", e))?;
            }
        }

        Ok(())
    }

    async fn reconcile_task_list(&self, list: &serde_json::Value) -> Result<(), String> {
        let list_id = list
            .get("id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Task list missing id".to_string())?;

        let title = list
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("Untitled List");

        let now = chrono::Utc::now().timestamp();

        // Check if list exists
        let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
            .bind(list_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| format!("Failed to check existing list: {}", e))?;

        if exists.is_some() {
            // Update existing list
            sqlx::query(
                "UPDATE task_lists SET title = ?, updated_at = ? WHERE id = ?",
            )
            .bind(title)
            .bind(now)
            .bind(list_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update list: {}", e))?;

            eprintln!("[sync_service] Updated task list {} ({})", list_id, title);
        } else {
            // Insert new list
            sqlx::query(
                "INSERT INTO task_lists (id, google_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            )
            .bind(list_id)
            .bind(list_id)
            .bind(title)
            .bind(now)
            .bind(now)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to insert list: {}", e))?;

            eprintln!("[sync_service] Inserted task list {} ({})", list_id, title);
        }

        Ok(())
    }

    async fn reconcile_task(&self, list_id: &str, task_json: &serde_json::Value) -> Result<(), String> {
        let task: GoogleTask = serde_json::from_value(task_json.clone()).map_err(|e| e.to_string())?;

        let google_id = &task.id;
        let title = &task.title;

        // Store the title in the notes field (this is what the frontend displays)
        let notes_to_store = Some(title.to_string());
        // Parse Google due date if present
        let due_to_store = task.due.as_ref().map(|s| {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(s) {
                dt.date_naive().to_string()
            } else if s.len() >= 10 && s.as_bytes()[4] == b'-' && s.as_bytes()[7] == b'-' {
                s[..10].to_string()
            } else {
                s.to_string()
            }
        });

        let now = chrono::Utc::now().timestamp();

        eprintln!(
            "[sync_service] Reconciling task google_id={}, title={}",
            google_id, title
        );

        // Check if task exists locally by google_id
        #[derive(sqlx::FromRow)]
        struct ExistingTask {
            id: String,
            sync_state: String,
            metadata_hash: Option<String>,
        }

        let existing: Option<ExistingTask> =
            sqlx::query_as("SELECT id, sync_state, metadata_hash FROM tasks_metadata WHERE google_id = ?")
                .bind(google_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| format!("Failed to check existing task: {}", e))?;

        eprintln!(
            "[sync_service] Existing task check for {}: {:?}",
            google_id,
            existing.as_ref().map(|t| &t.id)
        );

        let remote_metadata = task_metadata::TaskMetadata {
            title: title.to_string(),
            notes: task.notes.clone(),
            due_date: task.due.clone(),
            priority: "none".to_string(),
            labels: "[]".to_string(),
            status: "needsAction".to_string(),
            time_block: None,
        };
        let remote_metadata_hash = remote_metadata.compute_hash();

        if let Some(existing_task) = existing {
            if existing_task.sync_state != "synced" && existing_task.metadata_hash.as_ref() != Some(&remote_metadata_hash) {
                println!(
                    "[sync_service] CONFLICT DETECTED for task {}. Local is dirty and hashes do not match. Remote wins.",
                    existing_task.id
                );
            }

            // Update existing task
            eprintln!(
                "[sync_service] Task exists, updating id={}",
                existing_task.id
            );
            if existing_task.sync_state == "pending_move" {
                println!(
                    "[sync_service] Skipping update for task {} because move is pending",
                    existing_task.id
                );
                return Ok(());
            }

            let result = sqlx::query(
                "UPDATE tasks_metadata SET list_id = ?, notes = ?, due_date = COALESCE(?, due_date), updated_at = ?, sync_state = 'synced', last_synced_at = ?, metadata_hash = ? WHERE id = ?"
            )
            .bind(list_id)
            .bind(notes_to_store.as_deref())
            .bind(due_to_store.as_deref())
            .bind(now)
            .bind(now)
            .bind(&remote_metadata_hash)
            .bind(&existing_task.id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to update task: {}", e))?;

            eprintln!(
                "[sync_service] UPDATE affected {} rows",
                result.rows_affected()
            );
            println!(
                "[sync_service] Updated task {} (google_id: {})",
                existing_task.id, google_id
            );
        } else {
            // Skip remote task if we're waiting to delete it as part of a pending move
            let pending_move_match: Option<String> = sqlx::query_scalar(
                "SELECT id FROM tasks_metadata WHERE pending_delete_google_id = ? LIMIT 1",
            )
            .bind(google_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| format!("Failed to check pending move for task: {}", e))?;

            if pending_move_match.is_some() {
                println!(
                    "[sync_service] Ignoring remote task {} because a move is pending locally",
                    google_id
                );
                return Ok(());
            }

            // Check if we have this task with a different local ID (preserve existing metadata)
            let existing_by_id: Option<(String, String, String)> = sqlx::query_as(
                "SELECT id, priority, labels FROM tasks_metadata WHERE notes = ? AND list_id = ? AND google_id IS NULL LIMIT 1"
            )
            .bind(notes_to_store.as_deref())
            .bind(list_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| format!("Failed to check for existing task by content: {}", e))?;

            if let Some((existing_id, _existing_priority, _existing_labels)) = existing_by_id {
                // Update existing task with google_id (preserve metadata)
                eprintln!(
                    "[sync_service] Found existing task {}, linking to google_id {}",
                    existing_id, google_id
                );
                let result = sqlx::query(
                    "UPDATE tasks_metadata SET google_id = ?, list_id = ?, notes = ?, due_date = COALESCE(?, due_date), updated_at = ?, sync_state = 'synced', last_synced_at = ? WHERE id = ?"
                )
                .bind(google_id)
                .bind(list_id)
                .bind(notes_to_store.as_deref())
                .bind(due_to_store.as_deref())
                .bind(now)
                .bind(now)
                .bind(&existing_id)
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to link existing task: {}", e))?;

                eprintln!(
                    "[sync_service] UPDATE affected {} rows",
                    result.rows_affected()
                );
                println!(
                    "[sync_service] Linked existing task {} to google_id {}",
                    existing_id, google_id
                );
            } else {
                // Insert truly new task with defaults
                let local_id = format!("google-{}", google_id);
                eprintln!(
                    "[sync_service] Task does NOT exist, inserting new id={}",
                    local_id
                );

                let metadata = task_metadata::TaskMetadata {
                    title: title.to_string(),
                    notes: task.notes.clone(),
                    due_date: task.due.clone(),
                    priority: "none".to_string(),
                    labels: "[]".to_string(),
                    status: "needsAction".to_string(),
                    time_block: None,
                };
                let metadata_hash = metadata.compute_hash();

                let result = sqlx::query(
                    "INSERT INTO tasks_metadata (id, google_id, list_id, title, priority, labels, due_date, notes, created_at, updated_at, sync_state, last_synced_at, metadata_hash, dirty_fields)\n                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                )
                .bind(local_id.clone())
                .bind(google_id)
                .bind(list_id)
                .bind(title)
                .bind("none")
                .bind("[]")
                .bind(task.due.as_deref())
                .bind(task.notes.as_deref())
                .bind(now)
                .bind(now)
                .bind("synced")
                .bind(now)
                .bind(metadata_hash)
                .bind("[]")
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to insert task: {}", e))?;

                eprintln!(
                    "[sync_service] INSERT affected {} rows",
                    result.rows_affected()
                );
                println!(
                    "[sync_service] Inserted new task {} (google_id: {})",
                    local_id, google_id
                );
            }
        }

        

        Ok(())

    }

}
