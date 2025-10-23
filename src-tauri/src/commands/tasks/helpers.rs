use crate::commands::tasks::types::{TaskMetadata, TaskResponse};
use crate::commands::tasks::subtasks::fetch_subtasks_for_tasks;
use sqlx::SqlitePool;

// #region Task helpers
pub async fn load_task_with_subtasks(
    pool: &SqlitePool,
    task_id: &str,
) -> Result<TaskResponse, String> {
    let metadata: TaskMetadata = sqlx::query_as(
        "SELECT id, google_id, list_id, title, priority, labels, due_date, status, time_block, notes, created_at, updated_at, sync_state, dirty_fields, last_synced_at, sync_error, has_conflict FROM tasks_metadata WHERE id = ?",
    )
    .bind(task_id)
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to load task {}: {}", task_id, e))?;

    let subtasks_map = fetch_subtasks_for_tasks(pool, &[metadata.id.clone()]).await?;
    let subtasks = subtasks_map.get(&metadata.id).cloned().unwrap_or_default();

    Ok(TaskResponse { metadata, subtasks })
}
// #endregion Task helpers