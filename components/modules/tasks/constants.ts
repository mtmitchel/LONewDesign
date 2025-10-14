import type { TaskList } from './types';

// Hardcoded task lists removed - now using Google Tasks sync
export const DEFAULT_TASK_LISTS: TaskList[] = [];

// Legacy export retained for board components that still expect `title`
export const TASK_LISTS: { readonly id: string; readonly title: string }[] = [];

export type TaskListId = string;
