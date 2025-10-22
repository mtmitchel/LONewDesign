-- Saga orchestration state tracking
CREATE TABLE IF NOT EXISTS saga_logs (
    id TEXT PRIMARY KEY,
    saga_type TEXT NOT NULL, -- 'task_move', 'task_delete', etc.
    state TEXT NOT NULL, -- JSON serialized TaskMoveSaga enum
    task_id TEXT NOT NULL,
    from_list_id TEXT,
    to_list_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    error TEXT
);

-- Idempotency tracking for external API calls
CREATE TABLE IF NOT EXISTS operation_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    request_params TEXT NOT NULL, -- JSON
    response_data TEXT, -- JSON
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    expires_at INTEGER NOT NULL
);

-- Task backups for rollback capability
CREATE TABLE IF NOT EXISTS task_backups (
    saga_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_backup_data TEXT NOT NULL, -- JSON
    subtask_backups_data TEXT NOT NULL, -- JSON array
    created_at INTEGER NOT NULL,
    FOREIGN KEY (saga_id) REFERENCES saga_logs(id) ON DELETE CASCADE
);

-- Distributed locking for concurrent operations
CREATE TABLE IF NOT EXISTS operation_locks (
    lock_key TEXT PRIMARY KEY,
    acquired_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Progress tracking for resumable subtask operations
CREATE TABLE IF NOT EXISTS saga_subtask_progress (
    saga_id TEXT NOT NULL,
    old_subtask_id TEXT NOT NULL,
    new_subtask_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (saga_id, old_subtask_id),
    FOREIGN KEY (saga_id) REFERENCES saga_logs(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saga_logs_task_id ON saga_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_saga_logs_state ON saga_logs(saga_type, state);
CREATE INDEX IF NOT EXISTS idx_operation_idempotency_expires ON operation_idempotency(expires_at);
CREATE INDEX IF NOT EXISTS idx_operation_locks_expires ON operation_locks(expires_at);
