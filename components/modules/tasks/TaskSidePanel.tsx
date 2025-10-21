import * as React from 'react';
import { Calendar, Check, Flag, Plus, Tag, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

import { Checkbox } from '../../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { Badge, badgeVariants } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { PaneHeader } from '../../layout/PaneHeader';
import { useTaskStore } from './taskStore';
import type { Task, TaskLabel, Subtask } from './types';

export type ComposerLabel = {
  name: string;
  color: string;
};

const chipStyle = (color: string) => ({
  backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
  color: `color-mix(in oklab, ${color} 85%, var(--text-primary))`,
  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)`,
});

type DueState = 'none' | 'scheduled' | 'today' | 'overdue';

const EMPTY_META_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] grid place-items-center text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] hover:bg-[color:var(--caret-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--quick-panel-bg)] transition-colors';

const DUE_PILL_BASE_CLASS =
  'inline-flex items-center gap-[var(--space-1)] h-[var(--chip-height)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--text-sm)] font-medium shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-colors';

const DUE_TONE_CLASSES: Record<DueState, string> = {
  none: 'bg-transparent text-[color:var(--text-tertiary)]',
  scheduled: 'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)]',
  today:
    'bg-[color-mix(in_oklab,var(--due-today)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-today)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-today)_35%,transparent)]',
  overdue:
    'bg-[color-mix(in_oklab,var(--due-overdue)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-overdue)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-overdue)_35%,transparent)]',
};

const getTaskLabelName = (label: TaskLabel) => (typeof label === 'string' ? label : label.name);
const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

const toComposerLabel = (label: TaskLabel): ComposerLabel =>
  typeof label === 'string'
    ? { name: label, color: DEFAULT_LABEL_COLOR }
    : { name: label.name, color: label.color ?? DEFAULT_LABEL_COLOR };

type TaskSidePanelProps = {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  presentation?: 'overlay' | 'inline';
  className?: string;
};

function normalizeLabels(input: unknown): TaskLabel[] {
  if (Array.isArray(input)) return input as TaskLabel[];
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? (parsed as TaskLabel[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function TaskSidePanel({
  task,
  onClose,
  onUpdateTask,
  onDeleteTask,
  presentation = 'overlay',
  className,
}: TaskSidePanelProps) {
  const [editedTask, setEditedTask] = React.useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = React.useState<string | undefined>(undefined);
  const [labelsPopoverOpen, setLabelsPopoverOpen] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState('');
  const [priorityPopoverOpen, setPriorityPopoverOpen] = React.useState(false);
  const titleFieldRef = React.useRef<HTMLTextAreaElement | null>(null);
  const labelNameInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleToggleLabel = React.useCallback((label: ComposerLabel) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      const labels = normalizeLabels(prev.labels);
      const exists = labels.some((item) => getTaskLabelName(item) === label.name);
      if (exists) {
        return {
          ...prev,
          labels: labels.filter((item) => getTaskLabelName(item) !== label.name),
        };
      }
      return { ...prev, labels: [...labels, label] };
    });
  }, []);

  const handleAddLabel = React.useCallback((name: string) => {
    handleToggleLabel({ name, color: DEFAULT_LABEL_COLOR });
  }, [handleToggleLabel]);

  const focusLabelInput = React.useCallback(() => {
    const input = labelNameInputRef.current;
    if (!input) return;

    input.focus({ preventScroll: true });
    const caretPosition = input.value.length;
    input.setSelectionRange?.(caretPosition, caretPosition);
  }, []);

  const addFreeformLabel = React.useCallback(() => {
    const value = labelInput.trim();
    if (!value) return;

    handleAddLabel(value);
    setLabelInput('');
  }, [labelInput, handleAddLabel]);

  const adjustTitleHeight = React.useCallback(() => {
    const el = titleFieldRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    if (!task) {
      setEditedTask(null);
      setNewSubtaskTitle('');
      setNewSubtaskDueDate(undefined);
      return;
    }

    setEditedTask(task);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
  }, [task]);

  React.useLayoutEffect(() => {
    adjustTitleHeight();
  }, [adjustTitleHeight, editedTask?.title, task?.id, presentation]);

  const headingId = task ? `task-panel-title-${task.id}` : undefined;

  // Build available labels from all tasks in store so search shows existing labels
  const tasksById = useTaskStore((s) => s.tasksById);
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, ComposerLabel>();
    Object.values(tasksById).forEach((t) => {
      const labels = normalizeLabels(t?.labels ?? []);
      labels.forEach((lbl) => {
        const name = getTaskLabelName(lbl);
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) {
          const color = typeof lbl === 'string' ? DEFAULT_LABEL_COLOR : lbl.color ?? DEFAULT_LABEL_COLOR;
          map.set(key, { name, color });
        }
      });
    });
    return Array.from(map.values());
  }, [tasksById]);

  const selectedLabels = React.useMemo(() => {
    const labels = normalizeLabels(editedTask?.labels ?? []);
    const map = new Map<string, ComposerLabel>();
    labels.forEach((label) => {
      const composer = toComposerLabel(label);
      if (!composer.name) return;
      const key = composer.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, composer);
      }
    });
    return Array.from(map.values());
  }, [editedTask?.labels]);

  const mergedLabels = React.useMemo(() => {
    const map = new Map<string, ComposerLabel>();
    [...availableLabels, ...selectedLabels].forEach((label) => {
      const key = label.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, label);
      }
    });
    return Array.from(map.values());
  }, [availableLabels, selectedLabels]);

  const parseDisplayDate = React.useCallback((dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr);
    }
    const currentYear = new Date().getFullYear();
    const parsed = new Date(`${dateStr}, ${currentYear}`);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, []);

  const handleFieldChange = React.useCallback((field: keyof Task, value: unknown) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      if (field === 'labels') {
        return { ...prev, labels: normalizeLabels(value) };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleAddSubtask = React.useCallback(() => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      if (!newSubtaskTitle.trim()) return prev;
      const nextSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        isCompleted: false,
        dueDate: newSubtaskDueDate,
      };
      return { ...prev, subtasks: [...(prev.subtasks ?? []), nextSubtask] };
    });
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
  }, [newSubtaskDueDate, newSubtaskTitle]);

  const handleToggleSubtaskCompletion = React.useCallback((subtaskId: string, isCompleted: boolean) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: (prev.subtasks ?? []).map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
        ),
      };
    });
  }, []);

  const handleUpdateSubtaskTitle = React.useCallback((subtaskId: string, title: string) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: (prev.subtasks ?? []).map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, title } : subtask,
        ),
      };
    });
  }, []);

  const handleUpdateSubtaskDueDate = React.useCallback((subtaskId: string, dueDate: string | undefined) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: (prev.subtasks ?? []).map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, dueDate } : subtask,
        ),
      };
    });
  }, []);

  const handleDeleteSubtask = React.useCallback((subtaskId: string) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: (prev.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId),
      };
    });
  }, []);

  const handleSaveChanges = React.useCallback(() => {
    if (!editedTask) return;
    onUpdateTask(editedTask);
    onClose();
  }, [editedTask, onClose, onUpdateTask]);

  const containerClass = cn(
    'flex flex-col',
    presentation === 'inline'
      ? 'h-full w-full border-l border-[var(--quick-panel-border)] bg-[var(--quick-panel-bg)]'
      : 'fixed top-[var(--pane-header-h)] right-0 bottom-0 z-[var(--z-overlay)] h-[calc(100%-var(--pane-header-h))] border-l border-[var(--quick-panel-border)] bg-[var(--quick-panel-bg)] shadow-[var(--elevation-xl)]',
    className,
  );

  const overlayStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (presentation !== 'overlay') {
      return undefined;
    }

    return {
      width:
        'clamp(var(--task-panel-min-width, 352px), calc((100vw - var(--sidebar-current-width, var(--sidebar-width))) * var(--task-panel-ratio, 0.38)), var(--task-panel-max-width, 640px))',
    };
  }, [presentation]);

  const regionProps = presentation === 'inline' && headingId
    ? { role: 'region' as const, 'aria-labelledby': headingId }
    : {};

  if (!task || !editedTask) {
    return null;
  }

  const dueDateValue = editedTask.dueDate ? parseDisplayDate(editedTask.dueDate) : undefined;
  const dueState: DueState = React.useMemo(() => {
    if (!dueDateValue) return 'none';
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const targetKey = format(dueDateValue, 'yyyy-MM-dd');
    if (targetKey === todayKey) return 'today';
    return dueDateValue.getTime() < today.getTime() ? 'overdue' : 'scheduled';
  }, [dueDateValue]);
  const dueDisplayLabel = dueDateValue ? format(dueDateValue, 'EEE, MMM d') : undefined;
  const hasDueDate = dueState !== 'none';
  const currentPriority: Task['priority'] = editedTask.priority ?? 'none';

  const getPriorityLabel = (value: Task['priority']) =>
    value === 'none' ? 'No priority' : value[0].toUpperCase() + value.slice(1);

  const renderPriorityChip = (value: Task['priority']) => {
    if (value === 'none') {
      return null;
    }

    const tone = value === 'high' ? 'high' : value === 'medium' ? 'medium' : 'low';
    return (
      <Badge
        variant="soft"
        tone={tone}
        size="sm"
        className="flex items-center gap-[var(--space-1)]"
      >
        <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
        <span>{getPriorityLabel(value)}</span>
      </Badge>
    );
  };

  return (
    <div className={containerClass} style={overlayStyle} {...regionProps}>
      <div className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--quick-panel-bg)] px-6 py-[var(--space-4)] shadow-[var(--elevation-sm)]">
        <PaneHeader role="heading" className="justify-between px-0 py-0">
          <h2 id={headingId} className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
            Task details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
            aria-label="Close task details"
          >
            <X className="size-5" aria-hidden />
          </button>
        </PaneHeader>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-6)]">
          <section className="flex flex-col gap-[var(--space-2)]">
            <textarea
              ref={titleFieldRef}
              value={editedTask.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-[length:var(--text-2xl)] font-semibold leading-tight text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-0 whitespace-pre-wrap"
              placeholder="Task name"
              rows={1}
              onInput={() => adjustTitleHeight()}
            />
          </section>

          <section className="flex flex-col gap-[var(--space-3)]">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
              <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Due date</span>
              <div className="flex items-center gap-[var(--space-2)]">
                <Popover>
                  <PopoverTrigger asChild>
                    {hasDueDate ? (
                      <button
                        type="button"
                        data-due-state={dueState}
                        className={cn(DUE_PILL_BASE_CLASS, DUE_TONE_CLASSES[dueState])}
                        aria-label={dueDisplayLabel ? `Choose date (${dueDisplayLabel})` : 'Choose date'}
                      >
                        <Calendar
                          className="h-[var(--icon-sm)] w-[var(--icon-sm)]"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                        <span>{dueDisplayLabel}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Choose date"
                        className={EMPTY_META_BUTTON_CLASS}
                      >
                        <Calendar
                          className="h-[var(--icon-sm)] w-[var(--icon-sm)]"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                      </button>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dueDateValue}
                      onSelect={(date) =>
                        handleFieldChange('dueDate', date ? format(date, 'yyyy-MM-dd') : undefined)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {hasDueDate ? (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('dueDate', undefined)}
                    className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-secondary)]"
                    aria-label="Clear due date"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
              <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Priority</span>
              <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
                <PopoverTrigger asChild>
                  {currentPriority === 'none' ? (
                    <button
                      type="button"
                      aria-label="Choose priority"
                      className={EMPTY_META_BUTTON_CLASS}
                    >
                      <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Choose priority (${getPriorityLabel(currentPriority)})`}
                      className={cn(
                        badgeVariants({
                          variant: 'soft',
                          tone: currentPriority === 'high' ? 'high' : currentPriority === 'medium' ? 'medium' : 'low',
                          size: 'sm',
                        }),
                        'inline-flex h-[var(--chip-height)] items-center gap-[var(--space-1)] rounded-[var(--chip-radius)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-panel)]',
                      )}
                    >
                      <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                      <span>{getPriorityLabel(currentPriority)}</span>
                    </button>
                  )}
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2">
                  <div className="flex flex-col gap-[var(--space-1)]">
                    {(['high','medium','low'] as const).map((value) => {
                      const isActive = currentPriority === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            handleFieldChange('priority', value);
                            setPriorityPopoverOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center justify-start gap-[var(--space-2)] px-[var(--space-2)] py-[var(--space-1_5)] text-left',
                            isActive && 'bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]',
                          )}
                        >
                          {renderPriorityChip(value)}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('priority', 'none');
                        setPriorityPopoverOpen(false);
                      }}
                      className={cn('flex w-full items-center justify-start px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[color:var(--text-tertiary)]')}
                      aria-label="No priority"
                    >
                      <span className="inline-flex h-[28px] w-[32px] items-center justify-center">—</span>
                    </button>
                  </div>
                </PopoverContent>
                </Popover>
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
              <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Labels</span>
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--space-2)]">
                <Popover
                  open={labelsPopoverOpen}
                  onOpenChange={(open) => {
                    setLabelsPopoverOpen(open);
                    if (open) {
                      requestAnimationFrame(focusLabelInput);
                    } else {
                      setLabelInput('');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={EMPTY_META_BUTTON_CLASS}
                      aria-label="Choose labels"
                    >
                      <Tag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[240px] p-3"
                    side="bottom"
                    sideOffset={8}
                    align="end"
                    onOpenAutoFocus={(event) => {
                      event.preventDefault();
                      requestAnimationFrame(focusLabelInput);
                    }}
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <div className="flex flex-col gap-[var(--space-2)]">
                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {mergedLabels.map((label) => {
                          const isSelected = selectedLabels.some((item) => item.name === label.name);
                          return (
                            <button
                              key={label.name}
                              type="button"
                              onClick={() => handleToggleLabel(label)}
                              className={`rounded-[var(--chip-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-surface)] transition-shadow ${
                                isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--bg-surface)]' : ''
                              }`}
                            >
                              <Badge
                                variant="soft"
                                size="sm"
                                className="flex items-center gap-[var(--space-1)]"
                                style={chipStyle(label.color)}
                              >
                                <span>{label.name}</span>
                                {isSelected ? <Check className="w-3 h-3" aria-hidden /> : null}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={labelInput}
                          onChange={(event) => setLabelInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addFreeformLabel();
                            }
                          }}
                          ref={labelNameInputRef}
                          aria-label="Label name"
                          autoFocus
                          autoComplete="off"
                          spellCheck={false}
                          inputMode="text"
                          className="flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] caret-[var(--primary)] focus:border-[var(--primary)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedLabels.length > 0 && (
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-[var(--space-1)]">
                    {selectedLabels.map((label) => (
                      <Badge
                        key={`selected-${label.name}`}
                        variant="soft"
                        size="sm"
                        className="flex items-center gap-[var(--space-1)]"
                        style={chipStyle(label.color)}
                      >
                        <span className="truncate max-w-[120px]" title={label.name}>{label.name}</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
            <header className="flex items-center justify-between">
              <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Subtasks</span>
            </header>
            <div className="flex flex-col gap-[var(--space-2)]">
              {(editedTask.subtasks ?? []).map((subtask) => (
                <div
                  key={subtask.id}
                  className="group flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-2_5)] py-[var(--space-1_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <Checkbox
                    checked={subtask.isCompleted}
                    onCheckedChange={(checked) => handleToggleSubtaskCompletion(subtask.id, Boolean(checked))}
                    className="size-5"
                    aria-label={subtask.isCompleted ? 'Mark subtask incomplete' : 'Mark subtask complete'}
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(event) => handleUpdateSubtaskTitle(subtask.id, event.target.value)}
                    className={cn(
                      'flex-1 rounded-[var(--radius-md)] border border-transparent bg-transparent px-[var(--space-2)] py-[var(--space-1)] text-sm text-[color:var(--text-primary)] focus:border-[var(--border-default)] focus:outline-none focus:ring-0',
                      subtask.isCompleted && 'line-through text-[color:var(--text-tertiary)]',
                    )}
                    placeholder="Untitled subtask"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-secondary)]"
                        aria-label="Choose subtask due date"
                      >
                        <Calendar className="size-4" aria-hidden />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                        onSelect={(date) =>
                          handleUpdateSubtaskDueDate(subtask.id, date ? format(date, 'yyyy-MM-dd') : undefined)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] opacity-0 transition-opacity duration-200 hover:text-[color:var(--text-secondary)] group-hover:opacity-100"
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] px-[var(--space-2_5)] py-[var(--space-2)]">
                <Plus className="size-4 text-[color:var(--text-tertiary)]" aria-hidden />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(event) => setNewSubtaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddSubtask();
                    } else if (event.key === 'Escape') {
                      setNewSubtaskTitle('');
                    }
                  }}
                  placeholder="Add a subtask"
                  className="flex-1 border-0 bg-transparent text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none"
                  aria-label="Add a subtask"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-secondary)]"
                      aria-label="Choose subtask due date"
                    >
                      <Calendar className="size-4" aria-hidden />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newSubtaskDueDate ? new Date(newSubtaskDueDate) : undefined}
                      onSelect={(date) => setNewSubtaskDueDate(date ? format(date, 'yyyy-MM-dd') : undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="text-[color:var(--text-secondary)]"
                >
                  Add
                </Button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
            <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Description</span>
            <textarea
              value={editedTask.description ?? ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="min-h-[120px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-canvas)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-tint-10)]"
            />
          </section>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-[var(--border-subtle)] bg-[var(--quick-panel-bg)] px-6 py-[var(--space-4)] shadow-[var(--elevation-sm)]">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-[color:var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)]"
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete task
          </Button>
          <Button type="button" variant="solid" onClick={handleSaveChanges}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export { TaskSidePanel };
export default TaskSidePanel;
