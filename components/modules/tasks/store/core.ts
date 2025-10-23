"use client";

import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Task, TaskList, TaskSyncState } from '../types';
import { hydrateDefaultLists } from './helpers';
import { createTaskActions } from './actions/tasks';
import { createListActions } from './actions/lists';
import { createSyncActions } from './actions/sync';

// Re-export types for convenience
export type { Task, TaskList, TaskSyncState } from '../types';

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
  source?: string;
};

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

export type TaskStoreState = {
  // Entities + status
  tasksById: Record<string, Task>;
  taskOrder: string[];
  listsById: Record<string, TaskList>;
  listOrder: string[];
  listViewPreferences: Record<string, { showCompleted: boolean }>;
  syncStatus: TaskSyncState;
  syncError?: string | null;
  lastSyncAt?: number;

  // Actions
  addTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, updates: TaskUpdates) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchTasks: () => Promise<void>;
  toggleTaskCompletion: (id: string) => void;
  duplicateTask: (id: string) => Promise<Task | null>;
  moveTask: (id: string, toListId: string) => Promise<void>;
  setTaskDueDate: (id: string, dueDate: string | undefined) => void;
  reconcileLists: (lists: TaskList[], opts?: { replace?: boolean }) => void;
  toggleListCompletedVisibility: (listId: string, showCompleted: boolean) => void;

  // List lifecycle + manual sync
  createTaskList: (title: string) => Promise<TaskList>;
  deleteTaskList: (id: string, reassignTo?: string) => Promise<void>;
  syncNow: () => Promise<void>;
  setSyncStatus: (status: TaskSyncState, error?: string | null) => void;
};

const STORAGE_KEY = 'libreollama_task_store_v2'; // v2: removed hardcoded lists, using Google Tasks sync

// Create the base store with persist middleware
const useTaskStoreBase = createWithEqualityFn<TaskStoreState>()(
  persist(
    immer<TaskStoreState>((set, get) => ({
      // Initial state
      tasksById: {},
      taskOrder: [],
      listsById: hydrateDefaultLists().listsById,
      listOrder: hydrateDefaultLists().listOrder,
      listViewPreferences: {},
      syncStatus: 'idle',
      syncError: null,
      lastSyncAt: undefined,

      // Combine all actions
      ...createTaskActions(set, get),
      ...createListActions(set, get),
      ...createSyncActions(set, get),
    })),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not actions
      partialize: (state) => ({
        tasksById: state.tasksById,
        taskOrder: state.taskOrder,
        listsById: state.listsById,
        listOrder: state.listOrder,
        listViewPreferences: state.listViewPreferences,
        syncStatus: state.syncStatus,
        syncError: state.syncError,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Export the hook
export const useTaskStore = useTaskStoreBase;
export { useTaskStoreBase };