use chrono::Utc;
use reqwest::Client;
use sqlx::SqlitePool;
use std::collections::HashMap;
use uuid::Uuid;

use crate::task_metadata::TaskMetadata;

use super::google_client;
use super::saga::{
    acquire_lock, check_or_store_idempotent_operation, load_or_initialize_saga,
    mark_idempotent_completed, mark_idempotent_failed, persist_saga_state, release_lock,
    SubtaskBackup, TaskBackup, TaskMoveSaga,
};

/// Execute the complete task move saga
pub async fn execute_move_saga(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    task_id: &str,
    from_list_id: &str,
    to_list_id: &str,
) -> Result<(), String> {
    let saga_id = Uuid::new_v4().to_string();
    let lock_key = format!("task_move:{}", task_id);

    // Acquire distributed lock
    let lock_acquired = acquire_lock(db_pool, &lock_key, 300).await?; // 5 minute timeout
    if !lock_acquired {
        return Err("Another move operation is already in progress for this task".to_string());
    }

    // Ensure lock is released on exit
    let result = execute_move_saga_internal(
        db_pool,
        http_client,
        access_token,
        &saga_id,
        task_id,
        from_list_id,
        to_list_id,
    )
    .await;

    // Release lock
    let _ = release_lock(db_pool, &lock_key).await;

    result
}

