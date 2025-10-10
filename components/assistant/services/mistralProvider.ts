import { invoke } from '@tauri-apps/api/core';
import {
  Intent,
  IntentType,
  IntentResponseSchema,
  IntentClassificationError,
  ProviderAPIError,
  LLMProvider,
  Message,
} from './types';
import { useProviderSettings } from '../../modules/settings/state/providerSettings';
import { parseJSONSafely, sanitizeLLMText } from './llmSanitizer';

const INTENT_CLASSIFICATION_SYSTEM_PROMPT = `You are an intent classifier for a productivity assistant. Classify user input into: task, note, event, or unknown.

━━━ CRITICAL RULE: Messages starting with "remember", "remind", "don't forget" → ALWAYS classify as TASK ━━━

━━━ EVENTS (scheduled, time-bound, often with others) ━━━
Keywords: meeting, appointment, scheduled, conference, call with, lunch with, dinner with, visit, class, practice, rehearsal, session, interview
Indicators:
- Specific time mentioned (2pm, 10am, "at 3", etc.)
- Involves coordination with others ("with John", "team meeting")
- Location mentioned ("at the office", "at Starbucks")
- Event-specific nouns (appointment, meeting, conference, lunch, dinner)
- BUT: If starts with "remember", "remind", "don't forget" → classify as TASK instead
Examples:
✓ "Dentist appointment Tuesday 2pm" → event
✓ "Team meeting tomorrow at 10am" → event
✓ "Lunch with Sarah Friday noon" → event
✓ "Coffee with Alex tomorrow 3pm" → event
✗ "Remember dentist appointment Tuesday 2pm" → task (starts with "remember")
✗ "Remind me about meeting tomorrow at 10am" → task (starts with "remind")

━━━ TASKS (action items, flexible completion) ━━━
Keywords: remember, remind, remind me to, need to, have to, should, todo, task, must, don't forget
Action verbs: buy, call, email, write, create, submit, review, draft, edit, follow up, complete, deliver, finish, clean, fix, update, prepare, schedule, book, order, send
Indicators:
- Starts with action verb
- Has "remind me to" or "need to" patterns
- Flexible due date (by Friday, this weekend, soon)
- Individual work, not coordinated with others
Examples:
✓ "Remind me to buy milk tomorrow" → task
✓ "Need to submit report by Friday" → task
✓ "Call dentist to schedule appointment" → task (calling is the action)
✓ "Fix the sink this weekend" → task
✓ "Have to finish presentation by Monday" → task

━━━ NOTES (informational, reference, no action) ━━━
Keywords: note that, remember that, note to self, keep in mind, FYI, documented, noticed, mentioned, meeting notes
Indicators:
- Past tense ("Sarah mentioned...", "John said...")
- Reference information (passwords, phone numbers, facts)
- No action verb or scheduled time
- Observational or documentary
Examples:
✓ "Note that John prefers email" → note
✓ "Remember WiFi password is ABC123" → note
✓ "Meeting notes from today's standup" → note (past event documentation)
✓ "Sarah mentioned she'll be on vacation" → note

CRITICAL: "Meeting notes" = note (past documentation) vs "Meeting at 2pm" = event (scheduled)

Return ONLY valid JSON with this exact structure:
{
  "intent": "task" | "note" | "event" | "unknown",
  "confidence": 0.0-1.0,
  "extracted": {
    // For task: { "title": string, "dueDate"?: string, "priority"?: "low"|"medium"|"high", "notes"?: string }
    // For note: { "title"?: string, "body": string }
    // For event: { "title": string, "date": string, "startTime"?: string, "endTime"?: string, "location"?: string, "notes"?: string }
    // For unknown: {}
  }
}

Examples:

TASKS:
Input: "Buy milk tomorrow"
Output: {"intent":"task","confidence":0.9,"extracted":{"title":"Buy milk","dueDate":"tomorrow"}}

Input: "Remind me to call dentist tomorrow"
Output: {"intent":"task","confidence":0.95,"extracted":{"title":"Call dentist","dueDate":"tomorrow"}}

Input: "Remember dentist appointment Saturday at 10am"
Output: {"intent":"task","confidence":0.95,"extracted":{"title":"Dentist appointment","dueDate":"Saturday at 10am"}}

Input: "Remind meeting with John Monday 3pm"
Output: {"intent":"task","confidence":0.95,"extracted":{"title":"Meeting with John","dueDate":"Monday 3pm"}}

Input: "Need to submit report by Friday"
Output: {"intent":"task","confidence":0.9,"extracted":{"title":"Submit report","dueDate":"Friday"}}

Input: "Have to fix the sink this weekend"
Output: {"intent":"task","confidence":0.9,"extracted":{"title":"Fix the sink","dueDate":"this weekend"}}

EVENTS:
Input: "Dentist appointment next Tuesday at 2pm"
Output: {"intent":"event","confidence":0.95,"extracted":{"title":"Dentist appointment","date":"next Tuesday","startTime":"2pm"}}

Input: "Team sync Friday 10am"
Output: {"intent":"event","confidence":0.95,"extracted":{"title":"Team sync","date":"Friday","startTime":"10am"}}

Input: "Lunch with Sarah tomorrow at noon"
Output: {"intent":"event","confidence":0.95,"extracted":{"title":"Lunch with Sarah","date":"tomorrow","startTime":"noon"}}

Input: "Coffee meeting with Alex next Monday 3pm"
Output: {"intent":"event","confidence":0.95,"extracted":{"title":"Coffee meeting with Alex","date":"next Monday","startTime":"3pm"}}

NOTES:
Input: "Meeting notes from standup"
Output: {"intent":"note","confidence":0.9,"extracted":{"title":"Meeting notes from standup","body":"Meeting notes from standup"}}

Input: "Note that John prefers email communication"
Output: {"intent":"note","confidence":0.95,"extracted":{"body":"John prefers email communication"}}

Input: "Remember WiFi password is ABC123"
Output: {"intent":"note","confidence":0.9,"extracted":{"title":"WiFi password","body":"WiFi password is ABC123"}}

UNKNOWN:
Input: "xyz random gibberish"
Output: {"intent":"unknown","confidence":0.2,"extracted":{}}

Respond with ONLY the JSON object, no markdown, no code blocks, no additional text.`;

