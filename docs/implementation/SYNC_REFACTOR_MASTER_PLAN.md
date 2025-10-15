# Sync Refactor Master Plan

> **Consolidated from**: 4 source planning documents (archived in `docs/archive/source-plans/`)
> 
> **Created**: 2025-01-20  
> **Last Updated**: 2025-01-20
> **Status**: In Progress - Phase 1 Pending, Phase 2 Complete ✅
>
> **⚠️ CRITICAL**: This plan fully implements the **Task Metadata CRUD Plan** requirements.  
> See: `docs/archive/source-plans/TASK_METADATA_CRUD_PLAN.md` for detailed architectural specification.

---

## 📊 Status Dashboard

| Phase | Status | Tasks Complete | Duration Estimate |
|-------|--------|----------------|-------------------|
| **Phase 1**: Database Infrastructure | 🟡 Pending | 0/5 | 2-3 days |
| **Phase 2**: Module Extraction | ✅ **COMPLETE** | 11/11 | DONE |
| **Phase 3**: Metadata CRUD Enhancement | 🟡 Pending | 0/11 | 2-3 days |
| **Phase 4**: Sync Engine Overhaul | 🟡 Pending | 0/8 | 2-3 days |
| **Phase 5**: Frontend & Testing | 🟡 Pending | 0/8 | 1-2 days |

**Total Estimated Time Remaining**: 7-11 days

---

## 🎯 Goals & Architecture

### **Primary Objective**
Transform the Therefore task management system into a **bulletproof, local-first architecture** with SQLite as the canonical source of truth, deterministic Google Tasks sync, and zero metadata loss across all operations.

**This plan implements the complete architecture specified in the Task Metadata CRUD Plan**, including:
- Local-first SQLite backend with canonical data
- Field-level dirty tracking and metadata hashing
- Explicit sync queue with mutation logging
- Conflict detection and resolution
- Google Tasks metadata serialization (JSON encoding in notes field)
- Soft deletes with reconciliation support

### **Key Requirements**
1. ✅ **Local Data Is Canonical**: SQLite is single source of truth (CRUD Plan §2.1)
2. ✅ **No Metadata Loss**: Priority, labels, due dates persist through all operations (CRUD Plan §2.2)
3. ✅ **Deterministic Sync**: Idempotent operations with conflict detection (CRUD Plan §2.3)
4. ✅ **Offline-First**: All CRUD succeeds offline with mutation queue (CRUD Plan §2.5)
5. ✅ **Auditable History**: Full change tracking with timestamps and hashes (CRUD Plan §2.6)
6. ✅ **Testability**: Comprehensive test coverage at all layers (CRUD Plan §2.7)

### **Architecture Layers**

```
┌─────────────────────────────────────────────────────────────┐
│  React UI Components (TasksBoard, CalendarRail, Forms)     │
├─────────────────────────────────────────────────────────────┤
│  Zustand Task Store (Read-only view, dispatches commands)  │
├─────────────────────────────────────────────────────────────┤
│  Tauri IPC Boundary (invoke commands, listen to events)    │
├─────────────────────────────────────────────────────────────┤
│  Rust Commands (CRUD, validation, emit events)             │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database (tasks_metadata, mutation_log, sync_queue)│
├─────────────────────────────────────────────────────────────┤
│  Sync Service (Queue worker, poller, conflict resolution)  │
├─────────────────────────────────────────────────────────────┤
│  Google Tasks API (External sync target)                   │
└─────────────────────────────────────────────────────────────┘
```

**Reference**: See Task Metadata CRUD Plan §4 for detailed layer responsibilities and data flow.

---

## Phase 1: Database Infrastructure 🟡

**Goal**: Establish SQLite backend with migrations, schema enhancements, and supporting tables.

### **Prerequisites**
- ✅ Rust/Tauri project structure exists
- ✅ commands/ module directory created
- ✅ cargo check passes with 0 errors

### **Tasks**

#### **P1.1: Add SQLx Dependencies**
```toml
# Add to src-tauri/Cargo.toml
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite", "macros", "migrate"] }
tokio = { version = "1.36", features = ["full"] }
```

**Validation**: `cargo build` succeeds

---

#### **P1.2: Create Database Module**
**File**: `src-tauri/src/db.rs`

