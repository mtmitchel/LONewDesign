use keyring::{Entry, Error as KeyringError};
use reqwest::{Method, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use url::Url;

use crate::{ApiState, GoogleOAuthCallbackPayload};

const GOOGLE_TASKS_BASE_URL: &str = "https://tasks.googleapis.com/tasks/v1";
const GOOGLE_WORKSPACE_SERVICE: &str = "com.libreollama.desktop/google-workspace";
const GOOGLE_WORKSPACE_ACCOUNT: &str = "oauth";

#[derive(Debug, Deserialize)]
pub struct GoogleTokenRequestInput {
    pub code: String,
    pub code_verifier: String,
    pub redirect_uri: String,
    pub client_id: String,
    #[serde(default)]
    pub client_secret: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleRefreshRequestInput {
    pub refresh_token: String,
    pub client_id: String,
    #[serde(default)]
    pub client_secret: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct GoogleTokenResponse {
    pub access_token: String,
    #[serde(default)]
    pub expires_in: Option<u64>,
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub scope: Option<String>,
    #[serde(default)]
    pub token_type: Option<String>,
    #[serde(default)]
    pub id_token: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GoogleAuthContext {
    pub access_token: String,
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub client_id: Option<String>,
    #[serde(default)]
    pub client_secret: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GoogleTasksCommandResponse {
    pub data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_token: Option<GoogleTokenResponse>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksListTasklistsInput {
    pub auth: GoogleAuthContext,
    pub max_results: Option<u32>,
    pub page_token: Option<String>,
    pub fields: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksListTasksInput {
    pub auth: GoogleAuthContext,
    pub list_id: String,
    pub page_token: Option<String>,
    pub sync_token: Option<String>,
    pub show_completed: Option<bool>,
    pub show_deleted: Option<bool>,
    pub show_hidden: Option<bool>,
    pub max_results: Option<u32>,
    pub updated_min: Option<String>,
    pub due_min: Option<String>,
    pub due_max: Option<String>,
    pub fields: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksInsertInput {
    pub auth: GoogleAuthContext,
    pub list_id: String,
    pub task: Value,
    pub parent: Option<String>,
    pub previous: Option<String>,
    pub fields: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksPatchInput {
    pub auth: GoogleAuthContext,
    pub list_id: String,
    pub task_id: String,
    pub updates: Value,
    pub fields: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksDeleteInput {
    pub auth: GoogleAuthContext,
    pub list_id: String,
    pub task_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleTasksMoveInput {
    pub auth: GoogleAuthContext,
    pub list_id: String,
    pub task_id: String,
    pub parent: Option<String>,
    pub previous: Option<String>,
    pub fields: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleWorkspaceStoreSetInput {
    pub value: String,
}

#[tauri::command]
pub async fn google_oauth_exchange(
    state: State<'_, ApiState>,
    payload: GoogleTokenRequestInput,
) -> Result<GoogleTokenResponse, String> {
    let mut params = vec![
        ("grant_type".to_string(), "authorization_code".to_string()),
        ("code".to_string(), payload.code),
        ("code_verifier".to_string(), payload.code_verifier),
        ("redirect_uri".to_string(), payload.redirect_uri),
        ("client_id".to_string(), payload.client_id),
    ];

    if let Some(secret) = payload.client_secret {
        params.push(("client_secret".to_string(), secret));
    }

    let response = state
        .client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|error| format!("Failed to call Google token endpoint: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Google token endpoint returned {}: {}",
            status, body
        ));
    }

    response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|error| format!("Failed to parse Google token response: {error}"))
}

#[tauri::command]
pub async fn google_oauth_refresh(
    state: State<'_, ApiState>,
    payload: GoogleRefreshRequestInput,
) -> Result<GoogleTokenResponse, String> {
    let mut params = vec![
        ("grant_type", "refresh_token".to_string()),
        ("refresh_token", payload.refresh_token),
        ("client_id", payload.client_id),
    ];

    if let Some(secret) = payload.client_secret {
        params.push(("client_secret", secret));
    }

    let response = state
        .client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|error| format!("Failed to refresh Google access token: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Google token endpoint returned {}: {}",
            status, body
        ));
    }

    response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|error| format!("Failed to parse Google token response: {error}"))
}

#[tauri::command]
pub async fn google_tasks_list_tasklists(
    state: State<'_, ApiState>,
    payload: GoogleTasksListTasklistsInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend(["users", "@me", "lists"]);
    }

    let mut query = Vec::new();
    if let Some(max_results) = payload.max_results {
        query.push(("maxResults".to_string(), max_results.to_string()));
    }
    if let Some(page_token) = payload.page_token {
        query.push(("pageToken".to_string(), page_token));
    }
    if let Some(fields) = payload.fields {
        query.push(("fields".to_string(), fields));
    }

    google_tasks_request(&state, Method::GET, url, payload.auth, query, None).await
}

#[tauri::command]
pub async fn google_tasks_list_tasks(
    state: State<'_, ApiState>,
    payload: GoogleTasksListTasksInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let GoogleTasksListTasksInput {
        auth,
        list_id,
        page_token,
        sync_token,
        show_completed,
        show_deleted,
        show_hidden,
        max_results,
        updated_min,
        due_min,
        due_max,
        fields,
    } = payload;

    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend(["lists", list_id.as_str(), "tasks"]);
    }

    let mut query = Vec::new();
    if let Some(page_token) = page_token {
        query.push(("pageToken".to_string(), page_token));
    }
    if let Some(sync_token) = sync_token {
        query.push(("syncToken".to_string(), sync_token));
    }
    if let Some(show_completed) = show_completed {
        query.push(("showCompleted".to_string(), show_completed.to_string()));
    }
    if let Some(show_deleted) = show_deleted {
        query.push(("showDeleted".to_string(), show_deleted.to_string()));
    }
    if let Some(show_hidden) = show_hidden {
        query.push(("showHidden".to_string(), show_hidden.to_string()));
    }
    if let Some(max_results) = max_results {
        query.push(("maxResults".to_string(), max_results.to_string()));
    }
    if let Some(updated_min) = updated_min {
        query.push(("updatedMin".to_string(), updated_min));
    }
    if let Some(due_min) = due_min {
        query.push(("dueMin".to_string(), due_min));
    }
    if let Some(due_max) = due_max {
        query.push(("dueMax".to_string(), due_max));
    }
    if let Some(fields) = fields {
        query.push(("fields".to_string(), fields));
    }

    google_tasks_request(&state, Method::GET, url, auth, query, None).await
}

#[tauri::command]
pub async fn google_tasks_insert_task(
    state: State<'_, ApiState>,
    payload: GoogleTasksInsertInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let GoogleTasksInsertInput {
        auth,
        list_id,
        task,
        parent,
        previous,
        fields,
    } = payload;

    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend(["lists", list_id.as_str(), "tasks"]);
    }

    let mut query = Vec::new();
    if let Some(parent) = parent {
        query.push(("parent".to_string(), parent));
    }
    if let Some(previous) = previous {
        query.push(("previous".to_string(), previous));
    }
    if let Some(fields) = fields {
        query.push(("fields".to_string(), fields));
    }

    google_tasks_request(&state, Method::POST, url, auth, query, Some(task)).await
}

#[tauri::command]
pub async fn google_tasks_patch_task(
    state: State<'_, ApiState>,
    payload: GoogleTasksPatchInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let GoogleTasksPatchInput {
        auth,
        list_id,
        task_id,
        updates,
        fields,
    } = payload;

    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend(["lists", list_id.as_str(), "tasks", task_id.as_str()]);
    }

    let mut query = Vec::new();
    if let Some(fields) = fields {
        query.push(("fields".to_string(), fields));
    }

    google_tasks_request(&state, Method::PATCH, url, auth, query, Some(updates)).await
}

#[tauri::command]
pub async fn google_tasks_delete_task(
    state: State<'_, ApiState>,
    payload: GoogleTasksDeleteInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let GoogleTasksDeleteInput {
        auth,
        list_id,
        task_id,
    } = payload;

    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend(["lists", list_id.as_str(), "tasks", task_id.as_str()]);
    }

    google_tasks_request(&state, Method::DELETE, url, auth, Vec::new(), None).await
}

#[tauri::command]
pub async fn google_tasks_move_task(
    state: State<'_, ApiState>,
    payload: GoogleTasksMoveInput,
) -> Result<GoogleTasksCommandResponse, String> {
    let GoogleTasksMoveInput {
        auth,
        list_id,
        task_id,
        parent,
        previous,
        fields,
    } = payload;

    let mut url = Url::parse(GOOGLE_TASKS_BASE_URL)
        .map_err(|error| format!("Failed to parse Google Tasks base URL: {error}"))?;
    {
        let mut segments = url
            .path_segments_mut()
            .map_err(|_| "Google Tasks base URL cannot be relative".to_string())?;
        segments.extend([
            "lists",
            list_id.as_str(),
            "tasks",
            task_id.as_str(),
            "move",
        ]);
    }

    let mut query = Vec::new();
    if let Some(parent) = parent {
        query.push(("parent".to_string(), parent));
    }
    if let Some(previous) = previous {
        query.push(("previous".to_string(), previous));
    }
    if let Some(fields) = fields {
        query.push(("fields".to_string(), fields));
    }

    google_tasks_request(&state, Method::POST, url, auth, query, None).await
}

#[tauri::command]
pub fn google_workspace_store_set(payload: GoogleWorkspaceStoreSetInput) -> Result<bool, String> {
    let entry = google_workspace_entry()?;
    entry
        .set_password(&payload.value)
        .map_err(|error| format!("Failed to persist Google credentials: {error}"))?;
    Ok(true)
}

#[tauri::command]
pub fn google_workspace_store_get() -> Result<Option<String>, String> {
    let entry = google_workspace_entry()?;
    match entry.get_password() {
        Ok(value) => {
            if value.is_empty() {
                Ok(None)
            } else {
                Ok(Some(value))
            }
        }
        Err(KeyringError::NoEntry) => Ok(None),
        Err(error) => Err(format!("Failed to load Google credentials: {error}")),
    }
}

#[tauri::command]
pub fn google_workspace_store_clear() -> Result<bool, String> {
    let entry = google_workspace_entry()?;
    match entry.delete_password() {
        Ok(()) => Ok(true),
        Err(KeyringError::NoEntry) => Ok(true),
        Err(error) => Err(format!("Failed to clear Google credentials: {error}")),
    }
}

#[tauri::command]
pub async fn google_oauth_loopback_listen(
    app: AppHandle,
    state_token: String,
    port: Option<u16>,
) -> Result<u16, String> {
    let bind_port = port.unwrap_or(0);
    let listener = TcpListener::bind(("127.0.0.1", bind_port))
        .await
        .map_err(|error| format!("Failed to bind loopback listener: {error}"))?;
    let actual_port = listener
        .local_addr()
        .map_err(|error| format!("Failed to read loopback listener port: {error}"))?
        .port();

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(error) = handle_loopback_request(listener, app_handle, state_token).await {
            eprintln!("[oauth-loopback] listener error: {error}");
        }
    });

    Ok(actual_port)
}

