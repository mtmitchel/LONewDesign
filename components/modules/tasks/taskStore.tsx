"use client";

import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  Task,
  TaskList,
  TaskMutation,
  TaskMutationOperation,
  TaskSyncState,
} from './types';
import { DEFAULT_TASK_LISTS } from './constants';
import { startGoogleTasksBackgroundSync } from './sync/googleTasksSyncService';

type TaskSourceMeta = {
  source?: string;
};

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

type PendingSyncIndex = Record<string, string>; // taskId -> mutationId

type TaskStoreState = {
  tasksById: Record<string, Task>;
  taskOrder: string[];
  listsById: Record<string, TaskList>;
  listOrder: string[];
  mutationQueue: TaskMutation[];
  pendingByTaskId: PendingSyncIndex;
  syncStatus: TaskSyncState;
  syncError?: string | null;
  lastSyncAt?: number;
  nextPollAt?: number;
  pollIntervalMs: number;
  isPollerActive: boolean;
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, updates: TaskUpdates) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  duplicateTask: (id: string) => Task | null;
  setTaskDueDate: (id: string, dueDate: string | undefined) => void;
  upsertTasksFromGoogle: (tasks: Task[], meta: { fetchedAt: number }) => void;
  reconcileLists: (lists: TaskList[], opts?: { replace?: boolean }) => void;
  enqueueMutation: (op: TaskMutationOperation, taskId?: string) => TaskMutation;
  markMutationInFlight: (mutationId: string) => void;
  resolveMutation: (mutationId: string, payload?: Partial<Task>) => void;
  failMutation: (mutationId: string, error: string) => void;
  shiftNextMutation: () => TaskMutation | undefined;
  requeueMutation: (mutation: TaskMutation) => void;
  clearFailedMutations: () => void;
  registerPollerActive: (active: boolean) => void;
  scheduleNextPoll: (delayMs: number) => void;
  setSyncStatus: (status: TaskSyncState, error?: string | null) => void;
};

