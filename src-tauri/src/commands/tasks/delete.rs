use crate::db;
use chrono::Utc;

use tauri::{AppHandle, Emitter};
use uuid::Uuid;

#[tauri::command]
pub async fn delete_task(app: AppHandle, task_id: String) -> Result<(), String> {
    let pool = db::init_database(&app).await?;
    let now = Utc::now().timestamp();
    let _write_guard = db::acquire_write_lock().await;

    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE tasks_metadata SET deleted_at = ?, sync_state = 'pending_delete' WHERE id = ?",
    )
    .bind(now)
    .bind(&task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to delete task: {}", e))?;

    let mutation_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO task_mutation_log (id, task_id, operation, payload, actor, created_at) VALUES (?, ?, 'delete', '', 'user', ?)",
    )
    .bind(&mutation_id)
    .bind(&task_id)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to log mutation: {}", e))?;

    let sync_queue_id = Uuid::new_v4().to_string();

    sqlx::query("DELETE FROM sync_queue WHERE task_id = ?")
        .bind(&task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to clear existing queue entries: {}", e))?;

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) VALUES (?, ?, 'delete', '', ?, ?, 'pending', 0)"
    )
    .bind(&sync_queue_id)
    .bind(&task_id)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to enqueue sync operation: {}", e))?;

    tx.commit().await.map_err(|e| e.to_string())?;

    app.emit("tasks::deleted", &task_id).unwrap();

    Ok(())
}
