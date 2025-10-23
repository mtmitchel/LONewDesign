import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Task } from './types';

export function getSubtaskProgress(subtasks: Task['subtasks']) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return { total: 0, completed: 0 };
  }

  let total = 0;
  let completed = 0;

  for (const subtask of subtasks) {
    if (!subtask) {
      continue;
    }

    total += 1;

    const raw = (subtask as any).isCompleted ?? (subtask as any).is_completed ?? (subtask as any).status;
    let isDone = false;

    if (typeof raw === 'boolean') {
      isDone = raw;
    } else if (typeof raw === 'number') {
      isDone = raw === 1;
    } else if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      isDone = normalized === 'completed' || normalized === 'true' || normalized === '1';
    }

    if (isDone) {
      completed += 1;
    }
  }

  return { total, completed };
}

type SortableTaskCardProps = {
  task: Task;
  onToggleCompletion: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function SortableTaskCard({
  task,
  onToggleCompletion,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { total: totalSubtasks, completed: completedSubtasks } = getSubtaskProgress(task.subtasks);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        taskTitle={task.title}
        dueDate={task.dueDate}
        priority={task.priority ?? 'none'}
        labels={task.labels ?? []}
        isCompleted={Boolean(task.isCompleted)}
        subtaskCount={totalSubtasks}
        completedSubtaskCount={completedSubtasks}
        onToggleCompletion={onToggleCompletion}
        onClick={onClick}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
  );
}
