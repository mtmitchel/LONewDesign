import { invoke } from '@tauri-apps/api/core';
import type { TaskStoreState, TaskSyncState } from '../core';

export function createSyncActions(set: any, get: any) {
  return {
    syncNow: async () => {
      try {
        set((state: TaskStoreState) => { state.syncStatus = 'syncing'; });
        await invoke('sync_tasks_now');
        await get().fetchTasks();
        set((state: TaskStoreState) => { state.syncStatus = 'idle'; state.lastSyncAt = Date.now(); });
      } catch (e) {
        set((state: TaskStoreState) => { state.syncStatus = 'error'; state.syncError = String(e); });
      }
    },

    setSyncStatus: (status: TaskSyncState, error?: string | null) => {
      set((state: TaskStoreState) => {
        state.syncStatus = status;
        state.syncError = error ?? null;
      });
    },
  };
}