pub fn register(_app: &AppHandle) {}

fn google_workspace_entry() -> Result<Entry, String> {
    Entry::new(GOOGLE_WORKSPACE_SERVICE, GOOGLE_WORKSPACE_ACCOUNT)
        .map_err(|error| format!("Failed to access secure storage: {error}"))
}

async fn try_refresh_access_token(
    state: &State<'_, ApiState>,
    auth: &GoogleAuthContext,
) -> Result<Option<GoogleTokenResponse>, String> {
    let refresh_token = match auth.refresh_token.as_ref() {
        Some(token) if !token.is_empty() => token.clone(),
        _ => return Ok(None),
    };

    let client_id = match auth.client_id.as_ref() {
        Some(value) if !value.is_empty() => value.clone(),
        _ => return Ok(None),
    };

    let mut params = vec![
        ("grant_type".to_string(), "refresh_token".to_string()),
        ("refresh_token".to_string(), refresh_token.clone()),
        ("client_id".to_string(), client_id),
    ];

    if let Some(secret) = auth.client_secret.as_ref() {
        if !secret.is_empty() {
            params.push(("client_secret".to_string(), secret.clone()));
        }
    }

    let response = state
        .client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|error| format!("Failed to refresh Google access token: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!(
            "Google token endpoint returned {}: {}",
            status, body
        ));
    }

    let mut tokens = response
        .json::<GoogleTokenResponse>()
        .await
        .map_err(|error| format!("Failed to parse Google token response: {error}"))?;

    if tokens.refresh_token.is_none() {
        tokens.refresh_token = Some(refresh_token);
    }

    Ok(Some(tokens))
}

