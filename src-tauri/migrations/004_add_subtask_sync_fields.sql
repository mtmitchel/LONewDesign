-- Migration 004: expand task_subtasks with Google sync metadata

ALTER TABLE task_subtasks
    ADD COLUMN google_id TEXT;

ALTER TABLE task_subtasks
    ADD COLUMN parent_google_id TEXT;

ALTER TABLE task_subtasks
    ADD COLUMN metadata_hash TEXT;

ALTER TABLE task_subtasks
    ADD COLUMN dirty_fields TEXT NOT NULL DEFAULT '[]';

ALTER TABLE task_subtasks
    ADD COLUMN sync_state TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE task_subtasks
    ADD COLUMN sync_error TEXT;

ALTER TABLE task_subtasks
    ADD COLUMN last_synced_at INTEGER;

ALTER TABLE task_subtasks
    ADD COLUMN last_remote_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_task_subtasks_parent_google
    ON task_subtasks(parent_google_id);

CREATE INDEX IF NOT EXISTS idx_task_subtasks_google
    ON task_subtasks(google_id);
