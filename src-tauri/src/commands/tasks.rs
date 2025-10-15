use crate::task_metadata;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

use crate::db;

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskInput {
    pub id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub priority: Option<String>,
    pub labels: Option<Vec<String>>,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub due_date: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskMetadata {
    pub id: String,
    pub google_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub priority: String,
    pub labels: String,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub sync_state: String,
    pub dirty_fields: String,
    pub last_synced_at: Option<i64>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskList {
    pub id: String,
    pub title: String,
}

#[tauri::command]
pub async fn create_task(app: AppHandle, task: TaskInput) -> Result<String, String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();

    let task_id = task.id.unwrap_or_else(|| Uuid::new_v4().to_string());

    let labels_json = serde_json::to_string(&task.labels.unwrap_or_default()).unwrap();

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

    let dirty_fields = serde_json::to_string(&vec![
        "title",
        "priority",
        "labels",
        "due_date",
        "status",
        "notes",
    ])
    .unwrap();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO tasks_metadata (id, list_id, title, priority, labels, due_date, status, notes, time_block, metadata_hash, dirty_fields, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

    let mutation_id = Uuid::new_v4().to_string();
    let task_payload = serde_json::to_string(&normalized_metadata).unwrap();

    sqlx::query(
        "INSERT INTO task_mutation_log (id, task_id, operation, payload, new_hash, actor, created_at) \
         VALUES (?, ?, 'create', ?, ?, 'user', ?)",
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
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at) \
         VALUES (?, ?, 'create', ?, ?, ?)",
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

    app.emit("tasks::created", &task_id).unwrap();

    Ok(task_id)
}

#[tauri::command(rename = "update_task")]
pub async fn update_task_command(
    app: AppHandle,
    task_id: String,
    updates: TaskInput,
) -> Result<String, String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let current_task: task_metadata::TaskMetadata = sqlx::query_as(
        "SELECT title, notes, due_date, priority, labels, status, time_block FROM tasks_metadata WHERE id = ?",
    )
    .bind(&task_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| format!("Failed to fetch task for update: {}", e))?;

    let labels_json = updates.labels.map(|labels| serde_json::to_string(&labels).unwrap());

    let updated_metadata = task_metadata::TaskMetadata {
        title: updates.title,
        notes: updates.notes,
        due_date: updates.due_date,
        priority: updates.priority.unwrap_or_else(|| current_task.priority.clone()),
        labels: labels_json.unwrap_or_else(|| current_task.labels.clone()),
        status: updates.status.unwrap_or_else(|| current_task.status.clone()),
        time_block: updates.time_block,
    };

    let normalized_metadata = updated_metadata.normalize();
    let diff = current_task.diff_fields(&normalized_metadata);

    if diff.is_empty() {
        return Ok(task_id);
    }

    let metadata_hash = normalized_metadata.compute_hash();
    let labels_json = serde_json::to_string(&normalized_metadata.labels).unwrap();
    let dirty_fields = serde_json::to_string(&diff).unwrap();

    sqlx::query(
        "UPDATE tasks_metadata SET title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, metadata_hash = ?, dirty_fields = ?, updated_at = ?, sync_state = 'pending', sync_attempts = 0 WHERE id = ?",
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

    let mutation_id = Uuid::new_v4().to_string();
    let task_payload = serde_json::to_string(&normalized_metadata).unwrap();
    let previous_hash = current_task.compute_hash();

    sqlx::query(
        "INSERT INTO task_mutation_log (id, task_id, operation, payload, previous_hash, new_hash, actor, created_at) \
         VALUES (?, ?, 'update', ?, ?, ?, 'user', ?)",
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
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at) \
         VALUES (?, ?, 'update', ?, ?, ?) ON CONFLICT(task_id) DO UPDATE SET payload = excluded.payload, scheduled_at = excluded.scheduled_at, status = 'pending', attempts = 0",
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

    app.emit("tasks::updated", &task_id).unwrap();

    Ok(task_id)
}

#[tauri::command]
pub async fn delete_task(app: AppHandle, task_id: String) -> Result<String, String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE tasks_metadata SET deleted_at = ?, sync_state = 'pending_delete' WHERE id = ?",
    )
    .bind(now)
    .bind(&task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to delete task: {}", e))?;

    let mutation_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO task_mutation_log (id, task_id, operation, actor, created_at) \
         VALUES (?, ?, 'delete', 'user', ?)",
    )
    .bind(&mutation_id)
    .bind(&task_id)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to log mutation: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at) \
         VALUES (?, ?, 'delete', '', ?, ?) ON CONFLICT(task_id) DO UPDATE SET operation = 'delete', payload = '', scheduled_at = excluded.scheduled_at, status = 'pending', attempts = 0",
    )
    .bind(&sync_queue_id)
    .bind(&task_id)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    app.emit("tasks::deleted", &task_id).unwrap();

    Ok(task_id)
}

#[tauri::command]
pub async fn get_tasks(app: AppHandle) -> Result<Vec<TaskMetadata>, String> {
    let pool = db::init_database(&app).await?;

    let tasks: Vec<TaskMetadata> = sqlx::query_as(
        "SELECT id, google_id, list_id, title, priority, labels, time_block, notes, created_at, updated_at, sync_state, dirty_fields, last_synced_at, sync_error FROM tasks_metadata WHERE deleted_at IS NULL",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch tasks: {}", e))?;

    Ok(tasks)
}

#[tauri::command]
pub async fn get_task_lists(app: AppHandle) -> Result<Vec<TaskList>, String> {
    let pool = db::init_database(&app).await?;

    let lists: Vec<TaskList> = sqlx::query_as("SELECT id, title FROM task_lists")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

    Ok(lists)
}

pub fn register(_app_handle: &AppHandle) {}