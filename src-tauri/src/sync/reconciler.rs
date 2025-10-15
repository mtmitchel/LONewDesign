//! Polling and reconciliation logic for syncing with Google Tasks

use reqwest::Client;
use sqlx::SqlitePool;
use std::collections::HashSet;

use crate::sync::types::GOOGLE_TASKS_BASE_URL;

/// Polls Google Tasks API and reconciles with local database
///
/// Fetches all task lists and tasks from Google, updating the local database
/// to match the remote state
pub async fn poll_google_tasks(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
) -> Result<(), String> {
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

    let lists_json: serde_json::Value = lists_response
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
        if let Err(e) = reconcile_task_list(db_pool, list).await {
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
        let tasks_response = match http_client
            .get(&tasks_url)
            .bearer_auth(access_token)
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                eprintln!(
                    "[sync_service] Failed to fetch tasks for list {}: {}",
                    list_id, e
                );
                continue;
            }
        };

        if !tasks_response.status().is_success() {
            let status = tasks_response.status();
            let text = tasks_response.text().await.unwrap_or_default();
            eprintln!(
                "[sync_service] Google API error {} for list {}: {}",
                status, list_id, text
            );
            continue;
        }

        let tasks_json: serde_json::Value = match tasks_response.json().await {
            Ok(j) => j,
            Err(e) => {
                eprintln!(
                    "[sync_service] Failed to parse tasks for list {}: {}",
                    list_id, e
                );
                continue;
            }
        };

        let tasks = match tasks_json.get("items").and_then(|v| v.as_array()) {
            Some(t) => t,
            None => {
                println!("[sync_service] No tasks in list {}", list_id);
                continue;
            }
        };

        println!(
            "[sync_service] Found {} tasks in list {}",
            tasks.len(),
            list_id
        );

        // Reconcile each task with local database
        for task in tasks {
            if let Err(e) = reconcile_task(db_pool, list_id, task).await {
                eprintln!("[sync_service] Failed to reconcile task: {}", e);
            }
        }
    }

    // Remove task lists that no longer exist remotely
    let local_lists: Vec<(String,)> = sqlx::query_as("SELECT id FROM task_lists")
        .fetch_all(db_pool)
        .await
        .map_err(|e| format!("Failed to fetch local task lists: {}", e))?;

    for (local_id,) in local_lists {
        if !remote_list_ids.contains(&local_id) {
            println!(
                "[sync_service] Removing local task list {} not found in Google Tasks",
                local_id
            );
            sqlx::query("DELETE FROM tasks_metadata WHERE list_id = ?")
                .bind(&local_id)
                .execute(db_pool)
                .await
                .map_err(|e| format!("Failed to delete tasks for removed list: {}", e))?;

            sqlx::query("DELETE FROM task_lists WHERE id = ?")
                .bind(&local_id)
                .execute(db_pool)
                .await
                .map_err(|e| format!("Failed to delete removed task list: {}", e))?;
        }
    }

    Ok(())
}

