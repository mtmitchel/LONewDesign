# Task Metadata CRUD & Sync Technical Report

## 1. Purpose & Scope

This document specifies a Perplexity-aligned, bulletproof design for task CRUD operations in the Therefore Tauri application. It replaces the legacy optimistic-only flow with a **local-first, SQLite-backed architecture** that guarantees labels, priority, status, and due dates are never lost across refreshes, sync cycles, cross-list moves, or offline usage. The plan covers every layer: data schema, Rust backend commands, sync engine, React/Zustand store, migrations, conflict resolution, testing, and observability.

## 2. Guiding Requirements

1. **Local Data Is Canonical**: SQLite is the single source of truth. The React store mirrors database records; metadata edits never depend on in-memory optimistic state alone.
2. **No Metadata Loss**: Priority, labels, due date, and status must persist through any combination of create, update, move, delete, sync, or refresh operations.
3. **Deterministic Sync**: Google Tasks is eventually consistent. All pushes/pulls use idempotent operations keyed by deterministic IDs and monotonic timestamps.
4. **Conflict Safety**: The system detects and resolves concurrent edits via timestamps and dirty-field tracking. Local unsynced edits always win unless the user explicitly chooses otherwise.
5. **Offline-First**: Every CRUD action succeeds offline by recording mutations locally. Sync resumes automatically when connectivity returns.
6. **Auditable History**: Each write updates `updated_at`, `dirty_fields`, and `metadata_hash` columns, providing forensic insight when debugging.
7. **Testability**: Every workflow (CRUD, move, conflict, retry, migration) has deterministic tests in Rust and TypeScript.

## 3. Current-State Diagnosis

- **Frontend**: `components/modules/tasks/taskStore.tsx` performs optimistic updates and invokes Tauri commands. It does not read back the authoritative DB state on every mutation and lacks dirty-field awareness.
- **Backend**: `src-tauri/src/main.rs` exposes `create_task`, `update_task`, `queue_move_task`, and `move_task_across_lists`. `update_task` uses dynamic SQL but does not record dirty metadata or remember the previous snapshot.
- **Sync Engine**: `src-tauri/src/sync_service.rs` reconciles with Google Tasks but overwrites metadata whenever Google omits fields, because it lacks field-level merge logic and canonical serialization.
- **Schema**: `tasks_metadata` contains `priority`, `labels`, `due_date`, `sync_state`, and pending move columns. It lacks dirty flags, per-field timestamps, or metadata hashes to detect divergence.

These gaps allow metadata to be overwritten during refresh or cross-list syncs, violating the non-destructive requirement.

## 4. Target Architecture Overview

| Layer | Responsibilities |
|-------|------------------|
| SQLite (`tasks_metadata`) | Canonical store for metadata, sync bookkeeping, and conflict tracking. |
| Rust Commands | Enforce schema invariants, apply writes, enqueue sync mutations, emit events. |
| Rust Sync Service | Deterministic push/pull with Google Tasks, metadata serialization, conflict resolution, retries. |
| React Task Store | Read-only view backed by `get_tasks`; dispatches writes via commands; shows pending/synced state. |
| UI Components | Purely consume store selectors; never mutate metadata directly outside store actions. |

## 5. Database Specification

### 5.1 Updated `tasks_metadata` Schema

```sql
CREATE TABLE tasks_metadata (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    list_id TEXT NOT NULL,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'none',
    labels TEXT NOT NULL DEFAULT '[]',
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'needsAction',
    metadata_hash TEXT NOT NULL,
    dirty_fields TEXT NOT NULL DEFAULT '[]',
    sync_state TEXT NOT NULL DEFAULT 'pending',
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    last_synced_at INTEGER,
    last_remote_hash TEXT,
    time_block TEXT,
    notes TEXT,
    pending_move_from TEXT,
    pending_delete_google_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);
```

**Key Additions**:
- `metadata_hash`: SHA-256 of `{priority,labels,due_date,status,title,notes}` for quick divergence detection.
- `dirty_fields`: JSON array tracking which fields changed since last sync.
- `status`: Explicit column (currently inferred from UI) to prevent accidental default resets.
- `deleted_at`: Soft-delete marker to support multi-device reconciliation.
- `sync_attempts`: Helps backoff and alert when repeated failures occur.
- `last_remote_hash`: Stores hash from last remote pull to compare before overwriting.

### 5.2 Supporting Tables

- `task_mutation_log`: Append-only audit of every change (id, task_id, payload, previous_hash, new_hash, actor, created_at).
- `sync_queue`: Explicit queue of pending push operations (operation type, task_id, payload, scheduled_at, status).

### 5.3 Migrations

