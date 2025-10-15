use tauri::AppHandle;

pub mod ai_types;
pub mod ai_utils;
pub mod deepl;
pub mod google;
pub mod mistral;
pub mod ollama;
pub mod openai;
pub mod tasks;

/// Register command-level observers or background tasks.
pub fn register(app: &AppHandle) {
    tasks::register(app);
    google::register(app);
}
