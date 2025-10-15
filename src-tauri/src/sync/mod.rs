//! Sync service modules for Google Tasks integration
//!
//! This module provides structured sync functionality:
//! - `types`: Shared data structures and constants
//! - `oauth`: OAuth token management
//! - `google_client`: HTTP operations for Google Tasks API
//! - `queue_worker`: Mutation queue processing
//! - `reconciler`: Polling and reconciliation logic

pub mod types;
pub mod oauth;
pub mod google_client;
pub mod queue_worker;
pub mod reconciler;

// Re-export commonly used types
pub use types::{
    GoogleOAuthTokens,
    TaskListRecord,
    SyncQueueEntry,
    TaskMetadataRecord,
    GOOGLE_TASKS_BASE_URL,
    GOOGLE_WORKSPACE_SERVICE,
    GOOGLE_WORKSPACE_ACCOUNT,
};
