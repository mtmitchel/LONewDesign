"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { QuickNoteModal } from "../extended/QuickNoteModal";
import { QuickTaskModal } from "../extended/QuickTaskModal";
import { QuickEventModal } from "../extended/QuickEventModal";
import { AssistantCaptureDialog, type AssistantSubmitPayload } from "./AssistantCaptureDialog";
import { useTaskStore } from "../modules/tasks/taskStore";
import { createMistralProvider } from "./services/mistralProvider";
import { useProviderSettings } from "../modules/settings/state/providerSettings";

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const QUICK_ASSISTANT_EVENTS = {
  open: "quick-assistant:open",
  createNote: "quick-assistant:create-note",
  createEvent: "quick-assistant:create-event",
} as const;

export type QuickAssistantScope = {
  projectId?: string | null;
  folderId?: string | null;
  listId?: string | null;
  source?: string;
};

export type QuickAssistantMode = "capture" | "task" | "note" | "event";

export type OpenAssistantOptions = {
  mode?: QuickAssistantMode;
  initialValue?: string;
  scope?: QuickAssistantScope | null;
};

type QuickAssistantContextValue = {
  openAssistant: (options?: OpenAssistantOptions) => void;
  openQuickCreate: (
    mode: Exclude<QuickAssistantMode, "capture">,
    options?: Omit<OpenAssistantOptions, "mode">
  ) => void;
};

const QuickAssistantContext = createContext<QuickAssistantContextValue | null>(
  null
);

type ParsedCommand =
  | { kind: "empty" }
  | { kind: "task"; payload: string }
  | { kind: "event"; payload: string }
  | { kind: "note"; title?: string; body: string }
  | { kind: "ai"; action: string; payload: string }
  | { kind: "unknown"; raw: string };

function parseCommand(raw: string): ParsedCommand {
  const value = raw.trim();
  if (!value) return { kind: "empty" };

  if (value.startsWith("/")) {
    const spaceIndex = value.indexOf(" ");
    const command =
      spaceIndex === -1
        ? value.slice(1).toLowerCase()
        : value.slice(1, spaceIndex).toLowerCase();
    const rest = spaceIndex === -1 ? "" : value.slice(spaceIndex + 1).trim();

    switch (command) {
      case "task":
        return { kind: "task", payload: rest };
      case "note":
        return { kind: "note", body: rest };
      case "event":
        return { kind: "event", payload: rest };
      case "email":
      case "summarize":
      case "link":
      case "focus":
      case "ask":
        return { kind: "ai", action: command, payload: rest };
      default:
        return { kind: "unknown", raw: value };
    }
  }

  const [firstLine, ...rest] = value.split("\n");
  if (rest.length > 0) {
    return {
      kind: "note",
      title: firstLine.trim() || undefined,
      body: rest.join("\n").trim(),
    };
  }

  return { kind: "note", body: value };
}

function buildNoteFromBody(input: { title?: string; body: string }) {
  const title = input.title ?? input.body.slice(0, 80);
  const body = input.body;
  return {
    title: title.trim() || "Quick capture",
    body,
  };
}

function combineDateTime(date: string, time?: string) {
  if (!time) {
    return new Date(`${date}T09:00:00`);
  }
  if (time.length === 5) {
    return new Date(`${date}T${time}:00`);
  }
  return new Date(`${date}T${time}`);
}

