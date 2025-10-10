import { invoke } from '@tauri-apps/api/core';
import { LLMProvider, Intent, TaskIntent, NoteIntent, EventIntent, WritingToolResult } from './types';
import { useProviderSettings } from '../../modules/settings/state/providerSettings';
import type { ProviderId } from '../../modules/settings/state/providerSettings';
import { parseJSONSafely, sanitizeLLMText } from './llmSanitizer';

/**
 * Generic OpenAI-compatible provider
 * Works with: OpenRouter, GLM, OpenAI, DeepSeek, Gemini, Anthropic (via OpenAI-compatible endpoints)
 */
export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private providerId: ProviderId;

  constructor(apiKey: string, baseUrl: string, model: string, providerId: ProviderId) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.providerId = providerId;
  }

  /**
   * Call OpenAI-compatible completion API (non-streaming) via Tauri backend
   */
  private async complete(messages: Array<{ role: string; content: string }>, temperature = 0.1, maxTokens = 500): Promise<string> {
    try {
      console.log(`[OpenAIProvider] Calling openai_complete:`, {
        provider: this.providerId,
        model: this.model,
        baseUrl: this.baseUrl,
        messageCount: messages.length,
      });

      const response = await invoke<string>('openai_complete', {
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        messages,
        temperature,
        maxTokens,
      });

      console.log(`[OpenAIProvider] Response received:`, response.substring(0, 100));
      // Sanitize the response before returning
      return sanitizeLLMText(response);
    } catch (error) {
      console.error(`[OpenAIProvider] Completion error:`, error);
      throw error;
    }
  }

  /**
   * Classify user input into an intent
   */
  async classifyIntent(input: string): Promise<Intent> {
    if (!input || input.trim().length === 0) {
      return {
        type: 'unknown',
        confidence: 0,
        originalInput: input,
        extracted: {},
      };
    }

    const messages = [
      {
        role: 'system',
        content: `You are an intent classifier. Analyze the user's input and determine if they want to:
- CREATE A TASK: Action items, todos, reminders with deadlines
- CREATE A NOTE: Information to save, thoughts, reference material
- CREATE AN EVENT: Appointments, meetings, calendar items with specific date/time

CRITICAL CLASSIFICATION RULES:
1. If starts with "remember", "remind", "don't forget" → ALWAYS classify as TASK (even with date/time)
2. If it's about doing something (action verb) → usually TASK
3. Appointments, meetings, scheduled activities → EVENT (UNLESS it starts with remember/remind)
4. Social plans (lunch, dinner, coffee) with specific time → EVENT (UNLESS it starts with remember/remind)
5. Information to save without action → NOTE

Examples:
- "Remember to call dentist tomorrow at 2pm" → TASK (starts with "remember")
- "Remind me to submit report by Friday 5pm" → TASK (starts with "remind")
- "Remember dentist appointment tomorrow at 2pm" → TASK (starts with "remember")
- "Remind Sarah about meeting Monday 3pm" → TASK (starts with "remind")
- "Dentist appointment tomorrow at 2pm" → EVENT (it's an appointment, no remember/remind)
- "Meeting with Sarah Monday 3pm" → EVENT (it's a meeting, no remember/remind)

Respond with a JSON object containing EXACTLY these fields:
{
  "type": "task" or "note" or "event" or "unknown",
  "confidence": number between 0 and 1,
  "title": "extracted title",
  "description": "additional details if any",
  "dueDate": "YYYY-MM-DD format for tasks",
  "date": "natural language date like 'monday' or 'tomorrow' for events",
  "startTime": "HH:MM in 24-hour format for events",
  "endTime": "HH:MM in 24-hour format for events"
}`,
      },
      {
        role: 'user',
        content: input,
      },
    ];

    try {
      const response = await this.complete(messages, 0.1, 150); // Reduced to avoid truncation
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('[OpenAIProvider] No JSON found in response:', response);
        return { 
          type: 'unknown', 
          confidence: 0, 
          originalInput: input,
          extracted: {},
        };
      }

      // Use safe JSON parsing with fallback
      const parsed = parseJSONSafely<any>(jsonMatch[0], undefined, {
        type: 'unknown',
        confidence: 0,
        title: input,
      });
      
      if (!parsed) {
        return { 
          type: 'unknown', 
          confidence: 0, 
          originalInput: input,
          extracted: {},
        };
      }
      
      const intentType = parsed.type?.toLowerCase();

      // Map to our intent types
      if (intentType === 'task') {
        return {
          type: 'task',
          confidence: parsed.confidence || 0.8,
          originalInput: input,
          extracted: {
            title: parsed.title || input,
            dueDate: parsed.dueDate,
            notes: parsed.description,
          },
        };
      } else if (intentType === 'note') {
        return {
          type: 'note',
          confidence: parsed.confidence || 0.8,
          originalInput: input,
          extracted: {
            title: parsed.title,
            body: parsed.description || input,
          },
        };
      } else if (intentType === 'event') {
        return {
          type: 'event',
          confidence: parsed.confidence || 0.8,
          originalInput: input,
          extracted: {
            title: parsed.title || input,
            date: parsed.date || '', // Use 'date' not 'eventDate'
            startTime: parsed.startTime, // Use 'startTime' not 'eventTime'
            endTime: parsed.endTime,
            notes: parsed.description,
          },
        };
      }

      return { 
        type: 'unknown', 
        confidence: 0, 
        originalInput: input,
        extracted: {},
      };
    } catch (error) {
      console.error('[OpenAIProvider] Intent classification error:', error);
      return {
        type: 'unknown',
        confidence: 0,
        originalInput: input,
        extracted: {},
      };
    }
  }

  /**
   * Run a writing tool on selected text
   */
  async runWritingTool(tool: string, text: string, targetLanguage?: string, formality?: 'formal' | 'informal'): Promise<WritingToolResult> {
    let systemPrompt = '';
    
    switch (tool) {
      case 'professional':
        systemPrompt = 'Rewrite the following text in a professional, formal tone. Maintain the core message but elevate the language. Return ONLY the rewritten text, no explanations.';
        break;
      case 'friendly':
        systemPrompt = 'Rewrite the following text in a warm, friendly, conversational tone. Keep it approachable and personable. Return ONLY the rewritten text, no explanations.';
        break;
      case 'concise':
        systemPrompt = 'Make the following text more concise while preserving all key information. Remove unnecessary words and redundancy. Return ONLY the shortened text, no explanations.';
        break;
      case 'expand':
        systemPrompt = 'Expand the following text with more detail, examples, and context. Make it more comprehensive and thorough. Return ONLY the expanded text, no explanations.';
        break;
      case 'proofread':
        systemPrompt = 'Proofread and correct any spelling, grammar, or punctuation errors in the following text. Return ONLY the corrected text, no explanations.';
        break;
      case 'summarize':
        systemPrompt = 'Summarize the following text into key points. Be concise but capture the main ideas. Return ONLY the summary, no explanations.';
        break;
      case 'translate':
        const formalityNote = formality === 'formal' ? ' Use formal language and respectful tone.' : formality === 'informal' ? ' Use casual, informal language.' : '';
        systemPrompt = `Translate the following text to ${targetLanguage}.${formalityNote} Return ONLY the translation, no explanations.`;
        break;
      case 'explain':
        systemPrompt = 'Explain the following text in simpler terms. Make it easier to understand. Return ONLY the explanation, no meta-commentary.';
        break;
      case 'list':
        systemPrompt = 'Convert the following text into a clear, organized bullet-point list. Return ONLY the list, no explanations.';
        break;
      case 'extract':
        systemPrompt = 'Extract key information, dates, names, or important details from the following text. Present them in a clear format. Return ONLY the extracted information, no explanations.';
        break;
      default:
        throw new Error(`Unknown writing tool: ${tool}`);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ];

    try {
      const result = await this.complete(messages, 0.3, 1000);
      return {
        text: result.trim(),
        tool,
      };
    } catch (error) {
      console.error(`[OpenAIProvider] Writing tool error:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create provider from settings
 */
export function createProviderFromSettings(): LLMProvider {
  const state = useProviderSettings.getState();
  const providerId = state.assistantProvider;
  const modelOverride = state.assistantModel;

  if (!providerId) {
    throw new Error('No assistant provider configured. Please select one in Settings.');
  }

  const config = state.providers[providerId];
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error(`${providerId.toUpperCase()} API key not configured. Please add it in Settings.`);
  }

  // Determine which model to use
  let model: string;
  if (modelOverride) {
    model = modelOverride;
  } else if (config.defaultModel) {
    model = config.defaultModel;
  } else {
    throw new Error(`No model configured for ${providerId}`);
  }

  // Determine base URL
  const baseUrl = config.baseUrl || getDefaultBaseUrl(providerId);

  console.log(`[ProviderFactory] Creating ${providerId} provider:`, {
    model,
    baseUrl,
  });

  // Create appropriate provider based on type
  if (providerId === 'mistral') {
    // Use Mistral-specific provider if available
    const { MistralProvider } = require('./mistralProvider');
    return new MistralProvider(config.apiKey, baseUrl, model);
  } else {
    // Use generic OpenAI-compatible provider
    return new OpenAIProvider(config.apiKey, baseUrl, model, providerId);
  }
}

function getDefaultBaseUrl(providerId: ProviderId): string {
  const defaults: Record<ProviderId, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    deepseek: 'https://api.deepseek.com/v1',
    mistral: 'https://api.mistral.ai/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1',
    deepl: 'https://api-free.deepl.com',
    glm: 'https://open.bigmodel.cn/api/paas/v4',
  };
  
  return defaults[providerId] || 'https://api.openai.com/v1';
}
