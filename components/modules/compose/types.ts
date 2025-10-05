export interface EmailChip {
  id: string;
  label: string;
  email: string;
  valid: boolean;
}

export interface ComposeState {
  to: EmailChip[];
  cc: EmailChip[];
  bcc: EmailChip[];
  subject: string;
  html: string;
  showCc: boolean;
  showBcc: boolean;
}

export interface ComposeDraft {
  to: EmailChip[];
  cc: EmailChip[];
  bcc: EmailChip[];
  subject: string;
  html: string;
}

export type RecipientField = 'to' | 'cc' | 'bcc';

export interface ComposeEditorCommands {
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  applyColor: (color: string) => void;
  insertLink: (url: string, text?: string) => void;
  insertImage: (src: string, alt?: string) => void;
  undo: () => void;
  redo: () => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: string) => void;
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  insertOrderedList: () => void;
  insertUnorderedList: () => void;
  insertQuote: () => void;
}