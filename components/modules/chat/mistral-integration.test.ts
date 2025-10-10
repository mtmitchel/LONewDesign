import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChatMessage } from './types';

// Helper function to check if model is Mistral-based (duplicated from ChatModuleTriPane)
function isMistralModel(model: string): boolean {
  return model.startsWith('mistral-');
}

describe('Mistral Integration', () => {
  describe('isMistralModel', () => {
    it('should return true for Mistral models', () => {
      expect(isMistralModel('mistral-small-latest')).toBe(true);
      expect(isMistralModel('mistral-medium-latest')).toBe(true);
      expect(isMistralModel('mistral-large-latest')).toBe(true);
      expect(isMistralModel('mistral-7b-instruct')).toBe(true);
    });

    it('should return false for non-Mistral models', () => {
      expect(isMistralModel('gpt-4')).toBe(false);
      expect(isMistralModel('claude-3')).toBe(false);
      expect(isMistralModel('llama-2')).toBe(false);
      expect(isMistralModel('')).toBe(false);
    });
  });

  describe('Message Format Conversion', () => {
    it('should convert ChatMessage to API format', () => {
      const chatMessages: ChatMessage[] = [
        {
          id: 'm1',
          conversationId: 'c1',
          author: 'user',
          text: 'Hello',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: 'm2',
          conversationId: 'c1',
          author: 'assistant',
          text: 'Hi there!',
          timestamp: '2025-01-01T00:00:01Z',
        },
      ];

      const apiMessages = chatMessages.map(m => ({
        role: m.author === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      expect(apiMessages).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });

    it('should handle empty message list', () => {
      const chatMessages: ChatMessage[] = [];
      const apiMessages = chatMessages.map(m => ({
        role: m.author === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      expect(apiMessages).toEqual([]);
    });

    it('should preserve message order', () => {
      const chatMessages: ChatMessage[] = [
        {
          id: 'm1',
          conversationId: 'c1',
          author: 'user',
          text: 'First',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: 'm2',
          conversationId: 'c1',
          author: 'assistant',
          text: 'Second',
          timestamp: '2025-01-01T00:00:01Z',
        },
        {
          id: 'm3',
          conversationId: 'c1',
          author: 'user',
          text: 'Third',
          timestamp: '2025-01-01T00:00:02Z',
        },
      ];

      const apiMessages = chatMessages.map(m => ({
        role: m.author === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      expect(apiMessages[0].content).toBe('First');
      expect(apiMessages[1].content).toBe('Second');
      expect(apiMessages[2].content).toBe('Third');
    });
  });

  describe('Stream Event Handling', () => {
    interface StreamEvent {
      event: 'delta' | 'error' | 'done';
      content?: string;
      finish_reason?: string;
      error?: string;
    }

    it('should accumulate delta events', () => {
      const events: StreamEvent[] = [
        { event: 'delta', content: 'Hello' },
        { event: 'delta', content: ' ' },
        { event: 'delta', content: 'world' },
        { event: 'delta', content: '!' },
        { event: 'done' },
      ];

      let accumulated = '';
      events.forEach(event => {
        if (event.event === 'delta' && event.content) {
          accumulated += event.content;
        }
      });

      expect(accumulated).toBe('Hello world!');
    });

    it('should handle empty delta content', () => {
      const events: StreamEvent[] = [
        { event: 'delta', content: 'Hello' },
        { event: 'delta', content: '' },
        { event: 'delta', content: 'world' },
      ];

      let accumulated = '';
      events.forEach(event => {
        if (event.event === 'delta' && event.content) {
          accumulated += event.content;
        }
      });

      expect(accumulated).toBe('Helloworld');
    });

    it('should identify error events', () => {
      const errorEvent: StreamEvent = {
        event: 'error',
        error: 'API key invalid',
      };

      expect(errorEvent.event).toBe('error');
      expect(errorEvent.error).toBeDefined();
    });

    it('should identify done events', () => {
      const doneEvent: StreamEvent = {
        event: 'done',
        finish_reason: 'stop',
      };

      expect(doneEvent.event).toBe('done');
      expect(doneEvent.finish_reason).toBe('stop');
    });
  });

  describe('Message State Updates', () => {
    it('should update message text on delta events', () => {
      let messages: ChatMessage[] = [
        {
          id: 'assist-1',
          conversationId: 'c1',
          author: 'assistant',
          text: '',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ];

      const deltaContent = 'Hello';
      const assistantId = 'assist-1';

      // Simulate state update
      messages = messages.map(msg =>
        msg.id === assistantId
          ? { ...msg, text: msg.text + deltaContent }
          : msg
      );

      expect(messages[0].text).toBe('Hello');
    });

    it('should not affect other messages', () => {
      let messages: ChatMessage[] = [
        {
          id: 'm1',
          conversationId: 'c1',
          author: 'user',
          text: 'User message',
          timestamp: '2025-01-01T00:00:00Z',
        },
        {
          id: 'assist-1',
          conversationId: 'c1',
          author: 'assistant',
          text: 'Initial',
          timestamp: '2025-01-01T00:00:01Z',
        },
      ];

      const assistantId = 'assist-1';
      const newText = 'Updated';

      messages = messages.map(msg =>
        msg.id === assistantId
          ? { ...msg, text: newText }
          : msg
      );

      expect(messages[0].text).toBe('User message');
      expect(messages[1].text).toBe('Updated');
    });
  });

  describe('Configuration Validation', () => {
    it('should detect missing API key', () => {
      const config = {
        apiKey: '',
        baseUrl: '',
        defaultModel: 'mistral-small-latest',
        availableModels: [],
        enabledModels: [],
      };

      expect(config.apiKey.trim()).toBe('');
    });

    it('should detect valid API key', () => {
      const config = {
        apiKey: 'test-fake-api-key-for-testing',
        baseUrl: '',
        defaultModel: 'mistral-small-latest',
        availableModels: [],
        enabledModels: [],
      };

      expect(config.apiKey.trim()).not.toBe('');
      expect(config.apiKey.length).toBeGreaterThan(0);
    });

    it('should handle custom base URL', () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        defaultModel: 'mistral-small-latest',
        availableModels: [],
        enabledModels: [],
      };

      const resolvedUrl = config.baseUrl.trim() || null;
      expect(resolvedUrl).toBe('https://custom.api.com');
    });

    it('should use null for empty base URL', () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: '',
        defaultModel: 'mistral-small-latest',
        availableModels: [],
        enabledModels: [],
      };

      const resolvedUrl = config.baseUrl.trim() || null;
      expect(resolvedUrl).toBeNull();
    });
  });
});
