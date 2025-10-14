use sqlx::{sqlite::SqlitePool, migrate::MigrateDatabase, Sqlite};
use std::path::PathBuf;
use tauri::Manager;

pub async fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path()
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
        Sqlite::create_database(&db_url).await
            .map_err(|e| format!("Error creating database: {}", e))?;
    }
    
    let pool = SqlitePool::connect(&db_url).await
        .map_err(|e| format!("Error connecting to database: {}", e))?;
    
    println!("[db] Running migrations");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| format!("Error running migrations: {}", e))?;
    
    println!("[db] Database initialized successfully");
    Ok(pool)
}