```rust
use sqlx::{sqlite::SqlitePool, migrate::MigrateDatabase, Sqlite};
use std::path::PathBuf;
use tauri::Manager;

pub async fn get_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app.path()
        .app_data_dir()
        .ok_or("Failed to resolve app data directory")?;
    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;
    Ok(app_dir.join("therefore.db"))
}

pub async fn init_database(app: &tauri::AppHandle) -> Result<SqlitePool, String> {
    let db_path = get_db_path(app).await?;
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());
    
    if !Sqlite::database_exists(&db_url).await.unwrap_or(false) {
        Sqlite::create_database(&db_url).await
            .map_err(|e| format!("Error creating database: {}", e))?;
    }
    
    let pool = SqlitePool::connect(&db_url).await
        .map_err(|e| format!("Error connecting to database: {}", e))?;
    
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| format!("Error running migrations: {}", e))?;
    
    Ok(pool)
}
```

**Validation**: File compiles, exports `init_database` and `get_db_path`

---

#### **P1.3: Create Enhanced Schema Migration**
**File**: `src-tauri/migrations/001_create_enhanced_schema.sql`

**Reference**: Implements Task Metadata CRUD Plan §5.1 (Updated tasks_metadata Schema)

```sql
-- Core tasks table with metadata tracking
-- CRITICAL: This schema implements CRUD Plan §5.1 requirements
CREATE TABLE IF NOT EXISTS tasks_metadata (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,  -- CRUD Plan: Must be UNIQUE to prevent duplicates
    list_id TEXT NOT NULL,
    
    -- CRUD Plan §5.1: title is the canonical task name
    title TEXT NOT NULL,
    notes TEXT,
    due_date TEXT,
    
    -- CRUD Plan §5.1: Explicit metadata columns with defaults
    priority TEXT NOT NULL DEFAULT 'none',
    labels TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'needsAction',
    time_block TEXT,
    
    -- CRUD Plan §5.1: Metadata tracking for conflict detection
    metadata_hash TEXT NOT NULL,           -- SHA-256 of normalized metadata
    dirty_fields TEXT NOT NULL DEFAULT '[]', -- JSON array of changed fields
    last_remote_hash TEXT,                 -- Last known remote hash
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    
    -- Sync tracking
    sync_state TEXT NOT NULL DEFAULT 'pending',
    google_etag TEXT,
    last_synced_at INTEGER,
    
    -- CRUD Plan §7.4-7.5: Pending move tracking
    pending_move_from TEXT,
    pending_delete_google_id TEXT,
    
    -- CRUD Plan §5.1: Soft delete support
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER,
    
    -- Position for ordering
    "order" INTEGER DEFAULT 0
);

-- CRUD Plan §5.2: Mutation log for audit trail
-- Append-only log of every change for debugging and replay
CREATE TABLE IF NOT EXISTS task_mutation_log (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'create', 'update', 'delete', 'move'
    payload TEXT NOT NULL,   -- JSON serialized task state
    previous_hash TEXT,      -- Hash before change
    new_hash TEXT,           -- Hash after change
    actor TEXT,              -- 'user', 'sync', 'system'
    created_at INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks_metadata(id) ON DELETE CASCADE
);

-- CRUD Plan §5.2 & §8.1: Explicit sync queue for pending mutations
-- Worker processes entries in scheduled_at order with retry logic
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'create', 'update', 'delete', 'move'
    payload TEXT NOT NULL,   -- JSON serialized mutation (includes Google API payload)
    scheduled_at INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'failed'
    last_error TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks_metadata(id) ON DELETE CASCADE
);

-- Task lists
CREATE TABLE IF NOT EXISTS task_lists (
    id TEXT PRIMARY KEY,
    google_id TEXT,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks_metadata(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_google_id ON tasks_metadata(google_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_state ON tasks_metadata(sync_state, updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_hash ON tasks_metadata(metadata_hash);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks_metadata(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_mutation_log_task ON task_mutation_log(task_id, created_at);
```

**Down Migration**: `002_rollback_enhanced_schema.sql`
```sql
DROP INDEX IF EXISTS idx_mutation_log_task;
DROP INDEX IF EXISTS idx_sync_queue_status;
DROP INDEX IF EXISTS idx_tasks_deleted;
DROP INDEX IF EXISTS idx_tasks_metadata_hash;
DROP INDEX IF EXISTS idx_tasks_sync_state;
DROP INDEX IF EXISTS idx_tasks_google_id;
DROP INDEX IF EXISTS idx_tasks_list_id;
DROP TABLE IF EXISTS task_lists;
DROP TABLE IF EXISTS sync_queue;
DROP TABLE IF EXISTS task_mutation_log;
DROP TABLE IF EXISTS tasks_metadata;
```