async fn google_tasks_request(
    state: &State<'_, ApiState>,
    method: Method,
    url: Url,
    auth: GoogleAuthContext,
    query: Vec<(String, String)>,
    body: Option<Value>,
) -> Result<GoogleTasksCommandResponse, String> {
    let mut access_token = auth.access_token.clone();
    let mut updated_token: Option<GoogleTokenResponse> = None;

    for attempt in 0..=1 {
        let mut request = state.client.request(method.clone(), url.clone());
        request = request.bearer_auth(&access_token);

        if !query.is_empty() {
            request = request.query(&query);
        }

        if let Some(ref body_value) = body {
            request = request.json(body_value);
        }

        let response = request
            .send()
            .await
            .map_err(|error| format!("Failed to call Google Tasks API: {error}"))?;

        if response.status() == StatusCode::UNAUTHORIZED && attempt == 0 {
            match try_refresh_access_token(state, &auth).await? {
                Some(tokens) => {
                    access_token = tokens.access_token.clone();
                    updated_token = Some(tokens);
                    continue;
                }
                None => {
                    let status = response.status();
                    let body_text = response.text().await.unwrap_or_default();
                    return Err(format!(
                        "Google Tasks API returned {}: {}",
                        status, body_text
                    ));
                }
            }
        }

        if !response.status().is_success() {
            let status = response.status();
            let body_text = response.text().await.unwrap_or_default();
            return Err(format!(
                "Google Tasks API returned {}: {}",
                status, body_text
            ));
        }

        let data = if response.status() == StatusCode::NO_CONTENT {
            None
        } else {
            Some(response.json::<Value>().await.map_err(|error| {
                format!("Failed to parse Google Tasks API response: {error}")
            })?)
        };

        return Ok(GoogleTasksCommandResponse {
            data,
            updated_token,
        });
    }

    Err("Google Tasks API request retry limit exceeded".to_string())
}