/**
 * Mistral provider implementation using Tauri backend
 */
export class MistralProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.mistral.ai/v1';
    this.model = model || 'mistral-small-latest';
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

    const messages: Message[] = [
      {
        role: 'system',
        content: INTENT_CLASSIFICATION_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Classify this input: "${input}"`,
      },
    ];

    try {
      console.log('[MistralProvider] 🚀 Calling mistral_complete for intent classification');
      console.log('[MistralProvider] Input:', input);
      const response = await invoke<string>('mistral_complete', {
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.1, // Very low temperature for deterministic classification
        maxTokens: 500,
      });

      console.log('[MistralProvider] 📥 Raw API response:', response);

      // Parse JSON safely with fallback
      const parsed = parseJSONSafely(response, IntentResponseSchema, {
        intent: 'unknown',
        confidence: 0,
        extracted: {}
      });

      if (!parsed) {
        console.error('[MistralProvider] Failed to parse JSON response');
        throw new IntentClassificationError(
          'Failed to parse LLM response as JSON',
          undefined,
          true
        );
      }

      console.log('[MistralProvider] ✅ Classified as:', parsed.intent, 'with confidence:', parsed.confidence);
      console.log('[MistralProvider] Extracted data:', JSON.stringify(parsed.extracted, null, 2));

      // Apply confidence threshold
      if (parsed.confidence < 0.6) {
        console.log('[MistralProvider] Low confidence, returning unknown intent');
        return {
          type: 'unknown',
          confidence: parsed.confidence,
          originalInput: input,
          extracted: {},
        };
      }

      // Map the parsed response to Intent type (convert 'intent' field to 'type' field)
      const finalIntent: Intent = {
        type: parsed.intent as IntentType,
        confidence: parsed.confidence,
        originalInput: input,
        extracted: parsed.extracted as any, // Type assertion needed due to discriminated union
      } as Intent;

      return finalIntent;
    } catch (error) {
      console.error('[MistralProvider] Classification error:', error);

      if (error instanceof IntentClassificationError) {
        throw error;
      }

      // Handle Tauri invoke errors
      if (typeof error === 'string') {
        if (error.includes('Unauthorized') || error.includes('401')) {
          throw new ProviderAPIError('Invalid API key', 401, error);
        }
        throw new ProviderAPIError(error);
      }

      // Fallback to unknown intent on unexpected errors
      throw new IntentClassificationError(
        'Unexpected error during intent classification',
        error,
        false
      );
    }
  }

  /**
   * Run a writing tool on selected text
   */
  async runWritingTool(
    tool: string,
    text: string,
    targetLanguage?: string,
    formality?: 'formal' | 'informal'
  ): Promise<{ text: string; tool: string }> {
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
      { role: 'user', content: systemPrompt + '\n\n' + text },
    ];

    try {
      const response = await invoke<string>('mistral_complete', {
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        messages,
        temperature: 0.3,
        maxTokens: 2000,
      });
      
      // Sanitize the response before returning
      return {
        text: sanitizeLLMText(response),
        tool,
      };
    } catch (error) {
      console.error(`[MistralProvider] Writing tool error:`, error);
      throw error;
    }
  }

  /**
   * Ask the AI a question (Phase 2 - not implemented yet)
   */
  async *askAI(question: string, context?: string): AsyncGenerator<string> {
    throw new Error('Ask AI not implemented yet (Phase 2)');
  }
}

/**
 * Factory function to create a Mistral provider from settings
 */
export function createMistralProvider(): MistralProvider {
  const state = useProviderSettings.getState();
  const config = state.providers.mistral;
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('Mistral API key not configured. Please add it in Settings.');
  }

  // Use assistantModel if set, otherwise fall back to provider's defaultModel
  const model = state.assistantModel || config.defaultModel || undefined;

  return new MistralProvider(
    config.apiKey,
    config.baseUrl || undefined,
    model
  );
}
