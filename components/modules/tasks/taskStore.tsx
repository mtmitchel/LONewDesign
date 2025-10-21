"use client";

import React from 'react';
import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';

import {
  Task,
  TaskList,
  TaskSyncState,
} from './types';
import { DEFAULT_TASK_LISTS } from './constants';
import { invoke } from '@tauri-apps/api/core';
import {
  normalizePriority as normalizeMetadataPriority,
  normalizeLabels as normalizeMetadataLabels,
  normalizeDueDate as normalizeMetadataDueDate,
  type TaskMetadata as SharedTaskMetadata,
} from '../../../lib/metadata';

type TaskSourceMeta = {
  source?: string;
};

type SubtaskItem = NonNullable<Task['subtasks']>[number];

export type TaskInput = Partial<
  Omit<
    Task,
    | 'id'
    | 'createdAt'
    | 'dateCreated'
    | 'updatedAt'
    | 'labels'
    | 'checklist'
    | 'isPinned'
    | 'pendingSync'
    | 'clientMutationId'
    | 'syncState'
    | 'lastSyncedAt'
    | 'syncError'
  >
> & {
  title: string;
  listId?: string;
  labels?: Task['labels'];
  checklist?: Task['checklist'];
  isPinned?: boolean;
} &
  TaskSourceMeta;

export type TaskUpdates = Partial<
  Omit<
    Task,
    | 'id'
    | 'createdAt'
    | 'dateCreated'
    | 'clientMutationId'
    | 'pendingSync'
    | 'syncState'
    | 'lastSyncedAt'
    | 'syncError'
  >
>;

type TaskStoreState = {
  // Entities + status
  // Entities + status

  tasksById: Record<string, Task>;
  taskOrder: string[];
  listsById: Record<string, TaskList>;
  listOrder: string[];
  syncStatus: TaskSyncState;
  syncError?: string | null;
  lastSyncAt?: number;
  addTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, updates: TaskUpdates) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchTasks: () => Promise<void>;
  toggleTaskCompletion: (id: string) => void;
  duplicateTask: (id: string) => Promise<Task | null>;
  moveTask: (id: string, toListId: string) => Promise<void>;
  setTaskDueDate: (id: string, dueDate: string | undefined) => void;
  reconcileLists: (lists: TaskList[], opts?: { replace?: boolean }) => void;
  // List lifecycle + manual sync
  createTaskList: (title: string) => Promise<TaskList>;
  deleteTaskList: (id: string, reassignTo?: string) => Promise<void>;
  syncNow: () => Promise<void>;
  setSyncStatus: (status: TaskSyncState, error?: string | null) => void;
};

function createId(prefix = 'task') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function hydrateDefaultLists(): { listsById: Record<string, TaskList>; listOrder: string[] } {
  const listsById: Record<string, TaskList> = {};
  const listOrder: string[] = [];
  DEFAULT_TASK_LISTS.forEach((list) => {
    listsById[list.id] = list;
    listOrder.push(list.id);
  });
  return { listsById, listOrder };
}

function deserializeLabels(raw: unknown): Task['labels'] {
  if (raw == null) return [];
  let current: unknown = raw;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        break;
      }
    }
    break;
  }

  if (!Array.isArray(current)) return [];

  const entries = current as Task['labels'];

  return entries
    .map((label) => {
      if (typeof label === 'string') {
        const name = label.trim();
        return name ? { name, color: DEFAULT_LABEL_COLOR } : null;
      }
      if (label && typeof label === 'object' && 'name' in label) {
        const rawName = (label as { name?: string }).name;
        const nameValue = typeof rawName === 'string' ? rawName.trim() : '';
        if (!nameValue) return null;
        const rawColor = (label as { color?: string }).color;
        const colorValue = typeof rawColor === 'string' && rawColor.trim().length > 0
          ? rawColor
          : DEFAULT_LABEL_COLOR;
        return { name: nameValue, color: colorValue };
      }
      return null;
    })
    .filter((entry): entry is { name: string; color: string } => entry !== null);
}

function buildLabelColorMapFromLabels(labels: Task['labels'] | undefined) {
  const map = new Map<string, string>();
  if (!labels) {
    return map;
  }

  labels.forEach((label) => {
    if (typeof label === 'string') {
      const name = label.trim();
      if (name) {
        map.set(name.toLowerCase(), DEFAULT_LABEL_COLOR);
      }
      return;
    }

    if (label && typeof label.name === 'string') {
      const normalizedName = label.name.trim().toLowerCase();
      if (!normalizedName) {
        return;
      }
      const color = typeof label.color === 'string' && label.color.trim().length > 0
        ? label.color
        : DEFAULT_LABEL_COLOR;
      map.set(normalizedName, color);
    }
  });

  return map;
}

