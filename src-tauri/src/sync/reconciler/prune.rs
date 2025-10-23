use sqlx::SqlitePool;
use std::collections::HashSet;

pub async fn prune_missing_remote_tasks(
    pool: &SqlitePool,
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
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to load local tasks for pruning: {}", e))?;

    if local_tasks.is_empty() {
        return Ok(());
    }

    let mut tx = pool
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

pub async fn prune_missing_remote_subtasks(
    pool: &SqlitePool,
    list_id: &str,
    remote_google_ids: &HashSet<String>,
) -> Result<(), String> {
    #[derive(sqlx::FromRow)]
    struct LocalSubtask {
        id: String,
        google_id: String,
    }

    let local_subtasks: Vec<LocalSubtask> = sqlx::query_as(
        "SELECT ts.id, ts.google_id\
         FROM task_subtasks ts\
         JOIN tasks_metadata tm ON tm.id = ts.task_id\
         WHERE tm.list_id = ? AND ts.google_id IS NOT NULL",
    )
    .bind(list_id)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to load local subtasks for pruning: {}", e))?;

    if local_subtasks.is_empty() {
        return Ok(());
    }

    let mut tx = pool
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
