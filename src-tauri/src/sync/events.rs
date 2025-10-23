// #region Event Payload Types
use chrono::Utc;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SyncEventStatus {
    Success,
    Error,
}

#[derive(Clone, Serialize)]
pub struct SyncEventPayload {
    pub status: SyncEventStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub timestamp_ms: i64,
}

// #endregion

// #region Event Emission
pub fn emit_sync_event(app_handle: &AppHandle, status: SyncEventStatus, error: Option<String>) {
    let payload = SyncEventPayload {
        status,
        error,
        timestamp_ms: Utc::now().timestamp_millis(),
    };

    if let Err(err) = app_handle.emit("tasks:sync:complete", payload) {
        eprintln!(
            "[sync_service] Failed to emit tasks:sync:complete event: {}",
            err
        );
    }
}

pub fn emit_queue_event(app_handle: &AppHandle, status: SyncEventStatus, error: Option<String>) {
    let payload = SyncEventPayload {
        status,
        error,
        timestamp_ms: Utc::now().timestamp_millis(),
    };

    if let Err(err) = app_handle.emit("tasks:sync:queue-processed", payload) {
        eprintln!(
            "[sync_service] Failed to emit tasks:sync:queue-processed event: {}",
            err
        );
    }
}
// #endregion
