// Module declarations
pub mod types;
pub mod subtasks;
pub mod commands;
pub mod helpers;

// Re-export all command handlers and types for backward compatibility
pub use commands::*;
pub use types::*;
pub use subtasks::*;
pub use helpers::*;

// Registration function for Tauri
pub fn register(app_handle: &tauri::AppHandle) {
    // Commands are registered via the invoke_handler in main.rs
}
