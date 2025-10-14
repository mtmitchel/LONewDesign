-- Tasks Metadata Table
-- Stores metadata not supported by Google Tasks API (priority, labels, time_block)
CREATE TABLE IF NOT EXISTS tasks_metadata (
    id TEXT PRIMARY KEY NOT NULL,
    google_id TEXT UNIQUE,
    list_id TEXT NOT NULL,
    priority TEXT DEFAULT 'none',
    labels TEXT DEFAULT '[]',
    time_block TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_state TEXT DEFAULT 'pending',
    last_synced_at INTEGER,
    sync_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_google_id ON tasks_metadata(google_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_state ON tasks_metadata(sync_state);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks_metadata(list_id);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    summary TEXT,
    due_date TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'on-track',
    focus_area TEXT,
    last_updated TEXT,
    next_step TEXT,
    pinned INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_pinned ON projects(pinned);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Project Phases Table
CREATE TABLE IF NOT EXISTS project_phases (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'upcoming',
    completion_percentage INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_phases_project_id ON project_phases(project_id);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON project_milestones(date);
