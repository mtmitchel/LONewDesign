//! Ollama AI commands

use crate::ApiState;
use super::ai_types::{ChatMessageInput, StreamEvent, TestResult};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};

const DEFAULT_OLLAMA_BASE_URL: &str = "http://127.0.0.1:11434";

pub fn resolve_ollama_base_url(base_url: Option<String>) -> String {
    base_url
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_OLLAMA_BASE_URL.to_string())
}

fn emit(window: &WebviewWindow, event_name: &str, event: StreamEvent) -> Result<(), String> {
    window.emit(event_name, event).map_err(|e| e.to_string())
}

#[derive(Debug, Deserialize, Serialize)]
pub struct OllamaModelInfo {
    pub name: String,
    #[serde(default)]
    pub size: Option<u64>,
    #[serde(default)]
    pub modified_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelInfo>,
}

#[derive(Debug, Deserialize)]
struct OllamaStreamChunk {
    #[serde(default)]
    response: Option<String>,
    #[serde(default)]
    message: Option<OllamaMessage>,
    #[serde(default)]
    done: Option<bool>,
    #[serde(default)]
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaMessage {
    #[serde(default)]
    role: Option<String>,
    content: String,
}

#[derive(Deserialize)]
struct OllamaChatResponse {
    #[serde(default)]
    message: Option<OllamaMessage>,
    #[serde(default)]
    response: Option<String>,
}

#[tauri::command]
pub async fn test_ollama_connection(
    state: State<'_, ApiState>,
    base_url: Option<String>,
) -> Result<TestResult, String> {
    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/tags", resolved);

    match state.client.get(&url).send().await {
        Ok(response) if response.status().is_success() => Ok(TestResult {
            ok: true,
            message: None,
        }),
        Ok(response) => {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            Ok(TestResult {
                ok: false,
                message: Some(if body.is_empty() {
                    format!("Ollama responded with status {}", status)
                } else {
                    format!("{}: {}", status, body)
                }),
            })
        }
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
pub async fn ollama_list_models(
    state: State<'_, ApiState>,
    base_url: Option<String>,
) -> Result<Vec<OllamaModelInfo>, String> {
    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/tags", resolved);

    let response = state
        .client
        .get(&url)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Ollama responded with status {}", status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    let payload = response
        .json::<OllamaTagsResponse>()
        .await
        .map_err(|err| format!("Failed to parse Ollama tags: {}", err))?;

    Ok(payload.models)
}

#[tauri::command]
pub async fn ollama_pull_model(
    state: State<'_, ApiState>,
    base_url: Option<String>,
    model: String,
) -> Result<(), String> {
    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/pull", resolved);

    let response = state
        .client
        .post(&url)
        .json(&serde_json::json!({ "name": model }))
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Failed to pull model {} (status {})", model, status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    Ok(())
}

#[tauri::command]
pub async fn ollama_delete_model(
    state: State<'_, ApiState>,
    base_url: Option<String>,
    model: String,
) -> Result<(), String> {
    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/delete", resolved);

    let response = state
        .client
        .delete(&url)
        .json(&serde_json::json!({ "name": model }))
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Failed to delete model {} (status {})", model, status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    Ok(())
}

#[tauri::command]
pub async fn ollama_complete(
    state: State<'_, ApiState>,
    base_url: Option<String>,
    model: String,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    if model.trim().is_empty() {
        return Err("Model name is required".into());
    }

    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/chat", resolved);

    let mut options = serde_json::Map::new();
    if let Some(temp) = temperature {
        options.insert("temperature".into(), serde_json::json!(temp));
    }
    if let Some(tokens) = max_tokens {
        options.insert("num_predict".into(), serde_json::json!(tokens));
    }

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": false,
        "options": if options.is_empty() { serde_json::Value::Null } else { serde_json::Value::Object(options) },
    });

    let response = state
        .client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Ollama responded with status {}", status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    let parsed = response
        .json::<OllamaChatResponse>()
        .await
        .map_err(|err| format!("Failed to parse Ollama response: {}", err))?;

    if let Some(message) = parsed.message {
        return Ok(message.content.trim().to_string());
    }

    if let Some(content) = parsed.response {
        return Ok(content.trim().to_string());
    }

    Err("No response content returned from Ollama".into())
}

#[tauri::command]
pub async fn ollama_chat_stream(
    app: AppHandle,
    state: State<'_, ApiState>,
    window_label: String,
    event_name: String,
    base_url: Option<String>,
    model: String,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<(), String> {
    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    if model.trim().is_empty() {
        return Err("Model name is required".into());
    }

    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/chat", resolved);

    let mut options = serde_json::Map::new();
    if let Some(temp) = temperature {
        options.insert("temperature".into(), serde_json::json!(temp));
    }
    if let Some(tokens) = max_tokens {
        options.insert("num_predict".into(), serde_json::json!(tokens));
    }

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
        "options": if options.is_empty() { serde_json::Value::Null } else { serde_json::Value::Object(options) },
    });

    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let response = state
        .client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Ollama responded with status {}", status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    let mut stream = response.bytes_stream();
    let mut buffer: Vec<u8> = Vec::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|err| err.to_string())?;
        buffer.extend_from_slice(&chunk);

        while let Some(pos) = buffer.iter().position(|&b| b == b'\n') {
            let line_bytes: Vec<u8> = buffer.drain(..=pos).collect();
            let line = String::from_utf8_lossy(&line_bytes).trim().to_string();
            if line.is_empty() {
                continue;
            }

            match serde_json::from_str::<OllamaStreamChunk>(&line) {
                Ok(chunk) => {
                    if let Some(error) = chunk.error {
                        let _ = emit(
                            &window,
                            &event_name,
                            StreamEvent {
                                event: "error".into(),
                                content: None,
                                finish_reason: None,
                                error: Some(error.clone()),
                            },
                        );
                        return Err(error);
                    }

                    let content = chunk
                        .response
                        .or_else(|| chunk.message.as_ref().map(|m| m.content.clone()));

                    if let Some(content) = content {
                        if !content.is_empty() {
                            let _ = emit(
                                &window,
                                &event_name,
                                StreamEvent {
                                    event: "delta".into(),
                                    content: Some(content),
                                    finish_reason: None,
                                    error: None,
                                },
                            );
                        }
                    }

                    if chunk.done.unwrap_or(false) {
                        let _ = emit(
                            &window,
                            &event_name,
                            StreamEvent {
                                event: "done".into(),
                                content: None,
                                finish_reason: Some("stop".into()),
                                error: None,
                            },
                        );
                        return Ok(());
                    }
                }
                Err(err) => {
                    eprintln!("[Ollama] Failed to parse chunk: {} (line: {})", err, line);
                }
            }
        }
    }

    let _ = emit(
        &window,
        &event_name,
        StreamEvent {
            event: "done".into(),
            content: None,
            finish_reason: Some("eos".into()),
            error: None,
        },
    );

    Ok(())
}
