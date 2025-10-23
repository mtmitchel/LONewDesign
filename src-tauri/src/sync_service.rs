use crate::commands::google::{
    google_workspace_store_get, google_workspace_store_set, GoogleTokenResponse,
    GoogleWorkspaceStoreSetInput,
};
use crate::sync::queue_worker::{self, QueueExecutionResult};
use crate::sync::types::GOOGLE_TASKS_BASE_URL;
use crate::task_metadata;
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{Number, Value};
use sqlx::SqlitePool;
use std::collections::{HashMap, HashSet};
use std::env;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};
use uuid::Uuid;

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
    pub const ACCESS_TOKEN_REFRESH_SKEW_MS: i64 = 60_000;
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

    pub async fn process_queue_only(&self) -> Result<(), String> {
        match self.process_sync_queue().await {
            Ok(_) => {
                self.emit_queue_event(SyncEventStatus::Success, None);
                Ok(())
            }
            Err(err) => {
                self.emit_queue_event(SyncEventStatus::Error, Some(err.clone()));
                Err(err)
            }
        }
    }

    async fn ensure_access_token(&self, force_refresh: bool) -> Result<String, String> {
        let tokens_str = google_workspace_store_get()? // secure store snapshot
            .ok_or_else(|| "Google account not connected".to_string())?;

        println!("[sync_service] tokens_str: {}", tokens_str);

        let mut snapshot: Value = serde_json::from_str(&tokens_str)
            .map_err(|e| format!("Failed to parse stored Google credentials: {}", e))?;

        let (mut access_token, refresh_token, expires_at) = extract_token_fields(&snapshot)?;

        let now_ms = Utc::now().timestamp_millis();
        let needs_refresh = force_refresh
            || access_token.is_none()
            || refresh_token.is_none()
            || expires_at
                .map(|deadline| deadline <= now_ms + Self::ACCESS_TOKEN_REFRESH_SKEW_MS)
                .unwrap_or(true);

        if needs_refresh {
            let refresh_token = refresh_token
                .as_deref()
                .ok_or_else(|| "Missing Google refresh token".to_string())?;

            let refreshed = self.refresh_access_token(refresh_token).await?;
            access_token = Some(refreshed.access_token.clone());

            update_snapshot_with_token(&mut snapshot, refresh_token, &refreshed)?;

            persist_workspace_snapshot(&snapshot)?;
        }

        access_token.ok_or_else(|| "Google access token unavailable".to_string())
    }

    async fn refresh_access_token(
        &self,
        refresh_token: &str,
    ) -> Result<GoogleTokenResponse, String> {
        let client_id = Self::google_oauth_client_id().ok_or_else(|| {
            "Google OAuth client id not configured (set VITE_GOOGLE_OAUTH_CLIENT_ID)".to_string()
        })?;

        let client_secret = Self::google_oauth_client_secret();

        let mut params = vec![
            ("grant_type".to_string(), "refresh_token".to_string()),
            ("refresh_token".to_string(), refresh_token.to_string()),
            ("client_id".to_string(), client_id),
        ];

        if let Some(secret) = client_secret {
            if !secret.is_empty() {
                params.push(("client_secret".to_string(), secret));
            }
        }

        let response = self
            .api_state
            .client()
            .post("https://oauth2.googleapis.com/token")
            .form(&params)
            .send()
            .await
            .map_err(|e| format!("Failed to refresh Google access token: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!(
                "Google token endpoint returned {}: {}",
                status, body
            ));
        }

        let mut tokens = response
            .json::<GoogleTokenResponse>()
            .await
            .map_err(|e| format!("Failed to parse Google token response: {}", e))?;

        if tokens.refresh_token.is_none() {
            tokens.refresh_token = Some(refresh_token.to_string());
        }

        Ok(tokens)
    }

    fn google_oauth_client_id() -> Option<String> {
        env::var("VITE_GOOGLE_OAUTH_CLIENT_ID")
            .or_else(|_| env::var("GOOGLE_OAUTH_CLIENT_ID"))
            .ok()
    }

    fn google_oauth_client_secret() -> Option<String> {
        env::var("VITE_GOOGLE_OAUTH_CLIENT_SECRET")
            .or_else(|_| env::var("GOOGLE_OAUTH_CLIENT_SECRET"))
            .ok()
    }

    pub async fn sync_cycle(&self) -> Result<(), String> {
        let result = (async {
            self.process_sync_queue().await?;
            self.cleanup_duplicate_tasks().await?;
            self.poll_google_tasks().await?;
            Ok::<(), String>(())
        })
        .await;

        match &result {
            Ok(_) => self.emit_sync_event(SyncEventStatus::Success, None),
            Err(err) => self.emit_sync_event(SyncEventStatus::Error, Some(err.clone())),
        }

        result
    }

    async fn process_sync_queue(&self) -> Result<(), String> {
        let mut force_refresh = false;

        for attempt in 0..2 {
            let access_token = match self.ensure_access_token(force_refresh).await {
                Ok(token) => token,
                Err(err) => {
                    eprintln!(
                        "[sync_service] Cannot process queue without access token: {}",
                        err
                    );
                    return Err(err);
                }
            };

            match queue_worker::execute_pending_mutations(
                &self.pool,
                &self.http_client,
                &access_token,
            )
            .await?
            {
                QueueExecutionResult::Completed => return Ok(()),
                QueueExecutionResult::RequiresTokenRefresh => {
                    if attempt == 0 {
                        force_refresh = true;
                        continue;
                    }

                    return Err(
                        "Google access token refresh did not resolve authorization errors"
                            .to_string(),
                    );
                }
            }
        }

        Ok(())
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
        for attempt in 0..2 {
            let access_token = self.ensure_access_token(attempt > 0).await?;

            match self.poll_google_tasks_with_token(&access_token).await {
                Ok(()) => return Ok(()),
                Err(err) => {
                    if attempt == 0 && is_google_unauthorized(&err) {
                        println!(
                            "[sync_service] Google returned 401 during task poll, refreshing token"
                        );
                        continue;
                    }
                    return Err(err);
                }
            }
        }

        Err("Google access token refresh did not resolve task polling errors".to_string())
    }

    async fn poll_google_tasks_with_token(&self, access_token: &str) -> Result<(), String> {
        println!("[sync_service] Polling Google Tasks API");

        // Fetch task lists
        let mut remote_list_ids = HashSet::new();

        let lists_url = format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL);
        let lists_response = self
            .http_client
            .get(&lists_url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

        if !lists_response.status().is_success() {
            let status = lists_response.status();
            let text = lists_response.text().await.unwrap_or_default();
            return Err(format!("Google API error {}: {}", status, text));
        }

        let lists_json: Value = lists_response
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
            let mut remote_google_ids: HashSet<String> = HashSet::new();
            let mut remote_subtask_google_ids: HashSet<String> = HashSet::new();
            let mut remote_subtasks: Vec<Value> = Vec::new();
            let mut total_fetched = 0_usize;
            let mut page_token: Option<String> = None;
            let mut encountered_error = false;

            loop {
                let current_token = page_token.clone();
                let mut request = self
                    .http_client
                    .get(&tasks_url)
                    .bearer_auth(access_token)
                    .query(&[
                        ("showHidden", "true"),
                        ("showCompleted", "true"),
                        ("maxResults", "100"),
                    ]);

                if let Some(ref token) = current_token {
                    request = request.query(&[("pageToken", token.as_str())]);
                }

                let tasks_response = match request.send().await {
                    Ok(r) => r,
                    Err(e) => {
                        eprintln!(
                            "[sync_service] Failed to fetch tasks for list {}: {}",
                            list_id, e
                        );
                        encountered_error = true;
                        break;
                    }
                };

                if !tasks_response.status().is_success() {
                    let status = tasks_response.status();
                    let text = tasks_response.text().await.unwrap_or_default();
                    if status == reqwest::StatusCode::UNAUTHORIZED {
                        return Err(format!(
                            "Google API error {} for list {}: {}",
                            status, list_id, text
                        ));
                    }
                    eprintln!(
                        "[sync_service] Google API error {} for list {}: {}",
                        status, list_id, text
                    );
                    encountered_error = true;
                    break;
                }

                let tasks_json: Value = match tasks_response.json().await {
                    Ok(j) => j,
                    Err(e) => {
                        eprintln!(
                            "[sync_service] Failed to parse tasks for list {}: {}",
                            list_id, e
                        );
                        encountered_error = true;
                        break;
                    }
                };

                if let Some(tasks) = tasks_json.get("items").and_then(|v| v.as_array()) {
                    total_fetched += tasks.len();

                    // Reconcile each task with local database
                    for task in tasks {
                        if let Some(id_str) = task
                            .get("id")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string())
                        {
                            remote_google_ids.insert(id_str);
                        }

                        if task.get("parent").and_then(|v| v.as_str()).is_some() {
                            if let Some(subtask_id) = task.get("id").and_then(|v| v.as_str()) {
                                remote_subtask_google_ids.insert(subtask_id.to_string());
                            }
                            remote_subtasks.push(task.clone());
                            continue;
                        }

                        if let Err(e) = self.reconcile_task(list_id, task).await {
                            eprintln!("[sync_service] Failed to reconcile task: {}", e);
                        }
                    }
                } else if current_token.is_none() {
                    println!("[sync_service] No tasks in list {}", list_id);
                }

                page_token = tasks_json
                    .get("nextPageToken")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                if page_token.is_none() {
                    break;
                }
            }

            if encountered_error {
                continue;
            }

            println!(
                "[sync_service] Found {} tasks in list {}",
                total_fetched, list_id
            );

            if let Err(e) = self
                .prune_missing_remote_tasks(list_id, &remote_google_ids)
                .await
            {
                eprintln!(
                    "[sync_service] Failed pruning missing remote tasks for list {}: {}",
                    list_id, e
                );
            }

            if let Err(e) = self.reconcile_subtasks(list_id, remote_subtasks).await {
                eprintln!(
                    "[sync_service] Failed to reconcile subtasks for list {}: {}",
                    list_id, e
                );
            }

            if let Err(e) = self
                .prune_missing_remote_subtasks(list_id, &remote_subtask_google_ids)
                .await
            {
                eprintln!(
                    "[sync_service] Failed pruning missing subtasks for list {}: {}",
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
            google_id: Option<String>,
            sync_state: String,
            metadata_hash: Option<String>,
            dirty_fields: String,
            has_conflict: bool,
            title: String,
            notes: Option<String>,
            due_date: Option<String>,
            priority: String,
            labels: String,
            status: String,
            time_block: Option<String>,
            sync_error: Option<String>,
        }

        let existing: Option<ExistingTask> = sqlx::query_as(
            "SELECT id, google_id, sync_state, metadata_hash, dirty_fields, has_conflict, title, notes, due_date, priority, labels, status, time_block, sync_error FROM tasks_metadata WHERE google_id = ?",
        )
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

    async fn reconcile_subtasks(&self, list_id: &str, subtasks: Vec<Value>) -> Result<(), String> {
        if subtasks.is_empty() {
            return Ok(());
        }

        let mut grouped: HashMap<String, Vec<Value>> = HashMap::new();
        for subtask in subtasks {
            if let Some(parent_id) = subtask.get("parent").and_then(|v| v.as_str()) {
                grouped
                    .entry(parent_id.to_string())
                    .or_default()
                    .push(subtask);
            }
        }

        let now = chrono::Utc::now().timestamp();

        for (parent_google_id, mut items) in grouped {
            // Ensure deterministic ordering based on Google's lexicographical position string
            items.sort_by(|a, b| {
                let pos_a = a.get("position").and_then(|v| v.as_str()).unwrap_or("");
                let pos_b = b.get("position").and_then(|v| v.as_str()).unwrap_or("");
                pos_a.cmp(pos_b)
            });

            let parent_local_id: Option<String> =
                sqlx::query_scalar("SELECT id FROM tasks_metadata WHERE google_id = ? LIMIT 1")
                    .bind(&parent_google_id)
                    .fetch_optional(&self.pool)
                    .await
                    .map_err(|e| {
                        format!(
                            "Failed to resolve parent task {} for remote subtasks: {}",
                            parent_google_id, e
                        )
                    })?;

            let Some(parent_local_id) = parent_local_id else {
                eprintln!(
                    "[sync_service] Skipping subtasks for parent {} in list {} because local task not found",
                    parent_google_id, list_id
                );
                continue;
            };

            for (index, item) in items.into_iter().enumerate() {
                let task: GoogleTask = serde_json::from_value(item.clone())
                    .map_err(|e| format!("Failed to parse Google subtask payload: {}", e))?;

                let google_id = task.id.clone();
                let status = task
                    .status
                    .clone()
                    .unwrap_or_else(|| "needsAction".to_string());

                let remote_payload = task_metadata::GoogleTaskPayload {
                    title: task.title.clone(),
                    notes: task.notes.clone(),
                    due: task.due.clone(),
                    status: status.clone(),
                };
                let remote_metadata =
                    task_metadata::TaskMetadata::deserialize_from_google(&remote_payload)
                        .normalize();

                let subtask_metadata = task_metadata::SubtaskMetadata {
                    id: String::new(),
                    task_id: parent_local_id.clone(),
                    google_id: Some(google_id.clone()),
                    parent_google_id: Some(parent_google_id.clone()),
                    title: remote_metadata.title.clone(),
                    is_completed: status == "completed",
                    due_date: remote_metadata.due_date.clone(),
                    position: index as i64,
                };

                let normalized = subtask_metadata.normalize();
                let metadata_hash = normalized.compute_hash();

                #[derive(sqlx::FromRow)]
                struct ExistingSubtask {
                    id: String,
                }

                let existing: Option<ExistingSubtask> = sqlx::query_as(
                    "SELECT id, metadata_hash, sync_state FROM task_subtasks WHERE google_id = ?",
                )
                .bind(&google_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| format!("Failed to check existing subtask {}: {}", google_id, e))?;

                if let Some(existing_subtask) = existing {
                    let mut normalized = normalized;
                    normalized.id = existing_subtask.id.clone();

                    sqlx::query(
                        "UPDATE task_subtasks SET task_id = ?, google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = '[]', sync_state = 'synced', sync_error = NULL, last_synced_at = ?, updated_at = ? WHERE id = ?",
                    )
                    .bind(&parent_local_id)
                    .bind(normalized.google_id.as_ref())
                    .bind(normalized.parent_google_id.as_ref())
                    .bind(&normalized.title)
                    .bind(if normalized.is_completed { 1 } else { 0 })
                    .bind(normalized.position)
                    .bind(&normalized.due_date)
                    .bind(&metadata_hash)
                    .bind(now)
                    .bind(now)
                    .bind(&existing_subtask.id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to update subtask {}: {}", existing_subtask.id, e))?;

                    continue;
                }

                let existing_by_hash: Option<String> = sqlx::query_scalar(
                    "SELECT id FROM task_subtasks WHERE task_id = ? AND metadata_hash = ? AND google_id IS NULL LIMIT 1",
                )
                .bind(&parent_local_id)
                .bind(&metadata_hash)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| format!("Failed to check existing subtask by hash: {}", e))?;

                let mut normalized = normalized;

                if let Some(existing_id) = existing_by_hash {
                    normalized.id = existing_id.clone();

                    sqlx::query(
                        "UPDATE task_subtasks SET task_id = ?, google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = '[]', sync_state = 'synced', sync_error = NULL, last_synced_at = ?, updated_at = ? WHERE id = ?",
                    )
                    .bind(&parent_local_id)
                    .bind(normalized.google_id.as_ref())
                    .bind(normalized.parent_google_id.as_ref())
                    .bind(&normalized.title)
                    .bind(if normalized.is_completed { 1 } else { 0 })
                    .bind(normalized.position)
                    .bind(&normalized.due_date)
                    .bind(&metadata_hash)
                    .bind(now)
                    .bind(now)
                    .bind(&existing_id)
                    .execute(&self.pool)
                    .await
                    .map_err(|e| format!("Failed to link subtask {} by hash: {}", existing_id, e))?;

                    continue;
                }

                let new_id = format!("google-subtask-{}", google_id);
                normalized.id = new_id.clone();

                sqlx::query(
                    "INSERT INTO task_subtasks (id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'synced', NULL, ?, ?, ?)",
                )
                .bind(&normalized.id)
                .bind(&parent_local_id)
                .bind(normalized.google_id.as_ref())
                .bind(normalized.parent_google_id.as_ref())
                .bind(&normalized.title)
                .bind(if normalized.is_completed { 1 } else { 0 })
                .bind(normalized.position)
                .bind(&normalized.due_date)
                .bind(&metadata_hash)
                .bind(now)
                .bind(now)
                .bind(now)
                .execute(&self.pool)
                .await
                .map_err(|e| format!("Failed to insert remote subtask {}: {}", google_id, e))?;
            }
        }

        Ok(())
    }

    async fn prune_missing_remote_subtasks(
        &self,
        list_id: &str,
        remote_google_ids: &HashSet<String>,
    ) -> Result<(), String> {
        #[derive(sqlx::FromRow)]
        struct LocalSubtask {
            id: String,
            google_id: String,
        }

        let local_subtasks: Vec<LocalSubtask> = sqlx::query_as(
            "SELECT ts.id, ts.google_id
             FROM task_subtasks ts
             JOIN tasks_metadata tm ON tm.id = ts.task_id
             WHERE tm.list_id = ? AND ts.google_id IS NOT NULL",
        )
        .bind(list_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to load local subtasks for pruning: {}", e))?;

        if local_subtasks.is_empty() {
            return Ok(());
        }

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin subtask pruning transaction: {}", e))?;

        for subtask in local_subtasks {
            if remote_google_ids.contains(&subtask.google_id) {
                continue;
            }

            sqlx::query("DELETE FROM task_subtasks WHERE id = ?")
                .bind(&subtask.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to prune stale subtask {}: {}", subtask.id, e))?;

            println!(
                "[sync_service] Pruned subtask {} missing from Google list {}",
                subtask.id, list_id
            );
        }

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit subtask pruning transaction: {}", e))
    }

    fn emit_sync_event(&self, status: SyncEventStatus, error: Option<String>) {
        let payload = SyncEventPayload {
            status,
            error,
            timestamp_ms: Utc::now().timestamp_millis(),
        };

        if let Err(err) = self.app_handle.emit("tasks:sync:complete", payload) {
            eprintln!(
                "[sync_service] Failed to emit tasks:sync:complete event: {}",
                err
            );
        }
    }

    fn emit_queue_event(&self, status: SyncEventStatus, error: Option<String>) {
        let payload = SyncEventPayload {
            status,
            error,
            timestamp_ms: Utc::now().timestamp_millis(),
        };

        if let Err(err) = self.app_handle.emit("tasks:sync:queue-processed", payload) {
            eprintln!(
                "[sync_service] Failed to emit tasks:sync:queue-processed event: {}",
                err
            );
        }
    }
}

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
enum SyncEventStatus {
    Success,
    Error,
}

#[derive(Clone, Serialize)]
struct SyncEventPayload {
    status: SyncEventStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    timestamp_ms: i64,
}

fn extract_token_fields(
    snapshot: &Value,
) -> Result<(Option<String>, Option<String>, Option<i64>), String> {
    let account = snapshot
        .get("account")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "Stored Google credentials missing account payload".to_string())?;

    let token = account
        .get("token")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "Stored Google credentials missing token payload".to_string())?;

    let access_token = token
        .get("accessToken")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let refresh_token = token
        .get("refreshToken")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let expires_at = token
        .get("accessTokenExpiresAt")
        .and_then(|v| value_to_i64(v));

    Ok((access_token, refresh_token, expires_at))
}

