# Task & Sync Refactor Execution Plan

```json
{
  "executable_tasks": [
    {
      "task_id": "tauri-mod-bootstrap",
      "description": "Introduce module scaffolding to split monolithic main.rs into focused command files",
      "target_files": [
        {
          "path": "src-tauri/src/main.rs",
          "line_range": "1-320",
          "function_name": "tauri::Builder::default"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "use tauri::Manager;",
          "replace_with": "mod commands;\nmod services;\nuse tauri::Manager;",
          "line_number": "8"
        },
        {
          "operation": "insert",
          "find_pattern": "tauri::Builder::default()",
          "replace_with": "commands::register(&app_handle);\n        tauri::Builder::default()",
          "line_number": "155"
        },
        {
          "operation": "insert",
          "find_pattern": "fn main()",
          "replace_with": "fn main()",
          "line_number": "120"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check"
      ],
      "success_criteria": "Project compiles with new module declarations resolving and no regressions in command registration",
      "dependencies": [],
      "rollback_procedure": "Revert additions in main.rs and delete newly created module declarations using git checkout -- src-tauri/src/main.rs"
    },
    {
      "task_id": "tauri-command-split",
      "description": "Extract task CRUD-related commands from main.rs into src-tauri/src/commands/tasks.rs",
      "target_files": [
        {
          "path": "src-tauri/src/main.rs",
          "line_range": "320-1180",
          "function_name": "create_task"
        },
        {
          "path": "src-tauri/src/commands/tasks.rs",
          "line_range": "1-600",
          "function_name": "register_task_commands"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "#[tauri::command]\nasync fn create_task\([\s\S]*?Ok\(updated_task\)\n}\n",
          "replace_with": "// moved to commands::tasks::create_task",
          "line_number": "360"
        },
        {
          "operation": "insert",
          "find_pattern": "mod commands;",
          "replace_with": "mod commands;",
          "line_number": "6"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test --package libreollama_desktop --lib task_metadata"
      ],
      "success_criteria": "main.rs no longer defines create/update/delete task commands and tauri::Builder registers new module handlers",
      "dependencies": ["tauri-mod-bootstrap"],
      "rollback_procedure": "git checkout -- src-tauri/src/main.rs src-tauri/src/commands/tasks.rs"
    },
    {
      "task_id": "tauri-lists-oauth",
      "description": "Move list management and OAuth/keyring helpers into dedicated modules",
      "target_files": [
        {
          "path": "src-tauri/src/main.rs",
          "line_range": "1180-2100",
          "function_name": "create_task_list"
        },
        {
          "path": "src-tauri/src/commands/lists.rs",
          "line_range": "1-320",
          "function_name": "register_list_commands"
        },
        {
          "path": "src-tauri/src/commands/oauth.rs",
          "line_range": "1-260",
          "function_name": "get_oauth_tokens"
        }
      ],
      "code_changes": [
        {
          "operation": "delete",
          "find_pattern": "#[tauri::command]\nasync fn create_task_list[\s\S]*?Ok\(record\)\n}\n",
          "replace_with": "",
          "line_number": "1180"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test --package libreollama_desktop --lib oauth"
      ],
      "success_criteria": "OAuth helpers and list management compile from new modules and the command router still registers them",
      "dependencies": ["tauri-command-split"],
      "rollback_procedure": "Revert module files and restore main.rs via git checkout"
    },
    {
      "task_id": "sync-dir-bootstrap",
      "description": "Create sync module directory structure and re-export service entry points",
      "target_files": [
        {
          "path": "src-tauri/src/sync_service.rs",
          "line_range": "1-120",
          "function_name": "pub struct SyncService"
        },
        {
          "path": "src-tauri/src/sync/mod.rs",
          "line_range": "1-80",
          "function_name": "pub use service::SyncService"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "use crate::task_metadata;",
          "replace_with": "pub mod sync;\nuse crate::task_metadata;",
          "line_number": "12"
        }
      ],
      "validation_steps": [
        "mkdir -p src-tauri/src/sync",
        "cargo fmt",
        "cargo check"
      ],
      "success_criteria": "Project compiles with new sync module namespace exporting SyncService",
      "dependencies": [],
      "rollback_procedure": "Remove src-tauri/src/sync directory and restore sync_service.rs via git checkout"
    },
    {
      "task_id": "sync-queue-worker-extract",
      "description": "Move queue processing logic (execute_pending_mutations, process_* operations) into sync/queue_worker.rs with tests",
      "target_files": [
        {
          "path": "src-tauri/src/sync_service.rs",
          "line_range": "320-760",
          "function_name": "execute_pending_mutations"
        },
        {
          "path": "src-tauri/src/sync/queue_worker.rs",
          "line_range": "1-520",
          "function_name": "pub struct QueueWorker"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "async fn execute_pending_mutations[\s\S]*?Ok\(\(\)\)",
          "replace_with": "// queue logic now in sync::queue_worker",
          "line_number": "320"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test sync::queue_worker"
      ],
      "success_criteria": "SyncService delegates queue processing to new QueueWorker with equivalent behavior and tests cover success/failure paths",
      "dependencies": ["sync-dir-bootstrap"],
      "rollback_procedure": "Restore sync_service.rs and delete sync/queue_worker.rs via git checkout"
    },
    {
      "task_id": "sync-google-client-extract",
      "description": "Factor HTTP request helpers into sync/google_client.rs with typed methods",
      "target_files": [
        {
          "path": "src-tauri/src/sync_service.rs",
          "line_range": "760-930",
          "function_name": "create_google_task_with_payload"
        },
        {
          "path": "src-tauri/src/sync/google_client.rs",
          "line_range": "1-260",
          "function_name": "pub struct GoogleTasksClient"
        }
      ],
      "code_changes": [
        {
          "operation": "delete",
          "find_pattern": "async fn create_google_task_with_payload[\s\S]*?Ok\(\(\)\)",
          "replace_with": "",
          "line_number": "760"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test sync::google_client"
      ],
      "success_criteria": "Queue worker consumes GoogleTasksClient abstraction and HTTP errors are surfaced consistently",
      "dependencies": ["sync-queue-worker-extract"],
      "rollback_procedure": "git checkout -- src-tauri/src/sync_service.rs src-tauri/src/sync/google_client.rs"
    },
    {
      "task_id": "sync-reconciler-extract",
      "description": "Isolate poll_google_tasks and reconcile_task logic into sync/reconciler.rs with merge helpers",
      "target_files": [
        {
          "path": "src-tauri/src/sync_service.rs",
          "line_range": "930-1260",
          "function_name": "poll_google_tasks"
        },
        {
          "path": "src-tauri/src/sync/reconciler.rs",
          "line_range": "1-520",
          "function_name": "pub struct Reconciler"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "async fn poll_google_tasks[\s\S]*?Ok\(\(\)\)",
          "replace_with": "// moved to sync::reconciler",
          "line_number": "930"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test sync::reconciler"
      ],
      "success_criteria": "SyncService orchestrates Google poll through Reconciler and metadata fields persist across refresh",
      "dependencies": ["sync-google-client-extract"],
      "rollback_procedure": "Revert sync_service.rs and remove sync/reconciler.rs via git checkout"
    },
    {
      "task_id": "sync-service-thin",
      "description": "Reduce SyncService to scheduling/orchestration; wire QueueWorker and Reconciler together",
      "target_files": [
        {
          "path": "src-tauri/src/sync_service.rs",
          "line_range": "1-160",
          "function_name": "impl SyncService"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "pub struct SyncService \{[\s\S]*?\}",
          "replace_with": "pub struct SyncService {\n    queue_worker: sync::queue_worker::QueueWorker,\n    reconciler: sync::reconciler::Reconciler,\n    scheduler: Scheduler\n}",
          "line_number": "20"
        }
      ],
      "validation_steps": [
        "cargo fmt",
        "cargo check",
        "cargo test sync"
      ],
      "success_criteria": "SyncService owns only orchestration responsibilities and composes modular components",
      "dependencies": ["sync-reconciler-extract"],
      "rollback_procedure": "git checkout src-tauri/src/sync_service.rs and remove new sync modules"
    }
  ],
  "execution_order": [
    "tauri-mod-bootstrap",
    "tauri-command-split",
    "tauri-lists-oauth",
    "sync-dir-bootstrap",
    "sync-queue-worker-extract",
    "sync-google-client-extract",
    "sync-reconciler-extract",
    "sync-service-thin"
  ],
  "critical_warnings": [
    "Ensure DB queries moved into new modules preserve transaction boundaries to avoid deadlocks",
    "Verify Tauri command registration stays in sync with frontend invoke calls to prevent runtime errors",
    "Reconciliation changes can regress metadata retention; add regression tests before deploying"
  ]
}
```
