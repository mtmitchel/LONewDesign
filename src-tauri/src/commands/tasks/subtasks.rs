use crate::commands::tasks::types::{SubtaskDiff, TaskSubtask, TaskSubtaskRow};
use serde_json;
use sqlx::{QueryBuilder, Sqlite, SqlitePool, Transaction};
use std::collections::HashMap;
use uuid::Uuid;

// #region Subtask queue helpers
pub async fn enqueue_subtask_operations(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    list_id: &str,
    diff: &SubtaskDiff,
    now: i64,
) -> Result<(), String> {
    if diff.has_changes() {
        println!(
            "[subtask_sync] enqueue diff for task {} (created={}, updated={}, deleted={})",
            task_id,
            diff.created.len(),
            diff.updated.len(),
            diff.deleted.len()
        );
    }

    for metadata in &diff.created {
        if metadata.parent_google_id.is_none() {
            println!(
                "[subtask_sync] deferring create for subtask {} (missing parent google id)",
                metadata.id
            );
            mark_subtask_waiting(tx, &metadata.id, now).await?;
            continue;
        }

        let payload = serde_json::json!({
            "task_id": task_id,
            "list_id": list_id,
            "subtask_id": metadata.id,
            "google_id": metadata.google_id,
            "parent_google_id": metadata.parent_google_id,
            "google_payload": metadata.to_google_payload(),
        });

        println!(
            "[subtask_sync] enqueue subtask_create for {} under parent {:?}",
            metadata.id, metadata.parent_google_id
        );
        enqueue_subtask_queue_entry(tx, task_id, "subtask_create", payload, now).await?;
    }

    for metadata in &diff.updated {
        if metadata.parent_google_id.is_none() {
            println!(
                "[subtask_sync] deferring update for subtask {} (missing parent google id)",
                metadata.id
            );
            mark_subtask_waiting(tx, &metadata.id, now).await?;
            continue;
        }

        let payload = serde_json::json!({
            "task_id": task_id,
            "list_id": list_id,
            "subtask_id": metadata.id,
            "google_id": metadata.google_id,
            "parent_google_id": metadata.parent_google_id,
            "google_payload": metadata.to_google_payload(),
        });

        println!(
            "[subtask_sync] enqueue subtask_update for {} (google_id={:?})",
            metadata.id, metadata.google_id
        );
        enqueue_subtask_queue_entry(tx, task_id, "subtask_update", payload, now).await?;
    }

    for row in &diff.deleted {
        if let Some(google_id) = &row.google_id {
            let payload = serde_json::json!({
                "task_id": task_id,
                "list_id": list_id,
                "subtask_id": row.id,
                "google_id": google_id,
            });

            println!(
                "[subtask_sync] enqueue subtask_delete for {} (google_id={})",
                row.id, google_id
            );
            enqueue_subtask_queue_entry(tx, task_id, "subtask_delete", payload, now).await?;
        }
    }

    Ok(())
}

async fn enqueue_subtask_queue_entry(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    operation: &str,
    payload: serde_json::Value,
    now: i64,
) -> Result<(), String> {
    let sync_queue_id = Uuid::new_v4().to_string();
    let payload_json = serde_json::to_string(&payload)
        .map_err(|e| format!("Failed to serialize subtask queue payload: {}", e))?;

    sqlx::query(
        "INSERT INTO sync_queue (id, task_id, operation, payload, scheduled_at, created_at, status, attempts) \
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)",
    )
    .bind(&sync_queue_id)
    .bind(task_id)
    .bind(operation)
    .bind(&payload_json)
    .bind(now)
    .bind(now)
    .execute(tx.as_mut())
    .await
    .map_err(|e| format!("Failed to enqueue subtask operation '{}': {}", operation, e))?;

    Ok(())
}

async fn mark_subtask_waiting(
    tx: &mut Transaction<'_, Sqlite>,
    subtask_id: &str,
    now: i64,
) -> Result<(), String> {
    println!(
        "[subtask_sync] marking subtask {} as pending parent google id",
        subtask_id
    );
    sqlx::query(
        "UPDATE task_subtasks SET sync_state = 'pending_parent', updated_at = ? WHERE id = ?",
    )
    .bind(now)
    .bind(subtask_id)
    .execute(tx.as_mut())
    .await
    .map_err(|e| {
        format!(
            "Failed to mark subtask {} as waiting for parent: {}",
            subtask_id, e
        )
    })?;

    Ok(())
}
// #endregion Subtask queue helpers

