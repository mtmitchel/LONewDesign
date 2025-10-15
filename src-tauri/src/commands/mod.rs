use tauri::AppHandle;

pub mod google;
pub mod tasks;
pub mod ai_types;
pub mod mistral;
pub mod ollama;
pub mod openai;
pub mod deepl;
pub mod ai_utils;

/// Register command-level observers or background tasks.
pub fn register(app: &AppHandle) {
	tasks::register(app);
	google::register(app);
}
