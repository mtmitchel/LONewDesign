//! Tauri main entry
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod sync;
mod sync_service;
mod task_metadata;

use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

fn init_env() {
    if dotenvy::dotenv().is_ok() {
        return;
    }

    let fallback = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join(".env");

    let _ = dotenvy::from_path(fallback);
}

#[derive(Clone)]
pub struct ApiState {
    client: reqwest::Client,
}

impl ApiState {
    fn new() -> Self {
        let client = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(15))
            .timeout(Duration::from_secs(120))
            .build()
            .expect("failed to build reqwest client");
        Self { client }
    }

    pub fn client(&self) -> &reqwest::Client {
        &self.client
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct GoogleOAuthCallbackPayload {
    pub code: String,
    pub state: String,
    pub redirect_uri: String,
}

// All other Google structs moved to commands/google.rs

#[tauri::command]
async fn init_database_command(app: AppHandle) -> Result<String, String> {
    db::init_database(&app).await?;
    Ok("Database initialized successfully".to_string())
}

// Task CRUD Commands - now in commands/tasks.rs

#[tauri::command]
async fn sync_tasks_now(
    sync_service: tauri::State<'_, std::sync::Arc<sync_service::SyncService>>,
) -> Result<String, String> {
    let service = sync_service.inner().clone();
    tokio::spawn(async move {
        if let Err(e) = service.sync_cycle().await {
            eprintln!("[sync_tasks_now] Sync cycle error: {}", e);
        }
    });
    Ok("Sync triggered".to_string())
}

// All Google OAuth and Tasks commands moved to commands/google.rs

fn main() {
    init_env();
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let app_handle = app.handle();

            #[cfg(any(windows, target_os = "linux"))]
            if let Err(error) = app_handle.deep_link().register("libreollama") {
                eprintln!("[deep-link] Failed to register scheme: {error}");
            }

            let handle_for_listener = app_handle.clone();
            app_handle.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    if url.scheme() != "libreollama" {
                        continue;
                    }

                    let mut code: Option<String> = None;
                    let mut state: Option<String> = None;

                    for (key, value) in url.query_pairs() {
                        match key.as_ref() {
                            "code" => code = Some(value.to_string()),
                            "state" => state = Some(value.to_string()),
                            _ => {}
                        }
                    }

                    if let Some(code) = code {
                        let payload = GoogleOAuthCallbackPayload {
                            code,
                            state: state.unwrap_or_default(),
                            redirect_uri: url.to_string(),
                        };

                        if let Err(error) =
                            handle_for_listener.emit("google:oauth:callback", payload)
                        {
                            eprintln!("[deep-link] Failed to emit OAuth callback: {error}");
                        }
                    }
                }
            });

            // Initialize database and start sync service
            let app_handle_for_db = app_handle.clone();
            let app_handle_for_sync = app_handle.clone();
            let sync_service = tauri::async_runtime::block_on(async move {
                let pool = db::init_database(&app_handle_for_db)
                    .await
                    .expect("Failed to initialize database");
                println!("[main] Database initialized, creating sync service");
                println!(
                    "[main] Using shared DB pool (already_initialized={})",
                    db::is_initialized()
                );
                let http_client = reqwest::Client::builder()
                    .connect_timeout(std::time::Duration::from_secs(15))
                    .timeout(std::time::Duration::from_secs(120))
                    .build()
                    .expect("Failed to build HTTP client for sync service");
                let api_state = ApiState::new();
                std::sync::Arc::new(sync_service::SyncService::new(
                    pool,
                    http_client,
                    app_handle_for_sync,
                    api_state,
                ))
            });

            app.manage(sync_service.clone());
            tauri::async_runtime::spawn(async move {
                sync_service.start();
            });

            Ok(())
        })
        .manage(ApiState::new())
        .invoke_handler(tauri::generate_handler![
            init_database_command,
            commands::tasks::create_task,
            commands::tasks::update_task_command,
            commands::tasks::delete_task,
            commands::tasks::get_tasks,
            commands::tasks::get_task_lists,
            commands::tasks::create_task_list,
            commands::tasks::delete_task_list,
            commands::tasks::queue_move_task,
            sync_tasks_now,
            commands::mistral::test_mistral_credentials,
            commands::mistral::fetch_mistral_models,
            commands::mistral::mistral_chat_stream,
            commands::mistral::mistral_complete,
            commands::ollama::test_ollama_connection,
            commands::ollama::ollama_list_models,
            commands::ollama::ollama_pull_model,
            commands::ollama::ollama_delete_model,
            commands::ollama::ollama_chat_stream,
            commands::ollama::ollama_complete,
            commands::openai::fetch_openrouter_models,
            commands::openai::openai_chat_stream,
            commands::openai::openai_complete,
            commands::deepl::deepl_translate,
            commands::ai_utils::generate_conversation_title,
            commands::google::google_oauth_exchange,
            commands::google::google_oauth_refresh,
            commands::google::google_workspace_store_get,
            commands::google::google_workspace_store_set,
            commands::google::google_workspace_store_clear,
            commands::google::google_oauth_loopback_listen,
            commands::google::google_tasks_list_tasklists,
            commands::google::google_tasks_list_tasks,
            commands::google::google_tasks_insert_task,
            commands::google::google_tasks_patch_task,
            commands::google::google_tasks_delete_task,
            commands::google::google_tasks_move_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
