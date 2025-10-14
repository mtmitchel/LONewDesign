import { taskStoreApi } from '../taskStore';
import { googleTasksService } from '../../../../lib/services/googleTasks';
import type { GoogleTasksAuthContext } from '../../../../lib/services/googleTasks';
import { useGoogleWorkspaceSettings } from '../../settings/state/googleWorkspace';
import type { Task, TaskList } from '../types';

const MUTATION_RETRY_DELAY = 5_000;
const POLL_INTERVAL_FALLBACK = 60_000;
const MUTATION_MAX_ATTEMPTS = 3;

let pollTimer: number | null = null;
let mutationTimer: number | null = null;
let isRunning = false;

function clearTimers() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (mutationTimer) {
    clearTimeout(mutationTimer);
    mutationTimer = null;
  }
}

function scheduleMutationSweep(delay = MUTATION_RETRY_DELAY) {
  if (typeof window === 'undefined') return;
  if (mutationTimer) {
    clearTimeout(mutationTimer);
  }
  mutationTimer = window.setTimeout(async () => {
    await drainMutationQueue('interval');
    scheduleMutationSweep();
  }, delay);
}

function schedulePoll(delay?: number) {
  if (typeof window === 'undefined') return;
  if (pollTimer) {
    clearTimeout(pollTimer);
  }
  const store = taskStoreApi.getState();
  const interval = delay ?? store.pollIntervalMs ?? POLL_INTERVAL_FALLBACK;
  pollTimer = window.setTimeout(async () => {
    await runPollCycle();
    schedulePoll();
  }, interval);
  store.scheduleNextPoll(interval);
}

function buildAuthContext(): GoogleTasksAuthContext | null {
  const workspaceState = useGoogleWorkspaceSettings.getState();
  const account = workspaceState.account;
  
  if (!account?.token?.accessToken) {
    return null;
  }
  
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_SECRET;
  
  return {
    accessToken: account.token.accessToken,
    refreshToken: account.token.refreshToken ?? undefined,
    clientId: clientId ?? undefined,
    clientSecret: clientSecret ?? undefined,
  };
}

function handleTokenUpdate(updatedToken?: {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}) {
  if (!updatedToken) return;
  
  const workspaceState = useGoogleWorkspaceSettings.getState();
  workspaceState.updateToken({
    accessToken: updatedToken.access_token,
    refreshToken: updatedToken.refresh_token ?? undefined,
    accessTokenExpiresAt: updatedToken.expires_in
      ? Date.now() + updatedToken.expires_in * 1000
      : undefined,
    lastRefreshAt: Date.now(),
  });
}

