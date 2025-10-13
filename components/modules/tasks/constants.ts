import type { TaskList } from './types';

export const DEFAULT_TASK_LISTS: TaskList[] = [
  { id: 'todo', name: 'To Do', source: 'local', isVisible: true },
  { id: 'in-progress', name: 'Doing', source: 'local', isVisible: true },
  { id: 'done', name: 'Done', source: 'local', isVisible: true },
];

// Legacy export retained for board components that still expect `title`
export const TASK_LISTS = DEFAULT_TASK_LISTS.map(({ id, name }) => ({ id, title: name })) as {
  readonly id: string;
  readonly title: string;
}[];

export type TaskListId = (typeof TASK_LISTS)[number]['id'];
