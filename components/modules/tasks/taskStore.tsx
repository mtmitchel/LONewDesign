"use client";

import React from 'react';

// Re-export everything from the modular store
export {
  useTaskStore,
  taskStoreApi,
  selectTasks,
  selectTaskLists,
  selectSyncStatus,
  useTasks,
  useTaskLists,
  useSyncStatus,
} from './store';

export type {
  TaskInput,
  TaskUpdates,
  TaskStoreState,
  Task,
  TaskList,
  TaskSyncState,
} from './store';

// TaskStoreProvider - event wiring and initialization
export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    let disposed = false;

    const hydrateAndFetch = async () => {
      const { useTaskStore } = await import('./store');
      
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

      await useTaskStore.getState().fetchTasks();
      console.log('[TaskStoreProvider] Tasks loaded from Rust backend');
    };

    const init = async () => {
      const { setupEventListeners } = await import('./store/events');
      const { useTaskStore } = await import('./store');
      
      if (disposed) return;
      
      const cleanup = setupEventListeners(
        (updater: any) => useTaskStore.setState(updater),
        () => useTaskStore.getState(),
      );
      
      await hydrateAndFetch();
      
      return cleanup;
    };

    const done = init();

    return () => {
      disposed = true;
      done.then(fn => fn?.());
    };
  }, []);

  return <>{children}</>;
}
