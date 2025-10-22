use crate::commands::google::google_workspace_store_get;
use crate::db;
use crate::sync::types::GOOGLE_TASKS_BASE_URL;
use crate::task_metadata::{self, TaskLabel, DEFAULT_LABEL_COLOR};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{QueryBuilder, Sqlite, SqlitePool, Transaction};
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubtaskInput {
    pub id: Option<String>,
    pub google_id: Option<String>,
    pub parent_google_id: Option<String>,
    pub title: String,
    #[serde(default)]
    pub is_completed: bool,
    pub due_date: Option<String>,
    pub position: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum TaskLabelInput {
    Name(String),
    Detailed {
        name: String,
        #[serde(default)]
        color: Option<String>,
    },
}

fn convert_label_inputs(labels: Option<Vec<TaskLabelInput>>) -> Vec<TaskLabel> {
    labels
        .unwrap_or_default()
        .into_iter()
        .filter_map(|label| match label {
            TaskLabelInput::Name(raw) => {
                let trimmed = raw.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(TaskLabel {
                        name: trimmed.to_string(),
                        color: DEFAULT_LABEL_COLOR.to_string(),
                    })
                }
            }
            TaskLabelInput::Detailed { name, color } => {
                let trimmed = name.trim();
                if trimmed.is_empty() {
                    return None;
                }

                let resolved_color = color
                    .as_deref()
                    .map(|c| c.trim())
                    .filter(|c| !c.is_empty())
                    .unwrap_or(DEFAULT_LABEL_COLOR);

                Some(TaskLabel {
                    name: trimmed.to_string(),
                    color: resolved_color.to_string(),
                })
            }
        })
        .collect()
}

#[derive(Debug, Serialize, Clone)]
pub struct TaskSubtask {
    pub id: String,
    pub google_id: Option<String>,
    pub parent_google_id: Option<String>,
    pub title: String,
    pub is_completed: bool,
    pub position: i64,
    pub due_date: Option<String>,
    pub metadata_hash: Option<String>,
    pub dirty_fields: Vec<String>,
    pub sync_state: String,
    pub sync_error: Option<String>,
    pub last_synced_at: Option<i64>,
}

#[derive(sqlx::FromRow)]
struct TaskSubtaskRow {
    id: String,
    task_id: String,
    google_id: Option<String>,
    parent_google_id: Option<String>,
    title: String,
    is_completed: i64,
    position: i64,
    due_date: Option<String>,
    metadata_hash: Option<String>,
    dirty_fields: String,
    sync_state: String,
    sync_error: Option<String>,
    last_synced_at: Option<i64>,
}

#[derive(Default)]
struct SubtaskDiff {
    created: Vec<task_metadata::SubtaskMetadata>,
    updated: Vec<task_metadata::SubtaskMetadata>,
    deleted: Vec<TaskSubtaskRow>,
}

impl SubtaskDiff {
    fn has_changes(&self) -> bool {
        !self.created.is_empty() || !self.updated.is_empty() || !self.deleted.is_empty()
    }
}

async fn enqueue_subtask_operations(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    list_id: &str,
    diff: &SubtaskDiff,
    now: i64,
) -> Result<(), String> {
    if diff.has_changes() {
        println!(
            "[subtask_sync] enqueue diff for task {} (created={}, updated={}, deleted={})",
            task_id,
            diff.created.len(),
            diff.updated.len(),
            diff.deleted.len()
        );
    }

    for metadata in &diff.created {
        if metadata.parent_google_id.is_none() {
            println!(
                "[subtask_sync] deferring create for subtask {} (missing parent google id)",
                metadata.id
            );
            mark_subtask_waiting(tx, &metadata.id, now).await?;
            continue;
        }

        let payload = serde_json::json!({
            "task_id": task_id,
            "list_id": list_id,
            "subtask_id": metadata.id,
            "google_id": metadata.google_id,
            "parent_google_id": metadata.parent_google_id,
            "google_payload": metadata.to_google_payload(),
        });

        println!(
            "[subtask_sync] enqueue subtask_create for {} under parent {:?}",
            metadata.id, metadata.parent_google_id
        );
        enqueue_subtask_queue_entry(tx, task_id, "subtask_create", payload, now).await?;
    }

    for metadata in &diff.updated {
        if metadata.parent_google_id.is_none() {
            println!(
                "[subtask_sync] deferring update for subtask {} (missing parent google id)",
                metadata.id
            );
            mark_subtask_waiting(tx, &metadata.id, now).await?;
            continue;
        }

        let payload = serde_json::json!({
            "task_id": task_id,
            "list_id": list_id,
            "subtask_id": metadata.id,
            "google_id": metadata.google_id,
            "parent_google_id": metadata.parent_google_id,
            "google_payload": metadata.to_google_payload(),
        });

        println!(
            "[subtask_sync] enqueue subtask_update for {} (google_id={:?})",
            metadata.id, metadata.google_id
        );
        enqueue_subtask_queue_entry(tx, task_id, "subtask_update", payload, now).await?;
    }

    for row in &diff.deleted {
        if let Some(google_id) = &row.google_id {
            let payload = serde_json::json!({
                "task_id": task_id,
                "list_id": list_id,
                "subtask_id": row.id,
                "google_id": google_id,
            });

            println!(
                "[subtask_sync] enqueue subtask_delete for {} (google_id={})",
                row.id, google_id
            );
            enqueue_subtask_queue_entry(tx, task_id, "subtask_delete", payload, now).await?;
        }
    }

    Ok(())
}

