//! Sync service orchestrator for Google Tasks integration

use reqwest::Client;
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};

use crate::sync::{oauth, queue_worker, reconciler};

pub struct SyncService {
    db_pool: Arc<SqlitePool>,
    poll_interval: Duration,
    http_client: Client,
    _app_handle: AppHandle,
}

impl SyncService {
    pub fn new(db_pool: SqlitePool, http_client: Client, app_handle: AppHandle) -> Self {
        Self {
            db_pool: Arc::new(db_pool),
            poll_interval: Duration::from_secs(60), // 1 minute
            http_client,
            _app_handle: app_handle,
        }
    }

    pub fn start(self: Arc<Self>) {
        tokio::spawn(async move {
            // Run sync immediately on startup
            println!("[sync_service] Running initial sync on startup");
            if let Err(e) = self.sync_cycle().await {
                eprintln!("[sync_service] Initial sync failed: {}", e);
            }

            // Then start periodic polling
            let mut ticker = interval(self.poll_interval);
            loop {
                ticker.tick().await;
                if let Err(e) = self.sync_cycle().await {
                    eprintln!("[sync_service] Sync cycle failed: {}", e);
                }
            }
        });
    }

    pub async fn sync_now(&self) -> Result<(), String> {
        self.sync_cycle().await
    }

    async fn sync_cycle(&self) -> Result<(), String> {
        println!("[sync_service] Starting sync cycle");

        // Get OAuth tokens
        let tokens = oauth::get_oauth_tokens().await?;

        // Step 1: Execute pending mutations
        queue_worker::execute_pending_mutations(
            &self.db_pool,
            &self.http_client,
            &tokens.access_token
        ).await?;

        // Step 2: Poll Google Tasks API
        reconciler::poll_google_tasks(
            &self.db_pool,
            &self.http_client,
            &tokens.access_token
        ).await?;

        println!("[sync_service] Sync cycle complete");
        // Notify frontend that a sync completed
        let _ = self._app_handle.emit(
            "tasks:sync:complete",
            serde_json::json!({
                "at": chrono::Utc::now().timestamp(),
            }),
        );
        Ok(())
    }
}
