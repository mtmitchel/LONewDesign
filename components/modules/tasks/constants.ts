// Shared task list/column definitions
export const TASK_LISTS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'Doing' },
  { id: 'done', title: 'Done' },
] as const;

export type TaskListId = typeof TASK_LISTS[number]['id'];