1. Add new columns with defaults and backfill existing rows (`metadata_hash`, `dirty_fields`, `status`, `sync_attempts`, `last_remote_hash`, `deleted_at`).
2. Compute `metadata_hash` and `dirty_fields=[]` for existing entries.
3. Populate `status` using current in-memory data (assume `'needsAction'` unless `sync_state='completed'`).
4. Ensure indexes on `(sync_state, updated_at)`, `(google_id)`, `(metadata_hash)`, and verify the existing `(list_id)` index remains (or recreate it) so list-scoped lookups stay efficient.
5. Create `task_mutation_log` and `sync_queue` tables.
6. Write reversible down migrations for safe rollback.

## 6. Metadata Serialization & Normalization

### 6.1 Shared Normalizers

- Implement shared normalization logic in Rust (`task_metadata.rs`) and TypeScript (`metadata.ts`).
- Fields:
  - **Priority**: Enum `'high' | 'medium' | 'low' | 'none'`; reject unknown values before insert.
  - **Labels**: Stored as compact JSON array of `{ name: string, color: string }` sorted lexicographically, eliminating duplicates.
  - **Due Date**: Persist as UTC date string `YYYY-MM-DD`; when pushing to Google, convert to `YYYY-MM-DDT00:00:00.000Z`.
  - **Status**: `'needsAction' | 'completed'`; translations to/from Google `status` field.
  - **Notes**: Source of truth for task title until native Google fields align.

### 6.2 Metadata Hash Calculation

```text
hash_input = JSON.stringify({
  title,
  priority,
  labels,
  due_date,
  status,
  notes,
  time_block
})
metadata_hash = sha256(hash_input)
```

Hashes are recomputed after every local write and after every successful sync reconciliation.

### 6.3 Google Tasks Mapping

- `title` ➜ Google `title`
- `status` ➜ Google `status`
- `due_date` ➜ Google `due`
- `notes`, `priority`, `labels`, `time_block` ➜ Encode into Google `notes` as JSON under a namespace, e.g.

```json
{
  "meta": {
    "priority": "high",
    "labels": [{"name":"Design","color":"#FFAA00"}],
    "time_block": "afternoon"
  },
  "body": "Original notes..."
}
```

- On ingest, parse `meta` JSON to repopulate local columns. Preserve unknown keys for forward compatibility.

## 7. Backend Command Contracts

### 7.1 `create_task`

**Input**: `{ input: { id?, title, list_id, priority, labels, due_date, status, notes, time_block } }`

**Steps**:
1. If `id` omitted, generate deterministic ULID.
2. Normalize metadata; compute `metadata_hash`; set `dirty_fields` to `['title','priority','labels','due_date','status','notes']`.
3. Insert into `tasks_metadata` (wrapped in transaction).
4. Append to `task_mutation_log`.
5. Push entry into `sync_queue` with `operation='create'` and serialized payload.
6. Emit `tasks::created` event with minimal payload (id, list_id, sync_state, dirty_fields).
7. Return full row (for UI to update view immediately).

### 7.2 `update_task`

**Input**: `{ input: { id, changes: Partial<TaskMetadata> } }`

**Steps**:
1. Fetch current row with `FOR UPDATE` to ensure isolation.
2. Normalize `changes`; compare to existing values to derive `effective_fields`.
3. If no changes, return existing row (idempotent).
4. Update fields, recompute `metadata_hash`, merge `dirty_fields`.
5. Increment `sync_attempts=0`, set `sync_state='pending'`.
6. Record diff in `task_mutation_log`.
7. Upsert into `sync_queue` (merge with any existing pending entry for same task to avoid duplicates).
8. Emit `tasks::updated` event.

### 7.3 `delete_task`

**Soft delete** by setting `deleted_at=timestamp` and `sync_state='pending_delete'`. Keep data until remote deletion confirmed.

### 7.4 `queue_move_task`

**Purpose**: Mark cross-list moves when Google call fails (offline or auth error).

**Enhancements**:
- Update row: `list_id=new_list`, `sync_state='pending_move'`, add `dirty_fields` for list_id and metadata hash.
- Record `pending_move_from`, `pending_delete_google_id` only if remote ID exists.
- Insert mutation logs for both move and metadata retention.

### 7.5 `move_task_across_lists`

- Attempt remote move (create + delete) only when online and tokens valid.
- On success, update local row in single transaction: new `google_id`, `list_id`, preserve metadata, clear pending move fields, mark `sync_state='synced'`.

### 7.6 `get_tasks`

- Return full canonical rows, including `dirty_fields` and `sync_state`, allowing UI to display badges (e.g., “Unsynced changes”).

## 8. Sync Engine Design

### 8.1 Mutation Puller

