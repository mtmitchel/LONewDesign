import { shallow } from 'zustand/shallow';
import type { TaskStoreState } from './core';
import { useTaskStore } from './core';

// Selectors
export const selectTasks = (state: TaskStoreState) =>
  state.taskOrder.map((id) => state.tasksById[id]).filter(Boolean);

export const selectTaskLists = (state: TaskStoreState) =>
  state.listOrder.map((id) => state.listsById[id]).filter(Boolean);

export const selectSyncStatus = (state: TaskStoreState) => ({
  status: state.syncStatus,
  error: state.syncError,
});

// Hooks
export function useTasks() {
  return useTaskStore(selectTasks, shallow);
}

export function useTaskLists() {
  return useTaskStore(selectTaskLists, shallow);
}

export function useSyncStatus() {
  return useTaskStore(selectSyncStatus, shallow);
}