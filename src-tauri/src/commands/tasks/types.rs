use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// #region Subtask types
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

#[derive(Debug, Clone, Serialize)]
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
pub struct TaskSubtaskRow {
    pub id: String,
    pub task_id: String,
    pub google_id: Option<String>,
    pub parent_google_id: Option<String>,
    pub title: String,
    pub is_completed: i64,
    pub position: i64,
    pub due_date: Option<String>,
    pub metadata_hash: Option<String>,
    pub dirty_fields: String,
    pub sync_state: String,
    pub sync_error: Option<String>,
    pub last_synced_at: Option<i64>,
}

#[derive(Default)]
pub struct SubtaskDiff {
    pub created: Vec<crate::task_metadata::SubtaskMetadata>,
    pub updated: Vec<crate::task_metadata::SubtaskMetadata>,
    pub deleted: Vec<TaskSubtaskRow>,
}

impl SubtaskDiff {
    pub fn has_changes(&self) -> bool {
        !self.created.is_empty() || !self.updated.is_empty() || !self.deleted.is_empty()
    }
}
// #endregion Subtask types

// #region Task types
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
// #endregion Task types

// #region List types
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
// #endregion List types

// #region Move types
#[derive(Debug, Deserialize)]
pub struct QueueMoveTaskInput {
    pub task_id: String,
    pub to_list_id: String,
}
// #endregion Move types

// #region Auth types
#[derive(Debug, Deserialize)]
pub struct StoredGoogleToken {
    #[serde(rename = "accessToken")]
    pub access_token: String,
}

#[derive(Debug, Deserialize)]
pub struct StoredGoogleAccount {
    pub token: StoredGoogleToken,
}

#[derive(Debug, Deserialize)]
pub struct StoredGoogleAuth {
    pub account: StoredGoogleAccount,
}
// #endregion Auth types

// #region Utility functions
pub fn convert_label_inputs(labels: Option<Vec<TaskLabelInput>>) -> Vec<crate::task_metadata::TaskLabel> {
    labels
        .unwrap_or_default()
        .into_iter()
        .filter_map(|label| match label {
            TaskLabelInput::Name(raw) => {
                let trimmed = raw.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(crate::task_metadata::TaskLabel {
                        name: trimmed.to_string(),
                        color: crate::task_metadata::DEFAULT_LABEL_COLOR.to_string(),
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
                    .unwrap_or(crate::task_metadata::DEFAULT_LABEL_COLOR);

                Some(crate::task_metadata::TaskLabel {
                    name: trimmed.to_string(),
                    color: resolved_color.to_string(),
                })
            }
        })
        .collect()
}
// #endregion Utility functions