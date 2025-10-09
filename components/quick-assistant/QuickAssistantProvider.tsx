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
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { QuickNoteModal } from "../extended/QuickNoteModal";
import { QuickTaskModal } from "../extended/QuickTaskModal";
import { QuickEventModal } from "../extended/QuickEventModal";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useTaskStore } from "../modules/tasks/taskStore";
import { CaptureModal } from "./CaptureModal";
import type { CommandType } from "./useCaptureSession";

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
  const [launcherPortal, setLauncherPortal] = useState<HTMLElement | null>(null);

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
      metadata?: Record<string, unknown> | null;
    }) => {
      const now = new Date().toISOString();
      const detail = {
        id: generateId("note"),
        title: payload.title,
        body: payload.body,
        createdAt: now,
        scope: scopeRef.current,
        capture:
          payload.original || payload.metadata
            ? {
                originalContent: payload.original ?? payload.body,
                metadata: payload.metadata ?? undefined,
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
      metadata?: Record<string, unknown> | null;
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
        capture:
          payload.original || payload.metadata
            ? {
                originalContent: payload.original ?? payload.notes ?? payload.title,
                metadata: payload.metadata ?? undefined,
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
      setAssistant({
        open: true,
        initialValue: options?.initialValue ?? "",
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

  const handleCapture = useCallback(
    (payload: {
      command: CommandType;
      content: string;
      originalContent: string;
      metadata: Record<string, unknown> | null;
    }) => {
      const parsed = parseCommand(payload.content);
      const metadata = payload.metadata ?? {};
      const metaObject =
        typeof metadata === "object" && metadata
          ? (metadata as Record<string, unknown>)
          : {};

      switch (parsed.kind) {
        case "empty": {
          resetAssistant();
          return;
        }
        case "task": {
          const title = (parsed.payload || payload.content).trim();
          if (!title) {
            toast.error("Add a task description before creating.");
            resetAssistant();
            return;
          }
          const taskDescription = (parsed.payload ?? payload.content).trim();

          handleTaskCreate({
            title,
            date: typeof metaObject.dueDate === "string" ? (metaObject.dueDate as string) : undefined,
            priority:
              metaObject.priority === "low" ||
              metaObject.priority === "medium" ||
              metaObject.priority === "high" ||
              metaObject.priority === "none"
                ? (metaObject.priority as "low" | "medium" | "high" | "none")
                : undefined,
            assignee:
              typeof metaObject.assignee === "string"
                ? (metaObject.assignee as string)
                : undefined,
            description: taskDescription,
            notes:
              payload.originalContent &&
              payload.originalContent !== payload.content
                ? payload.originalContent
                : undefined,
          });
          resetAssistant();
          return;
        }
        case "event": {
          const title = (parsed.payload || payload.content || "Quick event").trim() || "Quick event";
          const date = typeof metaObject.date === "string" && metaObject.date
            ? (metaObject.date as string)
            : new Date().toISOString().slice(0, 10);

          emitCreateEvent({
            title,
            date,
            start:
              typeof metaObject.startTime === "string"
                ? (metaObject.startTime as string)
                : undefined,
            end:
              typeof metaObject.endTime === "string"
                ? (metaObject.endTime as string)
                : undefined,
            location:
              typeof metaObject.location === "string"
                ? (metaObject.location as string)
                : undefined,
            notes:
              payload.originalContent &&
              payload.originalContent !== payload.content
                ? payload.originalContent
                : undefined,
            original: payload.originalContent,
            metadata: metaObject,
          });
          resetAssistant();
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
            original: payload.originalContent,
            metadata: metaObject,
          });
          resetAssistant();
          return;
        }
        case "ai": {
          toast.info(`Assistant command “/${parsed.action}” coming soon`);
          resetAssistant();
          return;
        }
        case "unknown": {
          emitCreateNote({
            body: payload.content,
            original: payload.originalContent,
            metadata: metaObject,
          });
          resetAssistant();
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLauncherPortal(document.body);
  }, []);

  const contextValue = useMemo<QuickAssistantContextValue>(
    () => ({ openAssistant, openQuickCreate }),
    [openAssistant, openQuickCreate]
  );

  return (
    <QuickAssistantContext.Provider value={contextValue}>
      {children}

      {launcherPortal
        ? createPortal(
            <div className="fixed bottom-[calc(var(--space-8)+12px)] right-[var(--space-8)] z-[999]">
              <div className="group relative grid place-items-center">
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-[-4px] rounded-full border border-white/70",
                    "shadow-[0_20px_45px_rgba(15,23,42,0.35)]",
                    "transition-shadow duration-300",
                    "group-hover:shadow-[0_26px_65px_rgba(15,23,42,0.45)]"
                  )}
                />
                <Button
                  variant="assistant"
                  size="floating"
                  className={cn(
                    "relative z-[1] grid place-items-center",
                    "!shadow-none hover:!shadow-none",
                    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-surface)] focus-visible:ring-[color:var(--focus-ring)]",
                    "active:scale-95",
                    "transition-transform"
                  )}
                  title="Open Assistant"
                  aria-label="Open Assistant"
                  onClick={() => openAssistant()}
                >
                  <Plus className="relative size-6 text-[rgba(15,23,42,0.85)]" aria-hidden />
                </Button>
              </div>
            </div>,
            launcherPortal
          )
        : null}

      <CaptureModal
        open={assistant.open}
        onOpenChange={(nextOpen: boolean) => {
          if (!nextOpen) {
            resetAssistant();
          } else {
            setAssistant((prev) => ({ ...prev, open: true }));
          }
        }}
        initialSnippet={assistant.initialValue}
        source={scopeRef.current?.source ?? undefined}
        onCapture={handleCapture}
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
