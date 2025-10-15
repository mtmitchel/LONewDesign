import * as React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TASK_LISTS } from './constants';
import { Task, Priority } from './types';
import { TaskColumnHeader } from './TaskColumnHeader';
import { TaskAddButton } from './TaskAddButton';
import { TaskCard } from './TaskCard';
import { TaskComposer } from './TaskComposer';
import { SortableTaskCard } from './SortableTaskCard';
import { DroppableColumn } from './DroppableColumn';

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
  onDeleteList?: (listId: string) => void;
  onMoveTask?: (taskId: string, newListId: string) => void;
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
  onDeleteList,
  onMoveTask,
  className,
  trailingColumn,
}: TasksBoardProps) {
  const [activeComposer, setActiveComposer] = React.useState<string | null>(null);
  const [sortOption, setSortOption] = React.useState<Record<string, string>>({});
  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      return;
    }

    // Dropped onto column backdrop
    if (overId.startsWith('column-')) {
      const newListId = overId.replace('column-', '');
      if (task.listId !== newListId) {
        onMoveTask?.(taskId, newListId);
      }
      return;
    }

    // Dropped onto another task card; infer its column
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      const targetListId = overTask.listId ?? overTask.status;
      if (targetListId && task.listId !== targetListId) {
        onMoveTask?.(taskId, targetListId);
      }
    }
  };

  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div
      className={[
        'min-h-full overflow-x-auto px-6 py-4 bg-[var(--bg-canvas)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="density-compact flex min-w-max items-start gap-[var(--space-4)]">
        {columns.map((column) => {
          const columnId = column.id;
          const columnTasks = getTasksForColumn(columnId);
          const composerIsActive = activeComposer === columnId;
          const hasTasks = columnTasks.length > 0;
          return (
            <section
              key={columnId}
              className="flex w-[var(--board-lane-width)] flex-none flex-col"
            >
              <TaskColumnHeader
                columnTitle={column.title}
                taskCount={columnTasks.length}
                currentSort={sortOption[columnId] ?? 'date-created'}
                onSort={(value) => handleSortChange(columnId, value)}
                onHideCompleted={noop}
                onRenameList={noop}
                onDeleteList={() => onDeleteList?.(columnId)}
              />

              <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <DroppableColumn
                  id={`column-${columnId}`}
                  className={[
                    'flex flex-col rounded-[var(--board-lane-radius)] bg-[var(--board-lane-bg)] px-[var(--lane-padding-x)]',
                    hasTasks ? 'py-[var(--lane-padding-y)] min-h-[160px]' : 'pb-[var(--lane-padding-y)] pt-[var(--space-3)]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {hasTasks ? (
                    <ul className="space-y-[var(--gap-card-to-card)]">
                      {columnTasks.map((task) => (
                        <li key={task.id} className="mx-[var(--board-card-inset-x)]">
                          <SortableTaskCard
                            task={task}
                            onToggleCompletion={() => onToggleTaskCompletion(task.id)}
                            onClick={() => onTaskSelect?.(task)}
                            onEdit={() => onEditTask?.(task)}
                            onDuplicate={() => onDuplicateTask?.(task)}
                            onDelete={() => onDeleteTask?.(task.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}

                {composerIsActive ? (
                  <div
                    className={[
                      'mx-[var(--board-card-inset-x)]',
                      hasTasks ? 'mt-[var(--gap-header-to-stack)]' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <TaskComposer
                      onAddTask={(title, dueDate, priority) => handleAddFromComposer(columnId, title, dueDate, priority)}
                      onCancel={handleComposerClose}
                    />
                  </div>
                ) : (
                  <TaskAddButton
                    className={[
                      'mx-[var(--board-card-inset-x)]',
                      hasTasks ? 'mt-[var(--gap-header-to-stack)]' : undefined,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleComposerOpen(columnId)}
                  />
                )}
                </DroppableColumn>
              </SortableContext>
            </section>
          );
        })}
        {trailingColumn}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.8 }}>
            <TaskCard
              taskTitle={activeTask.title}
              dueDate={activeTask.dueDate}
              priority={activeTask.priority ?? 'none'}
              labels={activeTask.labels ?? []}
              isCompleted={Boolean(activeTask.isCompleted)}
              hasConflict={activeTask.hasConflict}
              onToggleCompletion={() => {}}
              onClick={() => {}}
              onEdit={() => {}}
              onDuplicate={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
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