fn update_snapshot_with_token(
    snapshot: &mut Value,
    fallback_refresh_token: &str,
    refreshed: &GoogleTokenResponse,
) -> Result<(), String> {
    let account = snapshot
        .get_mut("account")
        .and_then(|v| v.as_object_mut())
        .ok_or_else(|| "Stored Google credentials missing account payload".to_string())?;

    let token = account
        .get_mut("token")
        .and_then(|v| v.as_object_mut())
        .ok_or_else(|| "Stored Google credentials missing token payload".to_string())?;

    let now_ms = Utc::now().timestamp_millis();

    token.insert(
        "accessToken".to_string(),
        Value::String(refreshed.access_token.clone()),
    );

    let refresh_to_store = refreshed
        .refresh_token
        .as_deref()
        .unwrap_or(fallback_refresh_token)
        .to_string();
    token.insert("refreshToken".to_string(), Value::String(refresh_to_store));

    if let Some(expires_in) = refreshed.expires_in {
        let expires_at = now_ms + (expires_in as i64) * 1000;
        token.insert(
            "accessTokenExpiresAt".to_string(),
            Value::Number(Number::from(expires_at)),
        );
    } else {
        token.remove("accessTokenExpiresAt");
    }

    token.insert(
        "lastRefreshAt".to_string(),
        Value::Number(Number::from(now_ms)),
    );

    if let Some(sync_status) = account
        .get_mut("syncStatus")
        .and_then(|v| v.as_object_mut())
    {
        if let Some(tasks_status) = sync_status.get_mut("tasks").and_then(|v| v.as_object_mut()) {
            tasks_status.insert("lastErrorAt".to_string(), Value::Null);
            tasks_status.insert("lastError".to_string(), Value::Null);
        }
    }

    Ok(())
}

fn persist_workspace_snapshot(snapshot: &Value) -> Result<(), String> {
    let serialised = serde_json::to_string(snapshot)
        .map_err(|e| format!("Failed to serialise Google workspace snapshot: {}", e))?;

    google_workspace_store_set(GoogleWorkspaceStoreSetInput { value: serialised }).map(|_| ())
}

fn value_to_i64(value: &Value) -> Option<i64> {
    if let Some(num) = value.as_i64() {
        Some(num)
    } else if let Some(f) = value.as_f64() {
        Some(f as i64)
    } else if let Some(s) = value.as_str() {
        s.parse::<i64>().ok()
    } else {
        None
    }
}

fn is_google_unauthorized(error: &str) -> bool {
    error.contains("401") && error.to_ascii_lowercase().contains("unauthorized")
}
