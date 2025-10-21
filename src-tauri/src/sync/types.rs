//! Shared type definitions and constants for sync module

use serde::{Deserialize, Serialize};

// Google Tasks API constants
pub const GOOGLE_TASKS_BASE_URL: &str = "https://tasks.googleapis.com/tasks/v1";
pub const GOOGLE_WORKSPACE_SERVICE: &str = "com.libreollama.desktop/google-workspace";
pub const GOOGLE_WORKSPACE_ACCOUNT: &str = "oauth";

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleOAuthTokens {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<i64>,
    pub token_type: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrontendToken {
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub access_token_expires_at: Option<i64>,
    pub last_refresh_at: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleWorkspaceAccount {
    pub email: String,
    pub token: FrontendToken,
}

#[derive(Debug, Deserialize)]
pub struct GoogleWorkspaceState {
    pub account: Option<GoogleWorkspaceAccount>,
}

#[derive(Debug, Serialize, sqlx::FromRow, Clone)]
pub struct TaskListRecord {
    pub id: String,
    pub title: String,
    pub updated: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub sync_state: String,
}

#[derive(sqlx::FromRow, Debug, Clone)]
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

#[derive(sqlx::FromRow, Debug, Clone)]
pub struct TaskMetadataRecord {
    pub id: String,
    pub google_id: Option<String>,
    pub list_id: String,
    pub priority: String,
    pub labels: String,
    pub due_date: Option<String>,
    pub time_block: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub metadata_hash: String,
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

#[derive(sqlx::FromRow, Debug, Clone)]
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
