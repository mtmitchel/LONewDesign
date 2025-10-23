use crate::commands::google::{google_workspace_store_set, GoogleWorkspaceStoreSetInput};
use serde_json::Value;

pub fn persist_workspace_snapshot(snapshot: &Value) -> Result<(), String> {
    let serialised = serde_json::to_string(snapshot)
        .map_err(|e| format!("Failed to serialise Google workspace snapshot: {}", e))?;

    google_workspace_store_set(GoogleWorkspaceStoreSetInput { value: serialised }).map(|_| ())
}

pub fn value_to_i64(value: &Value) -> Option<i64> {
    if let Some(num) = value.as_i64() {
        Some(num)
    } else if let Some(f) = value.as_f64() {
        Some(f as i64)
    } else if let Some(s) = value.as_str() {
        s.parse::<i64>().ok()
    } else {
        None
    }
}