async fn handle_loopback_request(
    listener: TcpListener,
    app_handle: AppHandle,
    expected_state: String,
) -> Result<(), String> {
    loop {
        let (mut socket, _addr) = listener
            .accept()
            .await
            .map_err(|error| format!("Failed to accept loopback connection: {error}"))?;

        let mut buffer = vec![0u8; 4096];
        let read = socket
            .read(&mut buffer)
            .await
            .map_err(|error| format!("Failed to read loopback request: {error}"))?;
        if read == 0 {
            continue;
        }
        let request = String::from_utf8_lossy(&buffer[..read]);
        let first_line = match request.lines().next() {
            Some(line) => line,
            None => continue,
        };
        let mut parts = first_line.split_whitespace();
        let method = parts.next().unwrap_or("");
        let path = parts.next().unwrap_or("");

        if method != "GET" {
            continue;
        }

        if path.starts_with("/favicon") {
            let response = "HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n";
            let _ = socket.write_all(response.as_bytes()).await;
            continue;
        }

        let url = match Url::parse(&format!("http://127.0.0.1{}", path)) {
            Ok(url) => url,
            Err(_) => {
                let response = build_error_response("Invalid redirect URL");
                let _ = socket.write_all(response.as_bytes()).await;
                continue;
            }
        };

        let query_pairs = url.query_pairs().collect::<Vec<_>>();
        let code = query_pairs
            .iter()
            .find(|(k, _)| k == "code")
            .map(|(_, v)| v.to_string());
        let state = query_pairs
            .iter()
            .find(|(k, _)| k == "state")
            .map(|(_, v)| v.to_string());

        if let (Some(code), Some(state)) = (code, state) {
            if state != expected_state {
                let response = build_error_response("State token mismatch. Please retry sign-in.");
                let _ = socket.write_all(response.as_bytes()).await;
                break;
            }

            let payload = GoogleOAuthCallbackPayload {
                code,
                state,
                redirect_uri: url.to_string(),
            };

            eprintln!(
                "[oauth-loopback] emitting callback for state={}",
                payload.state
            );
            if let Err(error) = app_handle.emit("google:oauth:callback", payload) {
                eprintln!("[oauth-loopback] failed to emit callback event: {error}");
            }

            let response = build_success_response();
            let _ = socket.write_all(response.as_bytes()).await;
            break;
        } else {
            let response = build_error_response("Missing authorization code in redirect.");
            let _ = socket.write_all(response.as_bytes()).await;
            break;
        }
    }

    Ok(())
}

fn build_success_response() -> String {
    let body = r#"<html><head><meta charset='utf-8'><title>Signed in</title></head><body style='font-family: sans-serif;'>You can return to LibreOllama. This window can be closed.</body></html>"#;
    format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        body.len(), body
    )
}

fn build_error_response(message: &str) -> String {
    let body = format!(
        "<html><head><meta charset='utf-8'><title>Sign-in error</title></head><body style='font-family: sans-serif; color: #b91c1c;'>OAuth redirect failed: {}. You can close this window and retry.</body></html>",
        message
    );
    format!(
        "HTTP/1.1 400 Bad Request\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        body.len(), body
    )
}