**Validation**: `sqlx migrate run`, verify tables exist

---

#### **P1.4: Wire Database to Main**
**File**: `src-tauri/src/main.rs`

Add to imports:
```rust
mod db;
```

Update `setup()` closure:
```rust
.setup(|app| {
    let app_handle = app.handle();
    
    // ... existing deep-link setup ...
    
    // Initialize database
    let app_handle_for_db = app_handle.clone();
    tauri::async_runtime::spawn(async move {
        match db::init_database(&app_handle_for_db).await {
            Ok(pool) => {
                println!("[main] Database initialized successfully");
                // Store pool in app state if needed
            }
            Err(e) => {
                eprintln!("[main] Failed to initialize database: {}", e);
            }
        }
    });
    
    Ok(())
})
```

Add Tauri command:
```rust
#[tauri::command]
async fn init_database_command(app: AppHandle) -> Result<String, String> {
    db::init_database(&app).await?;
    Ok("Database initialized successfully".to_string())
}
```

Register in `invoke_handler!`:
```rust
.invoke_handler(tauri::generate_handler![
    init_database_command,
    // ... other commands
])
```

**Validation**: 
- `cargo check` passes
- `npm run tauri dev`
- Console: `await __TAURI__.invoke('init_database_command')`
- Verify DB file created at platform-specific path

---

#### **P1.5: Cross-Platform Testing**
**Platforms**: Windows, macOS, Linux

**Validation Steps**:
1. Run app on each platform
2. Verify database path:
   - **Windows**: `%APPDATA%\com.therefore.desktop\therefore.db`
   - **macOS**: `~/Library/Application Support/com.therefore.desktop/therefore.db`
   - **Linux**: `~/.local/share/com.therefore.desktop/therefore.db` or `$XDG_DATA_HOME`
3. Query schema: `sqlite3 <path> ".schema tasks_metadata"`
4. Verify all tables and indexes exist

**Rollback**: Delete database files, remove db module from main.rs

---

## Phase 2: Module Extraction ✅ **COMPLETE**

**Goal**: Extract monolithic main.rs into focused command modules.

### **Achievement Summary**
- ✅ Created 9 command modules (google, tasks, ai_types, mistral, ollama, openai, deepl, ai_utils)
- ✅ Reduced main.rs from 2,326 lines to 168 lines (93% reduction)
- ✅ Removed all duplicate Google and Task code
- ✅ All commands properly registered via `commands::module::function` paths
- ✅ Compilation successful with 0 errors

**Reference**: Full plan archived at `docs/archive/completed/BACKEND_REFACTOR_PHASE2_PLAN.json`

**Completed Tasks**:
1. ✅ Created `commands/ai_types.rs` with shared AI types
2. ✅ Created `commands/mistral.rs` (4 commands)
3. ✅ Created `commands/ollama.rs` (6 commands)
4. ✅ Created `commands/openai.rs` (3 commands)
5. ✅ Created `commands/deepl.rs` (1 command)
6. ✅ Created `commands/ai_utils.rs` (1 command)
7. ✅ Updated `commands/mod.rs` with all module declarations
8. ✅ Updated `main.rs` invoke_handler with module paths
9. ✅ Removed all AI command functions from main.rs (~700 lines)
10. ✅ Removed all AI type structs and helpers from main.rs (~200 lines)
11. ✅ Removed duplicate Google and Task commands from main.rs (~600 lines)

---

## Phase 3: Metadata CRUD Enhancement 🟡

**Goal**: Implement field-level dirty tracking, metadata hashing, and mutation logging in all CRUD commands.

**Reference**: Implements Task Metadata CRUD Plan §6 (Metadata Serialization), §7 (Backend Commands), and §10 (Workflows)

### **Prerequisites**
- ✅ Phase 1 complete (database tables exist)
- ✅ Phase 2 complete (commands modules exist)

### **Tasks**

#### **P3.1: Create Rust Metadata Normalizer**
**File**: `src-tauri/src/task_metadata.rs`

