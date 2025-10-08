export type Conversation = {
  id: string;
  title: string;
  lastMessageSnippet: string;
  updatedAt: string; // ISO or humanized string
  unread?: boolean;
  pinned?: boolean;
  participants?: string[];
};
