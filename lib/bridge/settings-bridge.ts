import { invoke } from '@tauri-apps/api/core';

export interface MistralTestResult {
  ok: boolean;
  message?: string | null;
}

export interface OllamaConnectionTestResult {
  ok: boolean;
  message?: string | null;
}

export interface OllamaModel {
  name: string;
}

export interface MistralModel {
  id: string;
}

export interface OpenRouterModel {
  id: string;
}

/**
 * Bridge module for Tauri invoke calls related to settings and provider management
 */
export class SettingsBridge {
  /**
   * Test Mistral credentials
   */
  static async testMistralCredentials(apiKey: string, baseUrl: string): Promise<MistralTestResult> {
    return await invoke('test_mistral_credentials', {
      apiKey: apiKey.trim(),
      baseUrl,
    }) as MistralTestResult;
  }

  /**
   * Test Ollama connection
   */
  static async testOllamaConnection(baseUrl: string): Promise<OllamaConnectionTestResult> {
    return await invoke('test_ollama_connection', {
      baseUrl,
    }) as OllamaConnectionTestResult;
  }

  /**
   * Fetch Mistral models
   */
  static async fetchMistralModels(apiKey: string, baseUrl: string): Promise<MistralModel[]> {
    return await invoke('fetch_mistral_models', {
      apiKey: apiKey.trim(),
      baseUrl,
    }) as MistralModel[];
  }

  /**
   * Fetch OpenRouter models
   */
  static async fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
    return await invoke('fetch_openrouter_models', {
      apiKey: apiKey.trim(),
    }) as OpenRouterModel[];
  }

  /**
   * List Ollama models
   */
  static async listOllamaModels(baseUrl: string): Promise<OllamaModel[]> {
    return await invoke('ollama_list_models', {
      baseUrl,
    }) as OllamaModel[];
  }

  /**
   * Pull an Ollama model
   */
  static async pullOllamaModel(baseUrl: string, model: string): Promise<void> {
    return await invoke('ollama_pull_model', {
      baseUrl,
      model,
    });
  }

  /**
   * Delete an Ollama model
   */
  static async deleteOllamaModel(baseUrl: string, model: string): Promise<void> {
    return await invoke('ollama_delete_model', {
      baseUrl,
      model,
    });
  }
}

/**
 * Check if running in Tauri context
 */
export function isTauriContext(): boolean {
  if (typeof window === 'undefined') return false;
  const candidate = window as unknown as {
    __TAURI_INTERNALS__?: unknown;
    isTauri?: unknown;
    __TAURI__?: unknown;
  };
  return Boolean(candidate.__TAURI_INTERNALS__ ?? candidate.isTauri ?? candidate.__TAURI__);
}