**Reference**: Implements CRUD Plan §6.1 (Shared Normalizers) and §6.2 (Metadata Hash Calculation)

**CRITICAL**: This module is the foundation for deterministic sync. All metadata must flow through these functions.

```rust
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetadata {
    pub title: String,           // CRUD Plan §6.3: Maps to Google title
    pub notes: Option<String>,   // CRUD Plan §6.3: Body text in metadata JSON
    pub due_date: Option<String>, // CRUD Plan §6.1: UTC date YYYY-MM-DD
    pub priority: String,         // CRUD Plan §6.1: Enum 'high'|'medium'|'low'|'none'
    pub labels: Vec<String>,      // CRUD Plan §6.1: JSON array sorted alphabetically
    pub status: String,           // CRUD Plan §6.1: 'needsAction'|'completed'
    pub time_block: Option<String>,
}

impl TaskMetadata {
    /// Normalize metadata for consistent hashing
    pub fn normalize(&self) -> Self {
        Self {
            title: self.title.trim().to_string(),
            notes: self.notes.as_ref().map(|n| n.trim().to_string()),
            due_date: self.due_date.clone(),
            priority: self.priority.clone(),
            labels: {
                let mut labels = self.labels.clone();
                labels.sort();
                labels.dedup();
                labels
            },
            status: self.status.clone(),
            time_block: self.time_block.clone(),
        }
    }
    
    /// Compute deterministic SHA-256 hash
    pub fn compute_hash(&self) -> String {
        let normalized = self.normalize();
        let json = serde_json::to_string(&normalized).unwrap();
        let mut hasher = Sha256::new();
        hasher.update(json.as_bytes());
        format!("{:x}", hasher.finalize())
    }
    
    /// Serialize for Google Tasks API (encode metadata in notes JSON)
    /// CRUD Plan §6.3: Encode priority/labels/time_block into Google notes field
    pub fn serialize_for_google(&self) -> GoogleTaskPayload {
        let meta_json = serde_json::json!({
            "priority": self.priority,
            "labels": self.labels,
            "time_block": self.time_block,
        });
        
        // CRUD Plan §6.3: Format: {"meta": {...}, "body": "..."}
        let notes_with_meta = format!(
            "{}\n\n__META__\n{}",
            self.notes.as_deref().unwrap_or(""),
            serde_json::to_string(&meta_json).unwrap()
        );
        
        GoogleTaskPayload {
            title: self.title.clone(),    // CRUD Plan §6.3: title → Google title
            notes: notes_with_meta,       // CRUD Plan §6.3: metadata encoded in notes
            due: self.due_date.clone(),
            status: self.status.clone(),
        }
    }
    
    /// Deserialize from Google Tasks API (parse meta JSON from notes)
    pub fn deserialize_from_google(payload: &GoogleTaskPayload) -> Self {
        let (notes, meta) = if let Some(notes_str) = &payload.notes {
            if let Some(meta_start) = notes_str.find("__META__") {
                let body = notes_str[..meta_start].trim();
                let meta_json = &notes_str[meta_start + 8..].trim();
                
                let meta: serde_json::Value = serde_json::from_str(meta_json)
                    .unwrap_or(serde_json::json!({}));
                
                (Some(body.to_string()), meta)
            } else {
                (Some(notes_str.clone()), serde_json::json!({}))
            }
        } else {
            (None, serde_json::json!({}))
        };
        
        Self {
            title: payload.title.clone(),
            notes,
            due_date: payload.due.clone(),
            priority: meta.get("priority")
                .and_then(|v| v.as_str())
                .unwrap_or("none")
                .to_string(),
            labels: meta.get("labels")
                .and_then(|v| v.as_array())
                .map(|arr| arr.iter()
                    .filter_map(|v| v.as_str())
                    .map(String::from)
                    .collect())
                .unwrap_or_default(),
            status: payload.status.clone(),
            time_block: meta.get("time_block")
                .and_then(|v| v.as_str())
                .map(String::from),
        }
    }
    
    /// Compare fields and return dirty field names
    pub fn diff_fields(&self, other: &TaskMetadata) -> Vec<String> {
        let mut dirty = Vec::new();
        
        if self.title != other.title { dirty.push("title".to_string()); }
        if self.notes != other.notes { dirty.push("notes".to_string()); }
        if self.due_date != other.due_date { dirty.push("due_date".to_string()); }
        if self.priority != other.priority { dirty.push("priority".to_string()); }
        if self.labels != other.labels { dirty.push("labels".to_string()); }
        if self.status != other.status { dirty.push("status".to_string()); }
        if self.time_block != other.time_block { dirty.push("time_block".to_string()); }
        
        dirty
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoogleTaskPayload {
    pub title: String,
    pub notes: String,
    pub due: Option<String>,
    pub status: String,
}
```

