use keyring::Entry;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use std::sync::Arc;
use tauri::AppHandle;
use tokio::time::{interval, Duration};

const GOOGLE_TASKS_BASE_URL: &str = "https://tasks.googleapis.com/tasks/v1";
const GOOGLE_WORKSPACE_SERVICE: &str = "com.libreollama.desktop/google-workspace";
const GOOGLE_WORKSPACE_ACCOUNT: &str = "oauth";

#[derive(Debug, Serialize, Deserialize)]
struct GoogleOAuthTokens {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<i64>,
    token_type: Option<String>,
}

pub struct SyncService {
    db_pool: Arc<SqlitePool>,
    poll_interval: Duration,
    http_client: Client,
    _app_handle: AppHandle,
}

impl SyncService {
    pub fn new(db_pool: SqlitePool, http_client: Client, app_handle: AppHandle) -> Self {
        Self {
            db_pool: Arc::new(db_pool),
            poll_interval: Duration::from_secs(300), // 5 minutes
            http_client,
            _app_handle: app_handle,
        }
    }
    
    pub fn start(self: Arc<Self>) {
        tokio::spawn(async move {
            let mut ticker = interval(self.poll_interval);
            loop {
                ticker.tick().await;
                if let Err(e) = self.sync_cycle().await {
                    eprintln!("[sync_service] Sync cycle failed: {}", e);
                }
            }
        });
    }
    
    async fn sync_cycle(&self) -> Result<(), String> {
        println!("[sync_service] Starting sync cycle");
        
        // Step 1: Execute pending mutations
        self.execute_pending_mutations().await?;
        
        // Step 2: Poll Google Tasks API
        self.poll_google_tasks().await?;
        
        println!("[sync_service] Sync cycle complete");
        Ok(())
    }
    
    async fn get_oauth_tokens(&self) -> Result<GoogleOAuthTokens, String> {
        let entry = Entry::new(GOOGLE_WORKSPACE_SERVICE, GOOGLE_WORKSPACE_ACCOUNT)
            .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
        
        let password = entry.get_password()
            .map_err(|e| format!("No OAuth tokens found in keyring: {}", e))?;
        
        serde_json::from_str(&password)
            .map_err(|e| format!("Failed to parse OAuth tokens: {}", e))
    }
    
    async fn execute_pending_mutations(&self) -> Result<(), String> {
        #[derive(sqlx::FromRow)]
        struct PendingTask {
            id: String,
            google_id: Option<String>,
            list_id: String,
            notes: Option<String>,
        }
        
        // Try to get OAuth tokens - if they don't exist, skip sync
        let tokens = match self.get_oauth_tokens().await {
            Ok(t) => t,
            Err(e) => {
                println!("[sync_service] Skipping sync - no OAuth tokens: {}", e);
                return Ok(());
            }
        };
        
        let pending: Vec<PendingTask> = sqlx::query_as(
            "SELECT id, google_id, list_id, notes FROM tasks_metadata WHERE sync_state = 'pending' ORDER BY created_at LIMIT 10"
        )
        .fetch_all(self.db_pool.as_ref())
        .await
        .map_err(|e| format!("Failed to fetch pending mutations: {}", e))?;
        
        for task in pending {
            println!("[sync_service] Executing mutation for task {}", task.id);
            
            // If google_id exists, update; otherwise create
            let result = if let Some(google_id) = &task.google_id {
                self.update_google_task(&tokens.access_token, &task.list_id, google_id, &task.notes).await
            } else {
                self.create_google_task(&tokens.access_token, &task.list_id, &task.notes).await
            };
            
            match result {
                Ok(response_google_id) => {
                    let now = chrono::Utc::now().timestamp();
                    sqlx::query(
                        "UPDATE tasks_metadata SET google_id = ?, sync_state = 'synced', last_synced_at = ? WHERE id = ?"
                    )
                    .bind(response_google_id)
                    .bind(now)
                    .bind(&task.id)
                    .execute(self.db_pool.as_ref())
                    .await
                    .map_err(|e| format!("Failed to update sync state: {}", e))?;
                    
                    println!("[sync_service] Successfully synced task {}", task.id);
                }
                Err(e) => {
                    eprintln!("[sync_service] Failed to sync task {}: {}", task.id, e);
                    sqlx::query(
                        "UPDATE tasks_metadata SET sync_error = ? WHERE id = ?"
                    )
                    .bind(e)
                    .bind(&task.id)
                    .execute(self.db_pool.as_ref())
                    .await
                    .ok();
                }
            }
        }
        
        Ok(())
    }
    
    async fn create_google_task(&self, access_token: &str, list_id: &str, notes: &Option<String>) -> Result<String, String> {
        let url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
        
        let body = serde_json::json!({
            "title": notes.as_ref().unwrap_or(&"Untitled".to_string()),
        });
        
        let response = self.http_client
            .post(&url)
            .bearer_auth(access_token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to create Google task: {}", e))?;
        
        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Google API error {}: {}", status, text));
        }
        
        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;
        
        json.get("id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| "Response missing 'id' field".to_string())
    }
    
    async fn update_google_task(&self, access_token: &str, list_id: &str, google_id: &str, notes: &Option<String>) -> Result<String, String> {
        let url = format!("{}/lists/{}/tasks/{}", GOOGLE_TASKS_BASE_URL, list_id, google_id);
        
        let body = serde_json::json!({
            "title": notes.as_ref().unwrap_or(&"Untitled".to_string()),
        });
        
        let response = self.http_client
            .patch(&url)
            .bearer_auth(access_token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to update Google task: {}", e))?;
        
        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("Google API error {}: {}", status, text));
        }
        
        Ok(google_id.to_string())
    }
    
