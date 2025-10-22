# Subtask Preservation During Task Moves - Implementation Plan

## Problem Statement

**Critical Data Loss Bug**: Moving a task between Google Tasks lists permanently deletes all subtasks.

### Root Cause
Google Tasks API requires DELETE from source list + CREATE in destination list for cross-list moves. Deleting the parent task cascades to delete all subtasks. The sync queue worker's move operation does not recreate subtasks.

### User Impact
1. User creates task with 2 subtasks → syncs successfully
2. User moves task from List A to List B → subtasks preserved locally
3. Sync cycle runs → **subtasks permanently deleted from both local and remote**

---

## Current Implementation Status (2025-10-22)

### ✅ Basic Fix Applied
- Added subtask loading after parent task creation
- Loop to recreate each subtask in Google Tasks
- Update local task_subtasks table with new google_id and parent_google_id

```rust
// Load all subtasks for this task and recreate them in the new list
let existing_subtasks: Vec<TaskSubtaskRecord> = sqlx::query_as(
    "SELECT id, task_id, google_id, parent_google_id, title, is_completed, position, due_date FROM task_subtasks WHERE task_id = ?"
)
.bind(&task.id)
.fetch_all(db_pool)
.await?;

// Recreate each subtask in the new list with the new parent google_id
for subtask_record in existing_subtasks {
    let metadata = record_to_metadata(&subtask_record);
    let google_payload = metadata.normalize().to_google_payload();
    
    let new_subtask_google_id = google_client::create_google_subtask(
        http_client, access_token, &to_list_id, &new_google_id, google_payload
    ).await?;
    
    sqlx::query("UPDATE task_subtasks SET google_id = ?, parent_google_id = ? WHERE id = ?")
        .bind(&new_subtask_google_id).bind(&new_google_id).bind(&subtask_record.id)
        .execute(db_pool).await?;
}
```

### ⚠️ Critical Gaps (Verified by Perplexity Research)

#### 1. **No Transaction Boundaries** (Priority: HIGH)
**Problem**: Operations are not atomic. Partial failures leave inconsistent state.

**Failure Scenarios**:
- Parent created in dest, source delete fails → duplicate tasks
- Parent moved, subtask creation fails → orphaned parent without subtasks
- Subtask creation fails midway → partial subtasks in Google, incomplete local records

**Solution**: Wrap entire operation in `sqlx::Transaction`
```rust
async fn process_move_operation(
    db_pool: &SqlitePool,
    http_client: &Client,
    access_token: &str,
    entry: &SyncQueueEntry,
) -> Result<(), String> {
    let mut tx = db_pool.begin().await.map_err(|e| e.to_string())?;
    
    // All operations here...
    
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}
```

#### 2. **No Compensating Actions** (Priority: HIGH)
**Problem**: If subtask creation fails after parent is created, the parent task and any successfully created subtasks remain in Google Tasks as orphans.

**Solution**: Implement saga pattern with rollback
```rust
let mut created_subtask_ids = Vec::new();

for subtask_record in existing_subtasks {
    match create_google_subtask(...).await {
        Ok(id) => created_subtask_ids.push(id),
        Err(e) => {
            // Rollback: delete all successfully created subtasks
            for subtask_id in created_subtask_ids.iter().rev() {
                let _ = google_client::delete_google_subtask(
                    http_client, access_token, &to_list_id, subtask_id
                ).await;
            }
            // Delete the new parent task
            let _ = google_client::delete_google_task(
                http_client, access_token, &to_list_id, &new_google_id
            ).await;
            // Rollback database transaction
            return Err(e);
        }
    }
}
```

#### 3. **Position/Ordering Not Preserved** (Priority: MEDIUM)
**Problem**: Subtasks recreated without position information may appear in wrong order.

**Google Tasks Behavior**:
- Uses `position` field (string) for lexicographical ordering
- `previous` parameter in insert/move specifies preceding sibling
- Omitting `previous` places task at first position