Add to `main.rs`:
```rust
mod task_metadata;
```

**Validation**: 
- `cargo check` passes
- Add unit tests for hash determinism and round-trip serialization

---

#### **P3.2: Refactor create_task Command**
**File**: `src-tauri/src/commands/tasks.rs`

**Reference**: Implements CRUD Plan §7.1 (create_task Contract)

**CRITICAL**: This command must be the ONLY way to create tasks. No direct SQL inserts elsewhere.

Update `create_task` to:
1. Generate deterministic ULID if id omitted (CRUD Plan §7.1 step 1)
2. Normalize metadata and compute hash (CRUD Plan §7.1 step 2)
3. Set `dirty_fields` to all fields `['title','priority','labels','due_date','status','notes']` (CRUD Plan §7.1 step 2)
4. Insert into `tasks_metadata` with transaction (CRUD Plan §7.1 step 3)
5. Log mutation in `task_mutation_log` (CRUD Plan §7.1 step 4)
6. Enqueue in `sync_queue` with `operation='create'` (CRUD Plan §7.1 step 5)
7. Emit `tasks::created` event with minimal payload (CRUD Plan §7.1 step 6)
8. Return full row for UI (CRUD Plan §7.1 step 7)

**Validation**:
- Create task via UI
- Verify `metadata_hash` populated
- Verify `dirty_fields='["title","priority","labels","due_date","status","notes"]'`
- Verify `sync_queue` has entry with `operation='create'`
- Verify `task_mutation_log` has entry

---

#### **P3.3: Refactor update_task Command**
**File**: `src-tauri/src/commands/tasks.rs`

**Reference**: Implements CRUD Plan §7.2 (update_task Contract)

Update `update_task` to:
1. Fetch current row with `SELECT ... FOR UPDATE` (CRUD Plan §7.2 step 1 - ensure isolation)
2. Compute diff using `task_metadata::diff_fields()` (CRUD Plan §7.2 step 2)
3. If no changes, return existing row - idempotent (CRUD Plan §7.2 step 3)
4. Update fields, recompute hash, merge dirty_fields (CRUD Plan §7.2 step 4)
5. Set `sync_state='pending'`, reset `sync_attempts=0` (CRUD Plan §7.2 step 5)
6. Record diff in `task_mutation_log` with previous_hash and new_hash (CRUD Plan §7.2 step 6)
7. Upsert into `sync_queue` - merge with existing entry to avoid duplicates (CRUD Plan §7.2 step 7)
8. Emit `tasks::updated` event (CRUD Plan §7.2 step 8)

**Validation**:
- Update task metadata
- Verify only changed fields in `dirty_fields`
- Verify `metadata_hash` updated
- Verify `task_mutation_log` shows previous and new hash
- Multiple updates to same task should only have ONE sync_queue entry

---

#### **P3.4: Implement Soft Delete**
**File**: `src-tauri/src/commands/tasks.rs`

**Reference**: Implements CRUD Plan §7.3 (delete_task - Soft Delete)

**CRITICAL**: NEVER use `DELETE FROM tasks_metadata`. Always soft delete.

Update `delete_task` to:
1. Set `deleted_at=current_timestamp` (CRUD Plan §7.3)
2. Set `sync_state='pending_delete'` (CRUD Plan §7.3)
3. Keep all data until remote deletion confirmed (CRUD Plan §7.3)
4. Log mutation in `task_mutation_log` with operation='delete'
5. Enqueue delete operation in `sync_queue`
6. Emit `tasks::deleted` event

**Validation**:
- Delete task
- Verify `deleted_at` set, row still exists in DB
- UI filters out deleted tasks (WHERE deleted_at IS NULL)
- After successful sync, row can be purged OR kept for audit trail

---

