import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Task } from './types';

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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        taskTitle={task.title}
        dueDate={task.dueDate}
        priority={task.priority ?? 'none'}
        labels={task.labels ?? []}
        isCompleted={Boolean(task.isCompleted)}
        onToggleCompletion={onToggleCompletion}
        onClick={onClick}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </div>
  );
}
