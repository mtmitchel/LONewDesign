use crate::sync::events::{emit_queue_event, SyncEventStatus};
use crate::sync::queue_worker::{self, QueueExecutionResult};
use crate::sync::token;
use sqlx::SqlitePool;

#[tauri::command]
pub async fn process_sync_queue_only(app_handle: tauri::AppHandle, pool: tauri::State<'_, SqlitePool>, http_client: tauri::State<'_, reqwest::Client>, api_state: tauri::State<'_, crate::ApiState>) -> Result<(), String> {
    match process_sync_queue(&pool, &http_client, &api_state).await {
        Ok(_) => {
            emit_queue_event(&app_handle, SyncEventStatus::Success, None);
            Ok(())
        }
        Err(err) => {
            emit_queue_event(&app_handle, SyncEventStatus::Error, Some(err.clone()));
            Err(err)
        }
    }
}

pub async fn process_sync_queue(pool: &SqlitePool, http_client: &reqwest::Client, api_state: &crate::ApiState) -> Result<(), String> {
    let mut force_refresh = false;

    for attempt in 0..2 {
        let access_token = match token::ensure_access_token(api_state, force_refresh).await {
            Ok(token) => token,
            Err(err) => {
                eprintln!(
                    "[sync_service] Cannot process queue without access token: {}",
                    err
                );
                return Err(err);
            }
        };

        match queue_worker::execute_pending_mutations(
            pool,
            http_client,
            &access_token,
        )
        .await?
        {
            QueueExecutionResult::Completed => return Ok(()),
            QueueExecutionResult::RequiresTokenRefresh => {
                if attempt == 0 {
                    force_refresh = true;
                    continue;
                }

                return Err(
                    "Google access token refresh did not resolve authorization errors"
                        .to_string(),
                );
            }
        }
    }

    Ok(())
}
