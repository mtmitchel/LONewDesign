import { z } from "zod";

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderId =
  | "openai"
  | "anthropic"
  | "mistral"
  | "openrouter"
  | "deepseek"
  | "gemini"
  | "deepl"
  | "glm"
  | "local";

export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  baseUrl?: string;
  model: string;
}

// ============================================================================
// Intent Classification Types
// ============================================================================

export type IntentType = "task" | "note" | "event" | "unknown";

export interface BaseIntent {
  type: IntentType;
  confidence: number;
  originalInput: string;
}

export interface TaskIntent extends BaseIntent {
  type: "task";
  extracted: {
    title: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
    notes?: string;
  };
}

export interface NoteIntent extends BaseIntent {
  type: "note";
  extracted: {
    title?: string;
    body: string;
  };
}

export interface EventIntent extends BaseIntent {
  type: "event";
  extracted: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
  };
}

export interface UnknownIntent extends BaseIntent {
  type: "unknown";
  extracted: Record<string, never>;
}

export type Intent = TaskIntent | NoteIntent | EventIntent | UnknownIntent;

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const BaseIntentSchema = z.object({
  confidence: z.number().min(0).max(1),
});

export const TaskIntentSchema = BaseIntentSchema.extend({
  intent: z.literal("task"),
  extracted: z.object({
    title: z.string().min(1),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    notes: z.string().optional(),
  }),
});

export const NoteIntentSchema = BaseIntentSchema.extend({
  intent: z.literal("note"),
  extracted: z.object({
    title: z.string().optional(),
    body: z.string(),
  }),
});

export const EventIntentSchema = BaseIntentSchema.extend({
  intent: z.literal("event"),
  extracted: z.object({
    title: z.string().min(1),
    date: z.string().min(1),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const UnknownIntentSchema = BaseIntentSchema.extend({
  intent: z.literal("unknown"),
  extracted: z.object({}),
});

export const IntentResponseSchema = z.union([
  TaskIntentSchema,
  NoteIntentSchema,
  EventIntentSchema,
  UnknownIntentSchema,
]);

// ============================================================================
// LLM Provider Interface
// ============================================================================

export interface LLMProvider {
  /**
   * Classify user input into an intent (task, note, event, or unknown)
   * @param input The user's natural language input
   * @returns Promise resolving to classified Intent
   */
  classifyIntent(input: string): Promise<Intent>;

  /**
   * Run a writing tool on selected text
   * @param tool The tool name (e.g., "summarize", "translate")
   * @param text The selected text to transform
   * @param targetLanguage Optional target language for translation
   * @param formality Optional formality level for translation
   * @returns Promise resolving to writing tool result
   */
  runWritingTool(tool: string, text: string, targetLanguage?: string, formality?: 'formal' | 'informal'): Promise<WritingToolResult>;

  /**
   * Ask the AI a question with optional context
   * @param question The user's question
   * @param context Optional context to include
   * @returns AsyncGenerator yielding response chunks
   */
  askAI?(question: string, context?: string): AsyncGenerator<string>;
}

// ============================================================================
// Writing Tool Types (for Phase 2)
// ============================================================================

export type WritingToolId =
  | "professional-tone"
  | "friendly-tone"
  | "make-concise"
  | "expand"
  | "proofread"
  | "summarize"
  | "translate"
  | "explain"
  | "create-list"
  | "extract-key-points";

export interface WritingTool {
  id: WritingToolId;
  label: string;
  description: string;
  icon?: string;
  requiresOptions?: boolean;
  execute: (text: string, options?: Record<string, unknown>) => Promise<string>;
}

export interface WritingToolResult {
  text: string;
  tool: string;
}

// ============================================================================
// Message Types (for conversation history)
// ============================================================================

export type MessageRole = "system" | "user" | "assistant";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class IntentClassificationError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
    public recoverable = true
  ) {
    super(message);
    this.name = "IntentClassificationError";
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(public providerId: ProviderId) {
    super(`Provider ${providerId} is not configured. Please add API key in Settings.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = "ProviderAPIError";
  }
}
