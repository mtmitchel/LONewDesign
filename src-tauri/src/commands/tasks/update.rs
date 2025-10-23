use crate::commands::tasks::types::*;
use crate::commands::tasks::subtasks::*;
use crate::commands::tasks::helpers::*;
use crate::db;
use crate::task_metadata;
use chrono::Utc;
use serde_json;

use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[tauri::command(rename = "update_task")]
pub async fn update_task_command(
    app: AppHandle,
    task_id: String,
    updates: TaskUpdates,
) -> Result<TaskResponse, String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();
    let _write_guard = db::acquire_write_lock().await;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let current_task: task_metadata::TaskMetadata = sqlx::query_as(
        "SELECT title, notes, due_date, priority, labels, status, time_block FROM tasks_metadata WHERE id = ?",
    )
    .bind(&task_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("Failed to fetch task for update: {}", e))?;

    let labels_json = updates
        .labels
        .map(|labels| convert_label_inputs(Some(labels)))
        .map(|labels| serde_json::to_string(&labels).unwrap());

    let updated_metadata = task_metadata::TaskMetadata {
        title: updates.title.unwrap_or_else(|| current_task.title.clone()),
        notes: updates.notes,
        due_date: updates.due_date,
        priority: updates
            .priority
            .unwrap_or_else(|| current_task.priority.clone()),
        labels: labels_json.unwrap_or_else(|| current_task.labels.clone()),
        status:
            updates.status.unwrap_or_else(|| current_task.status.clone()),
        time_block: updates.time_block,
    };

    let normalized_metadata = updated_metadata.normalize();
    let mut diff = current_task.diff_fields(&normalized_metadata);

    let mut subtask_diff = SubtaskDiff::default();
    if let Some(subtasks) = &updates.subtasks {
        subtask_diff = replace_subtasks(&mut tx, &task_id, subtasks, now).await?;
        if subtask_diff.has_changes() {
            diff.push("subtasks".to_string());
        }
    }

    if diff.is_empty() {
        let task: TaskMetadata = sqlx::query_as("SELECT id, google_id, list_id, title, priority, labels, time_block, notes, created_at, updated_at, sync_state, dirty_fields, last_synced_at, sync_error, has_conflict FROM tasks_metadata WHERE id = ?")
            .bind(&task_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Failed to fetch task: {}", e))?;
        let subtasks = fetch_subtasks_for_tasks(&pool, &[task.id.clone()]).await?;

        return Ok(TaskResponse {
            metadata: task,
            subtasks: subtasks.get(&task_id).cloned().unwrap_or_default(),
        });
    }

    let metadata_hash = normalized_metadata.compute_hash();
    let labels_json = serde_json::to_string(&normalized_metadata.labels).unwrap();
    let dirty_fields = serde_json::to_string(&diff).unwrap();

    sqlx::query(
        "UPDATE tasks_metadata SET title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, metadata_hash = ?, dirty_fields = ?, updated_at = ?, sync_state = 'pending', sync_attempts = 0, has_conflict = 0, sync_error = NULL WHERE id = ?",
    )
    .bind(&normalized_metadata.title)
    .bind(&normalized_metadata.notes)
    .bind(&normalized_metadata.due_date)
    .bind(&normalized_metadata.priority)
    .bind(&labels_json)
    .bind(&normalized_metadata.status)
    .bind(&normalized_metadata.time_block)
    .bind(&metadata_hash)
    .bind(&dirty_fields)
    .bind(now)
    .bind(&task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to update task: {}", e))?;

    if subtask_diff.has_changes() {
        let list_id: String = sqlx::query_scalar("SELECT list_id FROM tasks_metadata WHERE id = ?")
            .bind(&task_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Failed to load list id for subtask enqueue: {}", e))?;

        enqueue_subtask_operations(&mut tx, &task_id, &list_id, &subtask_diff, now).await?;
    }

    let mutation_id = Uuid::new_v4().to_string();
    let task_payload = serde_json::to_string(&normalized_metadata).unwrap();
    let previous_hash = current_task.compute_hash();

    sqlx::query(
                "INSERT INTO task_mutation_log (id, task_id, operation, payload, previous_hash, new_hash, actor, created_at)          VALUES (?, ?, 'update', ?, ?, ?, 'user', ?)",
    )
    .bind(&mutation_id)
    .bind(&task_id)
    .bind(&task_payload)
    .bind(&previous_hash)
    .bind(&metadata_hash)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to log mutation: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();
    let sync_payload = serde_json::to_string(&normalized_metadata.serialize_for_google()).unwrap();

    sqlx::query(
        "DELETE FROM sync_queue WHERE task_id = ? AND operation IN ('create', 'update', 'delete', 'move')",
    )
        .bind(&task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to clear existing queue entries: {}", e))?;

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) VALUES (?, ?, 'update', ?, ?, ?, 'pending', 0)"
    )
    .bind(&sync_queue_id)
    .bind(&task_id)
    .bind(&sync_payload)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    let updated_task = load_task_with_subtasks(&pool, &task_id).await?;

    app.emit("tasks::updated", &task_id).unwrap();

    Ok(updated_task)
}
