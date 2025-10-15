use crate::commands::google::google_workspace_store_get;
use crate::sync::google_client;
use crate::sync::types::{SyncQueueEntry, TaskMetadataRecord, GOOGLE_TASKS_BASE_URL};
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

        let entries: Vec<SyncQueueEntry> = sqlx::query_as(
            "SELECT id, operation, task_id, payload, scheduled_at, status, attempts, last_error, created_at \
             FROM sync_queue \
             WHERE status = 'pending' AND scheduled_at <= ? \
             ORDER BY scheduled_at ASC \
             LIMIT 25"
        )
        .bind(chrono::Utc::now().timestamp())
        .fetch_all(&self.pool)
        .await
        .map_err(|e| format!("Failed to fetch sync queue entries: {}", e))?;

        for entry in entries {
            let claimed = sqlx::query(
                "UPDATE sync_queue SET status = 'processing', attempts = attempts + 1, last_error = NULL WHERE id = ? AND status = 'pending'"
            )
            .bind(&entry.id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to claim sync queue entry {}: {}", entry.id, e))?;

            if claimed.rows_affected() == 0 {
                continue;
            }

            let attempt_number = entry.attempts + 1;

            let result = match entry.operation.as_str() {
                "create" => self.execute_create(&entry, &access_token).await,
                "update" => self.execute_update(&entry, &access_token).await,
                "delete" => self.execute_delete(&entry, &access_token).await,
                "move" => self.execute_move(&entry, &access_token).await,
                other => Err(format!("Unsupported sync operation '{}'", other)),
            };

            if let Err(err) = result {
                eprintln!(
                    "[sync_service] Failed processing sync queue entry {}: {}",
                    entry.id, err
                );
                self.mark_queue_failure(&entry, attempt_number, err).await?;
            }
        }

        Ok(())
    }

    async fn execute_create(
        &self,
        entry: &SyncQueueEntry,
        access_token: &str,
    ) -> Result<(), String> {
        let Some(task) = self.fetch_task_record(&entry.task_id).await? else {
            self.cleanup_queue_entry(&entry.id).await?;
            return Ok(());
        };

        if task.deleted_at.is_some() {
            self.cleanup_tombstoned_create(&entry.id, &task.id).await?;
            return Ok(());
        }

        let payload: serde_json::Value = serde_json::from_str(&entry.payload)
            .map_err(|e| format!("Invalid create payload for {}: {}", entry.id, e))?;

        let google_id = google_client::create_google_task_with_payload(
            &self.http_client,
            access_token,
            &task.list_id,
            payload,
        )
        .await?;

        self.finalize_task_sync(&entry.id, &task, Some(&google_id))
            .await
    }

    async fn execute_update(
        &self,
        entry: &SyncQueueEntry,
        access_token: &str,
    ) -> Result<(), String> {
        let Some(task) = self.fetch_task_record(&entry.task_id).await? else {
            self.cleanup_queue_entry(&entry.id).await?;
            return Ok(());
        };

        if task.deleted_at.is_some() {
            self.cleanup_queue_entry(&entry.id).await?;
            return Ok(());
        }

        let payload: serde_json::Value = serde_json::from_str(&entry.payload)
            .map_err(|e| format!("Invalid update payload for {}: {}", entry.id, e))?;

        if task.google_id.is_none() {
            let google_id = google_client::create_google_task_with_payload(
                &self.http_client,
                access_token,
                &task.list_id,
                payload,
            )
            .await?;
            return self
                .finalize_task_sync(&entry.id, &task, Some(&google_id))
                .await;
        }

        google_client::update_google_task_with_payload(
            &self.http_client,
            access_token,
            &task.list_id,
            task.google_id
                .as_ref()
                .ok_or_else(|| "Missing google_id for update".to_string())?,
            payload,
        )
        .await?;

        self.finalize_task_sync(&entry.id, &task, None).await
    }

    async fn execute_delete(
        &self,
        entry: &SyncQueueEntry,
        access_token: &str,
    ) -> Result<(), String> {
        let task_opt = self.fetch_task_record(&entry.task_id).await?;

        if let Some(task) = task_opt {
            if let Some(google_id) = task.google_id.as_ref() {
                google_client::delete_google_task(
                    &self.http_client,
                    access_token,
                    &task.list_id,
                    google_id,
                )
                .await?;
            }

            let mut tx = self
                .pool
                .begin()
                .await
                .map_err(|e| format!("Failed to begin delete transaction: {}", e))?;

            sqlx::query("DELETE FROM tasks_metadata WHERE id = ?")
                .bind(&task.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to remove task {} after delete: {}", task.id, e))?;

            sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                .bind(&entry.id)
                .execute(&mut *tx)
                .await
                .map_err(|e| format!("Failed to clear delete queue entry {}: {}", entry.id, e))?;

            tx.commit()
                .await
                .map_err(|e| format!("Failed to commit delete transaction: {}", e))?;
        } else {
            self.cleanup_queue_entry(&entry.id).await?;
        }

        Ok(())
    }

    async fn execute_move(&self, entry: &SyncQueueEntry, access_token: &str) -> Result<(), String> {
        let to_list_id: String = serde_json::from_str(&entry.payload)
            .map_err(|e| format!("Invalid move payload {}: {}", entry.id, e))?;

        let Some(task) = self.fetch_task_record(&entry.task_id).await? else {
            self.cleanup_queue_entry(&entry.id).await?;
            return Ok(());
        };

        #[derive(sqlx::FromRow)]
        struct MovePayload {
            title: String,
            notes: Option<String>,
            due_date: Option<String>,
            priority: String,
            labels: String,
            status: String,
            time_block: Option<String>,
        }

        let clone_payload: MovePayload = sqlx::query_as(
            "SELECT title, notes, due_date, priority, labels, status, time_block FROM tasks_metadata WHERE id = ?"
        )
        .bind(&task.id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| format!("Failed to load move payload for {}: {}", task.id, e))?;

        let metadata = task_metadata::TaskMetadata {
            title: clone_payload.title,
            notes: clone_payload.notes,
            due_date: clone_payload.due_date,
            priority: clone_payload.priority,
            labels: clone_payload.labels,
            status: clone_payload.status,
            time_block: clone_payload.time_block,
        };

        let google_payload = serde_json::to_value(metadata.normalize().serialize_for_google())
            .map_err(|e| format!("Failed to serialize move payload: {}", e))?;

        let new_google_id = google_client::create_google_task_with_payload(
            &self.http_client,
            access_token,
            &to_list_id,
            google_payload,
        )
        .await?;

        if let (Some(source_list), Some(old_google_id)) = (
            task.pending_move_from.as_ref(),
            task.pending_delete_google_id.as_ref(),
        ) {
            if let Err(err) = google_client::delete_google_task(
                &self.http_client,
                access_token,
                source_list,
                old_google_id,
            )
            .await
            {
                eprintln!(
                    "[sync_service] Failed to delete old task {} during move: {}",
                    old_google_id, err
                );
            }
        }

        let now = chrono::Utc::now().timestamp();
        sqlx::query(
            "UPDATE tasks_metadata SET list_id = ?, google_id = ?, updated_at = ?, sync_state = 'synced', dirty_fields = '[]', sync_attempts = 0, last_synced_at = ?, sync_error = NULL, pending_move_from = NULL, pending_delete_google_id = NULL WHERE id = ?"
        )
        .bind(&to_list_id)
        .bind(&new_google_id)
        .bind(now)
        .bind(now)
        .bind(&task.id)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to finalize move for task {}: {}", task.id, e))?;

        self.cleanup_queue_entry(&entry.id).await
    }

    async fn cleanup_tombstoned_create(&self, entry_id: &str, task_id: &str) -> Result<(), String> {
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin tombstone cleanup: {}", e))?;

        sqlx::query("DELETE FROM sync_queue WHERE id = ?")
            .bind(entry_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to clear queue entry {}: {}", entry_id, e))?;

        sqlx::query("DELETE FROM tasks_metadata WHERE id = ?")
            .bind(task_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to remove tombstoned task {}: {}", task_id, e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit tombstone cleanup: {}", e))?;

        Ok(())
    }

    async fn mark_queue_failure(
        &self,
        entry: &SyncQueueEntry,
        attempts: i64,
        error: String,
    ) -> Result<(), String> {
        let delay = 2_i64.pow(attempts.clamp(1, 10) as u32);
        let next_run = chrono::Utc::now().timestamp() + delay;

        sqlx::query(
            "UPDATE sync_queue SET status = 'pending', scheduled_at = ?, last_error = ?, attempts = ? WHERE id = ?"
        )
        .bind(next_run)
        .bind(&error)
        .bind(attempts)
        .bind(&entry.id)
        .execute(&self.pool)
        .await
        .map_err(|e| format!("Failed to update sync queue failure state: {}", e))?;

        let _ = sqlx::query(
            "UPDATE tasks_metadata SET sync_state = 'error', sync_error = ?, sync_attempts = ? WHERE id = ?"
        )
        .bind(&error)
        .bind(attempts)
        .bind(&entry.task_id)
        .execute(&self.pool)
        .await;

        Ok(())
    }

    async fn finalize_task_sync(
        &self,
        entry_id: &str,
        task: &TaskMetadataRecord,
        new_google_id: Option<&str>,
    ) -> Result<(), String> {
        let now = chrono::Utc::now().timestamp();

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin sync finalization: {}", e))?;

        sqlx::query(
            "UPDATE tasks_metadata \
             SET google_id = COALESCE(?, google_id), \
                 sync_state = 'synced', \
                 dirty_fields = '[]', \
                 sync_attempts = 0, \
                 last_synced_at = ?, \
                 sync_error = NULL, \
                 last_remote_hash = metadata_hash, \
                 pending_move_from = NULL, \
                 pending_delete_google_id = NULL \
             WHERE id = ?",
        )
        .bind(new_google_id)
        .bind(now)
        .bind(&task.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to update task {} after sync: {}", task.id, e))?;

        sqlx::query("DELETE FROM sync_queue WHERE id = ?")
            .bind(entry_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to delete queue entry {}: {}", entry_id, e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit sync finalization: {}", e))?;

        Ok(())
    }

    async fn cleanup_queue_entry(&self, entry_id: &str) -> Result<(), String> {
        sqlx::query("DELETE FROM sync_queue WHERE id = ?")
            .bind(entry_id)
            .execute(&self.pool)
            .await
            .map_err(|e| format!("Failed to cleanup queue entry {}: {}", entry_id, e))?;
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

    async fn fetch_task_record(&self, task_id: &str) -> Result<Option<TaskMetadataRecord>, String> {
        sqlx::query_as(
            "SELECT id, google_id, list_id, priority, labels, due_date, time_block, notes, status, \
                    metadata_hash, dirty_fields, pending_move_from, pending_delete_google_id, deleted_at, \
                    sync_state, sync_attempts, last_synced_at, last_remote_hash, sync_error \
             FROM tasks_metadata WHERE id = ?"
        )
        .bind(task_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| format!("Failed to fetch task {} for sync: {}", task_id, e))
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
