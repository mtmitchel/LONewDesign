//! OpenAI and OpenRouter commands

use super::ai_types::{ChatMessageInput, ModelInfo, StreamEvent};
use crate::ApiState;
use futures_util::StreamExt;
use reqwest::StatusCode;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};

fn emit(window: &WebviewWindow, event_name: &str, event: StreamEvent) -> Result<(), String> {
    window.emit(event_name, event).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn fetch_openrouter_models(
    state: State<'_, ApiState>,
    api_key: String,
) -> Result<Vec<ModelInfo>, String> {
    if api_key.trim().is_empty() {
        return Err("Missing API key".into());
    }

    let url = "https://openrouter.ai/api/v1/models";

    let response = state
        .client
        .get(url)
        .header("Authorization", format!("Bearer {}", api_key.trim()))
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("OpenRouter API error {}: {}", status, body));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|err| format!("Failed to parse response: {}", err))?;

    let mut models = Vec::new();
    if let Some(data) = json["data"].as_array() {
        for model in data {
            if let Some(id) = model["id"].as_str() {
                models.push(ModelInfo {
                    id: id.to_string(),
                    object: "model".to_string(),
                    owned_by: model["owned_by"].as_str().map(|s| s.to_string()),
                });
            }
        }
    }

    Ok(models)
}

#[tauri::command]
pub async fn openai_chat_stream(
    app: AppHandle,
    state: State<'_, ApiState>,
    window_label: String,
    event_name: String,
    api_key: String,
    base_url: Option<String>,
    model: String,
    messages: Vec<ChatMessageInput>,
) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("Missing API key".into());
    }

    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let url = format!(
        "{}/chat/completions",
        base_url
            .as_deref()
            .unwrap_or("https://api.openai.com/v1")
            .trim_end_matches('/')
    );

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "stream": true,
    });

    let response = state
        .client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key.trim()))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await;

    let mut stream = match response {
        Ok(resp) if resp.status() == StatusCode::OK => resp.bytes_stream(),
        Ok(resp) => {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_else(|_| "unknown".into());
            let _ = emit(
                &window,
                &event_name,
                StreamEvent {
                    event: "error".into(),
                    content: None,
                    finish_reason: None,
                    error: Some(format!("HTTP {}: {}", status, body)),
                },
            );
            return Err(format!("HTTP {}: {}", status, body));
        }
        Err(e) => {
            let _ = emit(
                &window,
                &event_name,
                StreamEvent {
                    event: "error".into(),
                    content: None,
                    finish_reason: None,
                    error: Some(e.to_string()),
                },
            );
            return Err(e.to_string());
        }
    };

    let mut buffer = String::new();
    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| {
            let _ = emit(
                &window,
                &event_name,
                StreamEvent {
                    event: "error".into(),
                    content: None,
                    finish_reason: None,
                    error: Some(e.to_string()),
                },
            );
            e.to_string()
        })?;

        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer.drain(..=line_end);

            if line.is_empty() || !line.starts_with("data: ") {
                continue;
            }

            let data_str = &line[6..];
            if data_str == "[DONE]" {
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

            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data_str) {
                if let Some(choices) = parsed["choices"].as_array() {
                    if let Some(choice) = choices.first() {
                        if let Some(content) = choice["delta"]["content"].as_str() {
                            let _ = emit(
                                &window,
                                &event_name,
                                StreamEvent {
                                    event: "delta".into(),
                                    content: Some(content.to_string()),
                                    finish_reason: None,
                                    error: None,
                                },
                            );
                        }
                        if let Some(reason) = choice["finish_reason"].as_str() {
                            let _ = emit(
                                &window,
                                &event_name,
                                StreamEvent {
                                    event: "done".into(),
                                    content: None,
                                    finish_reason: Some(reason.to_string()),
                                    error: None,
                                },
                            );
                            return Ok(());
                        }
                    }
                }
            }
        }
    }

    let finish_reason = if buffer.contains("[DONE]") {
        Some("stop".into())
    } else {
        Some("length".into())
    };

    let _ = emit(
        &window,
        &event_name,
        StreamEvent {
            event: "done".into(),
            content: None,
            finish_reason,
            error: None,
        },
    );

    Ok(())
}

#[tauri::command]
pub async fn openai_complete(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
    model: String,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("Missing API key".into());
    }

    let url = format!(
        "{}/chat/completions",
        base_url
            .as_deref()
            .unwrap_or("https://api.openai.com/v1")
            .trim_end_matches('/')
    );

    let payload = serde_json::json!({
        "model": model,
        "messages": messages,
        "temperature": temperature.unwrap_or(0.3),
        "max_tokens": max_tokens.unwrap_or(2000),
        "stream": false,
    });

    let response = state
        .client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key.trim()))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_else(|_| "unknown".into());
        return Err(format!("HTTP {}: {}", status, body));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or("No content in response")?
        .to_string();

    Ok(content)
}
