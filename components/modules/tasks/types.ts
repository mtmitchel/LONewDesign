export type Priority = 'low' | 'medium' | 'high' | 'none';

export type TaskLabel = string | { name: string; color: string };

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  dateCreated?: string;
  updatedAt?: string;
  assignee?: string;
  labels: TaskLabel[];
  listId: string;
  projectId?: string;
  boardListId?: string;
  notes?: string;
  isCompleted: boolean;
  checklist?: ChecklistItem[];
  isPinned?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
}

export interface BoardSection {
  id: string;
  name: string;
}

export type SortOption = 'created' | 'title' | 'dueDate' | 'priority';

export interface ComposerDraft {
  title: string;
  dueDate?: Date;
  priority: Priority;
  listId: string;
}
