use crate::commands::google::{
    google_workspace_store_get, GoogleTokenResponse,
};
use crate::sync::snapshot::{persist_workspace_snapshot, value_to_i64};
use chrono::Utc;
use serde_json::{Number, Value};
use std::env;

pub const ACCESS_TOKEN_REFRESH_SKEW_MS: i64 = 60_000;

pub async fn ensure_access_token(
    api_state: &crate::ApiState,
    force_refresh: bool,
) -> Result<String, String> {
    let tokens_str = google_workspace_store_get()? // secure store snapshot
        .ok_or_else(|| "Google account not connected".to_string())?;

    println!("[sync_service] tokens_str: {}", tokens_str);

    let mut snapshot: Value = serde_json::from_str(&tokens_str)
        .map_err(|e| format!("Failed to parse stored Google credentials: {}", e))?;

    let (mut access_token, refresh_token, expires_at) = extract_token_fields(&snapshot)?;

    let now_ms = Utc::now().timestamp_millis();
    let needs_refresh = force_refresh
        || access_token.is_none()
        || refresh_token.is_none()
        || expires_at
            .map(|deadline| deadline <= now_ms + ACCESS_TOKEN_REFRESH_SKEW_MS)
            .unwrap_or(true);

    if needs_refresh {
        let refresh_token = refresh_token
            .as_deref()
            .ok_or_else(|| "Missing Google refresh token".to_string())?;

        let refreshed = refresh_access_token(api_state, refresh_token).await?;
        access_token = Some(refreshed.access_token.clone());

        update_snapshot_with_token(&mut snapshot, refresh_token, &refreshed)?;

        persist_workspace_snapshot(&snapshot)?;
    }

    access_token.ok_or_else(|| "Google access token unavailable".to_string())
}

async fn refresh_access_token(
    api_state: &crate::ApiState,
    refresh_token: &str,
) -> Result<GoogleTokenResponse, String> {
    let client_id = google_oauth_client_id()
        .ok_or_else(|| "Google OAuth client id not configured (set VITE_GOOGLE_OAUTH_CLIENT_ID)".to_string())?;

    let client_secret = google_oauth_client_secret();

    let mut params = vec![
        ("grant_type".to_string(), "refresh_token".to_string()),
        ("refresh_token".to_string(), refresh_token.to_string()),
        ("client_id".to_string(), client_id),
    ];

    if let Some(secret) = client_secret {
        if !secret.is_empty() {
            params.push(("client_secret".to_string(), secret));
        }
    }

    let response = api_state
        .client()
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to refresh Google access token: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Google token endpoint returned {}: {}",
            status, body
        ));
    }

    let mut tokens = response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|e| format!("Failed to parse Google token response: {}", e))?;

    if tokens.refresh_token.is_none() {
        tokens.refresh_token = Some(refresh_token.to_string());
    }

    Ok(tokens)
}

fn google_oauth_client_id() -> Option<String> {
    env::var("VITE_GOOGLE_OAUTH_CLIENT_ID")
        .or_else(|_| env::var("GOOGLE_OAUTH_CLIENT_ID"))
        .ok()
}

fn google_oauth_client_secret() -> Option<String> {
    env::var("VITE_GOOGLE_OAUTH_CLIENT_SECRET")
        .or_else(|_| env::var("GOOGLE_OAUTH_CLIENT_SECRET"))
        .ok()
}

fn extract_token_fields(
    snapshot: &Value,
) -> Result<(Option<String>, Option<String>, Option<i64>), String> {
    let account = snapshot
        .get("account")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "Stored Google credentials missing account payload".to_string())?;

    let token = account
        .get("token")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "Stored Google credentials missing token payload".to_string())?;

    let access_token = token
        .get("accessToken")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let refresh_token = token
        .get("refreshToken")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let expires_at = token
        .get("accessTokenExpiresAt")
        .and_then(|v| value_to_i64(v));

    Ok((access_token, refresh_token, expires_at))
}

fn update_snapshot_with_token(
    snapshot: &mut Value,
    fallback_refresh_token: &str,
    refreshed: &GoogleTokenResponse,
) -> Result<(), String> {
    let account = snapshot
        .get_mut("account")
        .and_then(|v| v.as_object_mut())
        .ok_or_else(|| "Stored Google credentials missing account payload".to_string())?;

    let token = account
        .get_mut("token")
        .and_then(|v| v.as_object_mut())
        .ok_or_else(|| "Stored Google credentials missing token payload".to_string())?;

    let now_ms = Utc::now().timestamp_millis();

    token.insert(
        "accessToken".to_string(),
        Value::String(refreshed.access_token.clone()),
    );

    let refresh_to_store = refreshed
        .refresh_token
        .as_deref()
        .unwrap_or(fallback_refresh_token)
        .to_string();
    token.insert("refreshToken".to_string(), Value::String(refresh_to_store));

    if let Some(expires_in) = refreshed.expires_in {
        let expires_at = now_ms + (expires_in as i64) * 1000;
        token.insert(
            "accessTokenExpiresAt".to_string(),
            Value::Number(Number::from(expires_at)),
        );
    } else {
        token.remove("accessTokenExpiresAt");
    }

    token.insert(
        "lastRefreshAt".to_string(),
        Value::Number(Number::from(now_ms)),
    );

    if let Some(sync_status) = account
        .get_mut("syncStatus")
        .and_then(|v| v.as_object_mut())
    {
        if let Some(tasks_status) = sync_status.get_mut("tasks").and_then(|v| v.as_object_mut()) {
            tasks_status.insert("lastErrorAt".to_string(), Value::Null);
            tasks_status.insert("lastError".to_string(), Value::Null);
        }
    }

    Ok(())
}