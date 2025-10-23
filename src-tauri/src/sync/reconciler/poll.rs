use crate::sync::reconciler::prune::{prune_missing_remote_tasks, prune_missing_remote_subtasks};
use crate::sync::reconciler::{reconcile_task, reconcile_task_list, reconcile_subtasks};
use crate::sync::token;
use crate::sync::types::GOOGLE_TASKS_BASE_URL;
use reqwest::Client;
use serde_json::Value;
use std::collections::HashSet;


pub async fn poll_google_tasks(http_client: &Client, api_state: &crate::ApiState, pool: &sqlx::SqlitePool) -> Result<(), String> {
    for attempt in 0..2 {
        let access_token = token::ensure_access_token(api_state, attempt > 0).await?;

        match poll_google_tasks_with_token(http_client, &access_token, pool).await {
            Ok(()) => return Ok(()),
            Err(err) => {
                if attempt == 0 && is_google_unauthorized(&err) {
                    println!(
                        "[sync_service] Google returned 401 during task poll, refreshing token"
                    );
                    continue;
                }
                return Err(err.to_string());
            }
        }
    }

    Err("Google access token refresh did not resolve task polling errors".to_string())
}

async fn poll_google_tasks_with_token(http_client: &Client, access_token: &str, pool: &sqlx::SqlitePool) -> Result<(), String> {
    println!("[sync_service] Polling Google Tasks API");

    // Fetch task lists
    let mut remote_list_ids = HashSet::new();

    let lists_url = format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL);
    let lists_response = http_client
        .get(&lists_url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch task lists: {}", e))?;

    if !lists_response.status().is_success() {
        let status = lists_response.status();
        let text = lists_response.text().await.unwrap_or_default();
        return Err(format!("Google API error {}: {}", status, text));
    }

    let lists_json: Value = lists_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse lists response: {}", e))?;

    let lists = lists_json
        .get("items")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "No task lists found".to_string())?;

    println!("[sync_service] Fetched {} task lists", lists.len());

    // Store task lists in database
    for list in lists {
        if let Err(e) = reconcile_task_list(pool, list).await {
            eprintln!("[sync_service] Failed to reconcile task list: {}", e);
        }
    }

    // Fetch tasks from each list
    for list in lists {
        let list_id = match list.get("id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => {
                eprintln!("[sync_service] Skipping list with no id");
                continue;
            }
        };

        remote_list_ids.insert(list_id.to_string());

        println!("[sync_service] Fetching tasks from list {}", list_id);

        let tasks_url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
        let mut remote_google_ids: HashSet<String> = HashSet::new();
        let mut remote_subtask_google_ids: HashSet<String> = HashSet::new();
        let mut remote_subtasks: Vec<Value> = Vec::new();
        let mut total_fetched = 0_usize;
        let mut page_token: Option<String> = None;
        let mut encountered_error = false;

        loop {
            let current_token = page_token.clone();
            let mut request = http_client
                .get(&tasks_url)
                .bearer_auth(access_token)
                .query(&[
                    ("showHidden", "true"),
                    ("showCompleted", "true"),
                    ("maxResults", "100"),
                ]);

            if let Some(ref token) = current_token {
                request = request.query(&[("pageToken", token.as_str())]);
            }

            let tasks_response = match request.send().await {
                Ok(r) => r,
                Err(e) => {
                    eprintln!(
                        "[sync_service] Failed to fetch tasks for list {}: {}",
                        list_id, e
                    );
                    encountered_error = true;
                    break;
                }
            };

            if !tasks_response.status().is_success() {
                let status = tasks_response.status();
                let text = tasks_response.text().await.unwrap_or_default();
                if status == reqwest::StatusCode::UNAUTHORIZED {
                    return Err(format!(
                        "Google API error {} for list {}: {}",
                        status, list_id, text
                    ));
                }
                eprintln!(
                    "[sync_service] Google API error {} for list {}: {}",
                    status, list_id, text
                );
                encountered_error = true;
                break;
            }

            let tasks_json: Value = match tasks_response.json().await {
                Ok(j) => j,
                Err(e) => {
                    eprintln!(
                        "[sync_service] Failed to parse tasks for list {}: {}",
                        list_id, e
                    );
                    encountered_error = true;
                    break;
                }
            };

            if let Some(tasks) = tasks_json.get("items").and_then(|v| v.as_array()) {
                total_fetched += tasks.len();

                // Reconcile each task with local database
                for task in tasks {
                    if let Some(id_str) = task
                        .get("id")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                    {
                        remote_google_ids.insert(id_str);
                    }

                    if task.get("parent").and_then(|v| v.as_str()).is_some() {
                        if let Some(subtask_id) = task.get("id").and_then(|v| v.as_str()) {
                            remote_subtask_google_ids.insert(subtask_id.to_string());
                        }
                        remote_subtasks.push(task.clone());
                        continue;
                    }

                    if let Err(e) = reconcile_task(pool, list_id, task).await {
                        eprintln!("[sync_service] Failed to reconcile task: {}", e);
                    }
                }
            } else if current_token.is_none() {
                println!("[sync_service] No tasks in list {}", list_id);
            }

            page_token = tasks_json
                .get("nextPageToken")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if page_token.is_none() {
                break;
            }
        }

        if encountered_error {
            continue;
        }

        println!(
            "[sync_service] Found {} tasks in list {}",
            total_fetched, list_id
        );

        if let Err(e) = prune_missing_remote_tasks(pool, list_id, &remote_google_ids).await {
            eprintln!(
                "[sync_service] Failed pruning missing remote tasks for list {}: {}",
                list_id, e
            );
        }

        if let Err(e) = reconcile_subtasks(pool, list_id, remote_subtasks).await {
            eprintln!(
                "[sync_service] Failed to reconcile subtasks for list {}: {}",
                list_id, e
            );
        }

        if let Err(e) = prune_missing_remote_subtasks(pool, list_id, &remote_subtask_google_ids).await {
            eprintln!(
                "[sync_service] Failed pruning missing subtasks for list {}: {}",
                list_id, e
            );
        }
    }

    // Remove task lists that no longer exist remotely
    let local_lists: Vec<(String, Option<String>)> =
        sqlx::query_as("SELECT id, google_id FROM task_lists")
            .fetch_all(pool)
            .await
            .map_err(|e| format!("Failed to fetch local task lists: {}", e))?;

    for (local_id, google_id) in local_lists {
        let remote_identifier = google_id.as_ref().unwrap_or(&local_id);

        if !remote_list_ids.contains(remote_identifier) {
            if google_id.is_none() {
                println!(
                    "[sync_service] Retaining local task list {} awaiting Google ID assignment",
                    local_id
                );
                continue;
            }

            println!(
                "[sync_service] Removing local task list {} not found in Google Tasks",
                local_id
            );
            sqlx::query("DELETE FROM tasks_metadata WHERE list_id = ?")
                .bind(&local_id)
                .execute(pool)
                .await
                .map_err(|e| format!("Failed to delete tasks for removed list: {}", e))?;

            sqlx::query("DELETE FROM task_lists WHERE id = ?")
                .bind(&local_id)
                .execute(pool)
                .await
                .map_err(|e| format!("Failed to delete removed task list: {}", e))?;
        }
    }

    Ok(())
}

fn is_google_unauthorized(error: &str) -> bool {
    error.contains("401") && error.to_ascii_lowercase().contains("unauthorized")
}
