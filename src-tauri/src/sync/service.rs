use crate::sync::events::{emit_sync_event, SyncEventStatus};
use crate::sync::queue;
use crate::sync::reconciler;
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::time::{interval, Duration};

pub struct SyncService {
    pool: SqlitePool,
    http_client: reqwest::Client,
    app_handle: AppHandle,
    api_state: crate::ApiState,
}

impl SyncService {
    pub fn new(
        pool: SqlitePool,
        http_client: reqwest::Client,
        app_handle: AppHandle,
        api_state: crate::ApiState,
    ) -> Self {
        Self {
            pool,
            http_client,
            app_handle,
            api_state,
        }
    }

    pub fn start(self: Arc<Self>) {
        let service = self.clone();
        tokio::spawn(async move {
            if let Err(e) = sync_cycle(&service).await {
                eprintln!("[sync_service] Initial sync cycle error: {}", e);
            }
        });

        let service = self.clone();
        tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(60));
            loop {
                ticker.tick().await;
                if let Err(e) = sync_cycle(&service).await {
                    eprintln!("[sync_service] Sync cycle error: {}", e);
                }
            }
        });
    }
}

pub async fn sync_cycle(service: &SyncService) -> Result<(), String> {
    let result = (async {
        queue::process_sync_queue(&service.pool, &service.http_client, &service.api_state).await?;
        reconciler::dedupe::cleanup_duplicate_tasks(&service.pool).await?;
        reconciler::poll::poll_google_tasks(&service.http_client, &service.api_state, &service.pool).await?;
        Ok::<(), String>(())
    })
    .await;

    match &result {
        Ok(_) => emit_sync_event(&service.app_handle, SyncEventStatus::Success, None),
        Err(err) => emit_sync_event(&service.app_handle, SyncEventStatus::Error, Some(err.clone())),
    }

    result
}