async function drainMutationQueue(reason: 'initial' | 'interval' | 'manual') {
  const store = taskStoreApi.getState();
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[google-tasks-sync] drainMutationQueue called', {
      reason,
      queueLength: store.mutationQueue.length,
      syncStatus: store.syncStatus,
    });
  }
  
  if (store.mutationQueue.length === 0) {
    if (store.syncStatus === 'syncing') {
      store.setSyncStatus('idle');
    }
    return;
  }

  const auth = buildAuthContext();
  if (!auth) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[google-tasks-sync] no auth context, skipping mutation drain');
    }
    store.setSyncStatus('pending');
    return;
  }

  // Peek at the next mutation to get data we need BEFORE shifting
  const nextMutation = store.mutationQueue[0];
  if (!nextMutation) {
    return;
  }

  // Capture data from store BEFORE shifting mutation (to avoid proxy revocation)
  const listsById = { ...store.listsById };
  const tasksById = { ...store.tasksById };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[google-tasks-sync] captured store data', {
      listsCount: Object.keys(listsById).length,
      tasksCount: Object.keys(tasksById).length,
    });
  }

  // Now shift the mutation
  const mutation = store.shiftNextMutation();
  if (!mutation) {
    return;
  }

  // Get fresh state reference for mutations
  const freshStore = taskStoreApi.getState();

  try {
    freshStore.setSyncStatus('syncing');
    if (process.env.NODE_ENV !== 'production') {
      console.log('[google-tasks-sync] executing mutation', { 
        reason, 
        kind: mutation.op.kind,
        mutationId: mutation.id,
        attempts: mutation.attempts,
      });
    }

    switch (mutation.op.kind) {
      case 'task.create': {
        const { task } = mutation.op;
        const listId = task.googleListId ?? listsById[task.listId]?.externalId ?? '@default';
        
        const googleTask = {
          title: task.title,
          notes: task.description ?? task.notes,
          due: task.dueDate,
          status: task.isCompleted ? 'completed' : 'needsAction',
        };

        const result = await googleTasksService.insertTask({
          auth,
          listId,
          task: googleTask,
        });

        handleTokenUpdate(result.updatedToken);
        freshStore.resolveMutation(mutation.id, {
          externalId: result.data.id,
          googleListId: listId,
          lastSyncedAt: Date.now(),
        });

        emitTaskEvent('tasks.sync.success', {
          operation: 'create',
          taskId: task.id,
          externalId: result.data.id,
        });
        break;
      }

      case 'task.update': {
        const { id, changes } = mutation.op;
        const localTask = tasksById[id];
        
        if (!localTask?.externalId || !localTask?.googleListId) {
          throw new Error('Task missing externalId or googleListId');
        }

        const updates: Record<string, unknown> = {};
        if (changes.title !== undefined) updates.title = changes.title;
        if (changes.description !== undefined || changes.notes !== undefined) {
          updates.notes = changes.description ?? changes.notes;
        }
        if (changes.dueDate !== undefined) updates.due = changes.dueDate;
        if (changes.isCompleted !== undefined) {
          updates.status = changes.isCompleted ? 'completed' : 'needsAction';
        }

        const result = await googleTasksService.patchTask({
          auth,
          listId: localTask.googleListId,
          taskId: localTask.externalId,
          updates,
        });

        handleTokenUpdate(result.updatedToken);
        freshStore.resolveMutation(mutation.id, {
          lastSyncedAt: Date.now(),
        });

        emitTaskEvent('tasks.sync.success', {
          operation: 'update',
          taskId: id,
          externalId: localTask.externalId,
        });
        break;
      }

      case 'task.delete': {
        const { id, externalId } = mutation.op;
        const localTask = tasksById[id];
        const extId = externalId ?? localTask?.externalId;
        const listId = localTask?.googleListId;

        if (extId && listId) {
          const result = await googleTasksService.deleteTask({
            auth,
            listId,
            taskId: extId,
          });
          handleTokenUpdate(result.updatedToken);
        }

        freshStore.resolveMutation(mutation.id);

        emitTaskEvent('tasks.sync.success', {
          operation: 'delete',
          taskId: id,
          externalId: extId,
        });
        break;
      }

      case 'task.move': {
        const { id, toListId, previousId } = mutation.op;
        const localTask = tasksById[id];
        
        if (!localTask?.externalId || !localTask?.googleListId) {
          throw new Error('Task missing externalId or googleListId');
        }

        const newListId = listsById[toListId]?.externalId ?? toListId;
        const previous = previousId ? tasksById[previousId]?.externalId : undefined;

        const result = await googleTasksService.moveTask({
          auth,
          listId: newListId,
          taskId: localTask.externalId,
          previous,
        });

        handleTokenUpdate(result.updatedToken);
        freshStore.resolveMutation(mutation.id, {
          googleListId: newListId,
          listId: toListId,
          lastSyncedAt: Date.now(),
        });

        emitTaskEvent('tasks.sync.success', {
          operation: 'move',
          taskId: id,
          externalId: localTask.externalId,
          toListId,
        });
        break;
      }

      default:
        throw new Error(`Unknown mutation kind: ${(mutation.op as { kind: string }).kind}`);
    }

    freshStore.setSyncStatus('idle');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    if (mutation.attempts >= MUTATION_MAX_ATTEMPTS) {
      freshStore.failMutation(mutation.id, message);
      emitTaskEvent('tasks.sync.failure', {
        operation: mutation.op.kind,
        mutationId: mutation.id,
        error: message,
        attempts: mutation.attempts,
      });
    } else {
      freshStore.requeueMutation(mutation);
    }
    
    freshStore.setSyncStatus('error', message);
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('[google-tasks-sync] mutation failed', { mutation, error: message });
    }
  }
}

