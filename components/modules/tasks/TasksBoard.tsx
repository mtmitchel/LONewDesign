import * as React from 'react';
import { TASK_LISTS } from './constants';
import { Task, Priority } from './types';
import { TaskColumnHeader } from './TaskColumnHeader';
import { TaskAddButton } from './TaskAddButton';
import { TaskCard } from './TaskCard';
import { TaskComposer } from './TaskComposer';

type Column = {
  id: string;
  title: string;
};

type TaskDraft = {
  title: string;
  dueDate?: string;
  priority?: Priority;
};

type TasksBoardProps = {
  variant: 'standalone' | 'embedded';
  columns?: readonly Column[];
  tasks: Task[];
  onAddTask: (listId: string, draft: TaskDraft) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onTaskSelect?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  className?: string;
  trailingColumn?: React.ReactNode;
};

export function TasksBoard({
  variant,
  columns = TASK_LISTS,
  tasks,
  onAddTask,
  onToggleTaskCompletion,
  onDeleteTask,
  onDuplicateTask,
  onTaskSelect,
  onEditTask,
  className,
  trailingColumn,
}: TasksBoardProps) {
  const [activeComposer, setActiveComposer] = React.useState<string | null>(null);
  const [sortOption, setSortOption] = React.useState<Record<string, string>>({});

  const handleComposerOpen = React.useCallback((columnId: string) => {
    setActiveComposer(columnId);
  }, []);

  const handleComposerClose = React.useCallback(() => {
    setActiveComposer(null);
  }, []);

  const handleAddFromComposer = React.useCallback(
    (columnId: string, title: string, dueDate?: string, priority?: Priority) => {
      if (!title.trim()) return;
      onAddTask(columnId, { title: title.trim(), dueDate, priority });
      setActiveComposer(null);
    },
    [onAddTask],
  );

  const getTasksForColumn = React.useCallback(
    (columnId: string) => {
      const sortBy = sortOption[columnId] ?? 'date-created';
      const items = tasks.filter((task) => belongsToColumn(task, columnId));
      return sortTasks([...items], sortBy);
    },
    [sortOption, tasks],
  );

  const handleSortChange = React.useCallback((columnId: string, nextSort: string) => {
    setSortOption((prev) => ({ ...prev, [columnId]: nextSort }));
  }, []);

  return (
    <div className={['min-h-full overflow-x-auto px-6 py-4', className].filter(Boolean).join(' ')}>
      <div className="density-compact flex min-w-max items-start gap-[var(--space-4)]">
        {columns.map((column) => {
          const columnId = column.id;
          const columnTasks = getTasksForColumn(columnId);
          return (
            <div key={columnId} className="flex min-w-[280px] min-h-[160px] flex-col bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
              <div className="flex flex-col gap-[var(--task-card-gap)]">
                <TaskColumnHeader
                  columnTitle={column.title}
                  taskCount={columnTasks.length}
                  currentSort={sortOption[columnId] ?? 'date-created'}
                  onSort={(value) => handleSortChange(columnId, value)}
                  onHideCompleted={noop}
                  onRenameList={noop}
                  onDeleteList={noop}
                />

                <div className="flex flex-col gap-[var(--task-card-gap)]">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      taskTitle={task.title}
                      dueDate={task.dueDate}
                      priority={task.priority ?? 'none'}
                      labels={task.labels ?? []}
                      isCompleted={Boolean(task.isCompleted)}
                      onToggleCompletion={() => onToggleTaskCompletion(task.id)}
                      onClick={() => onTaskSelect?.(task)}
                      onEdit={() => onEditTask?.(task)}
                      onDuplicate={() => onDuplicateTask?.(task)}
                      onDelete={() => onDeleteTask?.(task.id)}
                    />
                  ))}
                  {columnTasks.length === 0 && activeComposer !== columnId ? (
                    <button
                      type="button"
                      className="w-full rounded-[var(--task-card-radius)] border border-dashed border-[var(--border-subtle)] bg-transparent px-[var(--task-card-pad-x)] py-[var(--task-card-pad-y)] text-left text-sm text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                      onClick={() => handleComposerOpen(columnId)}
                    >
                      Add a task
                    </button>
                  ) : null}
                </div>

                <div className="mt-auto pt-[var(--space-2)]">
                  {activeComposer === columnId ? (
                    <TaskComposer
                      onAddTask={(title, dueDate, priority) => handleAddFromComposer(columnId, title, dueDate, priority)}
                      onCancel={handleComposerClose}
                    />
                  ) : (
                    <TaskAddButton onClick={() => handleComposerOpen(columnId)} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {trailingColumn}
      </div>
    </div>
  );
}

function belongsToColumn(task: Task, columnId: string) {
  if (!task) return false;
  if ('listId' in task && task.listId) {
    if (task.listId === columnId) return true;
  }
  return task.status === columnId;
}

function sortTasks(tasks: Task[], sortBy: string) {
  if (sortBy === 'title') {
    return tasks.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortBy === 'due-date') {
    return tasks.sort((a, b) => {
      const ad = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }

  if (sortBy === 'priority') {
    const order: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
    return tasks.sort((a, b) => (order[(b.priority ?? 'none')] ?? 0) - (order[(a.priority ?? 'none')] ?? 0));
  }

  return tasks.sort(compareTasks);
}

function compareTasks(a: Task, b: Task): number {
  if (Boolean(a.isCompleted) !== Boolean(b.isCompleted)) {
    return a.isCompleted ? 1 : -1;
  }

  if (!a.isCompleted) {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }

    const ad = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const bd = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;

    const priorityRank = (value: Priority | undefined) => {
      switch (value) {
        case 'high':
          return 0;
        case 'medium':
          return 1;
        case 'low':
          return 2;
        default:
          return 3;
      }
    };

    const prA = priorityRank(a.priority ?? 'none');
    const prB = priorityRank(b.priority ?? 'none');
    if (prA !== prB) return prA - prB;

    const createdA = Date.parse(a.dateCreated ?? a.createdAt);
    const createdB = Date.parse(b.dateCreated ?? b.createdAt);
    return createdA - createdB;
  }

  const completedA = a.completedAt ? Date.parse(a.completedAt) : 0;
  const completedB = b.completedAt ? Date.parse(b.completedAt) : 0;
  return completedA - completedB;
}

const noop = () => {};
