//! Sync queue processing for task mutations

use reqwest::Client;
use sqlx::SqlitePool;

use crate::sync::google_client;
use crate::sync::types::{SyncQueueEntry, TaskMetadataRecord};

/// Executes pending mutations from the sync queue
///
/// Processes up to 25 pending entries, executing CREATE, UPDATE, or DELETE operations
/// against the Google Tasks API
pub async fn execute_pending_mutations(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
) -> Result<(), String> {
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
        return Ok(());
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
                eprintln!(
                    "[sync_service] Failed processing sync queue entry {}: {}",
                    entry.id, err
                );
                mark_queue_failure(db_pool, &entry, attempt_number, err).await?;
            }
        }
    }

    Ok(())
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
    let payload_hash = payload_metadata_hash(&payload);

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
    let payload_hash = payload_metadata_hash(&payload);

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

fn payload_metadata_hash(_payload: &serde_json::Value) -> String {
    // TODO: Implement proper metadata hash calculation
    // let metadata = task_metadata::deserialize_from_google(payload);
    // task_metadata::calculate_metadata_hash(&metadata)
    String::from("placeholder-hash")
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
