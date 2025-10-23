// ============================================================================
// CONTEXT & TYPES
// ============================================================================

import { createContext } from "react";

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

export type QuickAssistantContextValue = {
  openAssistant: (options?: OpenAssistantOptions) => void;
  openQuickCreate: (
    mode: Exclude<QuickAssistantMode, "capture">,
    options?: Omit<OpenAssistantOptions, "mode">
  ) => void;
};

export const QuickAssistantContext = createContext<QuickAssistantContextValue | null>(
  null
);