function deserializeSubtasks(raw: unknown): Task['subtasks'] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value, index) => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const idValue = (() => {
        const maybeId = (value as { id?: unknown }).id;
        if (typeof maybeId === 'string' && maybeId.trim().length > 0) {
          return maybeId;
        }
        return createId('subtask');
      })();

      const titleValue = (() => {
        const maybeTitle = (value as { title?: unknown }).title;
        if (typeof maybeTitle === 'string') {
          const trimmed = maybeTitle.trim();
          return trimmed || null;
        }
        return null;
      })();

      if (!titleValue) {
        return null;
      }

      const completedValue = (() => {
        const maybeCompleted = (value as { is_completed?: unknown; isCompleted?: unknown }).is_completed ?? (value as { isCompleted?: unknown }).isCompleted;
        return Boolean(maybeCompleted);
      })();

      const dueDateValue = (() => {
        const maybeDue = (value as { due_date?: unknown; dueDate?: unknown }).due_date ?? (value as { dueDate?: unknown }).dueDate;
        return typeof maybeDue === 'string' ? maybeDue : undefined;
      })();

      const positionValue = (() => {
        const maybePosition = (value as { position?: unknown }).position;
        if (typeof maybePosition === 'number' && Number.isFinite(maybePosition)) {
          return maybePosition;
        }
        return index;
      })();

      const googleIdValue = (() => {
        const maybeGoogleId = (value as { google_id?: unknown; googleId?: unknown }).google_id
          ?? (value as { googleId?: unknown }).googleId;
        if (typeof maybeGoogleId === 'string' && maybeGoogleId.trim().length > 0) {
          return maybeGoogleId;
        }
        return undefined;
      })();

      const parentGoogleIdValue = (() => {
        const maybeParentGoogleId = (value as { parent_google_id?: unknown; parentGoogleId?: unknown }).parent_google_id
          ?? (value as { parentGoogleId?: unknown }).parentGoogleId;
        if (typeof maybeParentGoogleId === 'string' && maybeParentGoogleId.trim().length > 0) {
          return maybeParentGoogleId;
        }
        return undefined;
      })();

      return {
        id: idValue,
        googleId: googleIdValue,
        parentGoogleId: parentGoogleIdValue,
        title: titleValue,
        isCompleted: completedValue,
        dueDate: dueDateValue,
        position: positionValue,
      } as SubtaskItem;
    })
    .filter((entry): entry is SubtaskItem => entry !== null);
}

