pub mod dedupe;
pub mod poll;
pub mod prune;

use crate::sync::types::GoogleTask;
use crate::task_metadata;
use serde_json::Value;
use sqlx::SqlitePool;
use std::collections::HashMap;


async fn reconcile_task_list(pool: &SqlitePool, list: &serde_json::Value) -> Result<(), String> {
    let list_id = list
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Task list missing id".to_string())?;

    let title = list
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled List");

    let now = chrono::Utc::now().timestamp();

    // Check if list exists
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
        .bind(list_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to check existing list: {}", e))?;

    if exists.is_some() {
        // Update existing list
        sqlx::query("UPDATE task_lists SET title = ?, updated_at = ? WHERE id = ?")
            .bind(title)
            .bind(now)
            .bind(list_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to update list: {}", e))?;

        eprintln!("[sync_service] Updated task list {} ({})", list_id, title);
    } else {
        // Insert new list
        sqlx::query(
            "INSERT INTO task_lists (id, google_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(list_id)
        .bind(list_id)
        .bind(title)
        .bind(now)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert list: {}", e))?;

        eprintln!("[sync_service] Inserted task list {} ({})", list_id, title);
    }

    Ok(())
}

async fn reconcile_task(
    pool: &SqlitePool,
    list_id: &str,
    task_json: &serde_json::Value,
) -> Result<(), String> {
    let task: GoogleTask = serde_json::from_value(task_json.clone()).map_err(|e| e.to_string())?;

    let google_id = &task.id;
    let title = &task.title;

    let remote_payload = task_metadata::GoogleTaskPayload {
        title: task.title.clone(),
        notes: task.notes.clone(),
        due: task.due.clone(),
        status: task
            .status
            .clone()
            .unwrap_or_else(|| "needsAction".to_string()),
    };
    let remote_metadata =
        task_metadata::TaskMetadata::deserialize_from_google(&remote_payload).normalize();
    let remote_metadata_hash = remote_metadata.compute_hash();

    let notes_to_store = remote_metadata.notes.clone();
    let due_to_store = remote_metadata.due_date.clone();
    let priority_to_store = remote_metadata.priority.clone();
    let labels_to_store = remote_metadata.labels.clone();
    let status_to_store = remote_metadata.status.clone();
    let time_block_to_store = remote_metadata.time_block.clone();

    let now = chrono::Utc::now().timestamp();

    eprintln!(
        "[sync_service] Reconciling task google_id={}, title={}",
        google_id, title
    );

    // Check if task exists locally by google_id
    #[derive(sqlx::FromRow)]
    struct ExistingTask {
        id: String,
        _google_id: Option<String>,
        _sync_state: String,
        _metadata_hash: Option<String>,
        _dirty_fields: String,
        _has_conflict: bool,
        _title: String,
        _notes: Option<String>,
        _due_date: Option<String>,
        _priority: String,
        _labels: String,
        _status: String,
        _time_block: Option<String>,
        _sync_error: Option<String>,
    }

    let existing: Option<ExistingTask> = sqlx::query_as(
        "SELECT id, google_id, sync_state, metadata_hash, dirty_fields, has_conflict, title, notes, due_date, priority, labels, status, time_block, sync_error FROM tasks_metadata WHERE google_id = ?",
    )
    .bind(google_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("Failed to check existing task: {}", e))?;

    eprintln!(
        "[sync_service] Existing task check for {}: {:?}",
        google_id,
        existing.as_ref().map(|t| &t.id)
    );

    if let Some(existing_task) = existing {
        eprintln!(
            "[sync_service] Task exists, updating id={}",
            existing_task.id
        );
        if existing_task._sync_state == "pending_move" {
            println!(
                "[sync_service] Skipping update for task {} because move is pending",
                existing_task.id
            );
            return Ok(());
        }

        let result = sqlx::query(
            "UPDATE tasks_metadata SET list_id = ?, title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, updated_at = ?, sync_state = 'synced', last_synced_at = ?, metadata_hash = ?, dirty_fields = '[]', has_conflict = 0, sync_attempts = 0, sync_error = NULL WHERE id = ?"
        )
        .bind(list_id)
        .bind(&remote_metadata.title)
        .bind(notes_to_store.as_deref())
        .bind(due_to_store.as_deref())
        .bind(&priority_to_store)
        .bind(&labels_to_store)
        .bind(&status_to_store)
        .bind(time_block_to_store.as_deref())
        .bind(now)
        .bind(now)
        .bind(&remote_metadata_hash)
        .bind(&existing_task.id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to update task: {}", e))?;

        eprintln!(
            "[sync_service] UPDATE affected {} rows",
            result.rows_affected()
        );
        println!(
            "[sync_service] Updated task {} (google_id: {})",
            existing_task.id, google_id
        );
    } else {
        // Skip remote task if we're waiting to delete it as part of a pending move
        let pending_move_match: Option<String> = sqlx::query_scalar(
            "SELECT id FROM tasks_metadata WHERE pending_delete_google_id = ? LIMIT 1",
        )
        .bind(google_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to check pending move for task: {}", e))?;

        if pending_move_match.is_some() {
            println!(
                "[sync_service] Ignoring remote task {} because a move is pending locally",
                google_id
            );
            return Ok(());
        }

        // Check if we have this task with a different local ID (preserve metadata)
        let existing_by_hash: Option<String> = sqlx::query_scalar(
            "SELECT id FROM tasks_metadata WHERE metadata_hash = ? AND list_id = ? AND google_id IS NULL LIMIT 1"
        )
        .bind(&remote_metadata_hash)
        .bind(list_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Failed to check for existing task by metadata hash: {}", e))?;

        if let Some(existing_id) = existing_by_hash {
            // Update existing task with google_id (preserve metadata)
            eprintln!(
                "[sync_service] Found existing task {}, linking to google_id {}",
                existing_id, google_id
            );
            let result = sqlx::query(
                "UPDATE tasks_metadata SET google_id = ?, list_id = ?, title = ?, notes = ?, due_date = ?, priority = ?, labels = ?, status = ?, time_block = ?, updated_at = ?, sync_state = 'synced', last_synced_at = ?, metadata_hash = ?, dirty_fields = '[]', sync_attempts = 0, sync_error = NULL WHERE id = ?"
            )
            .bind(google_id)
            .bind(list_id)
            .bind(&remote_metadata.title)
            .bind(notes_to_store.as_deref())
            .bind(due_to_store.as_deref())
            .bind(&priority_to_store)
            .bind(&labels_to_store)
            .bind(&status_to_store)
            .bind(time_block_to_store.as_deref())
            .bind(now)
            .bind(now)
            .bind(&remote_metadata_hash)
            .bind(&existing_id)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to link existing task: {}", e))?;

            eprintln!(
                "[sync_service] UPDATE affected {} rows",
                result.rows_affected()
            );
            println!(
                "[sync_service] Linked existing task {} to google_id {}",
                existing_id, google_id
            );
        } else {
            // Insert truly new task with defaults
            let local_id = format!("google-{}", google_id);
            eprintln!(
                "[sync_service] Task does NOT exist, inserting new id={}",
                local_id
            );

            let result = sqlx::query(
                "INSERT INTO tasks_metadata (id, google_id, list_id, title, priority, labels, status, due_date, notes, time_block, created_at, updated_at, sync_state, last_synced_at, metadata_hash, dirty_fields)\n                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(local_id.clone())
            .bind(google_id)
            .bind(list_id)
            .bind(&remote_metadata.title)
            .bind(&priority_to_store)
            .bind(&labels_to_store)
            .bind(&status_to_store)
            .bind(due_to_store.as_deref())
            .bind(notes_to_store.as_deref())
            .bind(time_block_to_store.as_deref())
            .bind(now)
            .bind(now)
            .bind("synced")
            .bind(now)
            .bind(&remote_metadata_hash)
            .bind("[]")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to insert task: {}", e))?;

            eprintln!(
                "[sync_service] INSERT affected {} rows",
                result.rows_affected()
            );
            println!(
                "[sync_service] Inserted new task {} (google_id: {})",
                local_id, google_id
            );
        }
    }

    Ok(())
}

async fn reconcile_subtasks(pool: &SqlitePool, list_id: &str, subtasks: Vec<Value>) -> Result<(), String> {
    if subtasks.is_empty() {
        return Ok(());
    }

    let mut grouped: HashMap<String, Vec<Value>> = HashMap::new();
    for subtask in subtasks {
        if let Some(parent_id) = subtask.get("parent").and_then(|v| v.as_str()) {
            grouped
                .entry(parent_id.to_string())
                .or_default()
                .push(subtask);
        }
    }

    let now = chrono::Utc::now().timestamp();

    for (parent_google_id, mut items) in grouped {
        // Ensure deterministic ordering based on Google's lexicographical position string
        items.sort_by(|a, b| {
            let pos_a = a.get("position").and_then(|v| v.as_str()).unwrap_or("");
            let pos_b = b.get("position").and_then(|v| v.as_str()).unwrap_or("");
            pos_a.cmp(pos_b)
        });

        let parent_local_id: Option<String> =
            sqlx::query_scalar("SELECT id FROM tasks_metadata WHERE google_id = ? LIMIT 1")
                .bind(&parent_google_id)
                .fetch_optional(pool)
                .await
                .map_err(|e| {
                    format!(
                        "Failed to resolve parent task {} for remote subtasks: {}",
                        parent_google_id, e
                    )
                })?;

        let Some(parent_local_id) = parent_local_id else {
            eprintln!(
                "[sync_service] Skipping subtasks for parent {} in list {} because local task not found",
                parent_google_id, list_id
            );
            continue;
        };

        for (index, item) in items.into_iter().enumerate() {
            let task: GoogleTask = serde_json::from_value(item.clone())
                .map_err(|e| format!("Failed to parse Google subtask payload: {}", e))?;

            let google_id = task.id.clone();
            let status = task
                .status
                .clone()
                .unwrap_or_else(|| "needsAction".to_string());

            let remote_payload = task_metadata::GoogleTaskPayload {
                title: task.title.clone(),
                notes: task.notes.clone(),
                due: task.due.clone(),
                status: status.clone(),
            };
            let remote_metadata =
                task_metadata::TaskMetadata::deserialize_from_google(&remote_payload)
                    .normalize();

            let subtask_metadata = task_metadata::SubtaskMetadata {
                id: String::new(),
                task_id: parent_local_id.clone(),
                google_id: Some(google_id.clone()),
                parent_google_id: Some(parent_google_id.clone()),
                title: remote_metadata.title.clone(),
                is_completed: status == "completed",
                due_date: remote_metadata.due_date.clone(),
                position: index as i64,
            };

            let normalized = subtask_metadata.normalize();
            let metadata_hash = normalized.compute_hash();

            #[derive(sqlx::FromRow)]
            struct ExistingSubtask {
                id: String,
            }

            let existing: Option<ExistingSubtask> = sqlx::query_as(
                "SELECT id, metadata_hash, sync_state FROM task_subtasks WHERE google_id = ?",
            )
            .bind(&google_id)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Failed to check existing subtask {}: {}", google_id, e))?;

            if let Some(existing_subtask) = existing {
                let mut normalized = normalized;
                normalized.id = existing_subtask.id.clone();

                sqlx::query(
                    "UPDATE task_subtasks SET task_id = ?, google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = '[]', sync_state = 'synced', sync_error = NULL, last_synced_at = ?, updated_at = ? WHERE id = ?",
                )
                .bind(&parent_local_id)
                .bind(normalized.google_id.as_ref())
                .bind(normalized.parent_google_id.as_ref())
                .bind(&normalized.title)
                .bind(if normalized.is_completed { 1 } else { 0 })
                .bind(normalized.position)
                .bind(&normalized.due_date)
                .bind(&metadata_hash)
                .bind(now)
                .bind(now)
                .bind(&existing_subtask.id)
                .execute(pool)
                .await
                .map_err(|e| format!("Failed to update subtask {}: {}", existing_subtask.id, e))?;

                continue;
            }

            let existing_by_hash: Option<String> = sqlx::query_scalar(
                "SELECT id FROM task_subtasks WHERE task_id = ? AND metadata_hash = ? AND google_id IS NULL LIMIT 1",
            )
            .bind(&parent_local_id)
            .bind(&metadata_hash)
            .fetch_optional(pool)
            .await
            .map_err(|e| format!("Failed to check existing subtask by hash: {}", e))?;

            let mut normalized = normalized;

            if let Some(existing_id) = existing_by_hash {
                normalized.id = existing_id.clone();

                sqlx::query(
                    "UPDATE task_subtasks SET task_id = ?, google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = '[]', sync_state = 'synced', sync_error = NULL, last_synced_at = ?, updated_at = ? WHERE id = ?",
                )
                .bind(&parent_local_id)
                .bind(normalized.google_id.as_ref())
                .bind(normalized.parent_google_id.as_ref())
                .bind(&normalized.title)
                .bind(if normalized.is_completed { 1 } else { 0 })
                .bind(normalized.position)
                .bind(&normalized.due_date)
                .bind(&metadata_hash)
                .bind(now)
                .bind(now)
                .bind(&existing_id)
                .execute(pool)
                .await
                .map_err(|e| format!("Failed to link subtask {} by hash: {}", existing_id, e))?;

                continue;
            }

            let new_id = format!("google-subtask-{}", google_id);
            normalized.id = new_id.clone();

            sqlx::query(
                "INSERT INTO task_subtasks (id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', 'synced', NULL, ?, ?, ?)",
            )
            .bind(&normalized.id)
            .bind(&parent_local_id)
            .bind(normalized.google_id.as_ref())
            .bind(normalized.parent_google_id.as_ref())
            .bind(&normalized.title)
            .bind(if normalized.is_completed { 1 } else { 0 })
            .bind(normalized.position)
            .bind(&normalized.due_date)
            .bind(&metadata_hash)
            .bind(now)
            .bind(now)
            .bind(now)
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to insert remote subtask {}: {}", google_id, e))?;
        }
    }

    Ok(())
}
