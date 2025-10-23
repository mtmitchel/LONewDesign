use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn cleanup_duplicate_tasks(pool: &SqlitePool) -> Result<(), String> {
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
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to detect orphan duplicate tasks: {}", e))?;

    if !orphan_ids.is_empty() {
        let mut tx = pool
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
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch synced duplicate tasks: {}", e))?;

    if synced_duplicates.is_empty() {
        return Ok(());
    }

    let mut tx = pool
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
