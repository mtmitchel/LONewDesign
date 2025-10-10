//! Tauri main entry
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Duration;

use futures_util::StreamExt;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};

const DEFAULT_MISTRAL_BASE_URL: &str = "https://api.mistral.ai/v1";

#[derive(Clone)]
struct ApiState {
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
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ChatMessageInput {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Clone)]
struct StreamEvent {
    event: String,
    content: Option<String>,
    finish_reason: Option<String>,
    error: Option<String>,
}

#[derive(Debug, Serialize)]
struct TestResult {
    ok: bool,
    message: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ModelInfo {
    id: String,
    object: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    owned_by: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ModelsResponse {
    data: Vec<ModelInfo>,
}

#[derive(Debug, Deserialize)]
struct StreamDelta {
    content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StreamChoice {
    delta: Option<StreamDelta>,
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StreamChunk {
    choices: Vec<StreamChoice>,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessageInput>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stop: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    random_seed: Option<u64>,
    stream: bool,
}

fn emit(window: &WebviewWindow, event_name: &str, event: StreamEvent) -> Result<(), String> {
    window.emit(event_name, event).map_err(|e| e.to_string())
}

fn resolve_base_url(base_url: Option<String>) -> String {
    base_url
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_MISTRAL_BASE_URL.to_string())
}

#[tauri::command]
async fn test_mistral_credentials(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
) -> Result<TestResult, String> {
    if api_key.trim().is_empty() {
        return Ok(TestResult {
            ok: false,
            message: Some("Missing API key".into()),
        });
    }

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/models", resolved_base);

    let response = state
        .client
        .get(url)
        .bearer_auth(api_key)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    let status = response.status();

    if status.is_success() {
        Ok(TestResult { ok: true, message: None })
    } else {
        let body = response.text().await.unwrap_or_default();
        Ok(TestResult {
            ok: false,
            message: Some(if body.is_empty() {
                format!("Mistral responded with status {}", status)
            } else {
                format!("{}: {}", status, body)
            }),
        })
    }
}

#[tauri::command]
async fn fetch_mistral_models(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<ModelInfo>, String> {
    if api_key.trim().is_empty() {
        return Err("Missing API key".into());
    }

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/models", resolved_base);

    let response = state
        .client
        .get(url)
        .bearer_auth(api_key)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    let status = response.status();

    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Mistral responded with status {}", status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    let models_response = response
        .json::<ModelsResponse>()
        .await
        .map_err(|err| format!("Failed to parse models response: {}", err))?;

    Ok(models_response.data)
}

#[tauri::command]
async fn mistral_chat_stream(
    app: AppHandle,
    state: State<'_, ApiState>,
    window_label: String,
    event_name: String,
    api_key: String,
    base_url: Option<String>,
    model: Option<String>,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
    top_p: Option<f32>,
    max_tokens: Option<u32>,
    stop: Option<Vec<String>>,
    random_seed: Option<u64>,
) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err("Missing Mistral API key".into());
    }

    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| "Window not found".to_string())?;

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/chat/completions", resolved_base);

    let payload = ChatRequest {
        model: model.unwrap_or_else(|| "mistral-small-latest".to_string()),
        messages,
        temperature,
        top_p,
        max_tokens,
        stop,
        random_seed,
        stream: true,
    };

    let response = state
        .client
        .post(url)
        .bearer_auth(api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if response.status() == StatusCode::UNAUTHORIZED {
        let _ = emit(
            &window,
            &event_name,
            StreamEvent {
                event: "error".into(),
                content: None,
                finish_reason: None,
                error: Some("Unauthorized: verify API key".into()),
            },
        );
        return Err("Unauthorized".into());
    }

    if !response.status().is_success() {
        let status = response.status();
        let details = response.text().await.unwrap_or_default();
        let message = if details.is_empty() {
            format!("Mistral responded with status {}", status)
        } else {
            format!("{}: {}", status, details)
        };
        let _ = emit(
            &window,
            &event_name,
            StreamEvent {
                event: "error".into(),
                content: None,
                finish_reason: None,
                error: Some(message.clone()),
            },
        );
        return Err(message);
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut finish_reason: Option<String> = None;

    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|err| err.to_string())?;
        let text = String::from_utf8_lossy(&bytes);
        buffer.push_str(&text);

        loop {
            if let Some(index) = buffer.find("\n\n") {
                let frame = buffer[..index].to_string();
                buffer.drain(..index + 2);

                for line in frame.lines() {
                    let Some(data) = line.trim_start().strip_prefix("data:") else {
                        continue;
                    };
                    let payload = data.trim();

                    if payload == "[DONE]" {
                        let _ = emit(
                            &window,
                            &event_name,
                            StreamEvent {
                                event: "done".into(),
                                content: None,
                                finish_reason: finish_reason.clone(),
                                error: None,
                            },
                        );
                        return Ok(());
                    }

                    match serde_json::from_str::<StreamChunk>(payload) {
                        Ok(chunk) => {
                            for choice in chunk.choices {
                                if let Some(reason) = choice.finish_reason {
                                    finish_reason = if reason.is_empty() {
                                        None
                                    } else {
                                        Some(reason)
                                    };
                                }

                                if let Some(delta) = choice.delta {
                                    if let Some(content) = delta.content {
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
                            }
                        }
                        Err(err) => {
                            let _ = emit(
                                &window,
                                &event_name,
                                StreamEvent {
                                    event: "error".into(),
                                    content: None,
                                    finish_reason: None,
                                    error: Some(format!("Failed to decode stream: {}", err)),
                                },
                            );
                            return Err(err.to_string());
                        }
                    }
                }
            } else {
                break;
            }
        }
    }

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
async fn generate_conversation_title(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
    model: Option<String>,
    messages: Vec<ChatMessageInput>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("Missing Mistral API key".into());
    }

    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/chat/completions", resolved_base);

    // Create a system message to guide title generation
    let mut title_messages = vec![
        ChatMessageInput {
            role: "system".to_string(),
            content: "Generate a concise 3-5 word title that summarizes this conversation. Respond with ONLY the title, no quotes, no punctuation at the end.".to_string(),
        }
    ];
    
    // Add the conversation messages
    title_messages.extend(messages);

    let payload = ChatRequest {
        model: model.unwrap_or_else(|| "mistral-small-latest".to_string()),
        messages: title_messages,
        temperature: Some(0.7),
        top_p: None,
        max_tokens: Some(20),
        stop: None,
        random_seed: None,
        stream: false,
    };

    let response = state
        .client
        .post(&url)
        .bearer_auth(api_key.trim())
        .json(&payload)
        .send()
        .await
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(if body.is_empty() {
            format!("Mistral responded with status {}", status)
        } else {
            format!("{}: {}", status, body)
        });
    }

    #[derive(Deserialize)]
    struct TitleResponse {
        choices: Vec<TitleChoice>,
    }

    #[derive(Deserialize)]
    struct TitleChoice {
        message: TitleMessage,
    }

    #[derive(Deserialize)]
    struct TitleMessage {
        content: String,
    }

    let title_response = response
        .json::<TitleResponse>()
        .await
        .map_err(|err| format!("Failed to parse title response: {}", err))?;

    let title = title_response
        .choices
        .first()
        .map(|choice| choice.message.content.trim().to_string())
        .unwrap_or_else(|| "New Conversation".to_string());

    Ok(title)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(ApiState::new())
        .invoke_handler(tauri::generate_handler![
            test_mistral_credentials,
            fetch_mistral_models,
            mistral_chat_stream,
            generate_conversation_title
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}