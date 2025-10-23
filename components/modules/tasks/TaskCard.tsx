import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge, badgeVariants } from '../../ui/badge';
import { cn } from '../../ui/utils';
import { TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS, getLabelHue } from './taskChipStyles';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '../../ui/context-menu';
import {
  Edit,
  Trash,
  Copy,
  CheckSquare,
  Flag,
  ListChecks,
} from 'lucide-react';
import { DueDateChip, getDueMeta } from './DueDateChip';

type TaskLabel = string | { name: string; color: string };

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'none';
  labels?: TaskLabel[];
  isCompleted: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  onToggleCompletion: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const getTaskLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getTaskLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;

const EMPTY_META_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] grid place-items-center text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] hover:bg-[color:var(--caret-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-surface)] transition-colors';

const formatSubtaskLabel = (remaining: number, total: number) => `${remaining}/${total}`;

export function TaskCard({ 
    taskTitle, 
    dueDate,
    priority = 'none',
    labels: rawLabels = [],
    isCompleted, 
    subtaskCount = 0,
    completedSubtaskCount = 0,
    onToggleCompletion, 
    onClick, 
    onEdit, 
    onDuplicate, 
    onDelete 
}: TaskCardProps) {
  const labels = Array.isArray(rawLabels) ? rawLabels : [];

  const dueMeta = React.useMemo(() => getDueMeta(dueDate), [dueDate]);
  const primaryGap = 'var(--space-4)';

  const totalSubtasks = Math.max(0, subtaskCount);
  const completedSubtasks = Math.min(totalSubtasks, Math.max(0, completedSubtaskCount));
  const remainingSubtasks = Math.max(0, totalSubtasks - completedSubtasks);
  const showSubtasksIndicator = totalSubtasks > 0;

  const priorityContent = priority !== 'none'
    ? (
        <span
          className={cn(
            badgeVariants({
              variant: 'soft',
              tone: priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low',
              size: 'sm',
            }),
            TASK_META_CHIP_CLASS,
          )}
        >
          <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
          <span>{priority[0].toUpperCase() + priority.slice(1)}</span>
        </span>
      )
    : null;

  const labelContent = labels.length > 0
    ? labels.map((label, idx) => {
        const labelColor = getTaskLabelColor(label);
        const labelHue = getLabelHue(labelColor);
        return (
          <Badge
            key={`${getTaskLabelName(label)}-${idx}`}
            variant="soft"
            size="sm"
            data-label-color={labelHue}
            className={cn(TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS)}
          >
            {getTaskLabelName(label)}
          </Badge>
        );
      })
    : [];

  const dueLine = dueMeta.label
    ? (
        <div className="ml-6 flex items-center">
          <DueDateChip meta={dueMeta} />
        </div>
      )
    : null;

  const priorityAndLabelsLine = priorityContent || labelContent.length > 0
    ? (
        <div
          className={cn(
            'ml-6 flex flex-wrap items-center gap-[var(--space-3)] text-[length:var(--text-sm)] text-[color:var(--text-secondary)]',
          )}
        >
          {priorityContent}
          {labelContent}
        </div>
      )
    : null;

  const subtasksLine = showSubtasksIndicator
    ? (
        <div className="ml-6 flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">
          <ListChecks className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
          {formatSubtaskLabel(remainingSubtasks, totalSubtasks)}
        </div>
      )
    : null;

  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <Card 
              className={`bg-[var(--bg-surface)] border border-[var(--task-card-border)] rounded-[var(--task-card-radius)] shadow-[var(--task-card-shadow)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-shadow duration-[var(--duration-base)] px-[var(--task-card-padding-x)] py-[var(--task-card-pad-y)] cursor-pointer min-h-[64px]`}
              onClick={onClick}
            >
              <CardContent className="p-0">
                <div className="flex flex-col gap-[var(--space-3)]">
                  <div className={`flex items-center gap-[${primaryGap}]`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion();
                      }}
                      className="grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color,box-shadow] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                      aria-pressed={isCompleted}
                      aria-label={isCompleted ? 'Mark as not done' : 'Mark as done'}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="size-[calc(var(--check-size)-4px)]"
                        aria-hidden="true"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="10"
                          className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                        />
                        <path
                          d="M5 10.5l3 3 7-7"
                          fill="none"
                          strokeWidth="2"
                          className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <h4 className={`flex-1 min-w-0 text-[length:var(--task-title-size)] font-[var(--font-weight-medium)] leading-snug line-clamp-2 ${isCompleted ? 'line-through text-[color:var(--text-tertiary)] opacity-60' : 'text-[color:var(--text-primary)]'}`}>
                      {taskTitle}
                    </h4>
                  </div>
                  {(dueLine || priorityAndLabelsLine || subtasksLine) && (
                    <div className="space-y-[var(--space-2)]">
                      {dueLine}
                      {priorityAndLabelsLine}
                      {subtasksLine}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
            <ContextMenuItem onClick={onToggleCompletion} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <CheckSquare className="w-4 h-4 mr-2" />
                {isCompleted ? 'Mark as not completed' : 'Mark completed'}
            </ContextMenuItem>
            <ContextMenuItem onClick={onEdit} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Trash className="w-4 h-4 mr-2" />
                Delete
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}
