export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  updatedAt: string; // ISO or humanized string
  unread?: boolean;
  pinned?: boolean;
  participants?: string[];
};

export type ConversationAction =
  | 'pin'
  | 'unpin'
  | 'rename'
  | 'export-text'
  | 'export-markdown'
  | 'export-json'
  | 'export-pdf'
  | 'delete';
