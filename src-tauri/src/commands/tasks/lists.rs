use crate::commands::tasks::types::*;
use crate::commands::google::google_workspace_store_get;
use crate::db;
use crate::sync::types::GOOGLE_TASKS_BASE_URL;
use chrono::Utc;

use tauri::{AppHandle, State};

#[tauri::command]
pub async fn get_task_lists(app: AppHandle) -> Result<Vec<TaskList>, String> {
    let pool = db::init_database(&app).await?;

    let lists: Vec<TaskList> = sqlx::query_as("SELECT id, title FROM task_lists")
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

    Ok(lists)
}

#[tauri::command]
pub async fn create_task_list(
    app: AppHandle,
    state: State<'_, crate::ApiState>,
    input: CreateTaskListInput,
) -> Result<TaskList, String> {
    let pool = db::init_database(&app).await?;
    let title = input.title.trim().to_string();
    if title.is_empty() {
        return Err("Task list title cannot be empty".to_string());
    }

    let tokens = google_workspace_store_get()
        .map_err(|e| format!("Failed to load Google credentials: {}", e))?
        .ok_or_else(|| {
            "Google account not connected. Please sign in before creating task lists.".to_string()
        })?;

    let auth: StoredGoogleAuth = serde_json::from_str(&tokens)
        .map_err(|e| format!("Failed to parse Google auth tokens: {}", e))?;
    let access_token = auth.account.token.access_token;

    let response = state
        .client()
        .post(format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL))
        .bearer_auth(&access_token)
        .json(&serde_json::json!({ "title": title }))
        .send()
        .await
        .map_err(|e| format!("Failed to create Google task list: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Google API error {}: {}", status, text));
    }

    let list_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Google task list response: {}", e))?;

    let google_id = list_json
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Google API response missing list id".to_string())?
        .to_string();

    let resolved_title = list_json
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| input.title.trim())
        .to_string();

    let now = Utc::now().timestamp();

    sqlx::query(
        "INSERT INTO task_lists (id, google_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&google_id)
    .bind(&google_id)
    .bind(&resolved_title)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| format!("Failed to persist task list locally: {}", e))?;

    Ok(TaskList {
        id: google_id,
        title: resolved_title,
    })
}

#[tauri::command]
pub async fn delete_task_list(app: AppHandle, input: DeleteTaskListInput) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
        .bind(&input.id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| format!("Failed to load task list: {}", e))?;

    if exists.is_none() {
        return Err(format!("Task list {} not found", input.id));
    }

    if let Some(ref reassign_to) = input.reassign_to {
        if reassign_to == &input.id {
            return Err("Cannot reassign tasks to the list being deleted".to_string());
        }

        let reassignment_exists: Option<(String,)> =
            sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
            .bind(reassign_to)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| format!("Failed to load reassignment list: {}", e))?;

        if reassignment_exists.is_none() {
            return Err(format!("Reassignment list {} not found", reassign_to));
        }

        let now = Utc::now().timestamp();
        sqlx::query(
            "UPDATE tasks_metadata SET list_id = ?, updated_at = ?, sync_state = CASE WHEN sync_state = 'pending_delete' THEN sync_state ELSE 'pending' END WHERE list_id = ?",
        )
        .bind(reassign_to)
        .bind(now)
        .bind(&input.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to reassign tasks: {}", e))?;
    } else {
        let task_count: i64 =
            sqlx::query_scalar("SELECT COUNT(1) FROM tasks_metadata WHERE list_id = ?")
                .bind(&input.id)
                .fetch_one(&mut *tx)
                .await
                .map_err(|e| format!("Failed to count tasks for list {}: {}", input.id, e))?;

        if task_count > 0 {
            return Err(
                "Cannot delete a task list that still contains tasks without reassigning them"
                    .to_string(),
            );
        }
    }

    sqlx::query("DELETE FROM task_lists WHERE id = ?")
        .bind(&input.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to delete task list: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