#### **P3.5-P3.11**: Additional CRUD enhancements
- P3.5: Enhance `queue_move_task` with metadata preservation
- P3.6: Enhance `move_task_across_lists` with atomic operations
- P3.7: Update `get_tasks` to include dirty_fields and sync_state
- P3.8: Add property tests for metadata normalization
- P3.9: Add integration tests for CRUD operations
- P3.10: Test cross-list moves preserve metadata
- P3.11: Test offline operation queue

---

## Phase 4: Sync Engine Overhaul 🟡

**Goal**: Implement robust background sync with queue worker, conflict detection, and retry logic.

**Reference**: Implements CRUD Plan §8 (Sync Engine Design) and §11 (Conflict Detection & Resolution)

### **Tasks**

#### **P4.1: Create Sync Service Module**
**File**: `src-tauri/src/sync_service.rs`

```rust
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tauri::{AppHandle, Emitter};

pub struct SyncService {
    pool: SqlitePool,
    http_client: reqwest::Client,
    app_handle: AppHandle,
}

impl SyncService {
    pub fn new(pool: SqlitePool, http_client: reqwest::Client, app_handle: AppHandle) -> Self {
        Self { pool, http_client, app_handle }
    }
    
    pub fn start(self: Arc<Self>) {
        let service = self.clone();
        tokio::spawn(async move {
            let mut ticker = interval(Duration::from_secs(60));
            loop {
                ticker.tick().await;
                if let Err(e) = service.sync_cycle().await {
                    eprintln!("[sync_service] Sync cycle error: {}", e);
                }
            }
        });
    }
    
    async fn sync_cycle(&self) -> Result<(), String> {
        // 1. Process pending mutations (push to Google)
        self.process_sync_queue().await?;
        
        // 2. Poll Google for remote changes (pull from Google)
        self.poll_google_tasks().await?;
        
        Ok(())
    }
    
    async fn process_sync_queue(&self) -> Result<(), String> {
        // TODO: Implement in P4.2
        Ok(())
    }
    
    async fn poll_google_tasks(&self) -> Result<(), String> {
        // TODO: Implement in P4.3
        Ok(())
    }
}
```

Wire to main.rs setup:
```rust
let sync_service = Arc::new(sync_service::SyncService::new(pool, http_client, app_handle));
sync_service.start();
```

**Validation**: Service starts, logs sync cycle attempts

---

#### **P4.2: Implement Sync Queue Worker**
**File**: `src-tauri/src/sync_service.rs`

**Reference**: Implements CRUD Plan §8.1 (Mutation Puller)

**CRITICAL**: This is the push pipeline. All local changes flow through this worker.

Implement `process_sync_queue()`:
1. Query `sync_queue` WHERE `status='pending'` ORDER BY `scheduled_at` LIMIT 10 (CRUD Plan §8.1 step 1)
2. For each mutation (CRUD Plan §8.1 step 2):
   - Fetch task from `tasks_metadata`
   - Serialize metadata using `task_metadata::serialize_for_google()` (CRUD Plan §6.3)
   - Make Google API call (POST/PATCH/DELETE) (CRUD Plan §8.1 step 2)
   - Handle responses (CRUD Plan §8.1 step 2):
     - **200/201 Success**: (CRUD Plan §8.1 step 3)
       * Update `sync_state='synced'`
       * Clear `dirty_fields=[]`
       * Set `last_synced_at=now`
       * Store `last_remote_hash` (computed from normalized metadata)
       * Delete from `sync_queue`
       * Emit `tasks::synced` event
     - **401 Unauthorized**: Refresh OAuth token, retry (CRUD Plan §8.1 step 2)
     - **409/412 Conflict**: (CRUD Plan §8.1 step 4)
       * Set `sync_state='conflict'`
       * Keep mutation in queue
       * Trigger targeted pull for this task
     - **500 Server Error**: (CRUD Plan §8.1 step 4)
       * Increment `sync_attempts`
       * If attempts exceed threshold (5), set `sync_state='error'`
       * Exponential backoff before retry
       * Emit `tasks::sync_failed` event
3. Emit events for UI updates

**Validation**:
- Create task offline
- Wait for sync cycle
- Verify task appears in Google Tasks web UI
- Verify `sync_state='synced'` in local DB
- Verify `dirty_fields='[]'`
- Verify `last_remote_hash` populated

---

#### **P4.3: Implement Remote Poller**
**File**: `src-tauri/src/sync_service.rs`

**Reference**: Implements CRUD Plan §8.2 (Remote Poller)

