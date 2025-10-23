import { WritingTool } from "../WritingToolsGrid";

export type AssistantCommand = "capture" | "task" | "note" | "event" | "summarize";

export type AssistantSubmitPayload = {
  text: string;
  command: AssistantCommand;
};

export interface AssistantCaptureDialogProps {
  open: boolean;
  initialValue?: string;
  selectedText?: string; // Text selected before opening assistant
  canEditSelection?: boolean; // Whether selected text is editable (shows Replace/Insert)
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssistantSubmitPayload) => Promise<void>;
  onCommandSelect?: (command: AssistantCommand) => void;
  onError?: (message: string) => void;
  onReplace?: (text: string) => void; // Replace selected text with result
  onInsert?: (text: string) => void; // Insert result at cursor
}

export type CommandDefinition = {
  id: Exclude<AssistantCommand, "capture">;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

// Language definitions with T-V distinction support
export type LanguageOption = {
  code: string; // ISO 639-1 code for LLMs
  deeplCode: string; // DeepL API code
  label: string;
  hasTVDistinction: boolean;
  deeplFormality: boolean; // Whether DeepL supports formality for this language
  formalExample?: string;
  informalExample?: string;
};

// Writing tools state
export interface WritingToolsState {
  showWritingTools: boolean;
  activeTool: WritingTool | null;
  toolResult: string;
  isToolRunning: boolean;
  showTranslateConfig: boolean;
  targetLanguage: string;
  formality: "formal" | "informal" | "neutral";
  translationProvider: "deepl" | "assistant";
}