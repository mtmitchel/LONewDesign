import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProviderSettings, getProviderDefaults, getMistralConfig } from './providerSettings';
import type { ProviderId } from './providerSettings';

describe('providerSettings store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { providers } = useProviderSettings.getState();
    Object.keys(providers).forEach((id) => {
      useProviderSettings.getState().resetProvider(id as ProviderId);
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have default configuration for all providers', () => {
      const { providers } = useProviderSettings.getState();
      
      expect(providers.mistral).toBeDefined();
      expect(providers.mistral.apiKey).toBe('');
      expect(providers.mistral.baseUrl).toBe('');
      expect(providers.mistral.defaultModel).toBe('mistral-small-latest');
      expect(providers.mistral.availableModels).toEqual([]);
      expect(providers.mistral.enabledModels).toEqual([]);
    });

    it('should have configurations for all provider types', () => {
      const { providers } = useProviderSettings.getState();
      
      expect(providers.openai).toBeDefined();
      expect(providers.anthropic).toBeDefined();
      expect(providers.openrouter).toBeDefined();
      expect(providers.deepseek).toBeDefined();
      expect(providers.mistral).toBeDefined();
      expect(providers.gemini).toBeDefined();
    });
  });

  describe('updateProvider', () => {
    it('should update API key for a provider', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      updateProvider('mistral', { apiKey: 'test-key-123' });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.mistral.apiKey).toBe('test-key-123');
    });

    it('should update multiple fields at once', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      updateProvider('mistral', {
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        availableModels: ['model-1', 'model-2'],
        enabledModels: ['model-1'],
      });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.mistral.apiKey).toBe('test-key');
      expect(providers.mistral.baseUrl).toBe('https://custom.api.com');
      expect(providers.mistral.availableModels).toEqual(['model-1', 'model-2']);
      expect(providers.mistral.enabledModels).toEqual(['model-1']);
    });

    it('should not affect other providers when updating one', () => {
      const { updateProvider, providers: initialProviders } = useProviderSettings.getState();
      const initialOpenAI = { ...initialProviders.openai };
      
      updateProvider('mistral', { apiKey: 'mistral-key' });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.openai).toEqual(initialOpenAI);
    });

    it('should preserve unmodified fields', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      updateProvider('mistral', { defaultModel: 'mistral-large-latest' });
      updateProvider('mistral', { apiKey: 'test-key' });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.mistral.defaultModel).toBe('mistral-large-latest');
      expect(providers.mistral.apiKey).toBe('test-key');
    });
  });

  describe('resetProvider', () => {
    it('should reset provider to default configuration', () => {
      const { updateProvider, resetProvider } = useProviderSettings.getState();
      
      // Make changes
      updateProvider('mistral', {
        apiKey: 'test-key',
        baseUrl: 'https://custom.com',
        availableModels: ['model-1'],
        enabledModels: ['model-1'],
      });
      
      // Reset
      resetProvider('mistral');
      
      const { providers } = useProviderSettings.getState();
      const defaults = getProviderDefaults();
      expect(providers.mistral).toEqual(defaults.mistral);
    });
  });

  describe('model management', () => {
    it('should handle available models list', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      const models = ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'];
      updateProvider('mistral', { availableModels: models });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.mistral.availableModels).toEqual(models);
    });

    it('should handle enabled models subset', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      const available = ['model-1', 'model-2', 'model-3'];
      const enabled = ['model-1', 'model-3'];
      
      updateProvider('mistral', {
        availableModels: available,
        enabledModels: enabled,
      });
      
      const { providers } = useProviderSettings.getState();
      expect(providers.mistral.enabledModels).toEqual(enabled);
    });

    it('should allow toggling individual models', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      updateProvider('mistral', {
        availableModels: ['model-1', 'model-2'],
        enabledModels: ['model-1'],
      });
      
      // Enable model-2
      const { providers: state1 } = useProviderSettings.getState();
      updateProvider('mistral', {
        enabledModels: [...state1.mistral.enabledModels, 'model-2'],
      });
      
      const { providers: state2 } = useProviderSettings.getState();
      expect(state2.mistral.enabledModels).toEqual(['model-1', 'model-2']);
      
      // Disable model-1
      updateProvider('mistral', {
        enabledModels: state2.mistral.enabledModels.filter(id => id !== 'model-1'),
      });
      
      const { providers: state3 } = useProviderSettings.getState();
      expect(state3.mistral.enabledModels).toEqual(['model-2']);
    });
  });

  describe('getMistralConfig', () => {
    it('should return current Mistral configuration', () => {
      const { updateProvider } = useProviderSettings.getState();
      
      updateProvider('mistral', {
        apiKey: 'test-key',
        baseUrl: 'https://api.mistral.ai/v1',
      });
      
      const config = getMistralConfig();
      expect(config.apiKey).toBe('test-key');
      expect(config.baseUrl).toBe('https://api.mistral.ai/v1');
    });
  });

  describe('getProviderDefaults', () => {
    it('should return default configurations', () => {
      const defaults = getProviderDefaults();
      
      expect(defaults.mistral.apiKey).toBe('');
      expect(defaults.mistral.defaultModel).toBe('mistral-small-latest');
      expect(defaults.mistral.availableModels).toEqual([]);
    });

    it('should not modify store when called', () => {
      const { providers: before } = useProviderSettings.getState();
      getProviderDefaults();
      const { providers: after } = useProviderSettings.getState();
      
      expect(before).toEqual(after);
    });
  });
});