**Solution**: Sequential recreation with position tracking
```rust
// Order by position to maintain sequence
let existing_subtasks: Vec<TaskSubtaskRecord> = sqlx::query_as(
    "SELECT ... FROM task_subtasks WHERE task_id = ? ORDER BY position ASC"
)
.bind(&task.id)
.fetch_all(&mut *tx)
.await?;

let mut previous_subtask_id: Option<String> = None;

for subtask_record in existing_subtasks {
    let metadata = record_to_metadata(&subtask_record);
    let google_payload = metadata.normalize().to_google_payload();
    
    // Create with position: first subtask has no 'previous', rest specify predecessor
    let new_subtask_google_id = if let Some(prev_id) = &previous_subtask_id {
        google_client::create_google_subtask_with_position(
            http_client, access_token, &to_list_id, &new_google_id, 
            google_payload, Some(prev_id)
        ).await?
    } else {
        google_client::create_google_subtask(
            http_client, access_token, &to_list_id, &new_google_id, google_payload
        ).await?
    };
    
    previous_subtask_id = Some(new_subtask_google_id.clone());
    // ... update local record ...
}
```

**Note**: Requires adding `create_google_subtask_with_position` to google_client.rs

#### 4. **No Idempotency Protection** (Priority: MEDIUM)
**Problem**: Network timeouts during subtask creation could create duplicates on retry.

**Solution**: Deterministic idempotency tokens
```rust
// Generate idempotency key from subtask local ID
fn generate_idempotency_key(task_id: &str, subtask_id: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(format!("{}:{}", task_id, subtask_id));
    format!("subtask-move-{:x}", hasher.finalize())
}

// Include in API request headers
let idempotency_key = generate_idempotency_key(&entry.task_id, &subtask_record.id);
// Google Tasks API should recognize duplicate requests with same key
```

**Note**: Verify Google Tasks API supports idempotency keys in header

#### 5. **No Concurrency Control** (Priority: MEDIUM)
**Problem**: Multiple sync operations could process same task simultaneously, causing conflicts.

**Solution Options**:
1. **Queue-level**: Assign same-task operations to same queue partition
2. **Lock-based**: Distributed lock service (Redis, etc.)
3. **Optimistic**: Version numbers in task_metadata, check before commit

```rust
// Optimistic concurrency control
let task_version: i64 = sqlx::query_scalar(
    "SELECT version FROM tasks_metadata WHERE id = ?"
)
.bind(&entry.task_id)
.fetch_one(&mut *tx)
.await?;

// ... perform all operations ...

// Commit only if version unchanged
let updated = sqlx::query(
    "UPDATE tasks_metadata SET ... , version = version + 1 WHERE id = ? AND version = ?"
)
.bind(&entry.task_id)
.bind(task_version)
.execute(&mut *tx)
.await?;

if updated.rows_affected() == 0 {
    return Err("Task was modified by another operation".to_string());
}
```

#### 6. **Missing Metadata Preservation**
**Fields to verify**:
- ✅ title - included in to_google_payload()
- ✅ is_completed - included in to_google_payload()
- ❓ due_date - verify included in to_google_payload()
- ❓ notes - verify included in to_google_payload()
- ✅ position - handled by sequential creation with 'previous'

**Action**: Audit `SubtaskMetadata::to_google_payload()` to ensure all fields included

---

## 🚨 CRITICAL DESIGN FLAWS IDENTIFIED (Perplexity Research 2025-10-22)

### Summary of Issues

The initial implementation has **7 critical flaws** that could cause data loss, deadlocks, and performance issues:

#### 1. **Transaction Anti-Pattern** ❌ BLOCKING ISSUE
**Problem**: Holding database transaction open during external API calls is a documented anti-pattern.

- Database locks held for potentially **29+ seconds** while waiting for HTTP responses
- Connection pool exhaustion with concurrent operations
- SQLite exclusive write lock blocks ALL other operations

**Impact**: System-wide deadlocks, timeout cascades, unusable sync queue

**Root Cause**: Cannot mix database transactions with external API calls in single atomic unit

**Required Fix**: Separate transaction boundaries - use saga orchestration pattern instead

