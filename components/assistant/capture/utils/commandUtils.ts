import { CommandDefinition, AssistantCommand } from "../types";

// Command definitions
export const COMMANDS: CommandDefinition[] = [
  { id: "task", label: "/task", desc: "Create a task", icon: null },
  { id: "note", label: "/note", desc: "Save as note", icon: null },
  { id: "event", label: "/event", desc: "Create an event", icon: null },
  { id: "summarize", label: "/summarize", desc: "Summarize selection", icon: null },
];

export function deriveCommand(value: string): AssistantCommand {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return "capture";
  const commandToken = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  const match = COMMANDS.find((cmd) => cmd.label.slice(1) === commandToken);
  return match?.id ?? "capture";
}

export function shouldShowCommandRail(value: string) {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return false;
  return !trimmed.includes(" ");
}

export function filterCommands(value: string): CommandDefinition[] {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return COMMANDS;
  const search = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!search) return COMMANDS;
  return COMMANDS.filter((cmd) => cmd.label.slice(1).startsWith(search));
}

// Fast local intent detection using keywords (for instant feedback)
export function predictIntentLocally(text: string): "task" | "note" | "event" | null {
  const lower = text.toLowerCase().trim();
  
  if (lower.length < 5) return null;
  
  // CRITICAL: If starts with remember/remind, it's ALWAYS a task
  if (lower.startsWith('remember') || lower.startsWith('remind') || lower.startsWith("don't forget")) {
    return "task";
  }
  
  // Event patterns (only if NOT starting with remember/remind)
  const eventKeywords = [
    'appointment', 'meeting', 'lunch with', 'dinner with', 'coffee with',
    'call with', 'session', 'conference', 'interview', 'visit', 'class'
  ];
  const hasEventKeyword = eventKeywords.some(kw => lower.includes(kw));
  const hasTime = /\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)/.test(text) || /at \d/.test(lower);
  
  if (hasEventKeyword || hasTime) {
    return "event";
  }
  
  // Task patterns (action-oriented)
  const taskKeywords = [
    'need to', 'have to', 'should', 'todo', 'must'
  ];
  const taskVerbs = [
    'buy', 'call', 'email', 'write', 'create', 'submit', 'review',
    'draft', 'edit', 'follow up', 'complete', 'deliver', 'finish',
    'clean', 'fix', 'update', 'prepare', 'schedule', 'book', 'order', 'send'
  ];
  
  const hasTaskKeyword = taskKeywords.some(kw => lower.includes(kw));
  const startsWithTaskVerb = taskVerbs.some(verb => {
    const pattern = new RegExp(`^${verb}\\s`, 'i');
    return pattern.test(lower);
  });
  
  if (hasTaskKeyword || startsWithTaskVerb) {
    return "task";
  }
  
  // Note patterns (informational)
  const noteKeywords = [
    'note that', 'note to self', 'remember that', 'keep in mind',
    'fyi', 'noted', 'mentioned', 'said that'
  ];
  const hasNoteKeyword = noteKeywords.some(kw => lower.includes(kw));
  
  if (hasNoteKeyword) {
    return "note";
  }
  
  // Default: unknown
  return null;
}