// #region Subtask operations
pub async fn replace_subtasks(
    tx: &mut Transaction<'_, Sqlite>,
    task_id: &str,
    subtasks: &[crate::commands::tasks::types::SubtaskInput],
    now: i64,
) -> Result<SubtaskDiff, String> {
    

    let existing_rows: Vec<TaskSubtaskRow> = sqlx::query_as(
        "SELECT id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at FROM task_subtasks WHERE task_id = ?",
    )
    .bind(task_id)
    .fetch_all(tx.as_mut())
    .await
    .map_err(|e| format!("Failed to load existing subtasks for {}: {}", task_id, e))?;

    let existing_map: HashMap<String, TaskSubtaskRow> = existing_rows
        .into_iter()
        .map(|row| (row.id.clone(), row))
        .collect();

    let parent_google_id_global: Option<String> =
        sqlx::query_scalar("SELECT google_id FROM tasks_metadata WHERE id = ?")
            .bind(task_id)
            .fetch_optional(tx.as_mut())
            .await
            .map_err(|e| format!("Failed to load parent google id for {}: {}", task_id, e))?;

    let mut diff = SubtaskDiff::default();
    let mut seen_ids = std::collections::HashSet::new();

    for (index, input) in subtasks.iter().enumerate() {
        let trimmed_title = input.title.trim();
        if trimmed_title.is_empty() {
            continue;
        }

        let subtask_id = input
            .id
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
            .map(|value| value.to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let position = input.position.unwrap_or(index as i64);
        let metadata = crate::task_metadata::SubtaskMetadata {
            id: subtask_id.clone(),
            task_id: task_id.to_string(),
            google_id: input.google_id.clone(),
            parent_google_id: input
                .parent_google_id
                .clone()
                .or_else(|| parent_google_id_global.clone()),
            title: trimmed_title.to_string(),
            is_completed: input.is_completed,
            due_date: input.due_date.clone(),
            position,
        };

        let normalized = metadata.normalize();
        let metadata_hash = normalized.compute_hash();
        let mut dirty_fields: Vec<&str> = Vec::new();

        let mut google_id = normalized.google_id.clone();
        let mut parent_google_id = normalized
            .parent_google_id
            .clone()
            .or_else(|| parent_google_id_global.clone());

        println!(
            "[subtask_sync] evaluating subtask {} (existing={}, parent_google_id={:?}, google_id={:?})",
            subtask_id,
            existing_map.contains_key(&subtask_id),
            parent_google_id,
            google_id
        );

        if let Some(existing) = existing_map.get(&subtask_id) {
            seen_ids.insert(subtask_id.clone());

            if existing.title != normalized.title {
                dirty_fields.push("title");
            }
            if (existing.is_completed != 0) != normalized.is_completed {
                dirty_fields.push("status");
            }
            if existing.due_date != normalized.due_date {
                dirty_fields.push("due_date");
            }
            if existing.position != normalized.position {
                dirty_fields.push("position");
            }
            if existing.parent_google_id != normalized.parent_google_id {
                dirty_fields.push("parent_google_id");
            }
            if existing.google_id.is_none() && normalized.google_id.is_some() {
                dirty_fields.push("google_id");
            }

            let sync_state = if !dirty_fields.is_empty()
                || existing.metadata_hash.as_deref() != Some(&metadata_hash)
            {
                "pending".to_string()
            } else {
                existing.sync_state.clone()
            };

            if google_id.is_none() {
                google_id = existing.google_id.clone();
            }
            if parent_google_id.is_none() {
                parent_google_id = existing
                    .parent_google_id
                    .clone()
                    .or_else(|| parent_google_id_global.clone());
            }

            let dirty_fields_json =
                serde_json::to_string(&dirty_fields).unwrap_or_else(|_| "[]".to_string());

            sqlx::query(
                "UPDATE task_subtasks SET google_id = ?, parent_google_id = ?, title = ?, is_completed = ?, position = ?, due_date = ?, metadata_hash = ?, dirty_fields = ?, sync_state = ?, updated_at = ? WHERE id = ?",
            )
            .bind(&google_id)
            .bind(&parent_google_id)
            .bind(&normalized.title)
            .bind(if normalized.is_completed { 1 } else { 0 })
            .bind(normalized.position)
            .bind(&normalized.due_date)
            .bind(&metadata_hash)
            .bind(&dirty_fields_json)
            .bind(&sync_state)
            .bind(now)
            .bind(&subtask_id)
            .execute(tx.as_mut())
            .await
            .map_err(|e| format!("Failed updating subtask {}: {}", subtask_id, e))?;

            if sync_state == "pending" {
                println!(
                    "[subtask_sync] subtask {} marked for update with dirty fields {:?}",
                    subtask_id, dirty_fields
                );
                diff.updated.push(crate::task_metadata::SubtaskMetadata {
                    google_id,
                    parent_google_id,
                    ..normalized
                });
            }
        } else {
            seen_ids.insert(subtask_id.clone());
            let dirty_fields_json =
                serde_json::to_string(&["title", "status", "due_date", "position"]).unwrap();

            sqlx::query("INSERT INTO task_subtasks (id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)")
                .bind(&subtask_id)
                .bind(task_id)
                .bind(&normalized.google_id)
                .bind(&parent_google_id)
                .bind(&normalized.title)
                .bind(if normalized.is_completed { 1 } else { 0 })
                .bind(normalized.position)
                .bind(&normalized.due_date)
                .bind(&metadata_hash)
                .bind(&dirty_fields_json)
                .bind(now)
                .bind(now)
                .execute(tx.as_mut())
                .await
                .map_err(|e| format!("Failed inserting subtask for {}: {}", task_id, e))?;

            println!(
                "[subtask_sync] subtask {} recorded as new (parent_google_id={:?})",
                subtask_id, parent_google_id
            );
            diff.created.push(crate::task_metadata::SubtaskMetadata {
                google_id: normalized.google_id.clone(),
                parent_google_id: parent_google_id.clone(),
                ..normalized
            });
        }
    }

    for (subtask_id, row) in existing_map.into_iter() {
        if !seen_ids.contains(&subtask_id) {
            sqlx::query("UPDATE task_subtasks SET sync_state = 'pending_delete', dirty_fields = '[]', updated_at = ? WHERE id = ?")
                .bind(now)
                .bind(&subtask_id)
                .execute(tx.as_mut())
                .await
                .map_err(|e| format!("Failed marking subtask {} for deletion: {}", subtask_id, e))?;
            diff.deleted.push(row);
            println!(
                "[subtask_sync] subtask {} flagged for deletion (no longer present)",
                subtask_id
            );
        }
    }

    Ok(diff)
}

pub async fn fetch_subtasks_for_tasks(
    pool: &SqlitePool,
    task_ids: &[String],
) -> Result<HashMap<String, Vec<TaskSubtask>>, String> {
    if task_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let mut builder = QueryBuilder::<Sqlite>::new(
        "SELECT id, task_id, google_id, parent_google_id, title, is_completed, position, due_date, metadata_hash, dirty_fields, sync_state, sync_error, last_synced_at FROM task_subtasks WHERE task_id IN (",
    );
    {
        let mut separated = builder.separated(", ");
        for task_id in task_ids {
            separated.push_bind(task_id);
        }
    }
    builder.push(") ORDER BY task_id, position, created_at");

    let rows: Vec<TaskSubtaskRow> = builder
        .build_query_as()
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Failed to fetch subtasks: {}", e))?;

    let mut map: HashMap<String, Vec<TaskSubtask>> = HashMap::new();
    for row in rows {
        let dirty_fields: Vec<String> = serde_json::from_str(&row.dirty_fields).unwrap_or_default();

        map.entry(row.task_id.clone())
            .or_default()
            .push(TaskSubtask {
                id: row.id,
                google_id: row.google_id,
                parent_google_id: row.parent_google_id,
                title: row.title,
                is_completed: row.is_completed != 0,
                position: row.position,
                due_date: row.due_date,
                metadata_hash: row.metadata_hash,
                dirty_fields,
                sync_state: row.sync_state,
                sync_error: row.sync_error,
                last_synced_at: row.last_synced_at,
            });
    }

    Ok(map)
}
// #endregion Subtask operations