#### 2. **Unreliable Rollback** ❌ DATA LOSS RISK
**Problem**: Compensating deletes use `let _ =` which ignores failures.

```rust
Err(e) => {
    let _ = google_client::delete_google_subtask(...).await; // ❌ Failure ignored!
    tx.rollback().await?; // DB rolled back, Google state uncertain
}
```

**Impact**: Orphaned tasks/subtasks remain in Google Tasks after "rollback"

**Required Fix**: Async compensating jobs with retry logic, stored in database

#### 3. **No Idempotency Protection** ❌ DUPLICATE DATA RISK
**Problem**: Google Tasks API does NOT support idempotency keys.

**Impact**: Network timeouts create duplicate tasks/subtasks on retry

**Required Fix**: Application-level deduplication via `operation_idempotency` table

#### 4. **Insufficient Concurrency Control** ❌ RACE CONDITIONS
**Problem**: Version-based optimistic locking only tracks local DB, not Google API state.

**Race Condition Example**:
```
Client A: Read task (v=1) → Delete from Google → CREATE in Google
Client B: Read task (v=1) → Delete from Google → CREATE in Google  
Client A: Commit (v=2) ✓
Client B: Commit fails (v=2 != 1) ✗
// But Client B's Google API calls already executed!
```

**Impact**: Duplicate tasks created in Google, inconsistent state

**Required Fix**: Distributed advisory locks OR saga orchestration with single-operation guarantee

#### 5. **Permanent Data Loss on DELETE Failure** ❌ CRITICAL
**Problem**: If DELETE succeeds but CREATE fails, task is permanently deleted (Google Tasks has no undelete).

**Impact**: User loses all task data with no recovery option

**Required Fix**: Export task backup BEFORE deletion, restore on CREATE failure

#### 6. **No Partial Failure Recovery** ❌ USER IMPACT
**Problem**: Creating 100 subtasks sequentially - if #51 fails, entire operation fails with no resume.

**Impact**: User waits minutes for operation, then has to retry from scratch

**Required Fix**: Resumable saga with progress tracking in `saga_subtask_progress` table

#### 7. **Poor Performance** ❌ USABILITY ISSUE
**Problem**: 100 sequential API calls takes 100+ seconds, blocks sync queue.

**Impact**: Sync appears frozen, user thinks app is broken

**Required Fix**: Async background jobs with progress UI, or chunked parallel creation

---

## Revised Architecture: Saga Orchestration Pattern

Based on Perplexity research, the **only safe approach** is saga orchestration with explicit state machine:

### Key Changes

1. **Separate read/API/write transactions** - No locks held during HTTP calls
2. **Persistent saga state** - Every step recorded in `saga_logs` table before execution
3. **Async compensating jobs** - Rollback runs in background with retries
4. **Application-level idempotency** - Track completed operations in DB
5. **Backup-before-delete** - Export task data for recovery
6. **Resumable operations** - Can retry from last successful step
7. **Background processing** - Move operations don't block sync queue

### Required Database Schema

```sql
-- Saga orchestration state
CREATE TABLE saga_logs (
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

-- Idempotency tracking
CREATE TABLE operation_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    operation_type TEXT NOT NULL,
    request_params TEXT NOT NULL, -- JSON
    response_data TEXT, -- JSON
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    expires_at INTEGER NOT NULL
);

-- Task backups for rollback
CREATE TABLE task_backups (
    saga_id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    backup_data TEXT NOT NULL, -- JSON
    created_at INTEGER NOT NULL,
    FOREIGN KEY (saga_id) REFERENCES saga_logs(id)
);

-- Distributed locking
CREATE TABLE operation_locks (
    lock_key TEXT PRIMARY KEY,
    acquired_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Progress tracking for resumability
CREATE TABLE saga_subtask_progress (
    saga_id TEXT NOT NULL,
    old_subtask_id TEXT NOT NULL,
    new_subtask_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (saga_id, old_subtask_id),
    FOREIGN KEY (saga_id) REFERENCES saga_logs(id)
);
```

### Saga State Machine

