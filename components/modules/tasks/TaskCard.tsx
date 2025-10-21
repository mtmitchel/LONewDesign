import React from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Badge, badgeVariants } from '../../ui/badge';
import { cn } from '../../ui/utils';
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
  Check,
  AlertTriangle,
  Flag,
  Calendar,
  ListChecks,
} from 'lucide-react';

type TaskLabel = string | { name: string; color: string };

type DueState = 'none' | 'scheduled' | 'today' | 'overdue';

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'none';
  labels?: TaskLabel[];
  isCompleted: boolean;
  hasConflict?: boolean;
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

const CHIP_CLASS =
  'inline-flex h-[var(--chip-height)] items-center justify-start gap-[var(--chip-gap)] rounded-[var(--chip-radius)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-[length:var(--text-sm)] font-medium border border-transparent transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]';
const LABEL_CHIP_BASE_CLASS =
  'bg-[color:var(--chip-label-bg)] text-[color:var(--chip-label-fg)] shadow-[var(--chip-inset-shadow)] hover:bg-[color:color-mix(in_oklab,var(--chip-label-bg)_calc(100%+var(--chip-hover-bg-boost)),transparent)]';
const LABEL_HUES = new Set(['blue', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'gray']);
const getLabelHue = (color: string | undefined) => {
  if (!color) return undefined;
  const match = color.match(/--label-([a-z]+)/i);
  if (match) {
    const hue = match[1].toLowerCase();
    return LABEL_HUES.has(hue) ? hue : undefined;
  }
  const normalized = color.trim().toLowerCase();
  return LABEL_HUES.has(normalized) ? normalized : undefined;
};

const EMPTY_META_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] grid place-items-center text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] hover:bg-[color:var(--caret-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-surface)] transition-colors';

const DUE_PILL_BASE_CLASS =
  'inline-flex items-center gap-[var(--space-1)] h-[var(--chip-height)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--text-sm)] font-medium transition-colors shadow-[inset_0_0_0_1px_var(--border-subtle)]';

const DUE_TONE_CLASSES: Record<DueState, string> = {
  none: 'bg-transparent text-[color:var(--text-tertiary)]',
  scheduled: 'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)]',
  today:
    'bg-[color-mix(in_oklab,var(--due-today)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-today)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-today)_35%,transparent)]',
  overdue:
    'bg-[color-mix(in_oklab,var(--due-overdue)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-overdue)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-overdue)_35%,transparent)]',
};

const formatSubtaskLabel = (completed: number, total: number) => `${completed}/${total}`;

export function TaskCard({ 
    taskTitle, 
    dueDate,
    priority = 'none',
    labels: rawLabels = [],
    isCompleted, 
    hasConflict,
    subtaskCount = 0,
    completedSubtaskCount = 0,
    onToggleCompletion, 
    onClick, 
    onEdit, 
    onDuplicate, 
    onDelete 
}: TaskCardProps) {
  const labels = Array.isArray(rawLabels) ? rawLabels : [];

  const dueMeta = React.useMemo(() => {
    const trimmed = dueDate?.trim();
    if (!trimmed) {
      return { label: '', state: 'none' as const };
    }

    let parsed: Date | null = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      parsed = parseISO(trimmed);
    } else {
      const candidate = new Date(trimmed);
      parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
    }

    if (!parsed || Number.isNaN(parsed.getTime())) {
      return {
        label: trimmed,
        state: 'scheduled' as const,
      };
    }

    const label = format(parsed, 'MMM d');
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const parsedKey = format(parsed, 'yyyy-MM-dd');
    const isToday = parsedKey === todayKey;
    const isOverdue = parsed.getTime() < Date.now() && !isToday;

    return {
      label,
      state: isOverdue ? ('overdue' as const) : isToday ? ('today' as const) : ('scheduled' as const),
    };
  }, [dueDate]);

  const hasLabels = labels.length > 0;
  const totalSubtasks = Math.max(0, subtaskCount);
  const completedSubtasks = Math.min(totalSubtasks, Math.max(0, completedSubtaskCount));
  const showSubtasksIndicator = totalSubtasks > 0;

  const dueToneClass = DUE_TONE_CLASSES[dueMeta.state];
  const dueContent = dueMeta.label
    ? (
        <span data-due-state={dueMeta.state} className={cn(DUE_PILL_BASE_CLASS, dueToneClass)}>
          <Calendar
            className="h-[var(--icon-sm)] w-[var(--icon-sm)]"
            strokeWidth={1.25}
            aria-hidden
          />
          <span>{dueMeta.label}</span>
        </span>
      )
    : null;

  const priorityContent = priority !== 'none'
    ? (
        <span
          className={cn(
            badgeVariants({
              variant: 'soft',
              tone: priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low',
              size: 'sm',
            }),
            CHIP_CLASS,
          )}
        >
          <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
          <span>{priority[0].toUpperCase() + priority.slice(1)}</span>
        </span>
      )
    : null;

  const labelContent = hasLabels
    ? labels.map((label, idx) => {
        const labelColor = getTaskLabelColor(label);
        const labelHue = getLabelHue(labelColor);
        return (
          <Badge
            key={`${getTaskLabelName(label)}-${idx}`}
            variant="soft"
            size="sm"
            data-label-color={labelHue}
            className={cn(CHIP_CLASS, LABEL_CHIP_BASE_CLASS)}
          >
            {getTaskLabelName(label)}
          </Badge>
        );
      })
    : [];

  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <Card 
              className={`bg-[var(--bg-surface)] border border-[var(--task-card-border)] rounded-[var(--task-card-radius)] shadow-[var(--task-card-shadow)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-shadow duration-[var(--duration-base)] px-[var(--task-card-padding-x)] py-[var(--task-card-pad-y)] cursor-pointer min-h-[44px]`}
              onClick={onClick}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-[var(--task-leading-gap-x)]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion();
                      }}
                      className="mt-1 grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color,box-shadow] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
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
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[length:var(--task-title-size)] font-[var(--font-weight-medium)] leading-snug line-clamp-2 ${isCompleted ? 'line-through text-[color:var(--text-tertiary)] opacity-60' : 'text-[color:var(--text-primary)]'}`}>
                      {hasConflict && <AlertTriangle className="h-4 w-4 text-yellow-500 inline-block mr-2" />}
                      {taskTitle}
                    </h4>
                    {(dueContent || priorityContent || hasLabels || showSubtasksIndicator) && (
                      <div className="mt-[var(--space-1)] flex flex-wrap items-center gap-[var(--chip-gap)]">
                        {dueContent}
                        {priorityContent}
                        {labelContent}
                        {showSubtasksIndicator && (
                          <span className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                            <ListChecks className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                            {formatSubtaskLabel(completedSubtasks, totalSubtasks)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