function dispatchAssistantEvent(eventName: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

type AssistantModalState = {
  open: boolean;
  initialValue: string;
};

type TaskModalState = {
  open: boolean;
  initialTitle?: string;
  defaultDate?: string;
};

type NoteModalState = {
  open: boolean;
  initialTitle?: string;
  initialBody?: string;
};

type EventModalState = {
  open: boolean;
  defaultDate?: string;
  defaultStart?: string;
  defaultEnd?: string;
  initialTitle?: string;
};

export function QuickAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { addTask } = useTaskStore();

  const [assistant, setAssistant] = useState<AssistantModalState>({
    open: false,
    initialValue: "",
  });
  const [taskState, setTaskState] = useState<TaskModalState>({ open: false });
  const [noteState, setNoteState] = useState<NoteModalState>({ open: false });
  const [eventState, setEventState] = useState<EventModalState>({ open: false });
  const scopeRef = useRef<QuickAssistantScope | null>(null);

  const setScope = useCallback((scope: QuickAssistantScope | null) => {
    scopeRef.current = scope ?? null;
  }, []);

  const resetAssistant = useCallback(() => {
    scopeRef.current = null;
    setAssistant((prev) => ({ ...prev, open: false, initialValue: "" }));
  }, []);

  const emitCreateNote = useCallback(
    (payload: {
      title?: string;
      body: string;
      original?: string;
    }) => {
      const now = new Date().toISOString();
      const detail = {
        id: generateId("note"),
        title: payload.title,
        body: payload.body,
        createdAt: now,
        scope: scopeRef.current,
        capture: payload.original
          ? {
              originalContent: payload.original,
            }
          : undefined,
      };
      window.dispatchEvent(
        new CustomEvent(QUICK_ASSISTANT_EVENTS.createNote, { detail })
      );
      toast.success(
        payload.title ? `Note “${payload.title}” captured` : "Note captured"
      );
    },
    []
  );

  const emitCreateEvent = useCallback(
    (payload: {
      title: string;
      date: string;
      start?: string;
      end?: string;
      location?: string;
      notes?: string;
      original?: string;
    }) => {
      const startsAt = combineDateTime(payload.date, payload.start);
      const endsAtBase = payload.end
        ? combineDateTime(payload.date, payload.end)
        : new Date(startsAt.getTime() + 60 * 60 * 1000);
      const detail = {
        id: generateId("event"),
        title: payload.title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAtBase.toISOString(),
        location: payload.location,
        description: payload.notes,
        scope: scopeRef.current,
        capture: payload.original
          ? {
              originalContent: payload.original,
            }
          : undefined,
      };
      window.dispatchEvent(
        new CustomEvent(QUICK_ASSISTANT_EVENTS.createEvent, { detail })
      );
      toast.success(`Event “${payload.title}” scheduled`);
    },
    []
  );

  const openAssistant = useCallback(
    (options?: OpenAssistantOptions) => {
      const nextScope = options?.scope ?? null;
      setScope(nextScope);
      let initialText = options?.initialValue ?? "";
      if (options?.mode && options.mode !== "capture") {
        const prefix = `/${options.mode}`;
        if (!initialText.trim()) {
          initialText = `${prefix} `;
        } else if (!initialText.trimStart().startsWith(prefix)) {
          initialText = `${prefix} ${initialText}`;
        }
      }

      setAssistant({
        open: true,
        initialValue: initialText,
      });

      dispatchAssistantEvent("assistant.opened", {
        command: options?.mode ?? "capture",
        scope: nextScope ?? undefined,
      });
    },
    [setScope]
  );

  const openQuickCreate = useCallback<
    QuickAssistantContextValue["openQuickCreate"]
  >(
    (mode, options) => {
      const nextScope = options?.scope ?? null;
      setScope(nextScope);
      const initialValue = options?.initialValue ?? "";

      switch (mode) {
        case "task":
          setTaskState({ open: true, initialTitle: initialValue });
          break;
        case "note":
          setNoteState({ open: true, initialBody: initialValue });
          break;
        case "event": {
          const [titleSegment] = initialValue.split("@");
          const titleText = (titleSegment ?? "").trim();
          setEventState({
            open: true,
            initialTitle: titleText || undefined,
          });
          break;
        }
      }
    },
    []
  );

  const handleTaskCreate = useCallback(
    (payload: {
      title: string;
      date?: string;
      priority?: "low" | "medium" | "high" | "none";
      assignee?: string;
      description?: string;
      notes?: string;
    }) => {
      addTask({
        title: payload.title,
        dueDate: payload.date,
        priority: payload.priority,
        assignee: payload.assignee,
        description: payload.description,
        notes: payload.notes,
        source: "quick-assistant",
        listId: scopeRef.current?.listId ?? undefined,
      });
      toast.success(`Task “${payload.title}” created`);
      setTaskState({ open: false });
    },
    [addTask]
  );

  const handleAssistantSubmit = useCallback(
    async ({ text, command }: AssistantSubmitPayload) => {
      const trimmed = text.trim();
      if (!trimmed) {
        const message = "Add something to capture before saving.";
        dispatchAssistantEvent("assistant.error", {
          reason: "empty",
          command,
          scope: scopeRef.current ?? undefined,
        });
        throw new Error(message);
      }

      dispatchAssistantEvent("assistant.submitted", {
        command,
        scope: scopeRef.current ?? undefined,
      });

      // Check if user entered a slash command (manual mode)
      const isSlashCommand = trimmed.startsWith('/');
      
      // If not a slash command, try intent classification
      if (!isSlashCommand) {
        console.log('[QuickAssistant] No slash command, attempting intent classification');
        
        // Check if assistant provider is configured
        const assistantProvider = useProviderSettings.getState().assistantProvider;
        
        if (!assistantProvider) {
          console.warn('[QuickAssistant] No assistant provider configured, falling back to note');
          toast.info('Configure an assistant provider in Settings to use AI classification');
          emitCreateNote({ body: trimmed });
          return;
        }

        if (assistantProvider !== 'mistral') {
          console.warn('[QuickAssistant] Only Mistral provider supported currently');
          toast.info('Only Mistral provider is currently supported for AI classification');
          emitCreateNote({ body: trimmed });
          return;
        }

        // Attempt intent classification
        try {
          console.log('[QuickAssistant] Creating Mistral provider');
          const provider = createMistralProvider();
          
          console.log('[QuickAssistant] 🔍 Classifying intent for input:', trimmed);
          const intent = await provider.classifyIntent(trimmed);
          
          console.log('[QuickAssistant] 📊 Classification result:', {
            type: intent.type,
            confidence: intent.confidence,
            extracted: intent.extracted
          });
          
          dispatchAssistantEvent("assistant.intent_resolved", {
            intent: intent.type,
            confidence: intent.confidence,
            provider: assistantProvider,
            scope: scopeRef.current ?? undefined,
          });

          // Route based on classified intent
          switch (intent.type) {
            case 'task': {
              const title = intent.extracted.title || trimmed;
              console.log('[QuickAssistant] Creating task with extracted data:', intent.extracted);
              
              // handleTaskCreate already shows toast and closes dialog
              handleTaskCreate({
                title,
                description: intent.extracted.notes || title,
                date: intent.extracted.dueDate, // Pass the extracted due date
                priority: intent.extracted.priority,
              });
              return;
            }
            case 'note': {
              const noteTitle = intent.extracted.title;
              const noteBody = intent.extracted.body || trimmed;
              console.log('[QuickAssistant] Creating note with extracted data:', intent.extracted);
              emitCreateNote({
                title: noteTitle,
                body: noteBody,
                original: trimmed,
              });
              return;
            }
            case 'event': {
              const eventTitle = intent.extracted.title || trimmed;
              // For MVP, use today's date if date parsing would be complex
              // The natural language date goes in notes so user can see it
              const eventDate = new Date().toISOString().slice(0, 10);
              const notes = intent.extracted.date 
                ? `${trimmed} (Scheduled for: ${intent.extracted.date})`
                : trimmed;
              
              console.log('[QuickAssistant] Creating event with extracted data:', intent.extracted);
              emitCreateEvent({
                title: eventTitle,
                date: eventDate,
                start: intent.extracted.startTime,
                end: intent.extracted.endTime,
                location: intent.extracted.location,
                notes: notes,
                original: trimmed,
              });
              return;
            }
            case 'unknown':
            default: {
              console.log('[QuickAssistant] Unknown intent, creating note');
              // emitCreateNote already shows success toast, so just explain why it's a note
              emitCreateNote({ 
                body: trimmed,
                title: 'Quick note'
              });
              return;
            }
          }
        } catch (error) {
          console.error('[QuickAssistant] Intent classification failed:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Classification failed: ${errorMsg}`);
          
          // Fallback to note on error
          emitCreateNote({ body: trimmed });
          return;
        }
      }

      // Original slash command handling
      const parsed = parseCommand(trimmed);

      switch (parsed.kind) {
        case "empty": {
          dispatchAssistantEvent("assistant.error", {
            reason: "empty",
            command,
            scope: scopeRef.current ?? undefined,
          });
          throw new Error("Add something to capture before saving.");
        }
        case "task": {
          const title = (parsed.payload || trimmed.replace(/^\/task\s*/, "")).trim();
          if (!title) {
            const message = "Add a task description before creating.";
            dispatchAssistantEvent("assistant.error", {
              reason: "missing_task_title",
              command: "task",
              scope: scopeRef.current ?? undefined,
            });
            throw new Error(message);
          }

          handleTaskCreate({
            title,
            description: parsed.payload || title,
          });
          return;
        }
        case "event": {
          const title = (parsed.payload || trimmed.replace(/^\/event\s*/, "")).trim() || "Quick event";
          const today = new Date().toISOString().slice(0, 10);
          emitCreateEvent({
            title,
            date: today,
            notes: title,
            original: trimmed,
          });
          return;
        }
        case "note": {
          const built = buildNoteFromBody({
            title: parsed.title,
            body: parsed.body,
          });
          emitCreateNote({
            title: built.title,
            body: built.body,
            original: trimmed !== built.body ? trimmed : undefined,
          });
          return;
        }
        case "ai": {
          toast.info(`Assistant command “/${parsed.action}” coming soon`);
          return;
        }
        case "unknown": {
          emitCreateNote({
            body: trimmed,
          });
          return;
        }
      }
    },
    [emitCreateEvent, emitCreateNote, handleTaskCreate, resetAssistant]
  );

  const handleNoteCreate = useCallback(
    (payload: { title?: string; body: string }) => {
      emitCreateNote(payload);
      setNoteState({ open: false });
    },
    [emitCreateNote]
  );

  const handleEventCreate = useCallback(
    (payload: { title: string; date: string; start?: string; end?: string }) => {
      emitCreateEvent(payload);
      setEventState({ open: false });
    },
    [emitCreateEvent]
  );

  useEffect(() => {
    const isInputLike = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const selection = window.getSelection();
      const rawSelection = selection?.toString() ?? "";
      const trimmedSelection = rawSelection.trim();

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;

      if (key === "k" && isMod) {
        event.preventDefault();
        openAssistant({
          initialValue:
            trimmedSelection.length > 0 ? rawSelection : undefined,
        });
        return;
      }

      if (isInputLike(event.target)) return;

      if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
        return;
      }

      if (key === "t") {
        openQuickCreate("task");
      } else if (key === "n") {
        openQuickCreate("note");
      } else if (key === "e") {
        openQuickCreate("event");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openAssistant, openQuickCreate]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const detail = (event as CustomEvent<OpenAssistantOptions>).detail;
      openAssistant(detail);
    };

    window.addEventListener(QUICK_ASSISTANT_EVENTS.open, handleOpenEvent);
    return () => {
      window.removeEventListener(QUICK_ASSISTANT_EVENTS.open, handleOpenEvent);
    };
  }, [openAssistant]);

  const contextValue = useMemo<QuickAssistantContextValue>(
    () => ({ openAssistant, openQuickCreate }),
    [openAssistant, openQuickCreate]
  );

  return (
    <QuickAssistantContext.Provider value={contextValue}>
      {children}

      <AssistantCaptureDialog
        open={assistant.open}
        initialValue={assistant.initialValue}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetAssistant();
          } else {
            setAssistant((prev) => ({ ...prev, open: true }));
          }
        }}
        onSubmit={handleAssistantSubmit}
        onCommandSelect={(selected) => {
          dispatchAssistantEvent("assistant.command_selected", {
            command: selected,
            scope: scopeRef.current ?? undefined,
          });
        }}
        onError={(message) => {
          const duplicateGuard = new Set([
            "Add something to capture before saving.",
            "Add a task description before creating.",
          ]);
          const shouldDispatch = !duplicateGuard.has(message);
          if (shouldDispatch) {
            dispatchAssistantEvent("assistant.error", {
              reason: "dialog",
              message,
              scope: scopeRef.current ?? undefined,
            });
            toast.error(message);
          }
        }}
      />

      <QuickTaskModal
        open={taskState.open}
        onOpenChange={(next) => {
          if (!next) {
            setTaskState({ open: false });
          } else {
            setTaskState((prev) => ({ ...prev, open: true }));
          }
        }}
        defaultDate={taskState.defaultDate}
        initialTitle={taskState.initialTitle}
        onCreate={handleTaskCreate}
      />

      <QuickNoteModal
        open={noteState.open}
        onOpenChange={(next) => {
          if (!next) {
            setNoteState({ open: false });
          } else {
            setNoteState((prev) => ({ ...prev, open: true }));
          }
        }}
        initialTitle={noteState.initialTitle}
        initialBody={noteState.initialBody}
        onCreate={handleNoteCreate}
      />

      <QuickEventModal
        open={eventState.open}
        onOpenChange={(next) => {
          if (!next) {
            setEventState({ open: false });
          } else {
            setEventState((prev) => ({ ...prev, open: true }));
          }
        }}
        defaultDate={eventState.defaultDate}
        defaultStart={eventState.defaultStart}
        defaultEnd={eventState.defaultEnd}
        initialTitle={eventState.initialTitle}
        onCreate={handleEventCreate}
      />
    </QuickAssistantContext.Provider>
  );
}

export function useQuickAssistant() {
  const context = useContext(QuickAssistantContext);
  if (!context) {
    throw new Error(
      "useQuickAssistant must be used within a QuickAssistantProvider"
    );
  }
  return context;
}

export function openQuickAssistant(options?: OpenAssistantOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(QUICK_ASSISTANT_EVENTS.open, { detail: options })
  );
}
