import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'openrouter'
  | 'deepseek'
  | 'mistral'
  | 'gemini'
  | 'deepl'
  | 'glm'
  | 'local';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  availableModels: string[];
  enabledModels: string[];
  // Connection state persistence
  connectionState?: 'not_configured' | 'not_verified' | 'connected' | 'failed' | 'testing';
  lastCheckedAt?: number | null;
  lastError?: string | null;
}

const DEFAULT_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: { apiKey: '', baseUrl: '', defaultModel: 'gpt-4o-mini', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  anthropic: { apiKey: '', baseUrl: '', defaultModel: 'claude-3-5-sonnet-latest', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  openrouter: { apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openrouter/auto', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  deepseek: { apiKey: '', baseUrl: '', defaultModel: 'deepseek-chat', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  mistral: { apiKey: '', baseUrl: '', defaultModel: 'mistral-small-latest', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  gemini: { apiKey: '', baseUrl: '', defaultModel: 'gemini-1.5-flash', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  deepl: { apiKey: '', baseUrl: 'https://api-free.deepl.com', defaultModel: '', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  glm: { apiKey: '', baseUrl: 'https://api.z.ai/api/paas/v4', defaultModel: 'glm-4.6', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
  local: { apiKey: '', baseUrl: 'http://127.0.0.1:11434', defaultModel: '', availableModels: [], enabledModels: [], connectionState: 'not_configured', lastCheckedAt: null, lastError: null },
};

type ProviderSettingsState = {
  providers: Record<ProviderId, ProviderConfig>;
  assistantProvider: ProviderId | null;
  assistantModel: string | null;
  fallbackProvider: ProviderId | null;
  fallbackModel: string | null;
  updateProvider: (id: ProviderId, config: Partial<ProviderConfig>) => void;
  resetProvider: (id: ProviderId) => void;
  setAssistantProvider: (id: ProviderId | null) => void;
  setAssistantModel: (model: string | null) => void;
  setFallbackProvider: (id: ProviderId | null) => void;
  setFallbackModel: (model: string | null) => void;
};

const fallbackStorage: Storage = {
  get length() {
    return 0;
  },
  clear() {},
  getItem(_key: string) {
    return null;
  },
  key() {
    return null;
  },
  removeItem(_key: string) {},
  setItem(_key: string, _value: string) {},
};

const storage = createJSONStorage<ProviderSettingsState>(() => {
  if (typeof window === 'undefined') {
    return fallbackStorage;
  }
  return window.localStorage;
});

export const useProviderSettings = create(
  persist<ProviderSettingsState>(
    (set, get) => ({
      providers: DEFAULT_PROVIDERS,
      assistantProvider: null,
      assistantModel: null,
      fallbackProvider: null,
      fallbackModel: null,
      updateProvider: (id, config) => {
        set((state) => {
          const updated = {
            providers: {
              ...state.providers,
              [id]: {
                ...state.providers[id],
                ...config,
              },
            },
          };
          console.log(`[providerSettings] updateProvider(${id}):`, {
            configUpdate: config,
            resultingProvider: updated.providers[id],
          });
          return updated;
        });
      },
      resetProvider: (id) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [id]: DEFAULT_PROVIDERS[id],
          },
        }));
      },
      setAssistantProvider: (id) => {
        set({ assistantProvider: id });
      },
      setAssistantModel: (model) => {
        set({ assistantModel: model });
      },
      setFallbackProvider: (id) => {
        set({ fallbackProvider: id });
      },
      setFallbackModel: (model) => {
        set({ fallbackModel: model });
      },
    }),
    {
      name: 'provider-settings-v1',
      version: 1,
      storage,
      migrate: (persistedState: any, version: number) => {
        // Migration from v1 to v2: add fallback fields
        if (version < 2) {
          return {
            ...persistedState,
            fallbackProvider: null,
            fallbackModel: null,
          };
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProviderSettingsState>;
        const persistedProviders = (persisted.providers ?? {}) as Partial<Record<ProviderId, Partial<ProviderConfig>>>;
        
        // Deep merge per provider to preserve default baseUrl, defaultModel, etc.
        const mergedProviders = (Object.keys(DEFAULT_PROVIDERS) as ProviderId[]).reduce(
          (acc, providerId) => {
            acc[providerId] = {
              ...DEFAULT_PROVIDERS[providerId],
              ...(persistedProviders[providerId] || {}),
            };
            return acc;
          },
          {} as Record<ProviderId, ProviderConfig>
        );
        
        return {
          ...currentState,
          providers: mergedProviders,
          assistantProvider: persisted.assistantProvider ?? null,
          assistantModel: persisted.assistantModel ?? null,
          fallbackProvider: persisted.fallbackProvider ?? null,
          fallbackModel: persisted.fallbackModel ?? null,
        };
      },
    },
  ),
);

export function getProviderDefaults(): Record<ProviderId, ProviderConfig> {
  return { ...DEFAULT_PROVIDERS };
}

export function getMistralConfig() {
  const state = useProviderSettings.getState();
  return state.providers.mistral;
}