async fn enqueue_subtask_queue_entry(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    operation: &str,
    payload: serde_json::Value,
    now: i64,
) -> Result<(), String> {
    let sync_queue_id = Uuid::new_v4().to_string();
    let payload_json = serde_json::to_string(&payload)
        .map_err(|e| format!("Failed to serialize subtask queue payload: {}", e))?;

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) \
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)",
    )
    .bind(&sync_queue_id)
    .bind(task_id)
    .bind(operation)
    .bind(&payload_json)
    .bind(now)
    .bind(now)
    .execute(tx.as_mut())
    .await
    .map_err(|e| format!("Failed to enqueue subtask operation '{}': {}", operation, e))?;

    Ok(())
}

async fn mark_subtask_waiting(
    tx: &mut Transaction<'_, Sqlite>,
    subtask_id: &str,
    now: i64,
) -> Result<(), String> {
    println!(
        "[subtask_sync] marking subtask {} as pending parent google id",
        subtask_id
    );
    sqlx::query(
        "UPDATE task_subtasks SET sync_state = 'pending_parent', updated_at = ? WHERE id = ?",
    )
    .bind(now)
    .bind(subtask_id)
    .execute(tx.as_mut())
    .await
    .map_err(|e| {
        format!(
            "Failed to mark subtask {} as waiting for parent: {}",
            subtask_id, e
        )
    })?;

    Ok(())
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    #[serde(flatten)]
    pub metadata: TaskMetadata,
    pub subtasks: Vec<TaskSubtask>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskInput {
    pub id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub priority: Option<String>,
    pub labels: Option<Vec<TaskLabelInput>>,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub due_date: Option<String>,
    pub status: Option<String>,
    pub subtasks: Option<Vec<SubtaskInput>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskMetadata {
    pub id: String,
    pub google_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub priority: String,
    pub labels: String,
    pub due_date: Option<String>,
    pub status: String,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub sync_state: String,
    pub dirty_fields: String,
    pub last_synced_at: Option<i64>,
    pub sync_error: Option<String>,
    pub has_conflict: bool,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaskList {
    pub id: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskListInput {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct DeleteTaskListInput {
    pub id: String,
    pub reassign_to: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct QueueMoveTaskInput {
    pub task_id: String,
    pub to_list_id: String,
}

#[derive(Debug, Deserialize)]
struct StoredGoogleToken {
    #[serde(rename = "accessToken")]
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct StoredGoogleAccount {
    token: StoredGoogleToken,
}

#[derive(Debug, Deserialize)]
struct StoredGoogleAuth {
    account: StoredGoogleAccount,
}

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

#[derive(Debug, Deserialize)]
pub struct TaskUpdates {
    pub title: Option<String>,
    pub priority: Option<String>,
    pub labels: Option<Vec<TaskLabelInput>>,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub due_date: Option<String>,
    pub status: Option<String>,
    pub subtasks: Option<Vec<SubtaskInput>>,
}

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
        status: updates
            .status
            .unwrap_or_else(|| current_task.status.clone()),
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
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) \
         VALUES (?, ?, 'update', ?, ?, ?, 'pending', 0)"
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

#[tauri::command]
pub async fn delete_task(app: AppHandle, task_id: String) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();
    let _write_guard = db::acquire_write_lock().await;

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
        "INSERT INTO task_mutation_log (id, task_id, operation, payload, actor, created_at) \
         VALUES (?, ?, 'delete', '', 'user', ?)",
    )
    .bind(&mutation_id)
    .bind(&task_id)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to log mutation: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();

    sqlx::query("DELETE FROM sync_queue WHERE task_id = ?")
        .bind(&task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear existing queue entries: {}", e))?;

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) \
         VALUES (?, ?, 'delete', '', ?, ?, 'pending', 0)"
    )
    .bind(&sync_queue_id)
    .bind(&task_id)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    app.emit("tasks::deleted", &task_id).unwrap();

    Ok(())
}

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

#[tauri::command]
pub async fn get_task_lists(app: AppHandle) -> Result<Vec<TaskList>, String> {
    let pool = db::init_database(&app).await?;

    let lists: Vec<TaskList> = sqlx::query_as("SELECT id, title FROM task_lists")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

    Ok(lists)
}

#[tauri::command]
pub async fn create_task_list(
    app: AppHandle,
    state: State<'_, crate::ApiState>,
    input: CreateTaskListInput,
) -> Result<TaskList, String> {
    let pool = db::init_database(&app).await?;
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err("Task list title cannot be empty".to_string());
    }

    let tokens = google_workspace_store_get()
        .map_err(|e| format!("Failed to load Google credentials: {}", e))?
        .ok_or_else(|| {
            "Google account not connected. Please sign in before creating task lists.".to_string()
        })?;

    let auth: StoredGoogleAuth = serde_json::from_str(&tokens)
        .map_err(|e| format!("Failed to parse Google auth tokens: {}", e))?;
    let access_token = auth.account.token.access_token;

    let response = state
        .client()
        .post(format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL))
        .bearer_auth(&access_token)
        .json(&serde_json::json!({ "title": title }))
        .send()
        .await
        .map_err(|e| format!("Failed to create Google task list: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Google API error {}: {}", status, text));
    }

    let list_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google task list response: {}", e))?;

    let google_id = list_json
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Google API response missing list id".to_string())?
        .to_string();

    let resolved_title = list_json
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| input.title.trim())
        .to_string();

    let now = Utc::now().timestamp();

    sqlx::query(
        "INSERT INTO task_lists (id, google_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&google_id)
    .bind(&google_id)
    .bind(&resolved_title)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to persist task list locally: {}", e))?;

    Ok(TaskList {
        id: google_id,
        title: resolved_title,
    })
}

