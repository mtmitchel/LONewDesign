import { invoke } from '@tauri-apps/api/core';
import {
  type Intent,
  IntentClassificationError,
  IntentResponseSchema,
  LLMProvider,
} from './types';
import { parseJSONSafely, sanitizeLLMText } from './llmSanitizer';

const INTENT_PROMPT = `You are an intent classifier for a productivity assistant. Classify user input into: task, note, event, or unknown.

━━━ CRITICAL RULE: Messages starting with "remember", "remind", "don't forget" → ALWAYS classify as TASK ━━━

━━━ EVENTS (scheduled, time-bound, often with others) ━━━
Keywords: meeting, appointment, scheduled, conference, call with, lunch with, dinner with, visit, class, practice, rehearsal, session, interview
Indicators:
- Specific time mentioned (2pm, 10am, "at 3", etc.)
- Involves coordination with others ("with John", "team meeting")
- Location mentioned ("at the office", "at Starbucks")
- Event-specific nouns (appointment, meeting, conference, lunch, dinner)
- BUT: If starts with "remember", "remind", "don't forget" → classify as TASK instead

━━━ TASKS (action items, flexible completion) ━━━
Keywords: remember, remind, remind me to, need to, have to, should, todo, task, must, don't forget
Action verbs: buy, call, email, write, create, submit, review, draft, edit, follow up, complete, deliver, finish, clean, fix, update, prepare, schedule, book, order, send
Indicators:
- Starts with action verb
- Has "remind me to" or "need to" patterns
- Flexible due date (by Friday, this weekend, soon)
- Individual work, not coordinated with others

━━━ NOTES (informational, reference, no action) ━━━
Keywords: note that, remember that, note to self, keep in mind, FYI, documented, noticed, mentioned, meeting notes
Indicators:
- Past tense ("Sarah mentioned...", "John said...")
- Reference information (passwords, phone numbers, facts)
- No action verb or scheduled time
- Observational or documentary

Respond with ONLY valid JSON: {"intent": "...", "confidence": 0-1, "extracted": {...}}`;

export class OllamaProvider implements LLMProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  private async complete(
    messages: Array<{ role: string; content: string }>,
    temperature = 0.1,
    maxTokens = 512,
  ): Promise<string> {
    const response = await invoke<string>('ollama_complete', {
      baseUrl: this.baseUrl,
      model: this.model,
      messages,
      temperature,
      maxTokens,
    });
    return sanitizeLLMText(response);
  }

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
      { role: 'system', content: INTENT_PROMPT },
      { role: 'user', content: `Classify this input: "${input}"` },
    ];

    try {
      const response = await this.complete(messages, 0.1, 300);
      const parsed = parseJSONSafely(response, IntentResponseSchema, {
        intent: 'unknown',
        confidence: 0,
        extracted: {},
      });

      if (!parsed) {
        throw new IntentClassificationError('Failed to parse intent JSON', response, true);
      }

      switch (parsed.intent) {
        case 'task':
          return {
            type: 'task',
            confidence: parsed.confidence ?? 0.75,
            originalInput: input,
            extracted: parsed.extracted,
          };
        case 'note':
          return {
            type: 'note',
            confidence: parsed.confidence ?? 0.75,
            originalInput: input,
            extracted: parsed.extracted,
          };
        case 'event':
          return {
            type: 'event',
            confidence: parsed.confidence ?? 0.75,
            originalInput: input,
            extracted: parsed.extracted,
          };
        default:
          return {
            type: 'unknown',
            confidence: parsed.confidence ?? 0,
            originalInput: input,
            extracted: {},
          };
      }
    } catch (error) {
      console.error('[OllamaProvider] Intent classification error:', error);
      if (error instanceof IntentClassificationError) {
        throw error;
      }
      throw new IntentClassificationError(
        error instanceof Error ? error.message : 'Unknown intent classification error',
        error,
        true,
      );
    }
  }

  async runWritingTool(
    tool: string,
    text: string,
    targetLanguage?: string,
    formality?: 'formal' | 'informal',
  ) {
    let systemPrompt = '';

    switch (tool) {
      case 'professional':
        systemPrompt = 'Rewrite the following text in a professional, formal tone. Return ONLY the rewritten text.';
        break;
      case 'friendly':
        systemPrompt = 'Rewrite the following text in a warm, friendly tone. Return ONLY the rewritten text.';
        break;
      case 'concise':
        systemPrompt = 'Make the following text more concise while preserving meaning. Return ONLY the concise text.';
        break;
      case 'expand':
        systemPrompt = 'Expand the following text with additional helpful detail. Return ONLY the expanded text.';
        break;
      case 'proofread':
        systemPrompt = 'Correct any spelling or grammar issues in the following text. Return ONLY the corrected text.';
        break;
      case 'summarize':
        systemPrompt = 'Summarize the following text in 2-3 sentences. Return ONLY the summary.';
        break;
      case 'translate': {
        const style =
          formality === 'formal'
            ? 'Use formal language.'
            : formality === 'informal'
            ? 'Use informal language.'
            : '';
        systemPrompt = `Translate the following text to ${targetLanguage ?? 'the requested language'}. ${style} Return ONLY the translation.`;
        break;
      }
      case 'explain':
        systemPrompt = 'Explain the following text in simple, clear terms. Return ONLY the explanation.';
        break;
      case 'list':
        systemPrompt = 'Convert the following text into a bullet list. Return ONLY the list.';
        break;
      case 'extract':
        systemPrompt = 'Extract the key points from the following text. Return ONLY the extracted items.';
        break;
      default:
        throw new Error(`Unknown writing tool: ${tool}`);
    }

    const response = await this.complete(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      tool === 'summarize' ? 0.2 : 0.3,
      1200,
    );

    return {
      text: response.trim(),
      tool,
    };
  }
}
