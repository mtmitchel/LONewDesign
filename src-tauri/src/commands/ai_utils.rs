//! Cross-provider AI utilities

use crate::ApiState;
use super::ai_types::{ChatMessageInput, ChatRequest};
use super::mistral::resolve_base_url;
use serde::Deserialize;
use tauri::State;

#[tauri::command]
pub async fn generate_conversation_title(
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

    println!(
        "[Title Generation] Starting with model: {:?}, base: {}",
        model, resolved_base
    );

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
    let response_text = response.text().await.map_err(|e| {
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
        content: Option<String>, // Make content optional to handle missing fields
    }

    let title_response: TitleResponse = serde_json::from_str(&response_text).map_err(|e| {
        println!("[Title Generation] JSON parse error: {}", e);
        format!(
            "Failed to parse JSON response: {}. Response was: {}",
            e, response_text
        )
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