#[tauri::command]
pub async fn delete_task_list(app: AppHandle, input: DeleteTaskListInput) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
        .bind(&input.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| format!("Failed to load task list: {}", e))?;

    if exists.is_none() {
        return Err(format!("Task list {} not found", input.id));
    }

    if let Some(ref reassign_to) = input.reassign_to {
        if reassign_to == &input.id {
            return Err("Cannot reassign tasks to the list being deleted".to_string());
        }

        let reassignment_exists: Option<(String,)> =
            sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
                .bind(reassign_to)
                .fetch_optional(&mut *tx)
                .await
                .map_err(|e| format!("Failed to load reassignment list: {}", e))?;

        if reassignment_exists.is_none() {
            return Err(format!("Reassignment list {} not found", reassign_to));
        }

        let now = Utc::now().timestamp();
        sqlx::query(
            "UPDATE tasks_metadata SET list_id = ?, updated_at = ?, sync_state = CASE WHEN sync_state = 'pending_delete' THEN sync_state ELSE 'pending' END WHERE list_id = ?",
        )
        .bind(reassign_to)
        .bind(now)
        .bind(&input.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to reassign tasks: {}", e))?;
    } else {
        let task_count: i64 =
            sqlx::query_scalar("SELECT COUNT(1) FROM tasks_metadata WHERE list_id = ?")
                .bind(&input.id)
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| format!("Failed to count tasks for list {}: {}", input.id, e))?;

        if task_count > 0 {
            return Err(
                "Cannot delete a task list that still contains tasks without reassigning them"
                    .to_string(),
            );
        }
    }

    sqlx::query("DELETE FROM task_lists WHERE id = ?")
        .bind(&input.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete task list: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn queue_move_task(app: AppHandle, input: QueueMoveTaskInput) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    #[derive(sqlx::FromRow)]
    struct TaskSnapshot {
        list_id: String,
        google_id: Option<String>,
    }

    let snapshot: TaskSnapshot =
        sqlx::query_as("SELECT list_id, google_id FROM tasks_metadata WHERE id = ?")
            .bind(&input.task_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Failed to load task {} before move: {}", input.task_id, e))?;

    sqlx::query(
        "UPDATE tasks_metadata SET list_id = ?, pending_move_from = ?, pending_delete_google_id = ?, updated_at = ?, sync_state = 'pending_move' WHERE id = ?",
    )
    .bind(&input.to_list_id)
    .bind(&snapshot.list_id)
    .bind(&snapshot.google_id)
    .bind(now)
    .bind(&input.task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to queue task move: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();
    let sync_payload = serde_json::to_string(&input.to_list_id).unwrap();

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at) \
         VALUES (?, ?, 'move', ?, ?, ?)",
    )
    .bind(&sync_queue_id)
    .bind(&input.task_id)
    .bind(&sync_payload)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

pub fn register(_app_handle: &AppHandle) {}

async fn replace_subtasks(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    subtasks: &[SubtaskInput],
    now: i64,
) -> Result<SubtaskDiff, String> {
    let existing_rows: Vec<TaskSubtaskRow> = sqlx::query_as(
        "SELECT id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at FROM task_subtasks WHERE task_id = ?",
    )
    .bind(task_id)
    .fetch_all(tx.as_mut())
    .await
    .map_err(|e| format!("Failed to load existing subtasks for {}: {}", task_id, e))?;

    let existing_map: HashMap<String, TaskSubtaskRow> = existing_rows
        .into_iter()
        .map(|row| (row.id.clone(), row))
        .collect();

    let parent_google_id_global: Option<String> =
        sqlx::query_scalar("SELECT google_id FROM tasks_metadata WHERE id = ?")
            .bind(task_id)
            .fetch_optional(tx.as_mut())
            .await
            .map_err(|e| format!("Failed to load parent google id for {}: {}", task_id, e))?;

    let mut diff = SubtaskDiff::default();
    let mut seen_ids = std::collections::HashSet::new();

    for (index, input) in subtasks.iter().enumerate() {
        let trimmed_title = input.title.trim();
        if trimmed_title.is_empty() {
            continue;
        }

        let subtask_id = input
            .id
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
            .map(|value| value.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let position = input.position.unwrap_or(index as i64);
        let metadata = task_metadata::SubtaskMetadata {
            id: subtask_id.clone(),
            task_id: task_id.to_string(),
            google_id: input.google_id.clone(),
            parent_google_id: input
                .parent_google_id
                .clone()
                .or_else(|| parent_google_id_global.clone()),
            title: trimmed_title.to_string(),
            is_completed: input.is_completed,
            due_date: input.due_date.clone(),
            position,
        };

        let normalized = metadata.normalize();
        let metadata_hash = normalized.compute_hash();
        let mut dirty_fields: Vec<&str> = Vec::new();

        let mut google_id = normalized.google_id.clone();
        let mut parent_google_id = normalized
            .parent_google_id
            .clone()
            .or_else(|| parent_google_id_global.clone());

        println!(
            "[subtask_sync] evaluating subtask {} (existing={}, parent_google_id={:?}, google_id={:?})",
            subtask_id,
            existing_map.contains_key(&subtask_id),
            parent_google_id,
            google_id
        );

        if let Some(existing) = existing_map.get(&subtask_id) {
            seen_ids.insert(subtask_id.clone());

            if existing.title != normalized.title {
                dirty_fields.push("title");
            }
            if (existing.is_completed != 0) != normalized.is_completed {
                dirty_fields.push("status");
            }
            if existing.due_date != normalized.due_date {
                dirty_fields.push("due_date");
            }
            if existing.position != normalized.position {
                dirty_fields.push("position");
            }
            if existing.parent_google_id != normalized.parent_google_id {
                dirty_fields.push("parent_google_id");
            }
            if existing.google_id.is_none() && normalized.google_id.is_some() {
                dirty_fields.push("google_id");
            }

            let sync_state = if !dirty_fields.is_empty()
                || existing.metadata_hash.as_deref() != Some(&metadata_hash)
            {
                "pending".to_string()
            } else {
                existing.sync_state.clone()
            };

            if google_id.is_none() {
                google_id = existing.google_id.clone();
            }
            if parent_google_id.is_none() {
                parent_google_id = existing
                    .parent_google_id
                    .clone()
                    .or_else(|| parent_google_id_global.clone());
            }

            let dirty_fields_json =
                serde_json::to_string(&dirty_fields).unwrap_or_else(|_| "[]".to_string());

            sqlx::query(
                "UPDATE task_subtasks SET google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = ?, sync_state = ?, updated_at = ? WHERE id = ?",
            )
            .bind(&google_id)
            .bind(&parent_google_id)
            .bind(&normalized.title)
            .bind(if normalized.is_completed { 1 } else { 0 })
            .bind(normalized.position)
            .bind(&normalized.due_date)
            .bind(&metadata_hash)
            .bind(&dirty_fields_json)
            .bind(&sync_state)
            .bind(now)
            .bind(&subtask_id)
            .execute(tx.as_mut())
            .await
            .map_err(|e| format!("Failed updating subtask {}: {}", subtask_id, e))?;

            if sync_state == "pending" {
                println!(
                    "[subtask_sync] subtask {} marked for update with dirty fields {:?}",
                    subtask_id, dirty_fields
                );
                diff.updated.push(task_metadata::SubtaskMetadata {
                    google_id,
                    parent_google_id,
                    ..normalized
                });
            }
        } else {
            seen_ids.insert(subtask_id.clone());
            let dirty_fields_json =
                serde_json::to_string(&["title", "status", "due_date", "position"]).unwrap();

            sqlx::query("INSERT INTO task_subtasks (id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)")
                .bind(&subtask_id)
                .bind(task_id)
                .bind(&normalized.google_id)
                .bind(&parent_google_id)
                .bind(&normalized.title)
                .bind(if normalized.is_completed { 1 } else { 0 })
                .bind(normalized.position)
                .bind(&normalized.due_date)
                .bind(&metadata_hash)
                .bind(&dirty_fields_json)
                .bind(now)
                .bind(now)
                .execute(tx.as_mut())
            .await
            .map_err(|e| format!("Failed inserting subtask for {}: {}", task_id, e))?;

            println!(
                "[subtask_sync] subtask {} recorded as new (parent_google_id={:?})",
                subtask_id, parent_google_id
            );
            diff.created.push(task_metadata::SubtaskMetadata {
                google_id: normalized.google_id.clone(),
                parent_google_id: parent_google_id.clone(),
                ..normalized
            });
        }
    }

    for (subtask_id, row) in existing_map.into_iter() {
        if !seen_ids.contains(&subtask_id) {
            sqlx::query("UPDATE task_subtasks SET sync_state = 'pending_delete', dirty_fields = '[]', updated_at = ? WHERE id = ?")
                .bind(now)
                .bind(&subtask_id)
                .execute(tx.as_mut())
            .await
            .map_err(|e| format!("Failed marking subtask {} for deletion: {}", subtask_id, e))?;
            diff.deleted.push(row);
            println!(
                "[subtask_sync] subtask {} flagged for deletion (no longer present)",
                subtask_id
            );
        }
    }

    Ok(diff)
}

async fn fetch_subtasks_for_tasks(
    pool: &SqlitePool,
    task_ids: &[String],
) -> Result<HashMap<String, Vec<TaskSubtask>>, String> {
    if task_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let mut builder = QueryBuilder::<Sqlite>::new(
        "SELECT id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at FROM task_subtasks WHERE task_id IN (",
    );
    {
        let mut separated = builder.separated(", ");
        for task_id in task_ids {
            separated.push_bind(task_id);
        }
    }
    builder.push(") ORDER BY task_id, position, created_at");

    let rows: Vec<TaskSubtaskRow> = builder
        .build_query_as()
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch subtasks: {}", e))?;

    let mut map: HashMap<String, Vec<TaskSubtask>> = HashMap::new();
    for row in rows {
        let dirty_fields: Vec<String> = serde_json::from_str(&row.dirty_fields).unwrap_or_default();

        map.entry(row.task_id.clone())
            .or_default()
            .push(TaskSubtask {
                id: row.id,
                google_id: row.google_id,
                parent_google_id: row.parent_google_id,
                title: row.title,
                is_completed: row.is_completed != 0,
                position: row.position,
                due_date: row.due_date,
                metadata_hash: row.metadata_hash,
                dirty_fields,
                sync_state: row.sync_state,
                sync_error: row.sync_error,
                last_synced_at: row.last_synced_at,
            });
    }

    Ok(map)
}

async fn load_task_with_subtasks(pool: &SqlitePool, task_id: &str) -> Result<TaskResponse, String> {
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