**CRITICAL**: This is the pull pipeline. Never overwrite local dirty fields.

Implement `poll_google_tasks()`:
1. Fetch all task lists from Google (CRUD Plan §8.2 step 1)
2. For each list, fetch all tasks (CRUD Plan §8.2 step 1)
3. For each remote task (CRUD Plan §8.2 step 2):
   - Deserialize metadata using `task_metadata::deserialize_from_google()` (CRUD Plan §6.3)
   - Compute hash of remote metadata (CRUD Plan §6.2)
   - Query local task by `google_id`
   - **If local task missing**: (CRUD Plan §8.2)
     - Create local row with `dirty_fields=[]`, `sync_state='synced'`
   - **If local task exists AND `dirty_fields` is empty**: (CRUD Plan §8.2)
     - Compare `last_remote_hash` with current remote hash
     - If hashes differ: Update local row to remote values (remote wins)
   - **If local task exists AND `dirty_fields` is NOT empty**: (CRUD Plan §8.2 - CONFLICT ZONE)
     - Compare timestamps: `local.updated_at` vs `remote.updated`
     - **If local newer**: Keep local metadata, schedule push (local wins outright)
     - **If remote newer**: Field-by-field merge:
       * Apply remote changes ONLY for fields NOT in `dirty_fields`
       * Keep local values for fields in `dirty_fields`
       * Log conflict in `task_mutation_log` with both versions
       * Set `sync_state='conflict'`
       * Emit `tasks::conflict` event for UI alert
4. Prune local tasks: WHERE `deleted_at IS NOT NULL` AND remote task no longer exists (CRUD Plan §8.2 step 3)

**Validation**:
- Change task title in Google Tasks web UI
- Wait for poll cycle
- Verify local task updated
- Test conflict: Edit priority locally (dirty), change title remotely
  - Local priority should be preserved
  - Remote title should be applied
  - `sync_state='conflict'` set
  - UI shows conflict banner

---

#### **P4.4: Implement Conflict Detection**
**Reference**: Implements CRUD Plan §11 (Conflict Detection & Resolution)

Enhanced in P4.3 poller logic.

**Conflict Rules** (CRUD Plan §11.1):
- Conflict detected when:
  - Remote hash ≠ `last_remote_hash` (remote changed)
  - AND `dirty_fields` is non-empty (local has unsynced changes)
  - AND remote modification timestamp > local `updated_at` (remote is newer)

**Resolution Strategy** (CRUD Plan §11.2):
- **Default rule**: Local wins for fields in `dirty_fields`
- Remote values stored in `task_mutation_log` for audit
- UI surfaces conflict notification with option to accept remote values per-field
- Accepting remote change triggers new `update_task` call with remote metadata
- This clears `dirty_fields` for those fields and allows normal sync to resume

---

#### **P4.5: Implement Retry Logic**
- Exponential backoff for failed syncs
- Max retries: 5
- Backoff: 1s, 2s, 4s, 8s, 16s
- After max retries: Set `sync_state='error'`, alert user

---

#### **P4.6: Add Resume on Startup**
**File**: `src-tauri/src/main.rs` setup

After database init:
```rust
// Resume pending mutations on startup
tokio::spawn(async move {
    if let Err(e) = sync_service.process_sync_queue().await {
        eprintln!("[startup] Failed to resume pending syncs: {}", e);
    }
});
```

**Validation**:
- Create task offline
- Close app
- Reopen app
- Verify task syncs automatically

---

#### **P4.7: Implement Idempotency Checks**
Before creating remote task:
1. Check if task with same `metadata_hash` already exists remotely
2. If yes, link local task to existing remote task (update `google_id`)
3. Skip creation

---

#### **P4.8: Add Manual Sync Trigger**
**File**: `src-tauri/src/main.rs`

Update `sync_tasks_now` command:
```rust
#[tauri::command]
async fn sync_tasks_now(app: AppHandle) -> Result<String, String> {
    // Get sync service from app state
    // Trigger immediate sync_cycle()
    Ok("Sync triggered".to_string())
}
```

**Validation**:
- UI button calls `sync_tasks_now`
- Verify immediate sync occurs

---

## Phase 5: Frontend & Testing 🟡

**Goal**: Update React store, add UI indicators, and comprehensive testing.

