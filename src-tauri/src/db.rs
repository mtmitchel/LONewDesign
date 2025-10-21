use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions, SqliteSynchronous};
use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePool, Sqlite};
use std::path::PathBuf;
use std::str::FromStr;
use std::time::Duration;
use tauri::Manager;
use tokio::sync::{Mutex, MutexGuard, OnceCell};

static POOL: OnceCell<SqlitePool> = OnceCell::const_new();
static WRITE_MUTEX: OnceCell<Mutex<()>> = OnceCell::const_new();

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
    if let Some(pool) = database_pool() {
        return Ok(pool);
    }

    let db_path = get_db_path(app).await?;
    let db_path_string = db_path.to_string_lossy().to_string();
    let db_url = format!("sqlite://{}?mode=rwc", db_path_string);

    let db_path_string_for_init = db_path_string.clone();
    let db_url_for_init = db_url.clone();

    let pool = POOL
        .get_or_try_init(move || {
            let db_path_string = db_path_string_for_init.clone();
            let db_url = db_url_for_init.clone();

            async move {
                println!("[db] Database path: {}", db_path_string);

                if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
                    println!("[db] Creating new database");
                    Sqlite::create_database(&db_url)
                        .await
                        .map_err(|e| format!("Error creating database: {}", e))?;
                }

                let connect_opts = SqliteConnectOptions::from_str(&db_url)
                    .map_err(|e| format!("Invalid database URL {}: {}", db_url, e))?
                    .create_if_missing(true)
                    .journal_mode(SqliteJournalMode::Wal)
                    .synchronous(SqliteSynchronous::Normal)
                    .busy_timeout(Duration::from_secs(5));

                let pool = SqlitePoolOptions::new()
                    .max_connections(8)
                    .connect_with(connect_opts)
                    .await
                    .map_err(|e| format!("Error connecting to database: {}", e))?;

                sqlx::query("PRAGMA foreign_keys = ON;")
                    .execute(&pool)
                    .await
                    .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

                println!("[db] Running migrations");
                sqlx::migrate!("./migrations")
                    .run(&pool)
                    .await
                    .map_err(|e| format!("Error running migrations: {}", e))?;

                println!("[db] Database initialized successfully");

                Ok::<_, String>(pool)
            }
        })
        .await?
        .clone();

    Ok(pool)
}

pub fn database_pool() -> Option<SqlitePool> {
    POOL.get().cloned()
}

pub fn is_initialized() -> bool {
    POOL.get().is_some()
}

pub async fn acquire_write_lock() -> MutexGuard<'static, ()> {
    WRITE_MUTEX
        .get_or_init(|| async { Mutex::new(()) })
        .await
        .lock()
        .await
}
