//! Shared types for AI/LLM commands

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatMessageInput {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct StreamEvent {
    pub event: String,
    pub content: Option<String>,
    pub finish_reason: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TestResult {
    pub ok: bool,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ModelInfo {
    pub id: String,
    pub object: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owned_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ModelsResponse {
    pub data: Vec<ModelInfo>,
}

#[derive(Debug, Serialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessageInput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub random_seed: Option<u64>,
    pub stream: bool,
}

// Streaming response types
#[derive(Debug, Deserialize)]
pub struct StreamDelta {
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StreamChoice {
    pub delta: Option<StreamDelta>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct StreamChunk {
    pub choices: Vec<StreamChoice>,
}