**Reference**: Implements CRUD Plan §9 (React Store Refactor), §10 (Workflow Specifications), and §14 (Testing Strategy)

### **Tasks**

#### **P5.1: Refactor Task Store**
**File**: `components/modules/tasks/taskStore.tsx`

**Reference**: Implements CRUD Plan §9.1 (Store Responsibilities)

**CRITICAL**: Store must be read-only. No optimistic mutations. All writes via Tauri commands.

Changes:
1. Make store read-only mirror of backend (CRUD Plan §9.1)
2. All mutations call Tauri commands only - no direct state updates (CRUD Plan §9.1)
3. Listen to Tauri events: `tasks::created`, `tasks::updated`, `tasks::synced`, `tasks::sync_failed`, `tasks::conflict` (CRUD Plan §9.1)
4. Update state on events only (CRUD Plan §9.1)
5. Add selectors for `sync_state` and `dirty_fields` (CRUD Plan §9.1)
6. Remove all optimistic rollback logic - not needed with backend as source of truth

---

#### **P5.2: Add Sync Status Badges**
**Component**: `components/tasks/SyncStatusBadge.tsx`

Display badges based on `sync_state`:
- 🟡 `pending`: "Syncing..."
- 🟢 `synced`: No badge (default)
- 🔴 `error`: "Sync Failed"
- ⚠️ `conflict`: "Conflict"
- 🚀 `pending_move`: "Moving..."

---

#### **P5.3: Add Conflict Resolution UI**
**Component**: `components/tasks/ConflictBanner.tsx`

When `sync_state='conflict'`:
1. Show banner with both versions
2. Buttons: "Keep Local", "Accept Remote", "Merge"
3. Call command to resolve: `resolve_conflict(task_id, resolution)`

---

#### **P5.4-P5.8**: Testing
- P5.4: Unit tests for metadata normalizer (Rust)
- P5.5: Integration tests for CRUD commands (Rust)
- P5.6: E2E tests for sync cycle (Playwright)
- P5.7: Conflict resolution tests
- P5.8: Cross-platform smoke tests

---

## 📝 Execution Guidelines

### **Phase Sequencing**
Phases must be executed in order due to dependencies:
```
P1 (Database) → P2 (Modules ✅) → P3 (CRUD) → P4 (Sync) → P5 (Frontend/Testing)
```

### **Commit Strategy**
- Commit after each phase completion
- Use feature branches for risky changes
- Keep `main` always deployable

### **Rollback Procedures**
- Each task includes rollback steps
- Database migrations have down migrations
- Keep backups before major schema changes

### **Testing Requirements**
- Run `cargo test` after each Rust change
- Run `cargo check` continuously
- Run E2E tests before phase completion
- Manual testing on all platforms for P1.5

---

## 🔗 Related Documents

### **Primary Specification** ⭐
- **`docs/archive/source-plans/TASK_METADATA_CRUD_PLAN.md`** - **AUTHORITATIVE ARCHITECTURAL SPECIFICATION**
  - This Master Plan implements ALL requirements from the CRUD Plan
  - When in doubt, consult the CRUD Plan for detailed specifications
  - Sections referenced throughout this document (e.g., "CRUD Plan §5.1")

### **Source Plans** (Archived - Consolidated into Master Plan)
- `docs/archive/source-plans/backend-sync-refactor-tasks.json` - Database setup tasks
- `docs/archive/source-plans/refactor_sync_plans.md` - Original sync architecture
- `docs/archive/source-plans/IMPLEMENTATION_TASKS.json` - Granular task breakdown

### **Completed Plans**
- `docs/archive/completed/BACKEND_REFACTOR_PHASE2_PLAN.json` ✅

### **Other References**
- `docs/guidelines/Guidelines.md` - Development guidelines
- `CHANGELOG.md` - Breaking changes log
- `docs/roadmap/Unified-Workspace-Roadmap.md` - Product roadmap

---

## 📊 Progress Tracking

**Last Updated**: 2025-01-20

| Phase | Started | Completed | Notes |
|-------|---------|-----------|-------|
| P1 | - | - | Ready to start |
| P2 | 2025-01-20 | 2025-01-20 ✅ | Modules extracted |
| P3 | - | - | Pending P1 |
| P4 | - | - | Pending P3 |
| P5 | - | - | Pending P4 |

**Next Action**: Begin Phase 1 - Add SQLx dependencies to Cargo.toml
