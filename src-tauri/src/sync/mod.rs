//! Sync service modules for Google Tasks integration
//!
//! This module provides structured sync functionality:
//! - `types`: Shared data structures and constants
//! - `oauth`: OAuth token management
//! - `google_client`: HTTP operations for Google Tasks API
//! - `queue_worker`: Mutation queue processing
//! - `reconciler`: Polling and reconciliation logic
//! - `saga`: Saga orchestration pattern for distributed transactions
//! - `saga_move`: Task move saga implementation

pub mod google_client;
pub mod queue_worker;
pub mod saga;
pub mod saga_move;
pub mod types;