function serializeSubtasksForBackend(subtasks: Task['subtasks'] | undefined) {
  if (!Array.isArray(subtasks)) {
    return [];
  }

  return subtasks
    .map((subtask, index) => {
      const title = (subtask.title || '').trim();
      if (!title) {
        return null;
      }

      const payload: Record<string, unknown> = {
        title,
        is_completed: Boolean(subtask.isCompleted),
        position: typeof subtask.position === 'number' ? subtask.position : index,
      };

      if (subtask.id) {
        payload.id = subtask.id;
      }

      if (subtask.googleId) {
        payload.google_id = subtask.googleId;
      }

      if (subtask.parentGoogleId) {
        payload.parent_google_id = subtask.parentGoogleId;
      }

      if (subtask.dueDate) {
        payload.due_date = subtask.dueDate;
      }

      return payload;
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

// Normalize metadata before pushing through the Tauri create command.
function buildMetadataPayload(input: TaskInput, title: string): SharedTaskMetadata {
  const normalizedLabels = normalizeMetadataLabels(
    (input.labels ?? []).map((label) => {
      if (typeof label === 'string') {
        return { name: label.trim(), color: DEFAULT_LABEL_COLOR };
      }
      const name = typeof label.name === 'string' ? label.name.trim() : '';
      const color = typeof label.color === 'string' ? label.color : DEFAULT_LABEL_COLOR;
      return { name, color };
    }),
  );

  const status = input.isCompleted === true || input.status === 'completed'
    ? 'completed'
    : 'needsAction';
  const rawNotes = input.notes ?? input.description ?? null;
  const normalizedNotes =
    typeof rawNotes === 'string' ? rawNotes.trim() : '';

  return {
    title,
    priority: normalizeMetadataPriority(input.priority ?? 'none'),
    labels: normalizedLabels,
    due_date: normalizeMetadataDueDate(input.dueDate ?? null),
    status,
    notes: normalizedNotes,
    time_block: null,
  };
}

const STORAGE_KEY = 'libreollama_task_store_v2'; // v2: removed hardcoded lists, using Google Tasks sync
const DEFAULT_LIST_ID = DEFAULT_TASK_LISTS[0]?.id ?? 'todo';

const useTaskStoreBase = createWithEqualityFn<TaskStoreState>()(
  persist(
    immer<TaskStoreState>((set, get) => ({
      tasksById: {},
      taskOrder: [],
      listsById: hydrateDefaultLists().listsById,
      listOrder: hydrateDefaultLists().listOrder,
      syncStatus: 'idle',
      syncError: null,
      lastSyncAt: undefined,
      addTask: async (input) => {
        const title = (input.title ?? '').trim();
        const listId = input.listId ?? input.boardListId ?? input.status ?? DEFAULT_LIST_ID;
        const metadata = buildMetadataPayload(input, title);
        const id = createId();

        const createdAtIso = new Date().toISOString();
        const optimisticLabels = metadata.labels.length
          ? metadata.labels
          : (input.labels ?? []).map((label) =>
              typeof label === 'string'
                ? { name: label.trim(), color: DEFAULT_LABEL_COLOR }
                : {
                    name: typeof label?.name === 'string' ? label.name.trim() : '',
                    color:
                      typeof label?.color === 'string' && label.color
                        ? label.color
                        : DEFAULT_LABEL_COLOR,
                  },
            ).filter((label) => label.name);

        const optimisticTask: Task = {
          id,
          title: title || 'Untitled',
          description: undefined,
          status: listId as Task['status'],
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

        set((state) => {
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
              labels: metadata.labels.map((label) => ({
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

          const task: Task = {
            id: rustTask.id,
            title: rustTask.title || 'Untitled',
            description: undefined,
            status: rustTask.list_id,
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

          set((state) => {
            state.tasksById[id] = task;
          });

          emitTaskEvent('task_created', { source: input.source ?? 'task_store', id: task.id });

          try {
            await get().syncNow();
          } catch {}

          return task;
        } catch (error) {
          console.error('[taskStore] Failed to create task in Rust:', error);
          set((state) => {
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
      moveTask: async (id: string, toListId: string) => {
        const task = get().tasksById[id];
        if (!task) return;

        const sourceListId = task.listId;
        if (sourceListId === toListId) {
          return;
        }

        const taskBackup = { ...task };

        set((state) => {
          const draft = state.tasksById[id];
          if (draft) {
            draft.listId = toListId;
            draft.boardListId = toListId;
            draft.status = toListId as any;
          }
        });

        try {
            await invoke('queue_move_task', {
              input: {
                task_id: id,
                to_list_id: toListId,
              },
            });

            set((state) => {
              const draft = state.tasksById[id];
              if (!draft) return;
              draft.pendingSync = true;
              draft.syncState = 'pending_move';
            });

            emitTaskEvent('task_move_queued', { from: sourceListId, to: toListId, id });
        } catch (error) {
            set((state) => {
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

      updateTask: async (id, updates) => {
        const existingTask = get().tasksById[id];
        // Persist to Rust backend
        try {
            const payload: Record<string, unknown> = {};
            let normalizedLabelsForStore: Array<{ name: string; color: string }> | undefined;
            let existingLabelColorMap: Map<string, string> | undefined;

            if (typeof updates.priority !== 'undefined') {
              payload.priority = normalizeMetadataPriority(updates.priority ?? 'none');
            }

            if (typeof updates.labels !== 'undefined') {
              const normalized = normalizeMetadataLabels(
                (Array.isArray(updates.labels) ? updates.labels : []).map((label) => {
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
              payload.labels = normalized.map((label) => ({
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

            if (typeof updates.isCompleted !== 'undefined') {
              payload.status = updates.isCompleted ? 'completed' : 'needsAction';
            }

            if (typeof updates.subtasks !== 'undefined') {
              payload.subtasks = serializeSubtasksForBackend(updates.subtasks);
            }

            if (Object.keys(payload).length > 0) {
  const rustTask = await invoke<any>('update_task_command', {
                    taskId: id,
                    updates: payload,
                });

                const isCompleted = rustTask.status === 'completed';
                const subtasks = deserializeSubtasks(rustTask.subtasks);

                let labels = deserializeLabels(rustTask.labels);

                if (!normalizedLabelsForStore && existingTask && !existingLabelColorMap) {
                  existingLabelColorMap = buildLabelColorMapFromLabels(existingTask.labels);
                }

                const labelColorSource = normalizedLabelsForStore
                  ? new Map(normalizedLabelsForStore.map((label) => [label.name.toLowerCase(), label.color]))
                  : existingLabelColorMap;

                if (labelColorSource && labelColorSource.size > 0) {
                  labels = labels.map((label) => {
                    if (typeof label === 'string') {
                      const normalizedName = label.trim().toLowerCase();
                      const color = labelColorSource?.get(normalizedName) ?? DEFAULT_LABEL_COLOR;
                      return { name: label, color };
                    }

                    const normalizedName = label.name.trim().toLowerCase();
                    const color = labelColorSource?.get(normalizedName) ?? label.color ?? DEFAULT_LABEL_COLOR;
                    return { ...label, color };
                  });
                }

                const task: Task = {
                    id: rustTask.id,
                    title: rustTask.title || 'Untitled',
                    description: undefined,
                    status: rustTask.list_id,
                    priority: rustTask.priority as Task['priority'],
                    dueDate: rustTask.due_date ?? undefined,
                    createdAt: new Date(rustTask.created_at * 1000).toISOString(),
                    dateCreated: new Date(rustTask.created_at * 1000).toISOString(),
                    updatedAt: new Date(rustTask.updated_at * 1000).toISOString(),
                    assignee: undefined,
                    labels,
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

                set((state) => {
                    state.tasksById[id] = task;
                });
            }
        } catch (error) {
            console.error('[taskStore] Failed to update task in Rust:', error);
        }
      },
      deleteTask: async (id) => {
        // Persist to Rust backend
        try {
          await invoke('delete_task', { taskId: id });
          
          // Optimistic UI update
          set((state) => {
            delete state.tasksById[id];
            state.taskOrder = state.taskOrder.filter((taskId) => taskId !== id);
          });
          
          emitTaskEvent('task_deleted', { id });

        } catch (error) {
          console.error('[taskStore] Failed to delete task in Rust:', error);
        }
      },
      toggleTaskCompletion: (id) => {
        const task = get().tasksById[id];
        if (!task) return;

        const nextCompleted = !task.isCompleted;
        const completedAt = nextCompleted ? new Date().toISOString() : null;

        set((state) => {
          const draft = state.tasksById[id];
          if (!draft) return;
          draft.isCompleted = nextCompleted;
          draft.completedAt = completedAt;
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
      duplicateTask: async (id) => {
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
      setTaskDueDate: (id, dueDate) => {
        get().updateTask(id, { dueDate });
        emitTaskEvent('task_due_changed', { id, dueDate });
      },
      reconcileLists: (lists, opts) => {
        set((state) => {
          const replace = opts?.replace ?? false;
          if (replace) {
            state.listsById = {};
            state.listOrder = [];
          }
          lists.forEach((list) => {
            state.listsById[list.id] = {
              ...state.listsById[list.id],
              ...list,
              source: list.source,
            };
            if (!state.listOrder.includes(list.id)) {
              state.listOrder.push(list.id);
            }
          });
        });
      },
      fetchTasks: async () => {
        try {
          const [rustTasks, rustLists] = await Promise.all([
            invoke<any[]>('get_tasks'),
            invoke<any[]>('get_task_lists'),
          ]);

          set((state) => {
            const tasksById: Record<string, Task> = {};
            const taskOrder: string[] = [];

            for (const rustTask of rustTasks) {
              const isCompleted = rustTask.status === 'completed';
              const subtasks = deserializeSubtasks(rustTask.subtasks);

              const task: Task = {
                id: rustTask.id,
                title: rustTask.title || 'Untitled',
                description: undefined,
                status: rustTask.list_id,
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
      createTaskList: async (title) => {
        const trimmed = title.trim();
        if (!trimmed) throw new Error('List title cannot be empty');

        // optimistic add with temporary client id
        const tempId = `tmp_${Date.now()}`;
        const optimistic: TaskList = { id: tempId, name: trimmed, color: undefined, isVisible: true, source: 'google' };
        set((state) => {
          state.listsById[optimistic.id] = optimistic;
          state.listOrder.push(optimistic.id);
        });

        try {
          const created = await invoke<any>('create_task_list', { input: { title: trimmed } });
          const real: TaskList = {
            id: created.id,
            name: created.title,
            color: undefined,
            isVisible: true,
            source: 'google',
          };
          set((state) => {
            // swap temp id with real id
            delete state.listsById[tempId];
            state.listsById[real.id] = real;
            state.listOrder = state.listOrder.map((x) => (x === tempId ? real.id : x));
          });
          // Trigger immediate backend sync for fastest propagation
          try { await get().syncNow(); } catch {}
          return real;
        } catch (e) {
          // rollback optimistic
          set((state) => {
            delete state.listsById[tempId];
            state.listOrder = state.listOrder.filter((x) => x !== tempId);
          });
          throw e;
        }
      },
      deleteTaskList: async (id, reassignTo) => {
        // optimistic remove
        let backup: TaskList | undefined;
        set((state) => {
          backup = state.listsById[id];
          delete state.listsById[id];
          state.listOrder = state.listOrder.filter((x) => x !== id);
          // also detach tasks in this list locally (they will be reconciled from backend)
          Object.values(state.tasksById).forEach((t) => {
            if (t.listId === id) {
              t.listId = reassignTo ?? t.listId; // keep same until backend reconciliation
            }
          });
        });

        try {
          await invoke('delete_task_list', { input: { id, reassign_to: reassignTo } });
          // Trigger immediate backend sync for fastest propagation
          try { await get().syncNow(); } catch {}
        } catch (e) {
          // rollback
          if (backup) {
            set((state) => {
              state.listsById[id] = backup as TaskList;
              if (!state.listOrder.includes(id)) state.listOrder.push(id);
            });
          }
          throw e;
        }
      },
      syncNow: async () => {
        try {
          set((state) => { state.syncStatus = 'syncing'; });
          await invoke('sync_tasks_now');
          await get().fetchTasks();
          set((state) => { state.syncStatus = 'idle'; state.lastSyncAt = Date.now(); });
        } catch (e) {
          set((state) => { state.syncStatus = 'error'; state.syncError = String(e); });
        }
      },
      setSyncStatus: (status, error) => {
        set((state) => {
          state.syncStatus = status;
          state.syncError = error ?? null;
        });
      },
    })),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasksById: state.tasksById,
        taskOrder: state.taskOrder,
        listsById: state.listsById,
        listOrder: state.listOrder,
        lastSyncAt: state.lastSyncAt,
      }),
      version: 2, // v2: Backend-heavy architecture, tasks loaded from Rust
    },
  ),
);

function emitTaskEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('task:telemetry', {
        detail: { event, payload },
      }),
    );
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[task-event] ${event}`, payload ?? {});
  }
}

export const taskStoreApi = useTaskStoreBase;

export const useTaskStore = useTaskStoreBase;

export const selectTasks = (state: TaskStoreState): Task[] =>
  state.taskOrder.map((id) => state.tasksById[id]).filter(Boolean);

export const selectTaskLists = (state: TaskStoreState): TaskList[] =>
  state.listOrder.map((id) => state.listsById[id]).filter(Boolean);

export const selectSyncStatus = (state: TaskStoreState) => ({
  status: state.syncStatus,
  error: state.syncError,
});

export function useTasks() {
  return useTaskStore(selectTasks, shallow);
}

export function useTaskLists() {
  return useTaskStore(selectTaskLists, shallow);
}

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    function onSyncComplete() {
      // Pull latest from backend after each cycle
      void useTaskStore.getState().fetchTasks();
    }
    const handler = (e: Event) => onSyncComplete();
    if (typeof window !== 'undefined') {
      window.addEventListener('tauri://event', handler as EventListener);
      // Also listen for the custom event name if available via @tauri-apps/api/event
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('tasks:sync:complete', () => onSyncComplete());
      }).catch(() => {});
    }
    async function initialize() {
      // Hydrate Google Workspace tokens
      const { useGoogleWorkspaceSettings } = await import('../settings/state/googleWorkspace');
      const hydrate = useGoogleWorkspaceSettings.getState().hydrate;
      await hydrate();
      
      const account = useGoogleWorkspaceSettings.getState().account;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[TaskStoreProvider] Google Workspace hydrated', {
          hasAccount: !!account,
          hasAccessToken: !!account?.token?.accessToken,
          email: account?.email,
        });
      }
      
      // Load tasks from Rust backend
      // Background sync happens automatically in Rust every 60 seconds (cadence controlled by backend)
      await useTaskStore.getState().fetchTasks();
      console.log('[TaskStoreProvider] Tasks loaded from Rust backend');
    }

    void initialize();
  }, []);

  return <>{children}</>;
}
