import { invoke } from '@tauri-apps/api/core';
import type { TaskList, TaskStoreState } from '../core';

export function createListActions(set: any, get: any) {
  return {
    createTaskList: async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) throw new Error('List title cannot be empty');

      // optimistic add with temporary client id
      const tempId = `tmp_${Date.now()}`;
      const optimistic: TaskList = { id: tempId, name: trimmed, color: undefined, isVisible: true, source: 'google' };
      set((state: TaskStoreState) => {
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
        set((state: TaskStoreState) => {
          // swap temp id with real id
          delete state.listsById[tempId];
          state.listsById[real.id] = real;
          state.listOrder = state.listOrder.map((x) => (x === tempId ? real.id : x));
        });
        // Trigger immediate backend sync for fastest propagation
        try {
          await invoke('process_sync_queue_only');
        } catch (syncError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[taskStore] Immediate sync after create list failed', syncError);
          }
          // Fallback to full sync if queue processing fails
          try { await get().syncNow(); } catch {}
        }
        return real;
      } catch (e) {
        // rollback optimistic
        set((state: TaskStoreState) => {
          delete state.listsById[tempId];
          state.listOrder = state.listOrder.filter((x) => x !== tempId);
        });
        throw e;
      }
    },

    deleteTaskList: async (id: string, reassignTo?: string) => {
      // optimistic remove
      let backup: TaskList | undefined;
      set((state: TaskStoreState) => {
        const existing = state.listsById[id];
        backup = existing ? { ...existing } : undefined;
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
        try {
          await invoke('process_sync_queue_only');
        } catch (syncError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[taskStore] Immediate sync after delete list failed', syncError);
          }
          // Fallback to full sync if queue processing fails
          try { await get().syncNow(); } catch {}
        }
      } catch (e) {
        // rollback
        if (backup) {
          set((state: TaskStoreState) => {
            state.listsById[id] = backup as TaskList;
            if (!state.listOrder.includes(id)) state.listOrder.push(id);
          });
        }
        throw e;
      }
    },

    reconcileLists: (lists: TaskList[], opts?: { replace?: boolean }) => {
      set((state: TaskStoreState) => {
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

    toggleListCompletedVisibility: (listId: string, showCompleted: boolean) => {
      set((state: TaskStoreState) => {
        if (!state.listViewPreferences[listId]) {
          state.listViewPreferences[listId] = { showCompleted };
          return;
        }
        state.listViewPreferences[listId].showCompleted = showCompleted;
      });
    },
  };
}