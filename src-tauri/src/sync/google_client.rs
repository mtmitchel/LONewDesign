//! Google Tasks API HTTP client operations

use reqwest::{Client, StatusCode};

use crate::sync::types::GOOGLE_TASKS_BASE_URL;

/// Creates a new Google Task with the provided payload
///
/// Returns the Google ID of the created task
pub async fn create_google_task_with_payload(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    payload: serde_json::Value,
) -> Result<String, String> {
    let url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
    let response = http_client
        .post(&url)
        .bearer_auth(access_token)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to create Google task: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Google API error {}: {}", status, text));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google create response: {}", e))?;

    json.get("id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Response missing 'id' field".to_string())
}

/// Updates an existing Google Task with the provided payload
pub async fn update_google_task_with_payload(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    google_id: &str,
    payload: serde_json::Value,
) -> Result<(), String> {
    let url = format!(
        "{}/lists/{}/tasks/{}",
        GOOGLE_TASKS_BASE_URL, list_id, google_id
    );

    let response = http_client
        .patch(&url)
        .bearer_auth(access_token)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to update Google task: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Google API error {}: {}", status, text));
    }

    Ok(())
}

/// Deletes a Google Task
pub async fn delete_google_task(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    google_id: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/lists/{}/tasks/{}",
        GOOGLE_TASKS_BASE_URL, list_id, google_id
    );

    let response = http_client
        .delete(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to delete Google task: {}", e))?;

    if response.status().is_success() || response.status() == StatusCode::NOT_FOUND {
        Ok(())
    } else {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        Err(format!("Google API delete error {}: {}", status, text))
    }
}

/// Creates a Google subtask under a parent task
pub async fn create_google_subtask(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    parent_google_id: &str,
    payload: serde_json::Value,
) -> Result<String, String> {
    let url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
    println!(
        "[subtask_sync][http] POST {} parent={} payload={}",
        url, parent_google_id, payload
    );
    let response = http_client
        .post(&url)
        .bearer_auth(access_token)
        .query(&[("parent", parent_google_id)])
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to create Google subtask: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        println!(
            "[subtask_sync][http] subtask create failed status={} body={}",
            status, text
        );
        return Err(format!("Google API error {}: {}", status, text));
    }

    println!(
        "[subtask_sync][http] subtask create succeeded status={}",
        status
    );

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google subtask create response: {}", e))?;

    json.get("id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "Response missing 'id' field".to_string())
}

/// Updates a Google subtask
pub async fn update_google_subtask(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    google_id: &str,
    payload: serde_json::Value,
) -> Result<(), String> {
    let url = format!(
        "{}/lists/{}/tasks/{}",
        GOOGLE_TASKS_BASE_URL, list_id, google_id
    );
    println!("[subtask_sync][http] PATCH {} payload={}", url, payload);

    let response = http_client
        .patch(&url)
        .bearer_auth(access_token)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to update Google subtask: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        println!(
            "[subtask_sync][http] subtask update failed status={} body={}",
            status, text
        );
        return Err(format!("Google API error {}: {}", status, text));
    }

    println!(
        "[subtask_sync][http] subtask update succeeded status={}",
        status
    );

    Ok(())
}

/// Deletes a Google subtask
pub async fn delete_google_subtask(
    http_client: &Client,
    access_token: &str,
    list_id: &str,
    google_id: &str,
) -> Result<(), String> {
    let url = format!(
        "{}/lists/{}/tasks/{}",
        GOOGLE_TASKS_BASE_URL, list_id, google_id
    );
    println!("[subtask_sync][http] DELETE {}", url);

    let response = http_client
        .delete(&url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to delete Google subtask: {}", e))?;

    let status = response.status();
    if status.is_success() || status == StatusCode::NOT_FOUND {
        println!(
            "[subtask_sync][http] subtask delete succeeded status={}",
            status
        );
        Ok(())
    } else {
        let text = response.text().await.unwrap_or_default();
        println!(
            "[subtask_sync][http] subtask delete failed status={} body={}",
            status, text
        );
        Err(format!("Google API delete error {}: {}", status, text))
    }
}

/// Calculates exponential backoff delay in seconds
///
/// Uses exponential backoff with a base delay of 15 seconds
/// and a maximum delay of 900 seconds (15 minutes)
pub fn backoff_seconds(attempts: i64) -> i64 {
    let clamped = attempts.clamp(1, 8);
    let base_delay = 15_i64;
    let multiplier = 1_i64 << (clamped - 1);
    let delay = base_delay * multiplier;
    delay.min(900)
}
