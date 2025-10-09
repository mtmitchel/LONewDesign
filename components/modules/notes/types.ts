export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  order?: number; // ordering within its folder (or root when folderId is null)
  tags: string[];
  isStarred: boolean;
  isPinned?: boolean;
  lastModified: string;
  wordCount: number;
  createdAt?: string;
  updatedAt?: string;
  capture?: {
    originalContent: string;
    metadata?: Record<string, unknown>;
  };
}

export interface NoteFolder {
  id: string;
  name: string;
  parentId?: string | null;
  order?: number; // ordering within its parent (or root when parentId is null)
  noteCount: number;
}

export interface NotesSettings {
  showWordCount: boolean;
  showPreview: boolean;
  autoSave: boolean;
  compactView: boolean;
  sortBy: 'modified' | 'created' | 'title' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
  showWordCount: true,
  showPreview: true,
  autoSave: true,
  compactView: false,
  sortBy: 'modified',
  sortOrder: 'desc'
};

export type ToolbarAction = 
  | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'
  | 'align-left' | 'align-center' | 'align-right' | 'align-justify'
  | 'outdent' | 'indent'
  | 'link' | 'image' | 'table'
  | 'undo' | 'redo'
  | 'font-decrease' | 'font-increase'
  | 'text-color' | 'highlight'
  | 'h1' | 'h2' | 'h3' | 'quote' | 'ul' | 'ol' | 'checklist' | 'code-block'
  | 'toggle' | 'toggle-h1' | 'toggle-h2' | 'toggle-h3'
  | 'video' | 'audio' | 'file' | 'emoji';
