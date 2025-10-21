export type Priority = 'low' | 'medium' | 'high' | 'none';

export type TaskLabel = string | { name: string; color: string };

export interface Subtask {
  id: string;
  googleId?: string;
  parentGoogleId?: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  position?: number;
}

export type TaskSyncState = 'idle' | 'pending' | 'pending_move' | 'syncing' | 'error';

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
  order?: number;
  completedAt?: string | null;
  subtasks?: Subtask[];
  externalId?: string;
  googleListId?: string;
  pendingSync?: boolean;
  clientMutationId?: string;
  syncState?: TaskSyncState;
  lastSyncedAt?: number;
  syncError?: string | null;
  hasConflict?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export type TaskListSource = 'local' | 'google';

export interface TaskList {
  id: string;
  name: string;
  color?: string;
  isVisible: boolean;
  externalId?: string;
  source: TaskListSource;
  lastSyncedAt?: number;
  syncToken?: string | null;
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

export type TaskMutationOperation =
  | { kind: 'task.create'; task: Task }
  | { kind: 'task.update'; id: string; changes: Partial<Task> }
  | { kind: 'task.delete'; id: string; externalId?: string }
  | { kind: 'task.move'; id: string; toListId: string; previousId?: string | null; parentId?: string | null; externalId?: string };

export interface TaskMutation {
  id: string;
  op: TaskMutationOperation;
  attempts: number;
  lastError?: string;
  enqueuedAt: number;
  state: 'queued' | 'in-flight' | 'failed';
}
