use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::collections::HashMap;

/// Core saga orchestration types and state machine

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskBackup {
    pub id: String,
    pub google_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub notes: Option<String>,
    pub status: String,
    pub due_date: Option<String>,
    pub priority: String,
    pub labels: String,
    pub time_block: Option<String>,
    #[serde(default)]
    pub pending_move_from: Option<String>,
    #[serde(default)]
    pub pending_delete_google_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtaskBackup {
    pub id: String,
    pub google_id: String,
    pub parent_google_id: String,
    pub title: String,
    pub is_completed: bool,
    pub position: i64,
    pub due_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "state", content = "data")]
pub enum TaskMoveSaga {
    Initialized {
        task_id: String,
        from_list_id: String,
        to_list_id: String,
    },
    TaskExported {
        task_backup: TaskBackup,
        subtask_backups: Vec<SubtaskBackup>,
    },
    SourceDeleted {
        old_google_id: String,
    },
    DestinationCreated {
        new_google_id: String,
    },
    SubtasksCreated {
        new_google_id: String,
        subtask_mapping: HashMap<String, String>, // old_subtask_id -> new_google_id
    },
    DatabaseUpdated,
    Completed,

    // Compensating states
    Compensating {
        reason: String,
        from_state: String,
    },
    Compensated,
    Failed {
        error: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SagaLog {
    pub id: String,
    pub saga_type: String,
    pub state: String, // JSON serialized TaskMoveSaga
    pub task_id: String,
    pub from_list_id: Option<String>,
    pub to_list_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
}

/// Load or initialize a saga from the database
pub async fn load_or_initialize_saga(
    db_pool: &SqlitePool,
    saga_id: &str,
    initial_state: TaskMoveSaga,
) -> Result<TaskMoveSaga, String> {
    // Try to load existing saga
    let existing: Option<SagaLog> = sqlx::query_as(
        "SELECT id, saga_type, state, task_id, from_list_id, to_list_id, created_at, updated_at, completed_at, error 
         FROM saga_logs WHERE id = ?"
    )
    .bind(saga_id)
    .fetch_optional(db_pool)
    .await
    .map_err(|e| format!("Failed to load saga: {}", e))?;

    if let Some(saga) = existing {
        // Deserialize existing state
        serde_json::from_str(&saga.state)
            .map_err(|e| format!("Failed to deserialize saga state: {}", e))
    } else {
        // Initialize new saga
        let now = chrono::Utc::now().timestamp();
        let state_json = serde_json::to_string(&initial_state)
            .map_err(|e| format!("Failed to serialize initial state: {}", e))?;

        let (task_id, from_list_id, to_list_id) = match &initial_state {
            TaskMoveSaga::Initialized {
                task_id,
                from_list_id,
                to_list_id,
            } => (
                task_id.clone(),
                Some(from_list_id.clone()),
                Some(to_list_id.clone()),
            ),
            _ => return Err("Initial state must be Initialized variant".to_string()),
        };

        sqlx::query(
            "INSERT INTO saga_logs (id, saga_type, state, task_id, from_list_id, to_list_id, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(saga_id)
        .bind("task_move")
        .bind(&state_json)
        .bind(&task_id)
        .bind(&from_list_id)
        .bind(&to_list_id)
        .bind(now)
        .bind(now)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to initialize saga: {}", e))?;

        Ok(initial_state)
    }
}

/// Persist saga state transition
pub async fn persist_saga_state(
    db_pool: &SqlitePool,
    saga_id: &str,
    state: &TaskMoveSaga,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp();
    let state_json =
        serde_json::to_string(state).map_err(|e| format!("Failed to serialize state: {}", e))?;

    // Update completed_at if in terminal state
    let completed_at = match state {
        TaskMoveSaga::Completed | TaskMoveSaga::Compensated | TaskMoveSaga::Failed { .. } => {
            Some(now)
        }
        _ => None,
    };

    let error = match state {
        TaskMoveSaga::Failed { error } => Some(error.clone()),
        _ => None,
    };

    if let Some(completed) = completed_at {
        sqlx::query(
            "UPDATE saga_logs SET state = ?, updated_at = ?, completed_at = ?, error = ? WHERE id = ?"
        )
        .bind(&state_json)
        .bind(now)
        .bind(completed)
        .bind(&error)
        .bind(saga_id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to update saga state: {}", e))?;
    } else {
        sqlx::query("UPDATE saga_logs SET state = ?, updated_at = ? WHERE id = ?")
            .bind(&state_json)
            .bind(now)
            .bind(saga_id)
            .execute(db_pool)
            .await
            .map_err(|e| format!("Failed to update saga state: {}", e))?;
    }

    Ok(())
}

/// Acquire a distributed lock for an operation
pub async fn acquire_lock(
    db_pool: &SqlitePool,
    lock_key: &str,
    timeout_seconds: i64,
) -> Result<bool, String> {
    let now = chrono::Utc::now().timestamp();
    let expires_at = now + timeout_seconds;

    // Clean up expired locks first
    sqlx::query("DELETE FROM operation_locks WHERE expires_at < ?")
        .bind(now)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to clean up locks: {}", e))?;

    // Try to acquire lock
    let result = sqlx::query(
        "INSERT INTO operation_locks (lock_key, acquired_at, expires_at) 
         VALUES (?, ?, ?) 
         ON CONFLICT(lock_key) DO NOTHING",
    )
    .bind(lock_key)
    .bind(now)
    .bind(expires_at)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to acquire lock: {}", e))?;

    Ok(result.rows_affected() > 0)
}

/// Release a distributed lock
pub async fn release_lock(db_pool: &SqlitePool, lock_key: &str) -> Result<(), String> {
    sqlx::query("DELETE FROM operation_locks WHERE lock_key = ?")
        .bind(lock_key)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to release lock: {}", e))?;

    Ok(())
}

/// Store idempotent operation
pub async fn check_or_store_idempotent_operation(
    db_pool: &SqlitePool,
    idempotency_key: &str,
    operation_type: &str,
    request_params: &str,
) -> Result<Option<String>, String> {
    let now = chrono::Utc::now().timestamp();
    let expires_at = now + 86400; // 24 hours

    // Clean up expired entries
    sqlx::query("DELETE FROM operation_idempotency WHERE expires_at < ?")
        .bind(now)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to clean up idempotency records: {}", e))?;

    // Check if operation already exists
    let existing: Option<(String, String)> = sqlx::query_as(
        "SELECT status, response_data FROM operation_idempotency WHERE idempotency_key = ?",
    )
    .bind(idempotency_key)
    .fetch_optional(db_pool)
    .await
    .map_err(|e| format!("Failed to check idempotency: {}", e))?;

    if let Some((status, response_data)) = existing {
        if status == "completed" {
            // Return cached response
            return Ok(Some(response_data));
        } else if status == "pending" {
            return Err("Operation already in progress".to_string());
        }
        // If failed, allow retry
    }

    // Store new operation as pending
    sqlx::query(
        "INSERT INTO operation_idempotency (idempotency_key, operation_type, request_params, status, created_at, expires_at)
         VALUES (?, ?, ?, 'pending', ?, ?)
         ON CONFLICT(idempotency_key) DO UPDATE SET status = 'pending', created_at = ?"
    )
    .bind(idempotency_key)
    .bind(operation_type)
    .bind(request_params)
    .bind(now)
    .bind(expires_at)
    .bind(now)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to store idempotent operation: {}", e))?;

    Ok(None)
}

/// Mark idempotent operation as completed
pub async fn mark_idempotent_completed(
    db_pool: &SqlitePool,
    idempotency_key: &str,
    response_data: &str,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp();

    sqlx::query(
        "UPDATE operation_idempotency SET status = 'completed', response_data = ?, completed_at = ? WHERE idempotency_key = ?"
    )
    .bind(response_data)
    .bind(now)
    .bind(idempotency_key)
    .execute(db_pool)
    .await
    .map_err(|e| format!("Failed to mark operation completed: {}", e))?;

    Ok(())
}

/// Mark idempotent operation as failed
pub async fn mark_idempotent_failed(
    db_pool: &SqlitePool,
    idempotency_key: &str,
) -> Result<(), String> {
    sqlx::query("UPDATE operation_idempotency SET status = 'failed' WHERE idempotency_key = ?")
        .bind(idempotency_key)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to mark operation failed: {}", e))?;

    Ok(())
}
