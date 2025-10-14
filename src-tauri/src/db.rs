use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePool, Row, Sqlite};
use std::{collections::HashSet, path::PathBuf};
use tauri::Manager;

pub async fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    Ok(app_dir.join("therefore.db"))
}

pub async fn init_database(app: &tauri::AppHandle) -> Result<SqlitePool, String> {
    let db_path = get_db_path(app).await?;
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    println!("[db] Database path: {}", db_path.display());

    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        println!("[db] Creating new database");
        Sqlite::create_database(&db_url)
            .await
            .map_err(|e| format!("Error creating database: {}", e))?;
    }

    let pool = SqlitePool::connect(&db_url)
        .await
        .map_err(|e| format!("Error connecting to database: {}", e))?;

    println!("[db] Running migrations");
    let migrator = sqlx::migrate!("./migrations");
    if let Err(err) = migrator.run(&pool).await {
        let msg = err.to_string();
        let legacy_issue = msg.contains("no such column: \"deleted_at\"")
            || msg.contains("no such column: deleted_at")
            || msg.contains("no such column: \"dirty_fields\"")
            || msg.contains("duplicate column name")
            || msg.contains("already exists")
            || msg.contains("was previously applied but has been modified")
            || msg.contains("checksum")
            || msg.contains("modified after it was applied");

        if legacy_issue {
            eprintln!(
                "[db] Legacy migration issue detected ({}). Applying schema repairs and continuing.",
                msg
            );
        } else {
            return Err(format!("Error running migrations: {}", msg));
        }
    }

    ensure_tasks_metadata_columns(&pool).await?;
    ensure_supporting_tables(&pool).await?;

    println!("[db] Database initialized successfully");
    Ok(pool)
}

async fn ensure_tasks_metadata_columns(pool: &SqlitePool) -> Result<(), String> {
    let rows = sqlx::query("PRAGMA table_info(tasks_metadata)")
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to inspect tasks_metadata schema: {}", e))?;

    let mut columns: HashSet<String> = rows
        .iter()
        .filter_map(|row| row.try_get::<String, _>("name").ok())
        .collect();

    if !columns.contains("metadata_hash") {
        sqlx::query("ALTER TABLE tasks_metadata ADD COLUMN metadata_hash TEXT NOT NULL DEFAULT ''")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to add metadata_hash column: {}", e))?;
        columns.insert("metadata_hash".to_string());
    }

    if !columns.contains("dirty_fields") {
        sqlx::query(
            "ALTER TABLE tasks_metadata ADD COLUMN dirty_fields TEXT NOT NULL DEFAULT '[]'",
        )
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to add dirty_fields column: {}", e))?;
        columns.insert("dirty_fields".to_string());
    }

    if !columns.contains("status") {
        sqlx::query(
            "ALTER TABLE tasks_metadata ADD COLUMN status TEXT NOT NULL DEFAULT 'needsAction'",
        )
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to add status column: {}", e))?;
        columns.insert("status".to_string());
    }

    if !columns.contains("sync_attempts") {
        sqlx::query(
            "ALTER TABLE tasks_metadata ADD COLUMN sync_attempts INTEGER NOT NULL DEFAULT 0",
        )
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to add sync_attempts column: {}", e))?;
        columns.insert("sync_attempts".to_string());
    }

    if !columns.contains("last_remote_hash") {
        sqlx::query("ALTER TABLE tasks_metadata ADD COLUMN last_remote_hash TEXT")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to add last_remote_hash column: {}", e))?;
        columns.insert("last_remote_hash".to_string());
    }

    if !columns.contains("deleted_at") {
        sqlx::query("ALTER TABLE tasks_metadata ADD COLUMN deleted_at INTEGER")
            .execute(pool)
            .await
            .map_err(|e| format!("Failed to add deleted_at column: {}", e))?;
    }

    // Ensure supporting indexes exist once required columns are in place
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_tasks_metadata_hash ON tasks_metadata(metadata_hash)",
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create idx_tasks_metadata_hash: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_tasks_sync_state_updated ON tasks_metadata(sync_state, updated_at)"
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create idx_tasks_sync_state_updated: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_tasks_dirty_fields ON tasks_metadata(dirty_fields) WHERE dirty_fields != '[]'"
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to create idx_tasks_dirty_fields: {}", e))?;

    Ok(())
}

async fn ensure_supporting_tables(pool: &SqlitePool) -> Result<(), String> {
    // task_mutation_log: audit trail for mutations
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS task_mutation_log (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            operation TEXT NOT NULL,
            payload TEXT NOT NULL,
            previous_hash TEXT,
            new_hash TEXT NOT NULL,
            actor TEXT,
            created_at INTEGER NOT NULL
        )",
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to ensure task_mutation_log table: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_mutation_log_task_id ON task_mutation_log(task_id, created_at)"
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to ensure idx_mutation_log_task_id: {}", e))?;

    // sync_queue: pending sync operations
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS sync_queue (
            id TEXT PRIMARY KEY,
            operation TEXT NOT NULL,
            task_id TEXT NOT NULL,
            payload TEXT NOT NULL,
            scheduled_at INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            attempts INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            created_at INTEGER NOT NULL
        )",
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to ensure sync_queue table: {}", e))?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, scheduled_at)",
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to ensure idx_sync_queue_status: {}", e))?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sync_queue_task_id ON sync_queue(task_id)")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to ensure idx_sync_queue_task_id: {}", e))?;

    // Ensure critical list index for task lookups
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks_metadata(list_id)")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to ensure idx_tasks_list_id: {}", e))?;

    Ok(())
}
