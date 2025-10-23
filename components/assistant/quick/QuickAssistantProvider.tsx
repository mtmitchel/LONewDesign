// ============================================================================
// QUICK ASSISTANT PROVIDER (REFACTORED)
// ============================================================================

"use client";

import React, { useCallback, useContext, useMemo } from "react";
import { toast } from "sonner";
import { QuickNoteModal } from "../../extended/QuickNoteModal";
import { QuickTaskModal } from "../../extended/QuickTaskModal";
import { QuickEventModal } from "../../extended/QuickEventModal";
import { AssistantCaptureDialog, type AssistantSubmitPayload } from "../AssistantCaptureDialog";
import { useTaskStore } from "../../modules/tasks/taskStore";
import { createProviderFromSettings } from "../services/openaiProvider";
import { useProviderSettings } from "../../modules/settings/state/providerSettings";

// Import modular components
import { generateId } from "./utils";
import { parseCommand, buildNoteFromBody } from "./commands/registry";
import { parseNaturalDate, combineDateTime } from "./commands/helpers";
import { useQuickAssistantState } from "./state/useQuickAssistantState";
import { QuickAssistantContext } from "./state/QuickAssistantContext";
import { useQuickAssistantHotkeys } from "./hotkeys";
import { dispatchAssistantEvent, useEventListeners, QUICK_ASSISTANT_EVENTS } from "./telemetry";
import { useSelectionHandling } from "./selection";
import { useIntentClassification } from "./intent";

const CONFIDENCE_THRESHOLD = 0.6;