async function runPollCycle() {
  const store = taskStoreApi.getState();
  const auth = buildAuthContext();
  
  if (!auth) {
    store.setSyncStatus(store.mutationQueue.length ? 'pending' : 'idle');
    return;
  }

  try {
    const workspaceState = useGoogleWorkspaceSettings.getState();
    const tasksModuleEnabled = workspaceState.account?.modules.tasks ?? false;
    
    if (!tasksModuleEnabled) {
      store.setSyncStatus('idle');
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[google-tasks-sync] polling Google Tasks');
    }

    // Fetch all task lists
    const listsResult = await googleTasksService.listTasklists({
      auth,
      maxResults: 100,
    });

    handleTokenUpdate(listsResult.updatedToken);

    const googleLists: TaskList[] = (listsResult.data.items ?? []).map((gList) => ({
      id: gList.id,
      name: gList.title,
      color: 'blue',
      isVisible: true,
      source: 'google' as const,
      externalId: gList.id,
    }));

    store.reconcileLists(googleLists);

    // Fetch tasks from each list
    const fetchedAt = Date.now();
    const allTasks: Task[] = [];

    for (const list of googleLists) {
      const tasksResult = await googleTasksService.listTasks({
        auth,
        listId: list.externalId!,
        showCompleted: true,
        showHidden: false,
        maxResults: 100,
      });

      handleTokenUpdate(tasksResult.updatedToken);

      const tasks: Task[] = (tasksResult.data.items ?? []).map((gTask) => {
        const timestamp = gTask.updated ?? new Date().toISOString();
        return {
          id: gTask.id,
          title: gTask.title || 'Untitled',
          description: gTask.notes,
          notes: gTask.notes,
          status: list.id,
          listId: list.id,
          boardListId: list.id,
          priority: 'none' as const,
          dueDate: gTask.due,
          createdAt: timestamp,
          dateCreated: timestamp,
          updatedAt: timestamp,
          isCompleted: gTask.status === 'completed',
          completedAt: gTask.completed ?? null,
          labels: [],
          checklist: [],
          isPinned: false,
          subtasks: [],
          externalId: gTask.id,
          googleListId: list.externalId,
          pendingSync: false,
          syncState: 'idle' as const,
          lastSyncedAt: fetchedAt,
          syncError: null,
        };
      });

      allTasks.push(...tasks);
    }

    store.upsertTasksFromGoogle(allTasks, { fetchedAt });
    
    workspaceState.markSyncSuccess('tasks', fetchedAt);
    store.setSyncStatus('idle');

    emitTaskEvent('tasks.sync.poll_complete', {
      listCount: googleLists.length,
      taskCount: allTasks.length,
      fetchedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const workspaceState = useGoogleWorkspaceSettings.getState();
    
    workspaceState.markSyncFailure('tasks', message);
    store.setSyncStatus('error', message);

    emitTaskEvent('tasks.sync.poll_failure', {
      error: message,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('[google-tasks-sync] poll failed', { error: message });
    }
  }
}

function emitTaskEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('task:telemetry', {
        detail: { event, payload },
      }),
    );
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[task-sync-event] ${event}`, payload ?? {});
  }
}

export function startGoogleTasksBackgroundSync() {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  if (isRunning) {
    return () => undefined;
  }

  isRunning = true;
  const store = taskStoreApi.getState();
  store.registerPollerActive(true);

  // Listen for OAuth connection events to trigger immediate sync
  const handleOAuthConnected = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[google-tasks-sync] OAuth connected, triggering immediate sync');
    }
    void runPollCycle();
    void drainMutationQueue('initial');
  };

  window.addEventListener('google:oauth:connected', handleOAuthConnected);

  // Kick everything once on start so queued mutations are surfaced promptly.
  drainMutationQueue('initial');
  scheduleMutationSweep(0);
  schedulePoll();

  return () => {
    window.removeEventListener('google:oauth:connected', handleOAuthConnected);
    clearTimers();
    store.registerPollerActive(false);
    store.setSyncStatus('idle');
    isRunning = false;
  };
}
