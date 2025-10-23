use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Clone)]
pub struct GoogleTask {
    pub id: String,
    pub title: String,
    pub due: Option<String>,
    pub notes: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct SyncQueueEntry {
    pub id: String,
    pub operation: String,
    pub task_id: String,
    pub payload: String,
    pub scheduled_at: i64,
    pub status: String,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct TaskMetadataRecord {
    pub id: String,
    pub google_id: Option<String>,
    pub list_id: String,
    pub title: String,
    pub priority: String,
    pub labels: String,
    pub due_date: Option<String>,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub metadata_hash: Option<String>,
    pub dirty_fields: String,
    pub pending_move_from: Option<String>,
    pub pending_delete_google_id: Option<String>,
    pub deleted_at: Option<i64>,
    pub sync_state: String,
    pub sync_attempts: i64,
    pub last_synced_at: Option<i64>,
    pub last_remote_hash: Option<String>,
    pub sync_error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::FromRow)]
pub struct TaskSubtaskRecord {
    pub id: String,
    pub task_id: String,
    pub google_id: Option<String>,
    pub parent_google_id: Option<String>,
    pub title: String,
    pub is_completed: i64,
    pub position: i64,
    pub due_date: Option<String>,
}

pub const GOOGLE_TASKS_BASE_URL: &str = "https://tasks.googleapis.com/tasks/v1";