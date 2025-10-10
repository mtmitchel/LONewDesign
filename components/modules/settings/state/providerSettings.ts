import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ProviderId = 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'mistral' | 'gemini' | 'deepl' | 'glm';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  availableModels: string[];
  enabledModels: string[];
}

const DEFAULT_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openai: { apiKey: '', baseUrl: '', defaultModel: 'gpt-4o-mini', availableModels: [], enabledModels: [] },
  anthropic: { apiKey: '', baseUrl: '', defaultModel: 'claude-3-5-sonnet-latest', availableModels: [], enabledModels: [] },
  openrouter: { apiKey: '', baseUrl: '', defaultModel: 'openrouter/auto', availableModels: [], enabledModels: [] },
  deepseek: { apiKey: '', baseUrl: '', defaultModel: 'deepseek-chat', availableModels: [], enabledModels: [] },
  mistral: { apiKey: '', baseUrl: '', defaultModel: 'mistral-small-latest', availableModels: [], enabledModels: [] },
  gemini: { apiKey: '', baseUrl: '', defaultModel: 'gemini-1.5-flash', availableModels: [], enabledModels: [] },
  deepl: { apiKey: '', baseUrl: 'https://api-free.deepl.com', defaultModel: '', availableModels: [], enabledModels: [] },
  glm: { apiKey: '', baseUrl: 'https://api.z.ai/api/paas/v4', defaultModel: 'glm-4.6', availableModels: [], enabledModels: [] },
};

type ProviderSettingsState = {
  providers: Record<ProviderId, ProviderConfig>;
  assistantProvider: ProviderId | null;
  updateProvider: (id: ProviderId, config: Partial<ProviderConfig>) => void;
  resetProvider: (id: ProviderId) => void;
  setAssistantProvider: (id: ProviderId | null) => void;
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
      updateProvider: (id, config) => {
        set((state) => ({
          providers: {
            ...state.providers,
            [id]: {
              ...state.providers[id],
              ...config,
            },
          },
        }));
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
    }),
    {
      name: 'provider-settings-v1',
      version: 1,
      storage,
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProviderSettingsState>;
        const providers = persisted.providers ?? {};
        return {
          ...currentState,
          providers: {
            ...DEFAULT_PROVIDERS,
            ...providers,
          },
          assistantProvider: persisted.assistantProvider ?? null,
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
