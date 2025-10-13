import { taskStoreApi } from '../taskStore';

const MUTATION_RETRY_DELAY = 5_000;
const POLL_INTERVAL_FALLBACK = 60_000;

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

async function drainMutationQueue(reason: 'initial' | 'interval' | 'manual') {
  const store = taskStoreApi.getState();
  if (store.mutationQueue.length === 0) {
    if (store.syncStatus === 'syncing') {
      store.setSyncStatus('idle');
    }
    return;
  }

  const mutation = store.shiftNextMutation();
  if (!mutation) {
    return;
  }

  try {
    store.setSyncStatus('syncing');
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[google-tasks-sync] queued mutation', { reason, mutation });
    }
    // Placeholder: integration with Google Tasks REST API will land in a later pass.
    // For now we simply keep the mutation in the queue so the sync service can retry once
    // OAuth + HTTP plumbing is ready.
    store.requeueMutation(mutation);
    store.setSyncStatus('pending');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.failMutation(mutation.id, message);
    store.setSyncStatus('error', message);
  }
}

async function runPollCycle() {
  const store = taskStoreApi.getState();
  // Skip polling until we have OAuth tokens wired; this just keeps timestamps fresh.
  store.setSyncStatus(store.mutationQueue.length ? 'pending' : 'idle');
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[google-tasks-sync] poll placeholder – awaiting Google Tasks integration');
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

  // Kick everything once on start so queued mutations are surfaced promptly.
  drainMutationQueue('initial');
  scheduleMutationSweep(0);
  schedulePoll();

  return () => {
    clearTimers();
    store.registerPollerActive(false);
    store.setSyncStatus('idle');
    isRunning = false;
  };
}
