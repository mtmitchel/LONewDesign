//! Sync queue processing for task mutations

use reqwest::Client;
use sqlx::SqlitePool;

use crate::sync::google_client;
use crate::sync::types::{SyncQueueEntry, TaskMetadataRecord};
use crate::task_metadata;

#[derive(Debug, PartialEq, Eq)]
pub enum QueueExecutionResult {
    Completed,
    RequiresTokenRefresh,
}

/// Executes pending mutations from the sync queue
///
/// Processes up to 25 pending entries, executing CREATE, UPDATE, or DELETE operations
/// against the Google Tasks API. Returns [`QueueExecutionResult::RequiresTokenRefresh`] when
/// Google responds with 401 so the caller can refresh credentials before retrying.
pub async fn execute_pending_mutations(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
) -> Result<QueueExecutionResult, String> {
    let now = chrono::Utc::now().timestamp();
    let pending_entries: Vec<SyncQueueEntry> = sqlx::query_as(
        "SELECT id, operation, task_id, payload, scheduled_at, status, attempts, last_error, created_at \
         FROM sync_queue \
         WHERE status = 'pending' AND scheduled_at <= ? \
         ORDER BY scheduled_at ASC \
         LIMIT 25"
    )
    .bind(now)
    .fetch_all(db_pool)
    .await
    .map_err(|e| format!("Failed to fetch sync queue entries: {}", e))?;

    if pending_entries.is_empty() {
        return Ok(QueueExecutionResult::Completed);
    }

    for entry in pending_entries {
        // Claim the entry by moving it to processing. If another worker already claimed it, skip.
        let claim = sqlx::query(
            "UPDATE sync_queue SET status = 'processing', attempts = attempts + 1, last_error = NULL WHERE id = ? AND status = 'pending'"
        )
        .bind(&entry.id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to claim sync queue entry {}: {}", entry.id, e))?;

        if claim.rows_affected() == 0 {
            // Another worker processed this entry.
            continue;
        }

        let attempt_number = entry.attempts + 1;

        match process_queue_entry(db_pool, http_client, access_token, &entry).await {
            Ok(_) => {
                println!(
                    "[sync_service] Successfully processed sync queue entry {} (task {})",
                    entry.id, entry.task_id
                );
            }
            Err(err) => {
                if is_unauthorized_error(&err) {
                    eprintln!(
                        "[sync_service] Google API returned unauthorized for queue entry {}: {}",
                        entry.id, err
                    );
                    revert_queue_entry_claim(db_pool, &entry, &err).await?;
                    return Ok(QueueExecutionResult::RequiresTokenRefresh);
                }

                eprintln!(
                    "[sync_service] Failed processing sync queue entry {}: {}",
                    entry.id, err
                );
                mark_queue_failure(db_pool, &entry, attempt_number, err).await?;
            }
        }
    }

    Ok(QueueExecutionResult::Completed)
}

async fn process_queue_entry(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    match entry.operation.as_str() {
        "create" => process_create_operation(db_pool, http_client, access_token, entry).await,
        "update" => process_update_operation(db_pool, http_client, access_token, entry).await,
        "delete" => process_delete_operation(db_pool, http_client, access_token, entry).await,
        "move" => process_move_operation(db_pool, http_client, access_token, entry).await,
        other => Err(format!("Unsupported sync operation '{}'", other)),
    }
}

async fn process_create_operation(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    let Some(task) = fetch_task_record(db_pool, &entry.task_id).await? else {
        cleanup_queue_entry(db_pool, &entry.id).await?;
        return Ok(());
    };

    if task.deleted_at.is_some() {
        let mut tx = db_pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin transaction for tombstoned create: {}", e))?;

        sqlx::query("DELETE FROM sync_queue WHERE id = ?")
            .bind(&entry.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to clear queue entry {}: {}", entry.id, e))?;

        sqlx::query("DELETE FROM tasks_metadata WHERE id = ?")
            .bind(&task.id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to remove tombstoned task {}: {}", task.id, e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Failed to commit tombstone cleanup: {}", e))?;

        return Ok(());
    }

    let payload = parse_queue_payload(entry)?;
    let payload_hash = payload_metadata_hash(&payload)?;

    let google_id = google_client::create_google_task_with_payload(
        http_client,
        access_token,
        &task.list_id,
        payload.clone(),
    )
    .await?;

    finalize_task_sync(db_pool, entry, &task, Some(&google_id), &payload_hash).await
}

async fn process_update_operation(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    let Some(task) = fetch_task_record(db_pool, &entry.task_id).await? else {
        cleanup_queue_entry(db_pool, &entry.id).await?;
        return Ok(());
    };

    if task.deleted_at.is_some() {
        cleanup_queue_entry(db_pool, &entry.id).await?;
        return Ok(());
    }

    let payload = parse_queue_payload(entry)?;
    let payload_hash = payload_metadata_hash(&payload)?;

    if task.google_id.is_none() {
        let google_id = google_client::create_google_task_with_payload(
            http_client,
            access_token,
            &task.list_id,
            payload.clone(),
        )
        .await?;

        return finalize_task_sync(db_pool, entry, &task, Some(&google_id), &payload_hash).await;
    }

    google_client::update_google_task_with_payload(
        http_client,
        access_token,
        &task.list_id,
        task.google_id
            .as_ref()
            .ok_or_else(|| "Missing google_id for update".to_string())?,
        payload.clone(),
    )
    .await?;

    finalize_task_sync(db_pool, entry, &task, None, &payload_hash).await
}

async fn process_delete_operation(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    let task_opt = fetch_task_record(db_pool, &entry.task_id).await?;

    if let Some(task) = task_opt {
        if let Some(google_id) = task.google_id.as_ref() {
            google_client::delete_google_task(http_client, access_token, &task.list_id, google_id)
                .await?;
        }

        let mut tx = db_pool
            .begin()
            .await
            .map_err(|e| format!("Failed to begin transaction for delete success: {}", e))?;

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
        cleanup_queue_entry(db_pool, &entry.id).await?;
    }

    Ok(())
}

async fn process_move_operation(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    let to_list_id: String = serde_json::from_str(&entry.payload)
        .map_err(|e| format!("Invalid move payload {}: {}", entry.id, e))?;

    let Some(task) = fetch_task_record(db_pool, &entry.task_id).await? else {
        cleanup_queue_entry(db_pool, &entry.id).await?;
        return Ok(());
    };

    if task.deleted_at.is_some() {
        cleanup_queue_entry(db_pool, &entry.id).await?;
        return Ok(());
    }

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
        "SELECT title, notes, due_date, priority, labels, status, time_block FROM tasks_metadata WHERE id = ?",
    )
    .bind(&task.id)
    .fetch_one(db_pool)
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

    let normalized = metadata.normalize();
    let google_payload_value = serde_json::to_value(normalized.serialize_for_google())
        .map_err(|e| format!("Failed to serialize move payload: {}", e))?;
    let payload_hash = payload_metadata_hash(&google_payload_value)?;

    let new_google_id = google_client::create_google_task_with_payload(
        http_client,
        access_token,
        &to_list_id,
        google_payload_value,
    )
    .await?;

    if let (Some(source_list), Some(old_google_id)) = (
        task.pending_move_from.as_ref(),
        task.pending_delete_google_id.as_ref(),
    ) {
        if let Err(err) = google_client::delete_google_task(
            http_client,
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
        "UPDATE tasks_metadata SET list_id = ?, google_id = ?, updated_at = ?, sync_state = 'synced', dirty_fields = '[]', sync_attempts = 0, last_synced_at = ?, sync_error = NULL, pending_move_from = NULL, pending_delete_google_id = NULL, last_remote_hash = ? WHERE id = ?",
    )
    .bind(&to_list_id)
    .bind(&new_google_id)
    .bind(now)
    .bind(now)
    .bind(&payload_hash)
    .bind(&task.id)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to finalize move for task {}: {}", task.id, e))?;

    cleanup_queue_entry(db_pool, &entry.id).await
}

async fn fetch_task_record(
    db_pool: &SqlitePool,
    task_id: &str,
) -> Result<Option<TaskMetadataRecord>, String> {
    sqlx::query_as(
        "SELECT id, google_id, list_id, priority, labels, due_date, time_block, notes, status, \
            metadata_hash, dirty_fields, pending_move_from, pending_delete_google_id, deleted_at, \
            sync_state, sync_attempts, last_synced_at, last_remote_hash, sync_error \
         FROM tasks_metadata WHERE id = ?",
    )
    .bind(task_id)
    .fetch_optional(db_pool)
    .await
    .map_err(|e| format!("Failed to fetch task {} for sync: {}", task_id, e))
}

async fn cleanup_queue_entry(db_pool: &SqlitePool, entry_id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM sync_queue WHERE id = ?")
        .bind(entry_id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to cleanup queue entry {}: {}", entry_id, e))?;
    Ok(())
}

async fn revert_queue_entry_claim(
    db_pool: &SqlitePool,
    entry: &SyncQueueEntry,
    error: &str,
) -> Result<(), String> {
    sqlx::query(
        "UPDATE sync_queue SET status = 'pending', attempts = ?, last_error = ? WHERE id = ?",
    )
    .bind(entry.attempts)
    .bind(error)
    .bind(&entry.id)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to revert queue entry {} after auth error: {}", entry.id, e))?;

    Ok(())
}

async fn mark_queue_failure(
    db_pool: &SqlitePool,
    entry: &SyncQueueEntry,
    attempts: i64,
    error: String,
) -> Result<(), String> {
    let delay = google_client::backoff_seconds(attempts);
    let next_run = chrono::Utc::now().timestamp() + delay;

    sqlx::query(
        "UPDATE sync_queue SET status = 'pending', scheduled_at = ?, last_error = ?, attempts = ? WHERE id = ?"
    )
    .bind(next_run)
    .bind(&error)
    .bind(attempts)
    .bind(&entry.id)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to update sync queue failure state: {}", e))?;

    let _ = sqlx::query(
        "UPDATE tasks_metadata SET sync_state = 'error', sync_error = ?, sync_attempts = ? WHERE id = ?"
    )
    .bind(&error)
    .bind(attempts)
    .bind(&entry.task_id)
    .execute(db_pool)
    .await;

    Ok(())
}

fn parse_queue_payload(entry: &SyncQueueEntry) -> Result<serde_json::Value, String> {
    serde_json::from_str(&entry.payload)
        .map_err(|e| format!("Invalid JSON payload for queue entry {}: {}", entry.id, e))
}

fn payload_metadata_hash(payload: &serde_json::Value) -> Result<String, String> {
    let google_payload: task_metadata::GoogleTaskPayload = serde_json::from_value(payload.clone())
        .map_err(|e| format!("Failed to parse queue payload for hashing: {}", e))?;
    let metadata = task_metadata::TaskMetadata::deserialize_from_google(&google_payload);
    Ok(metadata.compute_hash())
}

fn is_unauthorized_error(error: &str) -> bool {
    error.contains("401") && error.to_ascii_lowercase().contains("unauthorized")
}

fn derive_post_sync_state(task: &TaskMetadataRecord, payload_hash: &str) -> (String, String) {
    if task.metadata_hash == payload_hash {
        ("synced".to_string(), "[]".to_string())
    } else {
        (task.sync_state.clone(), task.dirty_fields.clone())
    }
}

async fn finalize_task_sync(
    db_pool: &SqlitePool,
    entry: &SyncQueueEntry,
    task: &TaskMetadataRecord,
    new_google_id: Option<&str>,
    payload_hash: &str,
) -> Result<(), String> {
    let (sync_state_after, dirty_fields_after) = derive_post_sync_state(task, payload_hash);
    let now = chrono::Utc::now().timestamp();

    let mut tx = db_pool.begin().await.map_err(|e| {
        format!(
            "Failed to begin transaction for queue entry {}: {}",
            entry.id, e
        )
    })?;

    sqlx::query(
        "UPDATE tasks_metadata \
         SET google_id = COALESCE(?, google_id), \
             sync_state = ?, \
             dirty_fields = ?, \
             sync_attempts = 0, \
             last_synced_at = ?, \
             sync_error = NULL, \
             last_remote_hash = ?, \
             pending_move_from = NULL, \
             pending_delete_google_id = NULL \
         WHERE id = ?",
    )
    .bind(new_google_id)
    .bind(&sync_state_after)
    .bind(&dirty_fields_after)
    .bind(now)
    .bind(payload_hash)
    .bind(&task.id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to update task {} after sync: {}", task.id, e))?;

    sqlx::query("DELETE FROM sync_queue WHERE id = ?")
        .bind(&entry.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete queue entry {}: {}", entry.id, e))?;

    tx.commit()
        .await
        .map_err(|e| format!("Failed to commit sync finalization for {}: {}", entry.id, e))?;

    Ok(())
}