1. Worker scans `sync_queue` for pending entries ordered by `scheduled_at`.
2. For each mutation:
   - Serialize metadata using shared normalizer.
   - Call Google API (`POST`, `PATCH`, `DELETE`).
   - Handle 401 by initiating token refresh via existing OAuth module before retrying.
3. On success:
   - Update `tasks_metadata.sync_state='synced'`, clear `dirty_fields`, set `last_synced_at=now`, store `last_remote_hash`.
   - Delete row from `sync_queue`.
   - Emit `tasks::synced` event.
4. On failure:
   - Increment `sync_attempts`.
   - If attempts exceed threshold, set `sync_state='error'`, retain in queue with exponential backoff.
   - Emit `tasks::sync_failed` with detailed error for UI.
   - If Google responds with `409`/`412` conflict, mark the task as `sync_state='conflict'`, keep the mutation queued, and immediately trigger a targeted pull for that task so conflict resolution logic can run without waiting for the next poll.

### 8.2 Remote Poller

1. Poll Google lists & tasks periodically (e.g., 60s) or on demand (`sync_tasks_now`).
2. For each remote task:
   - Deserialize metadata.
   - Compute remote hash.
   - Fetch local row by `google_id`.
   - If missing: create local row with `dirty_fields=[]`, `sync_state='synced'`.
   - If exists and `dirty_fields` empty:
       * If hashes differ: update local row to remote values (remote wins when no local dirty fields).
   - If local `dirty_fields` present:
       * Compare timestamps. If local `updated_at > remote_updated_at`, keep local metadata and schedule push by keeping the existing mutation in the queue (local wins outright).
       * If the remote timestamp is newer, merge field-by-field: apply remote changes only for fields **not** listed in `dirty_fields`, and keep local values for overlapping dirty fields. Log a conflict entry that captures both versions and raise a UI alert for manual review so the user can optionally accept the remote value.
3. Prune local tasks with `deleted_at` set but remote already removed.

### 8.3 Idempotency Guarantees

- Use deterministic IDs (ULID or combination of list_id + slug) when creating tasks locally to avoid duplicates.
- Before creating remote tasks, check if a task with same hash already exists (prevents duplicates after retries).
- All Google calls include `if-match` headers when available to avoid overwriting newer remote versions.

## 9. React Store Refactor

### 9.1 Store Responsibilities

- Wrap `useTaskStore` selectors so state is derived from canonical DTOs returned by `get_tasks`.
- Expose actions that **only** call Tauri commands; no direct optimistic mutations beyond marking UI state (e.g., pending spinner).
- Listen to Tauri events (`tasks::created/updated/synced/sync_failed`) to update store state.

### 9.2 UI Indicators

- Show badges for `sync_state` (`pending`, `pending_move`, `error`).
- Disable destructive actions while `sync_state='pending_move'` to avoid race conditions.
- Provide conflict banners when `dirty_fields` intersects with remote changes.

### 9.3 Derived Selectors

- `selectTasksByList(listId)` sorts via stable order (e.g., `order` column) but falls back to `created_at`.
- `selectTaskMetadata(taskId)` returns normalized metadata object for forms.

### 9.4 Forms & Panels

- `TaskSidePanel`: when saving, call `updateTask` with full metadata; disable closing until command resolves or failure toast displayed.
- Ensure date pickers format `YYYY-MM-DD` and convert to/from local timezone consistently.

## 10. Workflow Specifications

### 10.1 Task Create

1. UI calls `taskActions.createTask(payload)`.
2. Command inserts row, returns canonical record.
3. Store receives result, pushes into state.
4. Sync queue picks up entry, pushes to Google; on success, event updates `sync_state` to `synced`.

### 10.2 Task Update (Metadata Change)

1. UI submits change.
2. Command applies diff, marks `dirty_fields`, schedules sync.
3. Store updates via returned row (no optimistic rollback).
4. Sync engine pushes patch; on success clears `dirty_fields`.

### 10.3 Task Move Within List

- Local store updates ordering (new `order` value) via command that updates DB and enqueues reorder mutation.
- Since metadata unaffected, `dirty_fields=['order']`; ensures metadata untouched.

### 10.4 Task Move Across Lists

1. UI triggers `moveTask` command.
2. Command updates local row `list_id`, keeps metadata intact, sets `dirty_fields` accordingly, schedules `move` mutation.
3. Sync engine either performs Google move or fallback create+delete; metadata JSON travels unchanged.

### 10.5 Task Delete

- Set `deleted_at`, `sync_state='pending_delete'`; UI hides task but retains for undo until sync succeeds.

### 10.6 Task Completion Toggle (Status)

- Treated as standard metadata update (`status` field). Ensures due dates/labels unaffected.

