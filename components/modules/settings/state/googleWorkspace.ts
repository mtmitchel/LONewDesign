import { create } from 'zustand';

import { isTauriRuntime } from '../../../../lib/isTauri';
import {
  clearGoogleWorkspaceState,
  loadGoogleWorkspaceState,
  saveGoogleWorkspaceState,
  type PersistedGoogleWorkspaceState,
} from './googleWorkspaceStorage';

export type GoogleWorkspaceModule = 'mail' | 'calendar' | 'tasks';

export type GoogleWorkspaceAccount = {
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  scopes: string[];
  connectedAt: number;
  modules: Record<GoogleWorkspaceModule, boolean>;
  token: {
    refreshToken: string | null;
    accessToken?: string | null;
    accessTokenExpiresAt?: number | null;
    lastRefreshAt?: number | null;
  };
  syncStatus: Record<GoogleWorkspaceModule, {
    lastSuccessAt: number | null;
    lastErrorAt: number | null;
    lastError?: string | null;
  }>;
};

type PendingOperation = {
  kind: 'connect' | 'disconnect' | 'refresh-token';
  startedAt: number;
  context?: Record<string, unknown>;
};

type GoogleWorkspaceState = {
  account: GoogleWorkspaceAccount | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError: string | null;
  pending: PendingOperation | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setConnecting: (context?: PendingOperation['context']) => void;
  setPending: (pending: PendingOperation | null) => void;
  setAccount: (account: GoogleWorkspaceAccount) => void;
  setModules: (modules: Partial<Record<GoogleWorkspaceModule, boolean>>) => void;
  markSyncSuccess: (module: GoogleWorkspaceModule, timestamp?: number) => void;
  markSyncFailure: (module: GoogleWorkspaceModule, message: string, timestamp?: number) => void;
  setError: (message: string | null) => void;
  clearAccount: () => void;
};

function snapshotFromState(state: GoogleWorkspaceState): PersistedGoogleWorkspaceState {
  return {
    account: state.account,
    status: state.status,
    lastError: state.lastError,
  };
}

export const useGoogleWorkspaceSettings = create<GoogleWorkspaceState>((set, get) => {
  const persist = async () => {
    const snapshot = snapshotFromState(get());
    await saveGoogleWorkspaceState(snapshot);
  };

  return {
    account: null,
    status: 'disconnected',
    lastError: null,
    pending: null,
    isHydrated: false,
    hydrate: async () => {
      if (get().isHydrated) return;
      const persisted = await loadGoogleWorkspaceState();
      if (persisted) {
        set({
          account: persisted.account as GoogleWorkspaceAccount | null,
          status: persisted.status,
          lastError: persisted.lastError,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    },
    setConnecting: (context) => {
      set({
        status: 'connecting',
        pending: { kind: 'connect', startedAt: Date.now(), context },
        lastError: null,
      });
    },
    setPending: (pending) => {
      set({ pending });
    },
    setAccount: (account) => {
      set({ account, status: 'connected', pending: null, lastError: null });
      void persist();
    },
    setModules: (modules) => {
      set((state) => {
        if (!state.account) return state;
        const nextModules = {
          ...state.account.modules,
          ...modules,
        };
        return {
          account: {
            ...state.account,
            modules: nextModules,
          },
        } as Partial<GoogleWorkspaceState>;
      });
      void persist();
    },
    markSyncSuccess: (module, timestamp = Date.now()) => {
      set((state) => {
        if (!state.account) return state;
        const nextStatus = {
          ...state.account.syncStatus,
          [module]: {
            lastSuccessAt: timestamp,
            lastErrorAt: null,
            lastError: null,
          },
        };
        return {
          account: {
            ...state.account,
            syncStatus: nextStatus,
          },
        } as Partial<GoogleWorkspaceState>;
      });
    },
    markSyncFailure: (module, message, timestamp = Date.now()) => {
      set((state) => {
        if (!state.account) return state;
        const nextStatus = {
          ...state.account.syncStatus,
          [module]: {
            lastSuccessAt: state.account.syncStatus[module]?.lastSuccessAt ?? null,
            lastErrorAt: timestamp,
            lastError: message,
          },
        };
        return {
          account: {
            ...state.account,
            syncStatus: nextStatus,
          },
        } as Partial<GoogleWorkspaceState>;
      });
      void persist();
    },
    setError: (message) => {
      set({
        lastError: message,
        status: message ? 'error' : 'connected',
        pending: null,
      });
      void persist();
    },
    clearAccount: () => {
      set({
        account: null,
        status: 'disconnected',
        pending: null,
        lastError: null,
      });
      void persist();
      void clearGoogleWorkspaceState();
    },
  };
});

export function buildMockAccount(email: string): GoogleWorkspaceAccount {
  const now = Date.now();
  return {
    email,
    displayName: null,
    photoUrl: null,
    scopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
    ],
    connectedAt: now,
    modules: {
      mail: true,
      calendar: true,
      tasks: true,
    },
    token: {
      refreshToken: null,
      accessToken: null,
      accessTokenExpiresAt: null,
      lastRefreshAt: null,
    },
    syncStatus: {
      mail: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
      calendar: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
      tasks: { lastSuccessAt: null, lastErrorAt: null, lastError: null },
    },
  };
}

export function isGoogleWorkspaceAvailable(): boolean {
  return isTauriRuntime() || typeof window !== 'undefined';
}

export function getGoogleWorkspaceAccount(): GoogleWorkspaceAccount | null {
  return useGoogleWorkspaceSettings.getState().account;
}

export function isGoogleWorkspaceModuleEnabled(module: GoogleWorkspaceModule): boolean {
  const account = useGoogleWorkspaceSettings.getState().account;
  return Boolean(account?.modules[module]);
}

export function getGoogleWorkspaceTokens() {
  const account = useGoogleWorkspaceSettings.getState().account;
  if (!account) return null;
  return account.token;
}

export function useGoogleWorkspaceModuleEnabled(module: GoogleWorkspaceModule): boolean {
  return useGoogleWorkspaceSettings((state) => Boolean(state.account?.modules[module]));
}
