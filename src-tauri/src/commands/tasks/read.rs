use crate::commands::tasks::types::*;
use crate::commands::tasks::subtasks::fetch_subtasks_for_tasks;
use crate::db;

use tauri::AppHandle;

#[tauri::command]
pub async fn get_tasks(app: AppHandle) -> Result<Vec<TaskResponse>, String> {
    let pool = db::init_database(&app).await?;

    let tasks: Vec<TaskMetadata> = sqlx::query_as(
        "SELECT id, google_id, list_id, title, priority, labels, due_date, status, time_block, notes, created_at, updated_at, sync_state, dirty_fields, last_synced_at, sync_error, has_conflict FROM tasks_metadata WHERE deleted_at IS NULL",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch tasks: {}", e))?;

    let ids: Vec<String> = tasks.iter().map(|task| task.id.clone()).collect();
    let subtasks_map = fetch_subtasks_for_tasks(&pool, &ids).await?;

    let mut responses = Vec::with_capacity(tasks.len());
    for metadata in tasks {
        let subtasks = subtasks_map.get(&metadata.id).cloned().unwrap_or_default();
        responses.push(TaskResponse { metadata, subtasks });
    }

    Ok(responses)
}
