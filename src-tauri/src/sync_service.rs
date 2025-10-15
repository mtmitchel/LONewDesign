use crate::commands::google::google_workspace_store_get;
use crate::sync::queue_worker;
use crate::sync::types::GOOGLE_TASKS_BASE_URL;
use crate::task_metadata;
use chrono::Utc;
use reqwest::Client;
use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::HashSet;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::time::{interval, Duration};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
struct GoogleToken {
    #[serde(rename = "accessToken")]
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct GoogleAccount {
    token: GoogleToken,
}

#[derive(Debug, Deserialize)]
struct GoogleAuthTokens {
    account: GoogleAccount,
}

#[derive(Debug, Deserialize)]
struct GoogleTask {
    id: String,
    title: String,
    due: Option<String>,
    notes: Option<String>,
    #[serde(default)]
    status: Option<String>,
}

pub struct SyncService {
    pool: SqlitePool,
    http_client: Client,
    app_handle: AppHandle,
    api_state: crate::ApiState,
}

impl SyncService {
    pub fn new(
        pool: SqlitePool,
        http_client: Client,
        app_handle: AppHandle,
        api_state: crate::ApiState,
    ) -> Self {
        Self {
            pool,
            http_client,
            app_handle,
            api_state,
        }
    }

    pub fn start(self: Arc<Self>) {
        let service = self.clone();
        tokio::spawn(async move {
            if let Err(e) = service.sync_cycle().await {
                eprintln!("[sync_service] Initial sync cycle error: {}", e);
            }
        });

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
                println!("[sync_service] tokens_str: {}", tokens_str);
                let tokens: GoogleAuthTokens =
                    serde_json::from_str(&tokens_str).map_err(|e| e.to_string())?;
                Ok(tokens.account.token.access_token)
            }
            None => Err("Not logged in".to_string()),
        }
    }

    pub async fn sync_cycle(&self) -> Result<(), String> {
        self.process_sync_queue().await?;
        self.cleanup_duplicate_tasks().await?;
        self.poll_google_tasks().await?;
        Ok(())
    }

    async fn process_sync_queue(&self) -> Result<(), String> {
        let access_token = match self.get_access_token().await {
            Ok(token) => token,
            Err(err) => {
                eprintln!(
                    "[sync_service] Cannot process queue without access token: {}",
                    err
                );
                return Err(err);
            }
        };

        queue_worker::execute_pending_mutations(
            &self.pool,
            &self.http_client,
            &access_token,
        )
        .await
    }

    async fn cleanup_duplicate_tasks(&self) -> Result<(), String> {
        // Step 1: Remove any orphan shadow entries that lost their google_id linkage
        let orphan_ids: Vec<String> = sqlx::query_scalar(
            "SELECT orphan.id \
             FROM tasks_metadata orphan \
             JOIN tasks_metadata remote \
               ON remote.google_id IS NOT NULL \
              AND remote.id = ('google-' || remote.google_id) \
              AND remote.list_id = orphan.list_id \
              AND remote.title = orphan.title \
              AND IFNULL(remote.notes, '') = IFNULL(orphan.notes, '') \
              AND IFNULL(remote.due_date, '') = IFNULL(orphan.due_date, '') \
             WHERE orphan.google_id IS NULL \
               AND orphan.deleted_at IS NULL \
               AND remote.deleted_at IS NULL \
               AND orphan.sync_state NOT IN ('pending', 'processing')",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to detect orphan duplicate tasks: {}", e))?;

        if !orphan_ids.is_empty() {
            let mut tx = self
                .pool
                .begin()
                .await
                .map_err(|e| format!("Failed to begin orphan duplicate cleanup: {}", e))?;

            for task_id in orphan_ids {
                sqlx::query("DELETE FROM sync_queue WHERE task_id = ?")
                    .bind(&task_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| {
                        format!("Failed to remove queue entries for {}: {}", task_id, e)
                    })?;

                sqlx::query("DELETE FROM tasks_metadata WHERE id = ?")
                    .bind(&task_id)
                    .execute(&mut *tx)
                    .await
                    .map_err(|e| format!("Failed to remove duplicate task {}: {}", task_id, e))?;
            }

            tx.commit()
                .await
                .map_err(|e| format!("Failed to commit orphan duplicate cleanup: {}", e))?;
        }

        // Step 2: Flag fully-synced duplicate tasks (same metadata, different google IDs) for deletion
        #[derive(sqlx::FromRow)]
        struct SyncedDuplicate {
            id: String,
            google_id: String,
            list_id: String,
            sync_state: String,
        }

        let synced_duplicates: Vec<SyncedDuplicate> = sqlx::query_as(
            "SELECT id, google_id, list_id, sync_state FROM (\
                 SELECT id, google_id, list_id, sync_state, \
                        ROW_NUMBER() OVER (PARTITION BY list_id, metadata_hash ORDER BY COALESCE(last_synced_at, updated_at, created_at) DESC) AS rn \
                 FROM tasks_metadata \
                 WHERE deleted_at IS NULL AND google_id IS NOT NULL\
             ) WHERE rn > 1"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to fetch synced duplicate tasks: {}", e))?;

        if synced_duplicates.is_empty() {
            return Ok(());
        }

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin synced duplicate cleanup: {}", e))?;

        for duplicate in synced_duplicates {
            if duplicate.sync_state == "pending_delete" {
                continue;
            }

            let now = Utc::now().timestamp();

            sqlx::query(
                "UPDATE tasks_metadata SET deleted_at = ?, sync_state = 'pending_delete', sync_attempts = 0 WHERE id = ?"
            )
            .bind(now)
            .bind(&duplicate.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to flag duplicate task {} for deletion: {}", duplicate.id, e))?;

            let mutation_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO task_mutation_log (id, task_id, operation, payload, actor, created_at) VALUES (?, ?, 'delete', '', 'system', ?)"
            )
            .bind(&mutation_id)
            .bind(&duplicate.id)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to log duplicate deletion for {}: {}", duplicate.id, e))?;

            sqlx::query("DELETE FROM sync_queue WHERE task_id = ?")
                .bind(&duplicate.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    format!(
                        "Failed to clear existing queue entries for {}: {}",
                        duplicate.id, e
                    )
                })?;

            let queue_id = Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) \
                 VALUES (?, ?, 'delete', '', ?, ?, 'pending', 0)"
            )
            .bind(&queue_id)
            .bind(&duplicate.id)
            .bind(now)
            .bind(now)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to enqueue duplicate {} for remote deletion: {}", duplicate.id, e))?;
        }

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit synced duplicate cleanup: {}", e))?;

        Ok(())
    }

    async fn prune_missing_remote_tasks(
        &self,
        list_id: &str,
        remote_google_ids: &HashSet<String>,
    ) -> Result<(), String> {
        #[derive(sqlx::FromRow)]
        struct LocalTask {
            id: String,
            google_id: Option<String>,
            sync_state: String,
        }

        let local_tasks: Vec<LocalTask> = sqlx::query_as(
            "SELECT id, google_id, sync_state FROM tasks_metadata WHERE list_id = ? AND google_id IS NOT NULL AND deleted_at IS NULL"
        )
        .bind(list_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to load local tasks for pruning: {}", e))?;

        if local_tasks.is_empty() {
            return Ok(());
        }

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin pruning transaction: {}", e))?;

        for task in local_tasks {
            let Some(google_id) = task.google_id.as_ref() else {
                continue;
            };

            if remote_google_ids.contains(google_id) {
                continue;
            }

            if task.sync_state == "pending_delete" {
                continue;
            }

            sqlx::query("DELETE FROM sync_queue WHERE task_id = ?")
                .bind(&task.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    format!(
                        "Failed to clear queue entries for stale task {}: {}",
                        task.id, e
                    )
                })?;

            sqlx::query("DELETE FROM tasks_metadata WHERE id = ?")
                .bind(&task.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| {
                    format!(
                        "Failed to remove stale task {} missing remotely: {}",
                        task.id, e
                    )
                })?;

            println!(
                "[sync_service] Pruned local task {} missing from Google list {}",
                task.id, list_id
            );
        }

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit pruning transaction: {}", e))?;

        Ok(())
    }

    async fn poll_google_tasks(&self) -> Result<(), String> {
        println!("[sync_service] Polling Google Tasks API");

        let access_token = self.get_access_token().await?;

        // Fetch task lists
        let mut remote_list_ids = HashSet::new();

        let lists_url = format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL);
        let lists_response = self
            .http_client
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
            let tasks_response = match self
                .http_client
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

            let mut remote_google_ids: HashSet<String> = HashSet::new();

            // Reconcile each task with local database
            for task in tasks {
                if let Some(id_str) = task
                    .get("id")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                {
                    remote_google_ids.insert(id_str);
                }

                if let Err(e) = self.reconcile_task(list_id, task).await {
                    eprintln!("[sync_service] Failed to reconcile task: {}", e);
                }
            }

            if let Err(e) = self
                .prune_missing_remote_tasks(list_id, &remote_google_ids)
                .await
            {
                eprintln!(
                    "[sync_service] Failed pruning missing remote tasks for list {}: {}",
                    list_id, e
                );
            }
        }

        // Remove task lists that no longer exist remotely
        let local_lists: Vec<(String, Option<String>)> =
            sqlx::query_as("SELECT id, google_id FROM task_lists")
                .fetch_all(&self.pool)
                .await
                .map_err(|e| format!("Failed to fetch local task lists: {}", e))?;

        for (local_id, google_id) in local_lists {
            let remote_identifier = google_id.as_ref().unwrap_or(&local_id);

            if !remote_list_ids.contains(remote_identifier) {
                if google_id.is_none() {
                    println!(
                        "[sync_service] Retaining local task list {} awaiting Google ID assignment",
                        local_id
                    );
                    continue;
                }

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
            sqlx::query("UPDATE task_lists SET title = ?, updated_at = ? WHERE id = ?")
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

    async fn reconcile_task(
        &self,
        list_id: &str,
        task_json: &serde_json::Value,
    ) -> Result<(), String> {
        let task: GoogleTask =
            serde_json::from_value(task_json.clone()).map_err(|e| e.to_string())?;

        let google_id = &task.id;
        let title = &task.title;

        let remote_payload = task_metadata::GoogleTaskPayload {
            title: task.title.clone(),
            notes: task.notes.clone(),
            due: task.due.clone(),
            status: task
                .status
                .clone()
                .unwrap_or_else(|| "needsAction".to_string()),
        };
        let remote_metadata =
            task_metadata::TaskMetadata::deserialize_from_google(&remote_payload).normalize();
        let remote_metadata_hash = remote_metadata.compute_hash();

        let notes_to_store = remote_metadata.notes.clone();
        let due_to_store = remote_metadata.due_date.clone();
        let priority_to_store = remote_metadata.priority.clone();
        let labels_to_store = remote_metadata.labels.clone();
        let status_to_store = remote_metadata.status.clone();
        let time_block_to_store = remote_metadata.time_block.clone();

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
            has_conflict: bool,
        }

        let existing: Option<ExistingTask> =
            sqlx::query_as("SELECT id, sync_state, metadata_hash, has_conflict FROM tasks_metadata WHERE google_id = ?")
                .bind(google_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| format!("Failed to check existing task: {}", e))?;

        eprintln!(
            "[sync_service] Existing task check for {}: {:?}",
            google_id,
            existing.as_ref().map(|t| &t.id)
        );

        if let Some(existing_task) = existing {
            if existing_task.sync_state != "synced"
                && existing_task.metadata_hash.as_ref() != Some(&remote_metadata_hash)
            {
                println!(
                    "[sync_service] CONFLICT DETECTED for task {}. Local is dirty and hashes do not match. Remote wins.",
                    existing_task.id
                );
                sqlx::query("UPDATE tasks_metadata SET has_conflict = 1 WHERE id = ?")
                    .bind(&existing_task.id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to mark task as conflicted: {}", e))?;
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
                "UPDATE tasks_metadata SET list_id = ?, title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, updated_at = ?, sync_state = 'synced', last_synced_at = ?, metadata_hash = ?, dirty_fields = '[]', has_conflict = 0, sync_attempts = 0, sync_error = NULL WHERE id = ?"
            )
            .bind(list_id)
            .bind(&remote_metadata.title)
            .bind(notes_to_store.as_deref())
            .bind(due_to_store.as_deref())
            .bind(&priority_to_store)
            .bind(&labels_to_store)
            .bind(&status_to_store)
            .bind(time_block_to_store.as_deref())
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

            // Check if we have this task with a different local ID (preserve metadata)
            let existing_by_hash: Option<String> = sqlx::query_scalar(
                "SELECT id FROM tasks_metadata WHERE metadata_hash = ? AND list_id = ? AND google_id IS NULL LIMIT 1"
            )
            .bind(&remote_metadata_hash)
            .bind(list_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| format!("Failed to check for existing task by metadata hash: {}", e))?;

            if let Some(existing_id) = existing_by_hash {
                // Update existing task with google_id (preserve metadata)
                eprintln!(
                    "[sync_service] Found existing task {}, linking to google_id {}",
                    existing_id, google_id
                );
                let result = sqlx::query(
                    "UPDATE tasks_metadata SET google_id = ?, list_id = ?, title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, updated_at = ?, sync_state = 'synced', last_synced_at = ?, metadata_hash = ?, dirty_fields = '[]', sync_attempts = 0, sync_error = NULL WHERE id = ?"
                )
                .bind(google_id)
                .bind(list_id)
                .bind(&remote_metadata.title)
                .bind(notes_to_store.as_deref())
                .bind(due_to_store.as_deref())
                .bind(&priority_to_store)
                .bind(&labels_to_store)
                .bind(&status_to_store)
                .bind(time_block_to_store.as_deref())
                .bind(now)
                .bind(now)
                .bind(&remote_metadata_hash)
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

                let result = sqlx::query(
                    "INSERT INTO tasks_metadata (id, google_id, list_id, title, priority, labels, status, due_date, notes, time_block, created_at, updated_at, sync_state, last_synced_at, metadata_hash, dirty_fields)\n                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                )
                .bind(local_id.clone())
                .bind(google_id)
                .bind(list_id)
                .bind(&remote_metadata.title)
                .bind(&priority_to_store)
                .bind(&labels_to_store)
                .bind(&status_to_store)
                .bind(due_to_store.as_deref())
                .bind(notes_to_store.as_deref())
                .bind(time_block_to_store.as_deref())
                .bind(now)
                .bind(now)
                .bind("synced")
                .bind(now)
                .bind(&remote_metadata_hash)
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
