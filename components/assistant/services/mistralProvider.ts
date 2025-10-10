import { invoke } from '@tauri-apps/api/core';
import {
  Intent,
  IntentResponseSchema,
  IntentClassificationError,
  ProviderAPIError,
  LLMProvider,
  Message,
} from './types';
import { useProviderSettings } from '../../modules/settings/state/providerSettings';

const INTENT_CLASSIFICATION_SYSTEM_PROMPT = `You are an intent classifier for a productivity assistant. Classify user input into: task, note, event, or unknown.

━━━ EVENTS (scheduled, time-bound, often with others) ━━━
Keywords: meeting, appointment, scheduled, conference, call with, lunch with, dinner with, visit, class, practice, rehearsal, session, interview
Indicators:
- Specific time mentioned (2pm, 10am, "at 3", etc.)
- Involves coordination with others ("with John", "team meeting")
- Location mentioned ("at the office", "at Starbucks")
- Event-specific nouns (appointment, meeting, conference, lunch, dinner)
Examples:
✓ "Dentist appointment Tuesday 2pm" → event
✓ "Team meeting tomorrow at 10am" → event
✓ "Lunch with Sarah Friday noon" → event
✓ "Coffee with Alex tomorrow 3pm" → event

━━━ TASKS (action items, flexible completion) ━━━
Keywords: remind me to, need to, have to, should, todo, task, must, don't forget to
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
 * Extract JSON from LLM response, handling code blocks and extra text
 */
function extractJSON(text: string): string {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Return as-is if no patterns match
  return text;
}

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

      // Extract JSON from response
      const jsonStr = extractJSON(response);
      console.log('[MistralProvider] Extracted JSON:', jsonStr);

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[MistralProvider] JSON parse error:', parseError);
        throw new IntentClassificationError(
          'Failed to parse LLM response as JSON',
          parseError,
          true
        );
      }

      // Validate with Zod
      const validationResult = IntentResponseSchema.safeParse(parsed);
      if (!validationResult.success) {
        console.error('[MistralProvider] Validation error:', validationResult.error);
        throw new IntentClassificationError(
          `Invalid intent response: ${validationResult.error.message}`,
          validationResult.error,
          true
        );
      }

      const validated = validationResult.data;
      console.log('[MistralProvider] ✅ Classified as:', validated.intent, 'with confidence:', validated.confidence);
      console.log('[MistralProvider] Extracted data:', JSON.stringify(validated.extracted, null, 2));

      // Apply confidence threshold
      if (validated.confidence < 0.6) {
        console.log('[MistralProvider] Low confidence, returning unknown intent');
        return {
          type: 'unknown',
          confidence: validated.confidence,
          originalInput: input,
          extracted: {},
        };
      }

      // Map validated response to Intent type based on discriminated union
      let intent: Intent;
      
      switch (validated.intent) {
        case 'task':
          intent = {
            type: 'task',
            confidence: validated.confidence,
            originalInput: input,
            extracted: validated.extracted,
          } as Intent;
          break;
        case 'note':
          intent = {
            type: 'note',
            confidence: validated.confidence,
            originalInput: input,
            extracted: validated.extracted,
          } as Intent;
          break;
        case 'event':
          intent = {
            type: 'event',
            confidence: validated.confidence,
            originalInput: input,
            extracted: validated.extracted,
          } as Intent;
          break;
        default:
          intent = {
            type: 'unknown',
            confidence: validated.confidence,
            originalInput: input,
            extracted: {},
          };
      }

      return intent;
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
   * Run a writing tool (Phase 2 - not implemented yet)
   */
  async runTool(
    tool: string,
    text: string,
    options?: Record<string, unknown>
  ): Promise<string> {
    throw new Error('Writing tools not implemented yet (Phase 2)');
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
  const config = useProviderSettings.getState().providers.mistral;
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('Mistral API key not configured. Please add it in Settings.');
  }

  return new MistralProvider(
    config.apiKey,
    config.baseUrl || undefined,
    config.defaultModel || undefined
  );
}
