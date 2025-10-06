import React, { KeyboardEvent } from 'react';
import { Calendar as CalendarIcon, Flag } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';
import type { Task, Priority } from './types';

export const priorityBadgeClasses: Record<Priority, string> = {
  high: 'bg-[var(--danger)] text-white',
  medium: 'bg-[var(--warning)] text-white',
  low: 'bg-[var(--success)] text-white',
  none: 'bg-[var(--primary-tint-10)] text-[var(--primary)]'
};

interface TaskCardProps {
  task: Task;
  dueLabel?: string;
  onToggleComplete: (taskId: string, checked: boolean) => void;
  onOpen: (taskId: string) => void;
  dragging?: boolean;
}

export function TaskCard({ task, dueLabel, onToggleComplete, onOpen, dragging }: TaskCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(task.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-dragging={dragging || undefined}
      className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-3)] shadow-[var(--elevation-sm)] motion-safe:transition-shadow motion-safe:duration-[var(--duration-fast)] hover:shadow-[var(--elevation-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      onClick={() => onOpen(task.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-[var(--space-2)]">
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={(checked) => onToggleComplete(task.id, Boolean(checked))}
          aria-label={task.isCompleted ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
          onClick={(event) => event.stopPropagation()}
        />
        <div className="flex-1 space-y-[var(--space-2)]">
          {/* Task title */}
          <p
            className={cn(
              'text-[var(--text-base)] text-[var(--text-primary)] mb-[var(--space-2)]',
              task.isCompleted && 'line-through text-[var(--text-tertiary)]'
            )}
            style={{ fontWeight: 'var(--font-weight-medium)' }}
          >
            {task.title}
          </p>
          
          {/* Task metadata: due date, labels, priority */}
          <div className="flex flex-wrap items-center gap-[var(--space-2)] text-[var(--text-xs)]">
            {dueLabel && (
              <span className="inline-flex items-center gap-[var(--space-1)] text-[var(--text-tertiary)]">
                <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {dueLabel}
              </span>
            )}
            {task.labels.map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="border-[color-mix(in_srgb,var(--primary) 20%,transparent)] text-[var(--primary)]"
                style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
              >
                #{label}
              </Badge>
            ))}
            {task.priority !== 'none' && (
              <Badge variant="secondary" className={priorityBadgeClasses[task.priority]}>
                {priorityLabel(task.priority)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function priorityLabel(priority: Priority) {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'None';
  }
}
