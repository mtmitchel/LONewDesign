import type { TaskStoreState } from './core';

// Task event emission system
export function emitTaskEvent(event: string, payload?: Record<string, unknown>) {
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

// Event listener setup for Tauri events
export function setupEventListeners(set: any, get: any) {
  function onSyncComplete() {
    // Pull latest from backend after each cycle
    void get().fetchTasks();
  }

  function onSyncQueueProcessed() {
    // Queue processing complete - no need to fetch since we use optimistic updates
    console.log('[TaskStoreProvider] Sync queue processed, skipping fetch to avoid UI flicker');
  }

  type TauriEventDetail = {
    event?: string;
  };

  const windowListener = (event: Event) => {
    const detail = (event as CustomEvent<TauriEventDetail>).detail;
    if (detail?.event === 'tasks:sync:complete') {
      onSyncComplete();
    } else if (detail?.event === 'tasks:sync:queue-processed') {
      onSyncQueueProcessed();
    }
  };

  let isUnmounted = false;
  const unlistenFns: Array<() => void> = [];

  if (typeof window !== 'undefined') {
    window.addEventListener('tauri://event', windowListener as EventListener);
  }

  // Setup Tauri event listeners
  import('@tauri-apps/api/event')
    .then(async ({ listen }) => {
      try {
        const [unlistenComplete, unlistenQueue] = await Promise.all([
          listen('tasks:sync:complete', onSyncComplete),
          listen('tasks:sync:queue-processed', onSyncQueueProcessed),
        ]);

        if (isUnmounted) {
          unlistenComplete();
          unlistenQueue();
        } else {
          unlistenFns.push(unlistenComplete, unlistenQueue);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[TaskStoreProvider] Failed to attach Tauri sync listeners', error);
        }
      }
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[TaskStoreProvider] Failed to import @tauri-apps/api/event', error);
      }
    });

  // Return cleanup function
  return () => {
    isUnmounted = true;
    if (typeof window !== 'undefined') {
      window.removeEventListener('tauri://event', windowListener as EventListener);
    }
    while (unlistenFns.length > 0) {
      const unlisten = unlistenFns.pop();
      if (unlisten) {
        unlisten();
      }
    }
  };
}