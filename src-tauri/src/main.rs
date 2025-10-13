//! Tauri main entry
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Duration;

use futures_util::StreamExt;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use tauri_plugin_deep_link::DeepLinkExt;

const DEFAULT_MISTRAL_BASE_URL: &str = "https://api.mistral.ai/v1";
const DEFAULT_OLLAMA_BASE_URL: &str = "http://127.0.0.1:11434";

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

#[derive(Debug, Serialize, Clone)]
struct GoogleOAuthCallbackPayload {
    code: String,
    state: String,
    redirect_uri: String,
}

#[derive(Debug, Serialize)]
struct TestResult {
    ok: bool,
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenRequestInput {
    code: String,
    code_verifier: String,
    redirect_uri: String,
    client_id: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
struct GoogleTokenResponse {
    access_token: String,
    #[serde(default)]
    expires_in: Option<u64>,
    #[serde(default)]
    refresh_token: Option<String>,
    #[serde(default)]
    scope: Option<String>,
    #[serde(default)]
    token_type: Option<String>,
    #[serde(default)]
    id_token: Option<String>,
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

fn resolve_ollama_base_url(base_url: Option<String>) -> String {
    base_url
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_OLLAMA_BASE_URL.to_string())
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
async fn test_ollama_connection(
    state: State<'_, ApiState>,
    base_url: Option<String>,
) -> Result<TestResult, String> {
    let resolved = resolve_ollama_base_url(base_url);
    let url = format!("{}/api/tags", resolved);

    match state.client.get(&url).send().await {
        Ok(response) if response.status().is_success() => Ok(TestResult { ok: true, message: None }),
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
async fn fetch_openrouter_models(
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

#[derive(Debug, Deserialize, Serialize)]
struct OllamaModelInfo {
    name: String,
    #[serde(default)]
    size: Option<u64>,
    #[serde(default)]
    modified_at: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelInfo>,
}

#[tauri::command]
async fn ollama_list_models(
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
async fn ollama_pull_model(
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
async fn ollama_delete_model(
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
async fn mistral_complete(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
    model: Option<String>,
    messages: Vec<ChatMessageInput>,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("Missing Mistral API key".into());
    }

    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/chat/completions", resolved_base);

    let payload = ChatRequest {
        model: model.unwrap_or_else(|| "mistral-small-latest".to_string()),
        messages,
        temperature,
        top_p: None,
        max_tokens,
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
    struct CompletionResponse {
        choices: Vec<CompletionChoice>,
    }

    #[derive(Deserialize)]
    struct CompletionChoice {
        message: CompletionMessage,
    }

    #[derive(Deserialize)]
    struct CompletionMessage {
        content: String,
    }

    let completion_response = response
        .json::<CompletionResponse>()
        .await
        .map_err(|err| format!("Failed to parse completion response: {}", err))?;

    let content = completion_response
        .choices
        .first()
        .map(|choice| choice.message.content.trim().to_string())
        .ok_or_else(|| "No completion in response".to_string())?;

    Ok(content)
}

#[tauri::command]
async fn ollama_complete(
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

    #[derive(Deserialize)]
    struct OllamaChatResponse {
        #[serde(default)]
        message: Option<OllamaMessage>,
        #[serde(default)]
        response: Option<String>,
    }

    #[derive(Deserialize)]
    struct OllamaMessage {
        content: String,
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
async fn generate_conversation_title(
    state: State<'_, ApiState>,
    api_key: String,
    base_url: Option<String>,
    model: Option<String>,
    messages: Vec<ChatMessageInput>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("Missing API key".into());
    }

    if messages.is_empty() {
        return Err("Messages payload is empty".into());
    }

    let resolved_base = resolve_base_url(base_url);
    let url = format!("{}/chat/completions", resolved_base);
    
    println!("[Title Generation] Starting with model: {:?}, base: {}", model, resolved_base);

    // Create system message with stronger instructions
    let mut title_messages = vec![
        ChatMessageInput {
            role: "system".to_string(),
            content: "You are a title generator. Generate ONLY a concise 3-5 word title for this conversation. Do not include quotes, punctuation, or formatting. Respond with just the title text.".to_string(),
        }
    ];
    
    // Add conversation context with more characters for better context
    if let Some(first_user_msg) = messages.iter().find(|m| m.role == "user") {
        title_messages.push(ChatMessageInput {
            role: "user".to_string(),
            content: first_user_msg.content.chars().take(300).collect(),
        });
    }
    if let Some(first_asst_msg) = messages.iter().find(|m| m.role == "assistant") {
        title_messages.push(ChatMessageInput {
            role: "assistant".to_string(),
            content: first_asst_msg.content.chars().take(300).collect(),
        });
    }

    let payload = ChatRequest {
        model: model.unwrap_or_else(|| "mistral-small-latest".to_string()),
        messages: title_messages,
        temperature: Some(0.1), // Very low for consistency
        top_p: None,
        max_tokens: Some(15), // Slightly higher buffer
        stop: None,
        random_seed: None,
        stream: false,
    };
    
    println!("[Title Generation] Sending request to: {}", url);
    println!("[Title Generation] Payload model: {:?}", payload.model);

    let response = state
        .client
        .post(&url)
        .bearer_auth(api_key.trim())
        .json(&payload)
        .send()
        .await
        .map_err(|err| {
            println!("[Title Generation] Network request failed: {}", err);
            format!("Network request failed: {}", err)
        })?;

    // Enhanced error handling for HTTP status
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        println!("[Title Generation] API error ({}): {}", status, body);
        return Err(format!("API error ({}): {}", status, body));
    }

    // Parse response with detailed error handling
    let response_text = response.text().await
        .map_err(|e| {
            println!("[Title Generation] Failed to read response: {}", e);
            format!("Failed to read response: {}", e)
        })?;
    
    println!("[Title Generation] API Response: {}", response_text);

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
        content: Option<String>,  // Make content optional to handle missing fields
    }

    let title_response: TitleResponse = serde_json::from_str(&response_text)
        .map_err(|e| {
            println!("[Title Generation] JSON parse error: {}", e);
            format!("Failed to parse JSON response: {}. Response was: {}", e, response_text)
        })?;

    // Extract title with better error handling
    let title = title_response
        .choices
        .first()
        .and_then(|choice| choice.message.content.as_ref())
        .filter(|content| !content.trim().is_empty())
        .map(|content| content.trim().to_string())
        .unwrap_or_else(|| {
            println!("[Title Generation] No valid title in response, using fallback");
            "New conversation".to_string()
        });
    
    println!("[Title Generation] Generated title: '{}'", title);
    Ok(title)
}

#[tauri::command]
async fn deepl_translate(
    api_key: String,
    base_url: String,
    text: String,
    target_lang: String,
    source_lang: Option<String>,
    formality: Option<String>,
) -> Result<String, String> {
    if api_key.trim().is_empty() {
        return Err("Missing DeepL API key".into());
    }

    let url = format!("{}/v2/translate", base_url.trim_end_matches('/'));
    
    // Build request body
    let mut body = serde_json::json!({
        "text": [text],
        "target_lang": target_lang,
    });
    
    if let Some(src) = source_lang {
        if !src.is_empty() {
            body["source_lang"] = serde_json::json!(src);
        }
    }
    
    if let Some(form) = formality {
        if !form.is_empty() && form != "neutral" {
            // Map our UI values to DeepL API values
            let deepl_formality = match form.as_str() {
                "formal" => "more",
                "informal" => "less",
                _ => "default",
            };
            body["formality"] = serde_json::json!(deepl_formality);
        }
    }

    // Make API request
    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("DeepL-Auth-Key {}", api_key.trim()))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".into());
        return Err(format!("DeepL API error ({}): {}", status, error_text));
    }

    // Parse response
    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Extract translated text
    let translations = response_json["translations"]
        .as_array()
        .ok_or("No translations in response")?;
    
    let first_translation = translations
        .first()
        .ok_or("Empty translations array")?;
    
    let translated_text = first_translation["text"]
        .as_str()
        .ok_or("No text field in translation")?;

    Ok(translated_text.to_string())
}

#[tauri::command]
async fn openai_chat_stream(
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
        base_url.as_deref().unwrap_or("https://api.openai.com/v1").trim_end_matches('/')
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

#[tauri::command]
async fn ollama_chat_stream(
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

#[tauri::command]
async fn openai_complete(
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
        base_url.as_deref().unwrap_or("https://api.openai.com/v1").trim_end_matches('/')
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

#[tauri::command]
async fn google_oauth_exchange(
    state: State<'_, ApiState>,
    payload: GoogleTokenRequestInput,
) -> Result<GoogleTokenResponse, String> {
    let form = [
        ("grant_type", "authorization_code"),
        ("code", payload.code.as_str()),
        ("code_verifier", payload.code_verifier.as_str()),
        ("redirect_uri", payload.redirect_uri.as_str()),
        ("client_id", payload.client_id.as_str()),
    ];

    let response = state
        .client
        .post("https://oauth2.googleapis.com/token")
        .form(&form)
        .send()
        .await
        .map_err(|error| format!("Failed to call Google token endpoint: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Google token endpoint returned {}: {}", status, body));
    }

    response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|error| format!("Failed to parse Google token response: {error}"))
}

fn main() {
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

                        if let Err(error) = handle_for_listener.emit("google:oauth:callback", payload) {
                            eprintln!("[deep-link] Failed to emit OAuth callback: {error}");
                        }
                    }
                }
            });

            Ok(())
        })
        .manage(ApiState::new())
        .invoke_handler(tauri::generate_handler![
            test_mistral_credentials,
            test_ollama_connection,
            fetch_mistral_models,
            fetch_openrouter_models,
            ollama_list_models,
            ollama_pull_model,
            ollama_delete_model,
            mistral_chat_stream,
            mistral_complete,
            ollama_chat_stream,
            ollama_complete,
            generate_conversation_title,
            deepl_translate,
            openai_chat_stream,
            openai_complete,
            google_oauth_exchange
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