    async fn poll_google_tasks(&self) -> Result<(), String> {
        println!("[sync_service] Polling Google Tasks API");
        
        // Try to get OAuth tokens - if they don't exist, skip sync
        let tokens = match self.get_oauth_tokens().await {
            Ok(t) => t,
            Err(e) => {
                println!("[sync_service] Skipping poll - no OAuth tokens: {}", e);
                return Ok(());
            }
        };
        
        // Fetch task lists
        let lists_url = format!("{}/users/@me/lists", GOOGLE_TASKS_BASE_URL);
        let lists_response = self.http_client
            .get(&lists_url)
            .bearer_auth(&tokens.access_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch task lists: {}", e))?;
        
        if !lists_response.status().is_success() {
            let status = lists_response.status();
            let text = lists_response.text().await.unwrap_or_default();
            return Err(format!("Google API error {}: {}", status, text));
        }
        
        let lists_json: serde_json::Value = lists_response.json().await
            .map_err(|e| format!("Failed to parse lists response: {}", e))?;
        
        let lists = lists_json.get("items")
            .and_then(|v| v.as_array())
            .ok_or_else(|| "No task lists found".to_string())?;
        
        println!("[sync_service] Fetched {} task lists", lists.len());
        
        // Fetch tasks from each list
        for list in lists {
            let list_id = match list.get("id").and_then(|v| v.as_str()) {
                Some(id) => id,
                None => {
                    eprintln!("[sync_service] Skipping list with no id");
                    continue;
                }
            };
            
            println!("[sync_service] Fetching tasks from list {}", list_id);
            
            let tasks_url = format!("{}/lists/{}/tasks", GOOGLE_TASKS_BASE_URL, list_id);
            let tasks_response = match self.http_client
                .get(&tasks_url)
                .bearer_auth(&tokens.access_token)
                .send()
                .await
            {
                Ok(r) => r,
                Err(e) => {
                    eprintln!("[sync_service] Failed to fetch tasks for list {}: {}", list_id, e);
                    continue;
                }
            };
            
            if !tasks_response.status().is_success() {
                let status = tasks_response.status();
                let text = tasks_response.text().await.unwrap_or_default();
                eprintln!("[sync_service] Google API error {} for list {}: {}", status, list_id, text);
                continue;
            }
            
            let tasks_json: serde_json::Value = match tasks_response.json().await {
                Ok(j) => j,
                Err(e) => {
                    eprintln!("[sync_service] Failed to parse tasks for list {}: {}", list_id, e);
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
            
            println!("[sync_service] Found {} tasks in list {}", tasks.len(), list_id);
            
            // Reconcile each task with local database
            for task in tasks {
                if let Err(e) = self.reconcile_task(list_id, task).await {
                    eprintln!("[sync_service] Failed to reconcile task: {}", e);
                }
            }
        }
        
        Ok(())
    }
    
    async fn reconcile_task(&self, list_id: &str, task: &serde_json::Value) -> Result<(), String> {
        let google_id = task.get("id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Task missing id".to_string())?;
        
        let _title = task.get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("Untitled");
        
        let notes = task.get("notes")
            .and_then(|v| v.as_str());
        
        let now = chrono::Utc::now().timestamp();
        
        // Check if task exists locally by google_id
        #[derive(sqlx::FromRow)]
        struct ExistingTask {
            id: String,
        }
        
        let existing: Option<ExistingTask> = sqlx::query_as(
            "SELECT id FROM tasks_metadata WHERE google_id = ?"
        )
        .bind(google_id)
        .fetch_optional(self.db_pool.as_ref())
        .await
        .map_err(|e| format!("Failed to check existing task: {}", e))?;
        
        if let Some(existing_task) = existing {
            // Update existing task
            sqlx::query(
                "UPDATE tasks_metadata SET list_id = ?, notes = ?, updated_at = ?, sync_state = 'synced', last_synced_at = ? WHERE id = ?"
            )
            .bind(list_id)
            .bind(notes)
            .bind(now)
            .bind(now)
            .bind(&existing_task.id)
            .execute(self.db_pool.as_ref())
            .await
            .map_err(|e| format!("Failed to update task: {}", e))?;
            
            println!("[sync_service] Updated task {} (google_id: {})", existing_task.id, google_id);
        } else {
            // Insert new task
            let local_id = format!("google-{}", google_id);
            
            sqlx::query(
                "INSERT INTO tasks_metadata (id, google_id, list_id, priority, labels, notes, created_at, updated_at, sync_state, last_synced_at) 
                 VALUES (?, ?, ?, 'none', '[]', ?, ?, ?, 'synced', ?)"
            )
            .bind(&local_id)
            .bind(google_id)
            .bind(list_id)
            .bind(notes)
            .bind(now)
            .bind(now)
            .bind(now)
            .execute(self.db_pool.as_ref())
            .await
            .map_err(|e| format!("Failed to insert task: {}", e))?;
            
            println!("[sync_service] Inserted new task {} (google_id: {})", local_id, google_id);
        }
        
        Ok(())
    }
}