### 10.7 Rename / Notes Edit

- Same update path; metadata hash ensures remote merges acknowledge change.

## 11. Conflict Detection & Resolution

### 11.1 Detection Rules

- Conflict identified when:
  - Remote hash changes and local `dirty_fields` is non-empty with overlapping keys.
  - Remote modification timestamp > local `updated_at` and remote hash ≠ `last_remote_hash`.

### 11.2 Resolution Strategy

1. Default rule: **Local wins** for fields listed in `dirty_fields`; remote values stored in `sync_conflicts` table for audit.
2. UI surfaces conflict notification with option to accept remote values per-field.
3. Accepting remote change triggers new `update_task` call with remote metadata.

## 12. Offline & Error Handling

- Commands never fail when offline; they write to DB and enqueue sync.
- Sync queue uses exponential backoff and token refresh when encountering 401.
- Provide CLI/tooling to inspect queue (`tauri::command get_sync_queue_debug`).
- On startup, run `resume_pending_mutations()` to ensure no mutation is stranded.

## 13. Telemetry & Logging

- Emit structured logs for each command (task ID, operation, dirty_fields, hash before/after).
- Sync service logs remote API calls with correlation IDs.
- Capture metrics: pending tasks count, average sync latency, conflict occurrences, retries.
- Emit dedicated conflict-resolution log entries capturing local vs remote hashes and the user’s final choice for traceability.
- Optional: integrate Sentry/Logtail via feature flag for production tracing.

## 14. Testing Strategy

### 14.1 Rust Tests

- Unit tests for serializers, hash generation, command handlers (use in-memory SQLite).
- Integration tests simulating full push/pull cycle with mocked Google API responses (success, 401, 409, partial data).
- Property tests ensuring metadata round-trip no-op (serialize → deserialize → hash unchanged).

### 14.2 TypeScript Tests

- Jest/Vitest tests for store selectors, metadata normalizer, date formatting.
- Component tests verifying UI reflects `sync_state` and `dirty_fields` correctly.

### 14.3 End-to-End Tests

- Playwright/Tauri test harness: create task with metadata, refresh, move across lists, toggle status, ensure metadata persists.
- Offline scenario: simulate network loss, modify task, restore network, verify sync and metadata continuity.

## 15. Migration & Rollout Plan

1. **Phase 0 – Branch Prep**: Create feature branch; freeze current task edits during migration window.
2. **Phase 1 – Schema Migration**: Ship migrations adding new columns/tables; run backfill script.
3. **Phase 2 – Backend Refactor**: Implement new commands, normalizers, sync queue, conflict logic.
4. **Phase 3 – Frontend Refactor**: Update store to use new command signatures and event-driven updates.
5. **Phase 4 – Sync Engine Overhaul**: Deploy queue-based push/pull logic, metadata serialization.
6. **Phase 5 – Instrumentation**: Add logging/metrics, conflict UI surfaces.
7. **Phase 6 – QA & Regression**: Run automated suites + manual scripted QA (100% metadata retention across scenarios).
8. **Phase 7 – Gradual Rollout**: Gate the new sync via account-scoped feature flags, enforce a minimum client version before flipping the flag for any account, monitor logs, and expand to all users once telemetry stays green.

## 16. Risk Mitigation

- **Data Corruption**: Maintain nightly SQLite backups; mutation log allows replay.
- **Migration Failure**: Provide down migrations and preflight check to abort if schema mismatch.
- **Token Expiry**: Auto-refresh tokens; if refresh fails, pause queue and surface UI warning instead of clearing metadata.
- **Performance**: Index dirty queue and metadata hash columns; batch Google calls with exponential backoff.
- **Mixed Client Versions**: Once an account is opted into the new pipeline, reject writes from older app versions (with a clear upgrade prompt) to prevent legacy optimistic flows from clobbering canonical data.

## 17. Deliverables Checklist

- [ ] Migrations applied with backfill verified on staging DB snapshot.
- [ ] Shared metadata normalizer library in Rust + TypeScript.
- [ ] Updated Tauri commands with new payload contracts & tests.
- [ ] Sync queue implementation with worker tests.
- [ ] React store refactor using event-driven updates.
- [ ] UI indicators for sync status & conflicts.
- [ ] Fully fleshed QA test plan and automated suites.
- [ ] Observability dashboards (pending sync count, failure rate, latency).

## 18. Outcome

Adopting this architecture ensures task metadata can be edited, moved, and synced indefinitely without loss. Every interaction flows through the same deterministic pipeline: **SQLite write → dirty-field tracking → queued sync → conflict-safe reconciliation**. The system becomes observable, debuggable, and resilient against network failures, Google API inconsistencies, and application restarts.
