import { useState, useCallback, useMemo, useEffect } from "react";

export type CommandType = "task" | "note" | "event" | "summarize" | null;

export type CaptureMetadata = {
  timestamp: Date;
  wordCount: number;
  source?: string;
};

export type CaptureSessionState = {
  originalSnippet: string;
  workingCopy: string;
  command: CommandType;
  metadata: CaptureMetadata;
  isSnippetExpanded: boolean;
  isAdvancedOpen: boolean;
  showOutputPreview: boolean;
};

type TaskMetadata = {
  assignee?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
};

type NoteMetadata = {
  notebook?: string;
  tags?: string[];
};

type EventMetadata = {
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
};

export type CommandMetadata = TaskMetadata | NoteMetadata | EventMetadata | null;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useCaptureSession(initialSnippet = "", source?: string) {
  const [state, setState] = useState<CaptureSessionState>(() => ({
    originalSnippet: initialSnippet,
    workingCopy: initialSnippet,
    command: null,
    metadata: {
      timestamp: new Date(),
      wordCount: countWords(initialSnippet),
      source,
    },
    isSnippetExpanded: false,
    isAdvancedOpen: false,
    showOutputPreview: false,
  }));

  const [commandMetadata, setCommandMetadata] = useState<CommandMetadata>(null);

  const hasEdits = useMemo(
    () => state.workingCopy !== state.originalSnippet,
    [state.workingCopy, state.originalSnippet]
  );

  const isLargeSnippet = useMemo(
    () => state.metadata.wordCount > 500,
    [state.metadata.wordCount]
  );

  const setWorkingCopy = useCallback((text: string) => {
    setState((prev) => ({
      ...prev,
      workingCopy: text,
      metadata: {
        ...prev.metadata,
        wordCount: countWords(text),
      },
    }));
  }, []);

  const setCommand = useCallback((command: CommandType) => {
    setState((prev) => ({
      ...prev,
      command,
      isAdvancedOpen: false,
    }));
    setCommandMetadata(null);
  }, []);

  const toggleSnippetExpanded = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSnippetExpanded: !prev.isSnippetExpanded,
    }));
  }, []);

  const toggleAdvancedPanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAdvancedOpen: !prev.isAdvancedOpen,
    }));
  }, []);

  const revertToOriginal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      workingCopy: prev.originalSnippet,
      metadata: {
        ...prev.metadata,
        wordCount: countWords(prev.originalSnippet),
      },
    }));
  }, []);

  const reset = useCallback(
    (newSnippet = "", newSource?: string) => {
      setState({
        originalSnippet: newSnippet,
        workingCopy: newSnippet,
        command: null,
        metadata: {
          timestamp: new Date(),
          wordCount: countWords(newSnippet),
          source: newSource,
        },
        isSnippetExpanded: false,
        isAdvancedOpen: false,
        showOutputPreview: false,
      });
      setCommandMetadata(null);
    },
    []
  );

  const setShowOutputPreview = useCallback((show: boolean) => {
    setState((prev) => ({
      ...prev,
      showOutputPreview: show,
    }));
  }, []);

  useEffect(() => {
    if (initialSnippet !== state.originalSnippet) {
      reset(initialSnippet, source);
    }
  }, [initialSnippet, source]);

  return {
    state,
    hasEdits,
    isLargeSnippet,
    commandMetadata,
    setWorkingCopy,
    setCommand,
    setCommandMetadata,
    toggleSnippetExpanded,
    toggleAdvancedPanel,
    revertToOriginal,
    setShowOutputPreview,
    reset,
  };
}
