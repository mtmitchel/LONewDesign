-- Migration 003: create task_subtasks table for storing per-task subtasks

CREATE TABLE IF NOT EXISTS task_subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    due_date TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(task_id) REFERENCES tasks_metadata(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_position
    ON task_subtasks(task_id, position);
