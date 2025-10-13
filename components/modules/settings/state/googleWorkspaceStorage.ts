import { isTauriRuntime } from '../../../../lib/isTauri';

const WEB_STORAGE_KEY = 'libreollama:google-workspace';

type PersistedGoogleWorkspaceState = {
  account: unknown;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
};

async function invokeStoreCommand<T>(command: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(command, args);
  } catch (error) {
    console.warn(`[googleWorkspaceStorage] Command ${command} failed`, error);
    return null;
  }
}

export async function loadGoogleWorkspaceState(): Promise<PersistedGoogleWorkspaceState | null> {
  if (isTauriRuntime()) {
    const raw = await invokeStoreCommand<string | null>('google_workspace_store_get');
    if (raw) {
      try {
        return JSON.parse(raw) as PersistedGoogleWorkspaceState;
      } catch (error) {
        console.warn('[googleWorkspaceStorage] Failed to parse secure store snapshot. Falling back to web storage.', error);
      }
    }
  }

  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedGoogleWorkspaceState;
  } catch (error) {
    console.warn('[googleWorkspaceStorage] Failed to parse web storage snapshot.', error);
    return null;
  }
}

export async function saveGoogleWorkspaceState(snapshot: PersistedGoogleWorkspaceState): Promise<void> {
  const serialised = JSON.stringify(snapshot);

  if (isTauriRuntime()) {
    const stored = await invokeStoreCommand<boolean>('google_workspace_store_set', { value: serialised });
    if (stored) {
      return;
    }
  }

  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WEB_STORAGE_KEY, serialised);
  } catch (error) {
    console.error('[googleWorkspaceStorage] Failed to persist to web storage.', error);
  }
}

export async function clearGoogleWorkspaceState(): Promise<void> {
  if (isTauriRuntime()) {
    await invokeStoreCommand<boolean>('google_workspace_store_clear');
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(WEB_STORAGE_KEY);
    } catch (error) {
      console.warn('[googleWorkspaceStorage] Failed to clear web storage.', error);
    }
  }
}

export type { PersistedGoogleWorkspaceState };
