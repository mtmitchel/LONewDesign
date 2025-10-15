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
    sync_error TEXT,
    
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
    attempts INTEGER DEFAULT 0,
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
