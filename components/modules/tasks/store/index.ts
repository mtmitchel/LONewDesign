import { useTaskStoreBase } from './core';
import { createTaskActions } from './actions/tasks';
import { createListActions } from './actions/lists';
import { createSyncActions } from './actions/sync';

// Combine all actions
const useTaskStore = useTaskStoreBase;
const taskStoreApi = useTaskStoreBase;

// Export everything needed for backward compatibility
export { useTaskStore, taskStoreApi };
export { selectTasks, selectTaskLists, selectSyncStatus, useTasks, useTaskLists, useSyncStatus } from './selectors';
export type { TaskInput, TaskUpdates, TaskStoreState } from './core';

// Re-export types for convenience
export type { Task, TaskList, TaskSyncState } from '../types';