export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  updatedAt: string; // ISO or humanized string
  unread?: boolean;
  pinned?: boolean;
  participants?: string[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  author: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string; // ISO string
  pending?: boolean;
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