function createId(prefix = 'task') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createClientMutationId(op: TaskMutationOperation['kind']) {
  return `${op}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTaskIdFromMutation(mutation: TaskMutation): string | undefined {
  switch (mutation.op.kind) {
    case 'task.create':
      return mutation.op.task.id;
    case 'task.update':
    case 'task.delete':
    case 'task.move':
      return mutation.op.id;
    default:
      return undefined;
  }
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

const STORAGE_KEY = 'libreollama_task_store_v1';
const DEFAULT_LIST_ID = DEFAULT_TASK_LISTS[0]?.id ?? 'todo';

const useTaskStoreBase = create<TaskStoreState>()(
  persist(
    immer<TaskStoreState>((set, get) => ({
      tasksById: {},
      taskOrder: [],
      listsById: hydrateDefaultLists().listsById,
      listOrder: hydrateDefaultLists().listOrder,
      mutationQueue: [],
      pendingByTaskId: {},
      syncStatus: 'idle',
      syncError: null,
      lastSyncAt: undefined,
      nextPollAt: undefined,
      pollIntervalMs: 60_000,
      isPollerActive: false,
      addTask: (input) => {
        const timestamp = new Date().toISOString();
        const id = createId();
        const listId = input.listId ?? input.boardListId ?? input.status ?? DEFAULT_LIST_ID;
        const clientMutationId = createClientMutationId('task.create');
        const task: Task = {
          id,
          title: input.title.trim(),
          description: input.description,
          status: input.status ?? listId,
          priority: input.priority ?? 'none',
          dueDate: input.dueDate,
          createdAt: timestamp,
          dateCreated: timestamp,
          updatedAt: timestamp,
          assignee: input.assignee,
          labels: input.labels ?? [],
          listId,
          projectId: input.projectId,
          boardListId: input.boardListId ?? listId,
          notes: input.notes,
          isCompleted: input.isCompleted ?? false,
          checklist: input.checklist ?? [],
          isPinned: input.isPinned ?? false,
          order: input.order,
          completedAt: input.completedAt ?? null,
          subtasks: input.subtasks ?? [],
          externalId: undefined,
          googleListId: input.googleListId,
          pendingSync: true,
          clientMutationId,
          syncState: 'pending',
          lastSyncedAt: undefined,
          syncError: null,
        };

        set((state) => {
          state.tasksById[id] = task;
          state.taskOrder.unshift(id);
          const mutation = state.enqueueMutation({ kind: 'task.create', task }, id);
          state.pendingByTaskId[id] = mutation.id;
        });

        emitTaskEvent('task_created', { source: input.source ?? 'task_store', id });
        return task;
      },
      updateTask: (id, updates) => {
        set((state) => {
          const existing = state.tasksById[id];
          if (!existing) return;
          const updatedAt = new Date().toISOString();
          const nextTask: Task = {
            ...existing,
            ...updates,
            updatedAt,
            pendingSync: true,
            clientMutationId: createClientMutationId('task.update'),
            syncState: 'pending',
            syncError: null,
          };
          state.tasksById[id] = nextTask;
          const mutation = state.enqueueMutation({
            kind: 'task.update',
            id,
            changes: updates,
          });
          state.pendingByTaskId[id] = mutation.id;
        });
      },
      deleteTask: (id) => {
        set((state) => {
          const target = state.tasksById[id];
          if (!target) return;
          const mutation = state.enqueueMutation({
            kind: 'task.delete',
            id,
            externalId: target.externalId,
          });
          delete state.tasksById[id];
          state.taskOrder = state.taskOrder.filter((taskId) => taskId !== id);
          delete state.pendingByTaskId[id];
          state.pendingByTaskId[id] = mutation.id;
        });
        emitTaskEvent('task_deleted', { id });
      },
      toggleTaskCompletion: (id) => {
        const task = get().tasksById[id];
        const nextCompleted = !task?.isCompleted;
        get().updateTask(id, {
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null,
        });
        emitTaskEvent(nextCompleted ? 'task_completed' : 'task_reopened', { id });
      },
      duplicateTask: (id) => {
        const task = get().tasksById[id];
        if (!task) return null;
        return get().addTask({
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
          isCompleted: false,
          projectId: task.projectId,
          source: 'task_duplicate',
        });
      },
      setTaskDueDate: (id, dueDate) => {
        get().updateTask(id, { dueDate });
        emitTaskEvent('task_due_changed', { id, dueDate });
      },
      upsertTasksFromGoogle: (tasks, meta) => {
        set((state) => {
          tasks.forEach((task) => {
            state.tasksById[task.id] = {
              ...task,
              pendingSync: false,
              syncState: 'idle',
              syncError: null,
              lastSyncedAt: meta.fetchedAt,
            };
            if (!state.taskOrder.includes(task.id)) {
              state.taskOrder.push(task.id);
            }
          });
          state.lastSyncAt = meta.fetchedAt;
        });
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
      enqueueMutation: (op, taskId) => {
        const mutationId = createClientMutationId(op.kind);
        const mutation: TaskMutation = {
          id: mutationId,
          op,
          attempts: 0,
          enqueuedAt: Date.now(),
          state: 'queued',
        };
        set((state) => {
          state.mutationQueue.push(mutation);
          if (taskId) {
            state.pendingByTaskId[taskId] = mutationId;
          }
        });
        return mutation;
      },
      markMutationInFlight: (mutationId) => {
        set((state) => {
          const mutation = state.mutationQueue.find((item) => item.id === mutationId);
          if (!mutation) return;
          mutation.state = 'in-flight';
          mutation.attempts += 1;
        });
      },
      resolveMutation: (mutationId, payload) => {
        set((state) => {
          state.mutationQueue = state.mutationQueue.filter((mutation) => mutation.id !== mutationId);
          Object.keys(state.pendingByTaskId).forEach((taskId) => {
            if (state.pendingByTaskId[taskId] === mutationId) {
              const task = state.tasksById[taskId];
              if (task) {
                state.tasksById[taskId] = {
                  ...task,
                  pendingSync: false,
                  syncState: 'idle',
                  syncError: null,
                  clientMutationId: undefined,
                  ...payload,
                };
              }
              delete state.pendingByTaskId[taskId];
            }
          });
        });
      },
      failMutation: (mutationId, error) => {
        set((state) => {
          const mutation = state.mutationQueue.find((item) => item.id === mutationId);
          if (mutation) {
            mutation.state = 'failed';
            mutation.lastError = error;
          }
          Object.keys(state.pendingByTaskId).forEach((taskId) => {
            if (state.pendingByTaskId[taskId] === mutationId) {
              const task = state.tasksById[taskId];
              if (task) {
                state.tasksById[taskId] = {
                  ...task,
                  syncState: 'error',
                  syncError: error,
                };
              }
            }
          });
        });
      },
      shiftNextMutation: () => {
        let mutation: TaskMutation | undefined;
        set((state) => {
          mutation = state.mutationQueue.shift();
          if (mutation) {
            mutation.state = 'in-flight';
            mutation.attempts += 1;
          }
        });
        return mutation;
      },
      requeueMutation: (mutation) => {
        set((state) => {
          mutation.state = 'queued';
          state.mutationQueue.unshift(mutation);
          const taskId = getTaskIdFromMutation(mutation);
          if (taskId) {
            state.pendingByTaskId[taskId] = mutation.id;
          }
        });
      },
      clearFailedMutations: () => {
        set((state) => {
          state.mutationQueue = state.mutationQueue.filter((mutation) => mutation.state !== 'failed');
          Object.keys(state.pendingByTaskId).forEach((taskId) => {
            const mutationId = state.pendingByTaskId[taskId];
            const stillQueued = state.mutationQueue.some((mutation) => mutation.id === mutationId);
            if (!stillQueued) {
              delete state.pendingByTaskId[taskId];
            }
          });
        });
      },
      registerPollerActive: (active) => {
        set((state) => {
          state.isPollerActive = active;
        });
      },
      scheduleNextPoll: (delayMs) => {
        set((state) => {
          state.nextPollAt = Date.now() + delayMs;
        });
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
        mutationQueue: state.mutationQueue,
        pendingByTaskId: state.pendingByTaskId,
        lastSyncAt: state.lastSyncAt,
        pollIntervalMs: state.pollIntervalMs,
      }),
      version: 1,
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

type DerivedTaskStore = {
  tasks: Task[];
  lists: TaskList[];
  mutationQueue: TaskMutation[];
  syncStatus: TaskSyncState;
  syncError?: string | null;
  addTask: TaskStoreState['addTask'];
  updateTask: TaskStoreState['updateTask'];
  deleteTask: TaskStoreState['deleteTask'];
  toggleTaskCompletion: TaskStoreState['toggleTaskCompletion'];
  duplicateTask: TaskStoreState['duplicateTask'];
  setTaskDueDate: TaskStoreState['setTaskDueDate'];
  enqueueMutation: TaskStoreState['enqueueMutation'];
  shiftNextMutation: TaskStoreState['shiftNextMutation'];
  requeueMutation: TaskStoreState['requeueMutation'];
  resolveMutation: TaskStoreState['resolveMutation'];
  failMutation: TaskStoreState['failMutation'];
  registerPollerActive: TaskStoreState['registerPollerActive'];
  scheduleNextPoll: TaskStoreState['scheduleNextPoll'];
  setSyncStatus: TaskStoreState['setSyncStatus'];
  reconcileLists: TaskStoreState['reconcileLists'];
  upsertTasksFromGoogle: TaskStoreState['upsertTasksFromGoogle'];
};

function selectDerivedState(state: TaskStoreState): DerivedTaskStore {
  return {
    tasks: state.taskOrder.map((id) => state.tasksById[id]).filter(Boolean),
    lists: state.listOrder.map((id) => state.listsById[id]).filter(Boolean),
    mutationQueue: state.mutationQueue,
    syncStatus: state.syncStatus,
    syncError: state.syncError,
    addTask: state.addTask,
    updateTask: state.updateTask,
    deleteTask: state.deleteTask,
    toggleTaskCompletion: state.toggleTaskCompletion,
    duplicateTask: state.duplicateTask,
    setTaskDueDate: state.setTaskDueDate,
    enqueueMutation: state.enqueueMutation,
    shiftNextMutation: state.shiftNextMutation,
    requeueMutation: state.requeueMutation,
    resolveMutation: state.resolveMutation,
    failMutation: state.failMutation,
    registerPollerActive: state.registerPollerActive,
    scheduleNextPoll: state.scheduleNextPoll,
    setSyncStatus: state.setSyncStatus,
    reconcileLists: state.reconcileLists,
    upsertTasksFromGoogle: state.upsertTasksFromGoogle,
  };
}

export function useTaskStore() {
  return useTaskStoreBase(selectDerivedState);
}

export function useTaskList() {
  return useTaskStore().tasks;
}

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const stop = startGoogleTasksBackgroundSync();
    return () => stop();
  }, []);

  return <>{children}</>;
}
