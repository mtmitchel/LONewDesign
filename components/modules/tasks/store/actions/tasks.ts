import { invoke } from '@tauri-apps/api/core';
import type { Task, TaskList, TaskStoreState, TaskInput, TaskUpdates } from '../core';
import { createId, buildMetadataPayload, deserializeLabels, deserializeSubtasks, serializeSubtasksForBackend, DEFAULT_LABEL_COLOR } from '../helpers';
import { DEFAULT_TASK_LISTS } from '../../constants';
import { emitTaskEvent } from '../events';
import {
  normalizePriority as normalizeMetadataPriority,
  normalizeLabels as normalizeMetadataLabels,
  normalizeDueDate as normalizeMetadataDueDate,
} from '../../../../../lib/metadata';

const DEFAULT_LIST_ID = DEFAULT_TASK_LISTS[0]?.id ?? 'todo';

export function createTaskActions(set: any, get: any) {
  return {
    addTask: async (input: any) => {
      const title = (input.title ?? '').trim();
      const listId = input.listId ?? input.boardListId ?? input.status ?? DEFAULT_LIST_ID;
      const metadata = buildMetadataPayload(input, title);
      const id = createId();

      const createdAtIso = new Date().toISOString();
      const optimisticLabels = metadata.labels.length
        ? metadata.labels
        : (input.labels ?? []).map((label: any) =>
            typeof label === 'string'
              ? { name: label.trim(), color: DEFAULT_LABEL_COLOR }
              : {
                  name: typeof label?.name === 'string' ? label.name.trim() : '',
                  color:
                    typeof label?.color === 'string' && label.color
                      ? label.color
                      : DEFAULT_LABEL_COLOR,
                },
          ).filter((label: any) => label.name);

      const optimisticTask: Task = {
        id,
        title: title || 'Untitled',
        description: undefined,
        status: metadata.status,
        priority: metadata.priority as Task['priority'],
        dueDate: metadata.due_date ?? undefined,
        createdAt: createdAtIso,
        dateCreated: createdAtIso,
        updatedAt: createdAtIso,
        assignee: undefined,
        labels: optimisticLabels,
        listId,
        boardListId: listId,
        notes: metadata.notes?.length ? metadata.notes : undefined,
        isCompleted: metadata.status === 'completed',
        completedAt: metadata.status === 'completed' ? createdAtIso : null,
        subtasks: Array.isArray(input.subtasks) ? input.subtasks : [],
        externalId: undefined,
        pendingSync: true,
        syncState: 'pending',
        lastSyncedAt: undefined,
        syncError: undefined,
        hasConflict: false,
      };

      set((state: TaskStoreState) => {
        state.tasksById[id] = optimisticTask;
        state.taskOrder.unshift(id);
      });

      try {
        const rustTask = await invoke<any>('create_task', {
          task: {
            id,
            list_id: listId,
            title,
            priority: metadata.priority,
            labels: metadata.labels.map((label: any) => ({
              name: label.name,
              color: label.color,
            })),
            due_date: metadata.due_date,
            status: metadata.status,
            time_block: metadata.time_block ?? undefined,
            notes: metadata.notes ?? null,
            subtasks: serializeSubtasksForBackend(input.subtasks ?? []),
          },
        });

        const isCompleted = rustTask.status === 'completed';
        const subtasks = deserializeSubtasks(rustTask.subtasks);

        const canonicalStatus =
          typeof rustTask.status === 'string' && rustTask.status.trim().length > 0
            ? rustTask.status
            : 'needsAction';

        const task: Task = {
          id: rustTask.id,
          title: rustTask.title || 'Untitled',
          description: undefined,
          status: canonicalStatus,
          priority: rustTask.priority as Task['priority'],
          dueDate: rustTask.due_date ?? undefined,
          createdAt: new Date(rustTask.created_at * 1000).toISOString(),
          dateCreated: new Date(rustTask.created_at * 1000).toISOString(),
          updatedAt: new Date(rustTask.updated_at * 1000).toISOString(),
          assignee: undefined,
          labels: deserializeLabels(rustTask.labels),
          listId: rustTask.list_id,
          boardListId: rustTask.list_id,
          notes: rustTask.notes ?? undefined,
          isCompleted,
          completedAt: isCompleted
            ? new Date(rustTask.updated_at * 1000).toISOString()
            : null,
          subtasks,
          externalId: rustTask.google_id,
          pendingSync: ['pending', 'pending_move'].includes(rustTask.sync_state),
          syncState: rustTask.sync_state,
          lastSyncedAt: rustTask.last_synced_at
            ? rustTask.last_synced_at * 1000
            : undefined,
          syncError: rustTask.sync_error,
          hasConflict: rustTask.has_conflict,
        };

        set((state: TaskStoreState) => {
          state.tasksById[id] = task;
        });

        emitTaskEvent('task_created', { source: input.source ?? 'task_store', id: task.id });

        try {
          // Process only the sync queue to avoid UI flickering
          await invoke('process_sync_queue_only');
        } catch (syncError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[taskStore] Immediate sync after create failed', syncError);
          }
          // Fallback to full sync if queue processing fails
          try {
            await get().syncNow();
          } catch {}
        }

        return task;
      } catch (error) {
        console.error('[taskStore] Failed to create task in Rust:', error);
        set((state: TaskStoreState) => {
          const draft = state.tasksById[id];
          if (draft) {
            draft.pendingSync = true;
            draft.syncState = 'error';
            draft.syncError = error instanceof Error ? error.message : String(error);
          }
        });
        return get().tasksById[id];
      }
    },

    updateTask: async (id: string, updates: TaskUpdates) => {
      const existingTask = get().tasksById[id];
      // Persist to Rust backend
      try {
        const payload: Record<string, unknown> = {};
        let shouldTriggerImmediateSync = false;
        let normalizedLabelsForStore: Array<{ name: string; color: string }> | undefined;
        let existingLabelColorMap: Map<string, string> | undefined;

        if (typeof updates.priority !== 'undefined') {
          payload.priority = normalizeMetadataPriority(updates.priority ?? 'none');
        }

        if (typeof updates.labels !== 'undefined') {
          const normalized = normalizeMetadataLabels(
            (Array.isArray(updates.labels) ? updates.labels : []).map((label: any) => {
              if (typeof label === 'string') {
                const name = label.trim();
                return { name, color: DEFAULT_LABEL_COLOR };
              }
              const name = typeof label?.name === 'string' ? label.name.trim() : '';
              const color =
                typeof label?.color === 'string' && label.color
                  ? label.color
                  : DEFAULT_LABEL_COLOR;
              return { name, color };
            }),
          );
          normalizedLabelsForStore = normalized;
          payload.labels = normalized.map((label: any) => ({
            name: label.name,
            color: label.color,
          }));
        }

        if (typeof updates.title !== 'undefined') {
          payload.title = typeof updates.title === 'string'
            ? updates.title.trim()
            : updates.title;
        }

        if (typeof updates.notes !== 'undefined') {
          if (typeof updates.notes === 'string') {
            const trimmed = updates.notes.trim();
            payload.notes = trimmed.length > 0 ? trimmed : null;
          } else {
            payload.notes = updates.notes ?? null;
          }
        }

        if (typeof updates.dueDate !== 'undefined') {
          payload.due_date = normalizeMetadataDueDate(updates.dueDate ?? null);
        }

        if (typeof updates.status === 'string') {
          const trimmedStatus = updates.status.trim();
          if (trimmedStatus.length > 0) {
            payload.status = trimmedStatus;
            shouldTriggerImmediateSync = true;
          }
        }

        if (typeof updates.isCompleted !== 'undefined') {
          payload.status = updates.isCompleted ? 'completed' : 'needsAction';
          shouldTriggerImmediateSync = true;
        }

        if (typeof updates.subtasks !== 'undefined') {
          payload.subtasks = serializeSubtasksForBackend(updates.subtasks);
          shouldTriggerImmediateSync = true;
        }

        if (Object.keys(payload).length > 0) {
          // Apply optimistic updates to store immediately
          set((state: TaskStoreState) => {
            const current = state.tasksById[id];
            if (current) {
              // Apply the updates directly to current task
              if (typeof updates.title !== 'undefined') {
                current.title = updates.title;
              }
              if (typeof updates.status !== 'undefined') {
                current.status = updates.status;
                current.isCompleted = updates.status === 'completed';
              }
              if (typeof updates.isCompleted !== 'undefined') {
                current.isCompleted = updates.isCompleted;
                current.status = updates.isCompleted ? 'completed' : 'needsAction';
              }
              if (typeof updates.priority !== 'undefined') {
                current.priority = updates.priority;
              }
              if (typeof updates.dueDate !== 'undefined') {
                current.dueDate = updates.dueDate;
              }
              if (typeof updates.notes !== 'undefined') {
                current.notes = updates.notes;
              }
              if (typeof updates.subtasks !== 'undefined') {
                current.subtasks = updates.subtasks;
              }
              if (typeof updates.labels !== 'undefined') {
                current.labels = updates.labels;
              }

              // Mark as syncing
              current.updatedAt = new Date().toISOString();
              current.pendingSync = true;
              current.syncState = 'pending';
              current.syncError = null;
            }
          });

          // Process the update in background
          try {
            await invoke<any>('update_task_command', {
              taskId: id,
              updates: payload,
            });
          } catch (error) {
            console.error('[taskStore] Failed to update task in Rust:', error);
            // Mark as error but keep optimistic updates
            set((state: TaskStoreState) => {
              const current = state.tasksById[id];
              if (current) {
                current.pendingSync = true;
                current.syncState = 'error';
                current.syncError = error instanceof Error ? error.message : String(error);
              }
            });
            return;
          }

          if (shouldTriggerImmediateSync) {
            try {
              // Process only the sync queue to avoid UI flickering
              // The optimistic updates are already in the store, no need to fetch
              await invoke('process_sync_queue_only');
            } catch (syncError) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[taskStore] Immediate sync after update failed', syncError);
              }
              // Fallback to full sync if queue processing fails
              try {
                await get().syncNow();
              } catch (fallbackError) {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('[taskStore] Fallback sync also failed', fallbackError);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('[taskStore] Failed to update task in Rust:', error);
      }
    },

    deleteTask: async (id: string) => {
      // Persist to Rust backend
      try {
        await invoke('delete_task', { taskId: id });

        // Optimistic UI update
        set((state: TaskStoreState) => {
          delete state.tasksById[id];
          state.taskOrder = state.taskOrder.filter((taskId) => taskId !== id);
        });

        emitTaskEvent('task_deleted', { id });
      } catch (error) {
        console.error('[taskStore] Failed to delete task in Rust:', error);
      }
    },

    fetchTasks: async () => {
      try {
        const [rustTasks, rustLists] = await Promise.all([
          invoke<any[]>('get_tasks'),
          invoke<any[]>('get_task_lists'),
        ]);

        set((state: TaskStoreState) => {
          const tasksById: Record<string, Task> = {};
          const taskOrder: string[] = [];

          for (const rustTask of rustTasks) {
            const isCompleted = rustTask.status === 'completed';
            const subtasks = deserializeSubtasks(rustTask.subtasks);
            const canonicalStatus =
              typeof rustTask.status === 'string' && rustTask.status.trim().length > 0
                ? rustTask.status
                : 'needsAction';

            const task: Task = {
              id: rustTask.id,
              title: rustTask.title || 'Untitled',
              description: undefined,
              status: canonicalStatus,
              priority: rustTask.priority as Task['priority'],
              dueDate: rustTask.due_date ?? undefined,
              createdAt: new Date(rustTask.created_at * 1000).toISOString(),
              dateCreated: new Date(rustTask.created_at * 1000).toISOString(),
              updatedAt: new Date(rustTask.updated_at * 1000).toISOString(),
              assignee: undefined,
              labels: deserializeLabels(rustTask.labels),
              listId: rustTask.list_id,
              boardListId: rustTask.list_id,
              notes: rustTask.notes ?? undefined,
              isCompleted,
              completedAt: isCompleted
                ? new Date(rustTask.updated_at * 1000).toISOString()
                : null,
              subtasks,
              externalId: rustTask.google_id,
              pendingSync: ['pending', 'pending_move'].includes(rustTask.sync_state),
              syncState: rustTask.sync_state,
              lastSyncedAt: rustTask.last_synced_at
                ? rustTask.last_synced_at * 1000
                : undefined,
              syncError: rustTask.sync_error,
              hasConflict: rustTask.has_conflict,
            };
            tasksById[task.id] = task;
            taskOrder.push(task.id);
          }

          state.tasksById = tasksById;
          state.taskOrder = taskOrder;

          // Store task lists
          const listsById: Record<string, TaskList> = {};
          const listOrder: string[] = [];

          for (const rustList of rustLists) {
            const list: TaskList = {
              id: rustList.id,
              name: rustList.title,
              color: undefined,
              isVisible: true,
              source: 'google',
            };
            listsById[list.id] = list;
            listOrder.push(list.id);
          }

          state.listsById = listsById;
          state.listOrder = listOrder;
        });
      } catch (error) {
        console.error('[taskStore] Failed to fetch tasks from Rust:', error);
      }
    },

    toggleTaskCompletion: (id: string) => {
      const task = get().tasksById[id];
      if (!task) return;

      const nextCompleted = !task.isCompleted;
      const completedAt = nextCompleted ? new Date().toISOString() : null;

      set((state: TaskStoreState) => {
        const draft = state.tasksById[id];
        if (!draft) return;
        draft.isCompleted = nextCompleted;
        draft.completedAt = completedAt;
        draft.status = nextCompleted ? 'completed' : 'needsAction';
        draft.pendingSync = true;
        draft.syncState = 'pending';
        draft.syncError = null;
      });

      void get().updateTask(id, {
        isCompleted: nextCompleted,
        completedAt,
      });

      emitTaskEvent(nextCompleted ? 'task_completed' : 'task_reopened', { id });
    },

    duplicateTask: async (id: string) => {
      const task = get().tasksById[id];
      if (!task) return null;
      return await get().addTask({
        title: `${task.title} (Copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        labels: task.labels,
        listId: task.listId,
        boardListId: task.boardListId,
        notes: task.notes,
        checklist: task.checklist,
        subtasks: task.subtasks,
        isCompleted: false,
        projectId: task.projectId,
        source: 'task_duplicate',
      });
    },

    moveTask: async (id: string, toListId: string) => {
      const task = get().tasksById[id];
      if (!task) return;

      const sourceListId = task.listId;
      if (sourceListId === toListId) {
        return;
      }

      const taskBackup = { ...task };

      set((state: TaskStoreState) => {
        const draft = state.tasksById[id];
        if (draft) {
          draft.listId = toListId;
          draft.boardListId = toListId;
        }
      });

      try {
        await invoke('queue_move_task', {
          input: {
            task_id: id,
            to_list_id: toListId,
          },
        });

        set((state: TaskStoreState) => {
          const draft = state.tasksById[id];
          if (!draft) return;
          draft.pendingSync = true;
          draft.syncState = 'pending_move';
        });

        emitTaskEvent('task_move_queued', { from: sourceListId, to: toListId, id });
      } catch (error) {
        set((state: TaskStoreState) => {
          if (state.tasksById[id]) {
            state.tasksById[id] = taskBackup;
          } else {
            state.tasksById[id] = taskBackup;
            state.taskOrder = state.taskOrder.includes(id)
              ? state.taskOrder
              : [id, ...state.taskOrder];
          }
        });
        console.error('[taskStore] Failed to queue fallback move:', error);
        throw error;
      }
    },

    setTaskDueDate: (id: string, dueDate: string | undefined) => {
      get().updateTask(id, { dueDate });
      emitTaskEvent('task_due_changed', { id, dueDate });
    },
  };
}