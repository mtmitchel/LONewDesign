// ============================================================================
// STATE MANAGEMENT
// ============================================================================

import { useCallback, useRef, useState } from "react";
import type { QuickAssistantScope } from "./QuickAssistantContext";

export type AssistantModalState = {
  open: boolean;
  initialValue: string;
  selectedText?: string;
};

export type TaskModalState = {
  open: boolean;
  initialTitle?: string;
  defaultDate?: string;
};

export type NoteModalState = {
  open: boolean;
  initialTitle?: string;
  initialBody?: string;
};

export type EventModalState = {
  open: boolean;
  defaultDate?: string;
  defaultStart?: string;
  defaultEnd?: string;
  initialTitle?: string;
};

export type SelectionSnapshot =
  | {
      kind: "input";
      element: HTMLInputElement | HTMLTextAreaElement;
      start: number;
      end: number;
    }
  | {
      kind: "range";
      range: Range;
      focusElement: HTMLElement | null;
    };

export function useQuickAssistantState() {
  const [assistant, setAssistant] = useState<AssistantModalState>({
    open: false,
    initialValue: "",
  });
  const [taskState, setTaskState] = useState<TaskModalState>({ open: false });
  const [noteState, setNoteState] = useState<NoteModalState>({ open: false });
  const [eventState, setEventState] = useState<EventModalState>({ open: false });
  const scopeRef = useRef<QuickAssistantScope | null>(null);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);

  const setScope = useCallback((scope: QuickAssistantScope | null) => {
    scopeRef.current = scope ?? null;
  }, []);

  const resetAssistant = useCallback(() => {
    scopeRef.current = null;
    selectionSnapshotRef.current = null;
    setAssistant((prev) => ({ ...prev, open: false, initialValue: "", selectedText: undefined }));
  }, []);

  return {
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
  };
}