```rust
#[derive(Debug, Serialize, Deserialize)]
enum TaskMoveSaga {
    Initialized {
        task_id: String,
        from_list: String,
        to_list: String,
    },
    TaskExported {
        task_backup: TaskBackup,
        subtask_backups: Vec<SubtaskBackup>,
    },
    SourceDeleted {
        old_google_id: String,
    },
    DestinationCreated {
        new_google_id: String,
    },
    SubtasksCreated {
        subtask_mapping: HashMap<String, String>, // old_id -> new_id
    },
    DatabaseUpdated,
    Completed,
    
    // Compensating states
    Compensating,
    Compensated,
    Failed { error: String },
}
```

Each state transition is **persisted to `saga_logs` BEFORE execution**, allowing resume on failure.

---

## Implementation Phases

### Phase 1: Transaction Safety (1-2 days) - HIGH PRIORITY
- [ ] Wrap process_move_operation in sqlx::Transaction
- [ ] Add compensating delete actions for rollback
- [ ] Test failure scenarios (network timeout, API error mid-operation)
- [ ] Verify no orphaned tasks/subtasks remain after failures

### Phase 2: Position Preservation (1 day) - MEDIUM PRIORITY  
- [ ] Add ORDER BY position to subtask query
- [ ] Implement sequential creation with previous tracking
- [ ] Add create_google_subtask_with_position to google_client.rs
- [ ] Test subtask order preservation after moves

### Phase 3: Idempotency & Concurrency (2 days) - MEDIUM PRIORITY
- [ ] Implement idempotency key generation
- [ ] Add version column to tasks_metadata table (migration)
- [ ] Implement optimistic concurrency check
- [ ] Test retry scenarios and concurrent operations

### Phase 4: Edge Cases & Hardening (1 day) - LOW PRIORITY
- [ ] Add constraint checks (recurring tasks cannot move between lists)
- [ ] Handle metadata size limits (notes field max length)
- [ ] Add comprehensive logging for debugging
- [ ] Add metrics/telemetry for monitoring

---

## Testing Strategy

### Unit Tests
- [ ] Transaction rollback on parent creation failure
- [ ] Transaction rollback on subtask creation failure (midway)
- [ ] Compensating deletes executed correctly
- [ ] Position ordering maintained after move
- [ ] Idempotency key generation deterministic

### Integration Tests  
- [ ] Full move operation succeeds with 5 subtasks
- [ ] Move fails gracefully on network timeout
- [ ] Move fails gracefully on API error
- [ ] Concurrent moves on same task handled correctly
- [ ] Retry after failure completes successfully

### Manual Testing
- [ ] Create task with subtasks, move between lists, verify order preserved
- [ ] Force network failure during move, verify rollback
- [ ] Move task while another sync operation in progress

---

## Rollout Plan

1. **Code Review**: Senior engineer review of transaction and rollback logic
2. **Staging Deploy**: Test on staging with real Google Tasks account
3. **Canary Release**: Enable for 5% of users, monitor error rates
4. **Full Rollout**: Enable for all users if metrics healthy
5. **Monitoring**: Track move operation success rate, subtask preservation rate

---

## Metrics to Track

- `task_move.operation_duration_ms` - P50, P95, P99 latency
- `task_move.success_rate` - Percentage of successful moves
- `task_move.subtask_preservation_rate` - Subtasks recreated / subtasks expected
- `task_move.rollback_count` - Number of compensating rollbacks triggered
- `task_move.retry_count` - Number of retry attempts after failures

---

## Known Constraints from Google Tasks API

1. **Recurring tasks cannot move between lists** - Must check and block
2. **Assigned tasks cannot have subtasks** - Verify before allowing parent task moves
3. **Max 2,000 subtasks per task** - Validate before recreation loop
4. **Position uses lexicographical ordering** - String-based, not numeric

---

## References

- Google Tasks API: https://developers.google.com/workspace/tasks/reference/rest/v1/tasks
- Perplexity Deep Research: Verified 2025-10-22
- Original Bug Report: User report (subtasks lost during move)
- Fix Implementation: src-tauri/src/sync/queue_worker.rs:260-390