export function QuickAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const addTask = useTaskStore((state) => state.addTask);

  // State management
  const {
    assistant,
    setAssistant,
    taskState,
    setTaskState,
    noteState,
    setNoteState,
    eventState,
    setEventState,
    scopeRef,
    selectionSnapshotRef,
    setScope,
    resetAssistant,
  } = useQuickAssistantState();

  // Selection handling
  const { applyWritingResult } = useSelectionHandling(selectionSnapshotRef);



  // Event handlers
  const emitCreateNote = useCallback(
    (payload: {
      title?: string;
      body: string;
      original?: string;
    }) => {
      const now = new Date().toISOString();
      const noteId = generateId("note");
      const folderId = scopeRef.current?.folderId ?? null;
      const body = payload.body ?? '';
      const title = (payload.title ?? body.split('\n')[0] ?? 'Quick capture').trim() || 'Quick capture';
      
      const detail = {
        id: noteId,
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
      
      // ALWAYS save to localStorage (even if NotesModule isn't mounted)
      try {
        const STORAGE_KEY = 'libreollama:notes:notes';
        const stored = localStorage.getItem(STORAGE_KEY);
        const existingNotes = stored ? JSON.parse(stored) : [];
        
        const siblingOrder = existingNotes
          .filter((n: any) => (n.folderId || null) === (folderId || null))
          .reduce((max: number, n: any) => Math.max(max, n.order ?? 0), -1) + 1;
        
        const newNote = {
          id: noteId,
          title,
          content: body,
          folderId,
          order: siblingOrder,
          tags: [],
          isStarred: false,
          isPinned: false,
          lastModified: 'just now',
          wordCount: body.trim() ? body.trim().split(/\s+/).length : 0,
          createdAt: now,
          updatedAt: now,
          capture: detail.capture,
        };
        
        // Add to beginning of array
        const updatedNotes = [newNote, ...existingNotes];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
        
        console.log('[QuickAssistant] 📝 Note saved to localStorage:', noteId);
      } catch (err) {
        console.error('[QuickAssistant] Failed to save note to localStorage:', err);
      }
      
      // Still dispatch event for NotesModule to update UI if it's mounted
      window.dispatchEvent(
        new CustomEvent(QUICK_ASSISTANT_EVENTS.createNote, { detail })
      );
      toast.success(
        payload.title ? `Note "${payload.title}" captured` : "Note captured"
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
      console.log('[QuickAssistant] 📅 Creating event with:', {
        title: payload.title,
        date: payload.date,
        start: payload.start,
        startsAt: startsAt.toISOString(),
        endsAt: endsAtBase.toISOString(),
      });
      
      const eventId = generateId("event");
      const detail = {
        id: eventId,
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
      
      // ALWAYS save to localStorage (even if CalendarModule isn't mounted)
      try {
        const STORAGE_KEY = 'calendar-events';
        const stored = localStorage.getItem(STORAGE_KEY);
        const existingEvents = stored ? JSON.parse(stored) : [];
        
        const newEvent = {
          id: eventId,
          title: payload.title,
          calendarId: scopeRef.current?.projectId ?? 'quick-assistant',
          startsAt: startsAt.toISOString(),
          endsAt: endsAtBase.toISOString(),
          location: payload.location,
          description: payload.notes,
          allDay: false,
        };
        
        // Add to beginning of array
        const updatedEvents = [newEvent, ...existingEvents];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
        
        console.log('[QuickAssistant] 📅 Event saved to localStorage:', eventId);
      } catch (err) {
        console.error('[QuickAssistant] Failed to save event to localStorage:', err);
      }
      
      console.log('[QuickAssistant] 📤 Dispatching event:', detail);
      window.dispatchEvent(
        new CustomEvent(QUICK_ASSISTANT_EVENTS.createEvent, { detail })
      );
      toast.success(`Event "${payload.title}" scheduled`);
    },
    []
  );

  const openAssistant = useCallback(
    (options?: any) => {
      const nextScope = options?.scope ?? null;
      setScope(nextScope);
      let initialText = options?.initialValue ?? "";

      let capturedSelectedText: string | undefined;
      selectionSnapshotRef.current = null;
      if (typeof window !== "undefined") {
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement
        ) {
          const start = activeElement.selectionStart ?? activeElement.value.length;
          const end = activeElement.selectionEnd ?? activeElement.value.length;
          selectionSnapshotRef.current = {
            kind: "input",
            element: activeElement,
            start,
            end,
          };
          if (start !== end) {
            capturedSelectedText = activeElement.value.slice(start, end);
          }
        } else {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              capturedSelectedText = selection.toString();
            }
            selectionSnapshotRef.current = {
              kind: "range",
              range: range.cloneRange(),
              focusElement: (document.activeElement instanceof HTMLElement ? document.activeElement : null),
            };
          }
        }
      }

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
        selectedText: capturedSelectedText,
      });

      dispatchAssistantEvent("assistant.opened", {
        command: options?.mode ?? "capture",
        scope: nextScope ?? undefined,
      });
    },
    [setScope]
  );

  const openQuickCreate = useCallback(
    (mode: any, options?: any) => {
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
      toast.success(`Task "${payload.title}" created`);
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
        await classifyAndRouteIntent(trimmed);
        return;
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
          toast.info(`Assistant command "/${parsed.action}" coming soon`);
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

  // Intent classification (must be after function declarations)
  const { classifyAndRouteIntent } = useIntentClassification({
    scopeRef,
    handleTaskCreate,
    emitCreateNote,
    emitCreateEvent,
    resetAssistant,
  });

  // Hook integrations
  useQuickAssistantHotkeys({ openAssistant, openQuickCreate });
  useEventListeners(openAssistant);

  const contextValue = useMemo(
    () => ({ openAssistant, openQuickCreate }),
    [openAssistant, openQuickCreate]
  );

  return (
    <QuickAssistantContext.Provider value={contextValue}>
      {children}

      <AssistantCaptureDialog
        open={assistant.open}
        initialValue={assistant.initialValue}
        selectedText={assistant.selectedText}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetAssistant();
          } else {
            setAssistant((prev) => ({ ...prev, open: true }));
          }
        }}
        onSubmit={handleAssistantSubmit}
        onReplace={(text) => {
          const applied = applyWritingResult(text, "replace");
          if (applied) {
            toast.success("Selection replaced");
            dispatchAssistantEvent("assistant.executed", {
              action: "replace",
              scope: scopeRef.current ?? undefined,
            });
            resetAssistant();
          }
        }}
        onInsert={(text) => {
          const applied = applyWritingResult(text, "insert");
          if (applied) {
            toast.success("Text inserted");
            dispatchAssistantEvent("assistant.executed", {
              action: "insert",
              scope: scopeRef.current ?? undefined,
            });
            resetAssistant();
          }
        }}
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