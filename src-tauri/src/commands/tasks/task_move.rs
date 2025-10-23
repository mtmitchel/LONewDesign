use crate::commands::tasks::types::*;
use crate::db;
use chrono::Utc;

use tauri::AppHandle;
use uuid::Uuid;

#[tauri::command]
pub async fn queue_move_task(app: AppHandle, input: QueueMoveTaskInput) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    #[derive(sqlx::FromRow)]
    struct TaskSnapshot {
        list_id: String,
        google_id: Option<String>,
    }

    let snapshot: TaskSnapshot =
        sqlx::query_as("SELECT list_id, google_id FROM tasks_metadata WHERE id = ?")
            .bind(&input.task_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| format!("Failed to load task {} before move: {}", input.task_id, e))?;

    sqlx::query(
        "UPDATE tasks_metadata SET list_id = ?, pending_move_from = ?, pending_delete_google_id = ?, updated_at = ?, sync_state = 'pending_move' WHERE id = ?",
    )
    .bind(&input.to_list_id)
    .bind(&snapshot.list_id)
    .bind(&snapshot.google_id)
    .bind(now)
    .bind(&input.task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to queue task move: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();
    let sync_payload = serde_json::to_string(&input.to_list_id).unwrap();

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at) VALUES (?, ?, 'move', ?, ?, ?)",
    )
    .bind(&sync_queue_id)
    .bind(&input.task_id)
    .bind(&sync_payload)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
