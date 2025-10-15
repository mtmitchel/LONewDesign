//! DeepL translation command

#[tauri::command]
pub async fn deepl_translate(
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
        .header(
            "Authorization",
            format!("DeepL-Auth-Key {}", api_key.trim()),
        )
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".into());
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

    let first_translation = translations.first().ok_or("Empty translations array")?;

    let translated_text = first_translation["text"]
        .as_str()
        .ok_or("No text field in translation")?;

    Ok(translated_text.to_string())
}