async fn execute_move_saga_internal(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    saga_id: &str,
    task_id: &str,
    from_list_id: &str,
    to_list_id: &str,
) -> Result<(), String> {
    let initial_state = TaskMoveSaga::Initialized {
        task_id: task_id.to_string(),
        from_list_id: from_list_id.to_string(),
        to_list_id: to_list_id.to_string(),
    };

    let mut current_state = load_or_initialize_saga(db_pool, saga_id, initial_state).await?;

    loop {
        match current_state {
            TaskMoveSaga::Initialized {
                task_id,
                from_list_id,
                to_list_id: _,
            } => {
                println!("[saga_move] Step 1: Exporting task data");
                let (task_backup, subtask_backups) =
                    export_task_data(db_pool, &task_id, &from_list_id).await?;

                store_task_backup(db_pool, saga_id, &task_backup, &subtask_backups).await?;

                let next_state = TaskMoveSaga::TaskExported {
                    task_backup,
                    subtask_backups,
                };
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::TaskExported {
                task_backup,
                subtask_backups: _,
            } => {
                println!("[saga_move] Step 2: Deleting from source list");

                let google_id = task_backup
                    .google_id
                    .clone()
                    .ok_or_else(|| "Task missing google_id during delete".to_string())?;

                let idempotency_key = format!("delete-task-{}:{}", saga_id, google_id);
                let source_list_id = task_backup
                    .pending_move_from
                    .clone()
                    .unwrap_or_else(|| task_backup.list_id.clone());

                delete_task_idempotent(
                    db_pool,
                    http_client,
                    access_token,
                    &idempotency_key,
                    &source_list_id,
                    &google_id,
                )
                .await?;

                let next_state = TaskMoveSaga::SourceDeleted {
                    old_google_id: google_id,
                };
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::SourceDeleted { old_google_id } => {
                println!("[saga_move] Step 3: Creating in destination list");

                let task_backup = load_task_backup(db_pool, saga_id).await?;
                let idempotency_key = format!("create-task-{}:{}", saga_id, old_google_id);
                let new_google_id = create_task_idempotent(
                    db_pool,
                    http_client,
                    access_token,
                    &idempotency_key,
                    to_list_id,
                    &task_backup,
                )
                .await?;

                let next_state = TaskMoveSaga::DestinationCreated { new_google_id };
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::DestinationCreated { ref new_google_id } => {
                println!("[saga_move] Step 4: Recreating subtasks");

                let subtask_backups = load_subtask_backups(db_pool, saga_id).await?;
                let subtask_mapping = recreate_subtasks_resumable(
                    saga_id,
                    db_pool,
                    http_client,
                    access_token,
                    to_list_id,
                    new_google_id,
                    &subtask_backups,
                )
                .await?;

                let next_state = TaskMoveSaga::SubtasksCreated {
                    new_google_id: new_google_id.clone(),
                    subtask_mapping,
                };
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::SubtasksCreated {
                ref new_google_id,
                ref subtask_mapping,
            } => {
                println!("[saga_move] Step 5: Updating database");

                let task_backup = load_task_backup(db_pool, saga_id).await?;
                update_database_atomic(
                    db_pool,
                    &task_backup.id,
                    new_google_id,
                    to_list_id,
                    subtask_mapping,
                )
                .await?;

                let next_state = TaskMoveSaga::DatabaseUpdated;
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::DatabaseUpdated => {
                println!("[saga_move] Step 6: Cleanup");

                cleanup_backups(db_pool, saga_id).await?;

                let next_state = TaskMoveSaga::Completed;
                persist_saga_state(db_pool, saga_id, &next_state).await?;
                current_state = next_state;
            }
            TaskMoveSaga::Completed => {
                println!("[saga_move] Saga completed successfully");
                break Ok(());
            }
            TaskMoveSaga::Failed { error } => {
                println!("[saga_move] Saga failed: {}", error);
                break Err(error);
            }
            _ => return Err("Unexpected saga state".to_string()),
        }
    }
}

/// Phase 1: Export task data in short transaction
async fn export_task_data(
    db_pool: &SqlitePool,
    task_id: &str,
    _from_list_id: &str,
) -> Result<(TaskBackup, Vec<SubtaskBackup>), String> {
    let mut tx = db_pool.begin().await.map_err(|e| e.to_string())?;

    let task: Option<(
        String,
        Option<String>,
        String,
        String,
        Option<String>,
        String,
        Option<String>,
        String,
        String,
        Option<String>,
        Option<String>,
        Option<String>,
    )> = sqlx::query_as(
        "SELECT id, google_id, list_id, title, notes, status, due_date, priority, labels, time_block, pending_move_from, pending_delete_google_id \
         FROM tasks_metadata WHERE id = ?",
    )
    .bind(task_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| format!("Failed to load task: {}", e))?;

    let task = task.ok_or_else(|| format!("Task not found: {}", task_id))?;

    let (
        id,
        google_id,
        list_id,
        title,
        notes,
        status,
        due_date,
        priority,
        labels,
        time_block,
        pending_move_from,
        pending_delete_google_id,
    ) = task;

    let source_list_id = pending_move_from.clone().unwrap_or_else(|| list_id.clone());

    let task_backup = TaskBackup {
        id,
        google_id,
        list_id: source_list_id,
        title,
        notes,
        status,
        due_date,
        priority,
        labels,
        time_block,
        pending_move_from,
        pending_delete_google_id,
    };

    if task_backup.google_id.is_none() {
        return Err(
            "Task is missing a Google ID; wait for initial sync to finish before moving".into(),
        );
    }

    let subtask_records: Vec<(String, String, String, String, bool, i64, Option<String>)> =
        sqlx::query_as(
            "SELECT id, google_id, parent_google_id, title, is_completed, position, due_date \
         FROM task_subtasks WHERE task_id = ? ORDER BY position ASC",
        )
        .bind(task_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| format!("Failed to load subtasks: {}", e))?;

    let subtask_backups = subtask_records
        .into_iter()
        .map(|s| SubtaskBackup {
            id: s.0,
            google_id: s.1,
            parent_google_id: s.2,
            title: s.3,
            is_completed: s.4,
            position: s.5,
            due_date: s.6,
        })
        .collect();

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok((task_backup, subtask_backups))
}

/// Store task backup
async fn store_task_backup(
    db_pool: &SqlitePool,
    saga_id: &str,
    task_backup: &TaskBackup,
    subtask_backups: &[SubtaskBackup],
) -> Result<(), String> {
    let now = Utc::now().timestamp();
    let task_backup_json = serde_json::to_string(task_backup)
        .map_err(|e| format!("Failed to serialize task backup: {}", e))?;
    let subtask_backups_json = serde_json::to_string(subtask_backups)
        .map_err(|e| format!("Failed to serialize subtask backups: {}", e))?;

    sqlx::query(
        "INSERT INTO task_backups (saga_id, task_id, task_backup_data, subtask_backups_data, created_at)
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(saga_id)
    .bind(&task_backup.id)
    .bind(&task_backup_json)
    .bind(&subtask_backups_json)
    .bind(now)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to store backup: {}", e))?;

    Ok(())
}

/// Load task backup
async fn load_task_backup(db_pool: &SqlitePool, saga_id: &str) -> Result<TaskBackup, String> {
    let backup: Option<String> =
        sqlx::query_scalar("SELECT task_backup_data FROM task_backups WHERE saga_id = ?")
            .bind(saga_id)
            .fetch_optional(db_pool)
            .await
            .map_err(|e| format!("Failed to load backup: {}", e))?;

    let backup_json = backup.ok_or_else(|| "Backup not found".to_string())?;
    serde_json::from_str(&backup_json).map_err(|e| format!("Failed to deserialize backup: {}", e))
}

/// Load subtask backups
async fn load_subtask_backups(
    db_pool: &SqlitePool,
    saga_id: &str,
) -> Result<Vec<SubtaskBackup>, String> {
    let backups: Option<String> =
        sqlx::query_scalar("SELECT subtask_backups_data FROM task_backups WHERE saga_id = ?")
            .bind(saga_id)
            .fetch_optional(db_pool)
            .await
            .map_err(|e| format!("Failed to load subtask backups: {}", e))?;

    let backups_json = backups.ok_or_else(|| "Subtask backups not found".to_string())?;
    serde_json::from_str(&backups_json)
        .map_err(|e| format!("Failed to deserialize subtask backups: {}", e))
}

/// Idempotent task delete
async fn delete_task_idempotent(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    idempotency_key: &str,
    list_id: &str,
    google_id: &str,
) -> Result<(), String> {
    let request_params = format!(
        "{{\"list_id\":\"{}\",\"google_id\":\"{}\"}}",
        list_id, google_id
    );

    // Check if already completed
    if let Some(_) = check_or_store_idempotent_operation(
        db_pool,
        idempotency_key,
        "delete_task",
        &request_params,
    )
    .await?
    {
        println!("[saga_move] Delete already completed (idempotent)");
        return Ok(());
    }

    // Perform delete
    match google_client::delete_google_task(http_client, access_token, list_id, google_id).await {
        Ok(_) => {
            mark_idempotent_completed(db_pool, idempotency_key, "{}").await?;
            Ok(())
        }
        Err(e) => {
            mark_idempotent_failed(db_pool, idempotency_key).await?;
            Err(e)
        }
    }
}

/// Idempotent task create
async fn create_task_idempotent(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    idempotency_key: &str,
    list_id: &str,
    task_backup: &TaskBackup,
) -> Result<String, String> {
    let request_params = serde_json::to_string(task_backup)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    // Check if already completed
    if let Some(response) = check_or_store_idempotent_operation(
        db_pool,
        idempotency_key,
        "create_task",
        &request_params,
    )
    .await?
    {
        println!("[saga_move] Create already completed (idempotent)");
        let google_id: String = serde_json::from_str(&response)
            .map_err(|e| format!("Failed to deserialize cached response: {}", e))?;
        return Ok(google_id);
    }

    let metadata = TaskMetadata {
        title: task_backup.title.clone(),
        notes: task_backup.notes.clone(),
        due_date: task_backup.due_date.clone(),
        priority: task_backup.priority.clone(),
        labels: task_backup.labels.clone(),
        status: task_backup.status.clone(),
        time_block: task_backup.time_block.clone(),
    };

    let normalized = metadata.normalize();
    let google_payload = normalized.serialize_for_google();
    let payload = serde_json::to_value(google_payload)
        .map_err(|e| format!("Failed to convert task payload: {}", e))?;

    // Perform create
    match google_client::create_google_task_with_payload(
        http_client,
        access_token,
        list_id,
        payload,
    )
    .await
    {
        Ok(google_id) => {
            let response_json = serde_json::to_string(&google_id)
                .map_err(|e| format!("Failed to serialize response: {}", e))?;
            mark_idempotent_completed(db_pool, idempotency_key, &response_json).await?;
            Ok(google_id)
        }
        Err(e) => {
            mark_idempotent_failed(db_pool, idempotency_key).await?;
            Err(e)
        }
    }
}

/// Recreate subtasks with resumability
async fn recreate_subtasks_resumable(
    saga_id: &str,
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    parent_google_id: &str,
    subtask_backups: &[SubtaskBackup],
) -> Result<HashMap<String, String>, String> {
    // Load progress from previous attempt
    let completed_subtasks: Vec<(String, String)> = sqlx::query_as(
        "SELECT old_subtask_id, new_subtask_id FROM saga_subtask_progress WHERE saga_id = ?",
    )
    .bind(saga_id)
    .fetch_all(db_pool)
    .await
    .map_err(|e| format!("Failed to load progress: {}", e))?;

    let mut mapping: HashMap<String, String> = completed_subtasks.into_iter().collect();

    for subtask in subtask_backups {
        // Skip already-created subtasks
        if mapping.contains_key(&subtask.id) {
            continue;
        }

        // Create with idempotency
        let idempotency_key = format!("create-subtask-{}:{}", saga_id, &subtask.id);
        let new_google_id = create_subtask_idempotent(
            db_pool,
            http_client,
            access_token,
            &idempotency_key,
            list_id,
            parent_google_id,
            subtask,
        )
        .await?;

        // Record progress
        let now = Utc::now().timestamp();
        sqlx::query(
            "INSERT INTO saga_subtask_progress (saga_id, old_subtask_id, new_subtask_id, created_at) 
             VALUES (?, ?, ?, ?)"
        )
        .bind(saga_id)
        .bind(&subtask.id)
        .bind(&new_google_id)
        .bind(now)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to record progress: {}", e))?;

        mapping.insert(subtask.id.clone(), new_google_id);

        // Rate limiting
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }

    Ok(mapping)
}

/// Idempotent subtask create
async fn create_subtask_idempotent(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    idempotency_key: &str,
    list_id: &str,
    parent_google_id: &str,
    subtask: &SubtaskBackup,
) -> Result<String, String> {
    let request_params = serde_json::to_string(subtask)
        .map_err(|e| format!("Failed to serialize request: {}", e))?;

    // Check if already completed
    if let Some(response) = check_or_store_idempotent_operation(
        db_pool,
        idempotency_key,
        "create_subtask",
        &request_params,
    )
    .await?
    {
        let google_id: String = serde_json::from_str(&response)
            .map_err(|e| format!("Failed to deserialize cached response: {}", e))?;
        return Ok(google_id);
    }

    // Build payload
    let mut payload = serde_json::json!({
        "title": subtask.title,
        "status": if subtask.is_completed { "completed" } else { "needsAction" },
    });

    if let Some(due) = &subtask.due_date {
        payload["due"] = serde_json::json!(due);
    }

    // Perform create
    match google_client::create_google_subtask(
        http_client,
        access_token,
        list_id,
        parent_google_id,
        payload,
    )
    .await
    {
        Ok(google_id) => {
            let response_json = serde_json::to_string(&google_id)
                .map_err(|e| format!("Failed to serialize response: {}", e))?;
            mark_idempotent_completed(db_pool, idempotency_key, &response_json).await?;
            Ok(google_id)
        }
        Err(e) => {
            mark_idempotent_failed(db_pool, idempotency_key).await?;
            Err(e)
        }
    }
}

/// Update database in short transaction
async fn update_database_atomic(
    db_pool: &SqlitePool,
    task_id: &str,
    new_google_id: &str,
    new_list_id: &str,
    subtask_mapping: &HashMap<String, String>,
) -> Result<(), String> {
    let mut tx = db_pool.begin().await.map_err(|e| e.to_string())?;
    sqlx::query("PRAGMA defer_foreign_keys = ON")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to defer foreign keys: {}", e))?;
    let now = Utc::now().timestamp();
    let new_task_id = if task_id.starts_with("google-") {
        format!("google-{}", new_google_id)
    } else {
        task_id.to_string()
    };

    // Update task
    sqlx::query(
        "UPDATE tasks_metadata SET \
            id = ?, \
            google_id = ?, \
            list_id = ?, \
            pending_move_from = NULL, \
            pending_delete_google_id = NULL, \
            sync_state = CASE WHEN sync_state = 'pending_move' THEN 'synced' ELSE sync_state END, \
            sync_attempts = CASE WHEN sync_state = 'pending_move' THEN 0 ELSE sync_attempts END, \
            last_synced_at = CASE WHEN sync_state = 'pending_move' THEN ? ELSE last_synced_at END, \
            updated_at = ?, \
            sync_error = CASE WHEN sync_state = 'pending_move' THEN NULL ELSE sync_error END
         WHERE id = ?",
    )
    .bind(&new_task_id)
    .bind(new_google_id)
    .bind(new_list_id)
    .bind(now)
    .bind(now)
    .bind(task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to update task: {}", e))?;

    // Update subtasks - set both google_id (subtask's ID) and parent_google_id (parent task's ID)
    for (old_subtask_id, new_subtask_google_id) in subtask_mapping {
        sqlx::query(
            "UPDATE task_subtasks SET \
                task_id = ?, \
                google_id = ?, \
                parent_google_id = ?, \
                sync_state = 'synced', \
                dirty_fields = '[]', \
                sync_error = NULL, \
                last_synced_at = ?, \
                updated_at = ? \
             WHERE id = ?",
        )
        .bind(&new_task_id)
        .bind(new_subtask_google_id)
        .bind(new_google_id) // parent task's new google_id
        .bind(now)
        .bind(now)
        .bind(old_subtask_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to update subtask: {}", e))?;
    }

    if new_task_id != task_id {
        sqlx::query("UPDATE task_subtasks SET task_id = ? WHERE task_id = ?")
            .bind(&new_task_id)
            .bind(task_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to remap subtasks to new task id: {}", e))?;

        sqlx::query("UPDATE sync_queue SET task_id = ? WHERE task_id = ?")
            .bind(&new_task_id)
            .bind(task_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to update sync queue task id: {}", e))?;

        sqlx::query("UPDATE task_mutation_log SET task_id = ? WHERE task_id = ?")
            .bind(&new_task_id)
            .bind(task_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Failed to update mutation log task id: {}", e))?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

/// Cleanup backups
async fn cleanup_backups(db_pool: &SqlitePool, saga_id: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM task_backups WHERE saga_id = ?")
        .bind(saga_id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to cleanup backups: {}", e))?;

    sqlx::query("DELETE FROM saga_subtask_progress WHERE saga_id = ?")
        .bind(saga_id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to cleanup progress: {}", e))?;

    Ok(())
}