async fn reconcile_task_list(db_pool: &SqlitePool, list: &serde_json::Value) -> Result<(), String> {
    let list_id = list
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Task list missing id".to_string())?;

    let title = list
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled List");

    let updated = list.get("updated").and_then(|v| v.as_str());

    let now = chrono::Utc::now().timestamp();

    // Check if list exists
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM task_lists WHERE id = ?")
        .bind(list_id)
        .fetch_optional(db_pool)
        .await
        .map_err(|e| format!("Failed to check existing list: {}", e))?;

    if exists.is_some() {
        // Update existing list
        sqlx::query(
            "UPDATE task_lists SET title = ?, updated = ?, updated_at = ? WHERE id = ?",
        )
        .bind(title)
        .bind(updated)
        .bind(now)
        .bind(list_id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to update list: {}", e))?;

        eprintln!("[sync_service] Updated task list {} ({})", list_id, title);
    } else {
        // Insert new list
        sqlx::query(
            "INSERT INTO task_lists (id, title, updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(list_id)
        .bind(title)
        .bind(updated)
        .bind(now)
        .bind(now)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to insert list: {}", e))?;

        eprintln!("[sync_service] Inserted task list {} ({})", list_id, title);
    }

    Ok(())
}

async fn reconcile_task(db_pool: &SqlitePool, list_id: &str, task: &serde_json::Value) -> Result<(), String> {
    let google_id = task
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Task missing id".to_string())?;

    let title = task
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("Untitled");

    // Store the title in the notes field (this is what the frontend displays)
    let notes_to_store = Some(title.to_string());
    // Parse Google due date if present
    let due_to_store = task.get("due").and_then(|v| v.as_str()).map(|s| {
        if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(s) {
            dt.date_naive().to_string()
        } else if s.len() >= 10 && s.as_bytes()[4] == b'-' && s.as_bytes()[7] == b'-' {
            s[..10].to_string()
        } else {
            s.to_string()
        }
    });

    let now = chrono::Utc::now().timestamp();

    eprintln!(
        "[sync_service] Reconciling task google_id={}, title={}",
        google_id, title
    );

    // Check if task exists locally by google_id
    #[derive(sqlx::FromRow)]
    struct ExistingTask {
        id: String,
        sync_state: String,
    }

    let existing: Option<ExistingTask> =
        sqlx::query_as("SELECT id, sync_state FROM tasks_metadata WHERE google_id = ?")
            .bind(google_id)
            .fetch_optional(db_pool)
            .await
            .map_err(|e| format!("Failed to check existing task: {}", e))?;

    eprintln!(
        "[sync_service] Existing task check for {}: {:?}",
        google_id,
        existing.as_ref().map(|t| &t.id)
    );

    if let Some(existing_task) = existing {
        // Update existing task
        eprintln!(
            "[sync_service] Task exists, updating id={}",
            existing_task.id
        );
        if existing_task.sync_state == "pending_move" {
            println!(
                "[sync_service] Skipping update for task {} because move is pending",
                existing_task.id
            );
            return Ok(());
        }

        let result = sqlx::query(
            "UPDATE tasks_metadata SET list_id = ?, notes = ?, due_date = COALESCE(?, due_date), updated_at = ?, sync_state = 'synced', last_synced_at = ? WHERE id = ?"
        )
        .bind(list_id)
        .bind(notes_to_store.as_deref())
        .bind(due_to_store.as_deref())
        .bind(now)
        .bind(now)
        .bind(&existing_task.id)
        .execute(db_pool)
        .await
        .map_err(|e| format!("Failed to update task: {}", e))?;

        eprintln!(
            "[sync_service] UPDATE affected {} rows",
            result.rows_affected()
        );
        println!(
            "[sync_service] Updated task {} (google_id: {})",
            existing_task.id, google_id
        );
    } else {
        // Skip remote task if we're waiting to delete it as part of a pending move
        let pending_move_match: Option<String> = sqlx::query_scalar(
            "SELECT id FROM tasks_metadata WHERE pending_delete_google_id = ? LIMIT 1",
        )
        .bind(google_id)
        .fetch_optional(db_pool)
        .await
        .map_err(|e| format!("Failed to check pending move for task: {}", e))?;

        if pending_move_match.is_some() {
            println!(
                "[sync_service] Ignoring remote task {} because a move is pending locally",
                google_id
            );
            return Ok(());
        }

        // Check if we have this task with a different local ID (preserve existing metadata)
        let existing_by_id: Option<(String, String, String)> = sqlx::query_as(
            "SELECT id, priority, labels FROM tasks_metadata WHERE notes = ? AND list_id = ? AND google_id IS NULL LIMIT 1"
        )
        .bind(notes_to_store.as_deref())
        .bind(list_id)
        .fetch_optional(db_pool)
        .await
        .map_err(|e| format!("Failed to check for existing task by content: {}", e))?;

        if let Some((existing_id, _existing_priority, _existing_labels)) = existing_by_id {
            // Update existing task with google_id (preserve metadata)
            eprintln!(
                "[sync_service] Found existing task {}, linking to google_id {}",
                existing_id, google_id
            );
            let result = sqlx::query(
                "UPDATE tasks_metadata SET google_id = ?, list_id = ?, notes = ?, due_date = COALESCE(?, due_date), updated_at = ?, sync_state = 'synced', last_synced_at = ? WHERE id = ?"
            )
            .bind(google_id)
            .bind(list_id)
            .bind(notes_to_store.as_deref())
            .bind(due_to_store.as_deref())
            .bind(now)
            .bind(now)
            .bind(&existing_id)
            .execute(db_pool)
            .await
            .map_err(|e| format!("Failed to link existing task: {}", e))?;

            eprintln!(
                "[sync_service] UPDATE affected {} rows",
                result.rows_affected()
            );
            println!(
                "[sync_service] Linked existing task {} to google_id {}",
                existing_id, google_id
            );
        } else {
            // Insert truly new task with defaults
            let local_id = format!("google-{}", google_id);
            eprintln!(
                "[sync_service] Task does NOT exist, inserting new id={}",
                local_id
            );

            let result = sqlx::query(
                "INSERT INTO tasks_metadata (id, google_id, list_id, priority, labels, due_date, notes, created_at, updated_at, sync_state, last_synced_at) 
                 VALUES (?, ?, ?, 'none', '[]', ?, ?, ?, ?, 'synced', ?)"
            )
            .bind(&local_id)
            .bind(google_id)
            .bind(list_id)
            .bind(due_to_store.as_deref())
            .bind(notes_to_store.as_deref())
            .bind(now)
            .bind(now)
            .bind(now)
            .execute(db_pool)
            .await
            .map_err(|e| {
                eprintln!("[sync_service] INSERT failed: {}", e);
                format!("Failed to insert task: {}", e)
            })?;

            eprintln!(
                "[sync_service] INSERT affected {} rows",
                result.rows_affected()
            );
            println!(
                "[sync_service] Inserted new task {} (google_id: {})",
                local_id, google_id
            );
        }
    }

    Ok(())
}
