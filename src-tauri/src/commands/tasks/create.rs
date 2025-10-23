use crate::commands::tasks::types::*;
use crate::commands::tasks::subtasks::*;
use crate::commands::tasks::helpers::*;
use crate::db;
use crate::task_metadata;
use chrono::Utc;
use serde_json;

use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[tauri::command]
pub async fn create_task(app: AppHandle, task: TaskInput) -> Result<TaskResponse, String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();
    let _write_guard = db::acquire_write_lock().await;

    let task_id = task.id.unwrap_or_else(|| Uuid::new_v4().to_string());

    let label_entries = convert_label_inputs(task.labels.clone());
    let labels_json = serde_json::to_string(&label_entries).unwrap();

    let metadata = task_metadata::TaskMetadata {
        title: task.title,
        notes: task.notes,
        due_date: task.due_date,
        priority: task.priority.unwrap_or_else(|| "none".to_string()),
        labels: labels_json,
        status: task.status.unwrap_or_else(|| "needsAction".to_string()),
        time_block: task.time_block,
    };

    let normalized_metadata = metadata.normalize();
    let metadata_hash = normalized_metadata.compute_hash();
    let labels_json = serde_json::to_string(&normalized_metadata.labels).unwrap();

    let mut dirty_fields_vec = vec![
        "title".to_string(),
        "priority".to_string(),
        "labels".to_string(),
        "due_date".to_string(),
        "status".to_string(),
        "notes".to_string(),
    ];

    if task
        .subtasks
        .as_ref()
        .map(|subs| !subs.is_empty())
        .unwrap_or(false)
    {
        dirty_fields_vec.push("subtasks".to_string());
    }

    let dirty_fields = serde_json::to_string(&dirty_fields_vec).unwrap();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
                "INSERT INTO tasks_metadata (id, list_id, title, priority, labels, due_date, status, notes, time_block, metadata_hash, dirty_fields, created_at, updated_at)          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&task_id)
    .bind(&task.list_id)
    .bind(&normalized_metadata.title)
    .bind(&normalized_metadata.priority)
    .bind(&labels_json)
    .bind(&normalized_metadata.due_date)
    .bind(&normalized_metadata.status)
    .bind(&normalized_metadata.notes)
    .bind(&normalized_metadata.time_block)
    .bind(&metadata_hash)
    .bind(&dirty_fields)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to create task: {}", e))?;

    let subtask_diff = if let Some(subtasks) = &task.subtasks {
        replace_subtasks(&mut tx, &task_id, subtasks, now).await?
    } else {
        SubtaskDiff::default()
    };

    if subtask_diff.has_changes() {
        enqueue_subtask_operations(&mut tx, &task_id, &task.list_id, &subtask_diff, now).await?;
    }

    let mutation_id = Uuid::new_v4().to_string();
    let task_payload = serde_json::to_string(&normalized_metadata).unwrap();

    sqlx::query(
                "INSERT INTO task_mutation_log (id, task_id, operation, payload, new_hash, actor, created_at)          VALUES (?, ?, 'create', ?, ?, 'user', ?)",
    )
    .bind(&mutation_id)
    .bind(&task_id)
    .bind(&task_payload)
    .bind(&metadata_hash)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to log mutation: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();
    let sync_payload = serde_json::to_string(&normalized_metadata.serialize_for_google()).unwrap();

    sqlx::query(
                "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at)          VALUES (?, ?, 'create', ?, ?, ?)",
    )
    .bind(&sync_queue_id)
    .bind(&task_id)
    .bind(&sync_payload)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    let created_task = load_task_with_subtasks(&pool, &task_id).await?;

    app.emit("tasks::created", &task_id).unwrap();

    Ok(created_task)
}
