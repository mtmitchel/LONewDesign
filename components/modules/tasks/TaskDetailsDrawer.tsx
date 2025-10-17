import * as React from 'react';
import { Calendar, Check, Flag, GripVertical, Plus, Tag, X } from 'lucide-react';
import { addDays, format } from 'date-fns';

import { Button } from '../../ui/button';
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Badge, badgeVariants } from '../../ui/badge';

import { Calendar as CalendarComponent } from '../../ui/calendar';
import { Input } from '../../ui/input';
import { cn } from '../../ui/utils';
import type { Task, TaskLabel, Subtask } from './types';
import { useTaskStore } from './taskStore';

type Props = {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
};

const getLabelName = (label: TaskLabel) => (typeof label === 'string' ? label : label.name);
const QUICK_PICKS = [
  { label: 'Today', resolver: () => new Date() },
  { label: 'Tomorrow', resolver: () => addDays(new Date(), 1) },
  { label: 'Next week', resolver: () => addDays(new Date(), 7) },
];

const GRID_TEMPLATE: React.CSSProperties = {
  gridTemplateColumns: 'max-content minmax(0, var(--task-drawer-field-max-w))',
  columnGap: 'var(--space-8)',
};

const LABEL_CELL_CLASS = 'text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center';
const VALUE_CELL_CLASS = 'flex items-center min-h-[var(--row-min-h)] w-full';
const CHIP_CLASS = 'inline-flex items-center gap-[var(--chip-gap)] h-[var(--chip-height)] px-[var(--chip-px)] py-[var(--chip-py)] rounded-[var(--chip-radius)] text-[length:var(--text-xs)] font-medium border transition-colors duration-[var(--duration-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]';

const DEFAULT_LABEL_COLOR = 'var(--label-blue)';
const chipStyle = (color: string) => ({
  backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
  color: `color-mix(in oklab, ${color} 85%, var(--text-primary))`,
  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)`,
});

const useOverlayGutter = () => {
  const [value, setValue] = React.useState<number>(16);
  React.useEffect(() => {
    const root = document.documentElement;
    const token = getComputedStyle(root).getPropertyValue('--overlay-gutter');
    const parsed = Number.parseInt(token, 10);
    if (!Number.isNaN(parsed)) setValue(parsed);
  }, []);
  return value;
};

export function TaskDetailsDrawer({ task, onClose, onUpdateTask, onDeleteTask }: Props) {
  const [edited, setEdited] = React.useState<Task | null>(null);
  const [savedHint, setSavedHint] = React.useState<string | null>(null);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState('');
  const labelInputRef = React.useRef<HTMLInputElement | null>(null);

  const overlayPadding = useOverlayGutter();

  const tasksById = useTaskStore((s) => s.tasksById);

  React.useEffect(() => {
    setEdited(task);
  }, [task]);

  const handleSave = React.useCallback((updates: Partial<Task>) => {
    setEdited((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates } as Task;
      onUpdateTask(next);
      setSavedHint('Saved');
      const t = setTimeout(() => setSavedHint(null), 1200);
      return next;
    });
  }, [onUpdateTask]);

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    // Escape closes drawer
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    
    // Cmd/Ctrl+Enter marks task complete
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave({ isCompleted: !edited?.isCompleted });
      return;
    }
  }, [onClose, handleSave, edited]);
  
  React.useEffect(() => {
    if (!task) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, handleKeyDown]);

  // IMPORTANT: Keep all hooks above any conditional returns to preserve hook order across renders.
  // Build available labels from store on every render (memoized by tasksById).
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    Object.values(tasksById).forEach((t) => {
      const labels = Array.isArray(t.labels) ? (t.labels as TaskLabel[]) : [];
      labels.forEach((l) => map.set(getLabelName(l), typeof l === 'string' ? 'var(--label-blue)' : l.color));
    });
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [tasksById]);

  const currentLabels = React.useMemo(() => {
    const raw = (edited?.labels as TaskLabel[] | undefined) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [edited]);

  const selectedLabels = React.useMemo(
    () =>
      currentLabels.map((label) =>
        typeof label === 'string'
          ? { name: label, color: DEFAULT_LABEL_COLOR }
          : { name: label.name, color: label.color ?? DEFAULT_LABEL_COLOR },
      ),
    [currentLabels],
  );

  const normalizedAvailableLabels = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    availableLabels.forEach((label) => {
      const key = label.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: label.name, color: label.color });
      }
    });
    return Array.from(map.values());
  }, [availableLabels]);

  const mergedLabelOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    [...normalizedAvailableLabels, ...selectedLabels].forEach((label) => {
      const key = label.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, label);
      }
    });
    return Array.from(map.values());
  }, [normalizedAvailableLabels, selectedLabels]);

  const toggleLabel = React.useCallback(
    (label: { name: string; color: string }) => {
      const exists = currentLabels.some((item) => getLabelName(item) === label.name);
      const normalized = { name: label.name, color: label.color ?? DEFAULT_LABEL_COLOR };
      handleSave({
        labels: exists
          ? currentLabels.filter((item) => getLabelName(item) !== label.name)
          : [...currentLabels, normalized],
      });
    },
    [currentLabels, handleSave],
  );

  const focusLabelInput = React.useCallback(() => {
    const input = labelInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const value = input.value;
    input.setSelectionRange?.(value.length, value.length);
  }, []);

  const addFreeformLabel = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    toggleLabel({ name: trimmed, color: DEFAULT_LABEL_COLOR });
    setLabelInput('');
  }, [toggleLabel]);

  React.useLayoutEffect(() => {
    if (!labelsOpen) return;
    const frame = requestAnimationFrame(() => {
      focusLabelInput();
    });
    return () => cancelAnimationFrame(frame);
  }, [labelsOpen, focusLabelInput]);

  const renderPriorityChip = React.useCallback((value: Task['priority']) => {
    if (value === 'none') return null;
    const tone = value === 'high' ? 'high' : value === 'medium' ? 'medium' : 'low';
    return (
      <span
        className={cn(
          badgeVariants({ variant: 'soft', tone, size: 'sm' }),
          'inline-flex items-center gap-[var(--space-1)]',
        )}
      >
        <Flag className="size-[var(--icon-2xs)]" aria-hidden />
        <span>{value[0].toUpperCase() + value.slice(1)}</span>
      </span>
    );
  }, []);

  // Focus management: auto-focus title when drawer opens
  const titleRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (task && titleRef.current) {
      // Small delay to ensure drawer animation doesn't conflict
      const timer = setTimeout(() => {
        titleRef.current?.focus();
        titleRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [task]);

  if (!task || !edited) return null;

  const headingId = `task-drawer-title-${task.id}`;

  const dueDate = edited.dueDate ? new Date(edited.dueDate) : undefined;
  const isCompleted = Boolean(edited.isCompleted);
  const priority: Task['priority'] = edited.priority ?? 'none';
  const priorityLabel = priority !== 'none' ? priority[0].toUpperCase() + priority.slice(1) : '';
  const priorityTone = priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : priority === 'low' ? 'low' : undefined;
  const subCount = edited.subtasks?.length ?? 0;
  const doneCount = (edited.subtasks ?? []).filter((s) => s.isCompleted).length;

  const isOverdue = dueDate ? new Date(edited.dueDate!).getTime() < Date.now() && !isCompleted : false;
  const isToday = dueDate ? format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;
  return (
    <>
      {/* overlay */}
      <button
        aria-hidden
        className="fixed left-0 right-0 bottom-0 top-[var(--pane-header-h)] z-[69] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
        onClick={onClose}
      />

      <aside
        className="fixed right-0 bottom-0 top-[var(--pane-header-h)] z-[70] flex flex-col bg-[var(--bg-panel)] shadow-[var(--elevation-xl)] motion-safe:transition-transform duration-[var(--duration-sm)] ease-[var(--ease-emphasized)] px-[var(--panel-pad-x)] pb-[var(--panel-pad-y)]"
        style={{
          width: 'var(--task-drawer-w)',
          maxWidth: 'calc(100vw - 2 * var(--task-drawer-edge))',
          maxHeight: 'calc(100dvh - var(--pane-header-h))',
        }}
        role="dialog"
        aria-labelledby={headingId}
        aria-modal
      >
        {/* Sticky header */}
        <header className="sticky top-0 bg-[var(--bg-panel)]">
          <div className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[12px] border-b border-[color:var(--border-subtle)]">
            <Button
              variant={isCompleted ? 'outline' : 'default'}
              size="sm"
              onClick={() => handleSave({ isCompleted: !isCompleted })}
            >
              {isCompleted ? 'Reopen' : 'Mark complete'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="size-[var(--icon-sm)]" />
            </Button>
          </div>
          <div className="px-[var(--space-4)] py-[var(--space-3)]">
            <h1 className="text-[length:var(--text-2xl)] font-semibold text-[color:var(--text-primary)] leading-tight">
              {task.title}
            </h1>
          </div>
          <div aria-live="polite" className="sr-only">{savedHint ?? ''}</div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-6)] py-[var(--space-5)]">

            {/* Metadata */}
            <div className="grid gap-y-[var(--space-4)]" style={GRID_TEMPLATE}>
              <span className={LABEL_CELL_CLASS}>Due date</span>
              <div className={cn(VALUE_CELL_CLASS, 'gap-[var(--space-2)]')}>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size={dueDate ? 'sm' : 'icon'}
                      className={cn(
                        'rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface-elevated)] transition-colors hover:border-[color:var(--border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0 focus-visible:ring-0 focus-visible:border-[color:var(--border-strong)]',
                        dueDate
                          ? 'h-[34px] px-[var(--space-3)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)] hover:text-[color:var(--text-primary)]'
                          : 'size-[34px] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]',
                        dueDate && isOverdue && 'text-[color:var(--due-overdue)]',
                        dueDate && !isOverdue && isToday && 'text-[color:var(--due-today)]',
                        dateOpen && 'border-[color:var(--border-strong)]'
                      )}
                      aria-label={dueDate ? `Change due date (${format(dueDate, 'EEE, MMM d')})` : 'Add due date'}
                    >
                      {dueDate ? format(dueDate, 'EEE, MMM d') : <Calendar className="size-[var(--icon-sm)]" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    collisionPadding={overlayPadding}
                    className="w-auto p-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]"
                  >
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={(d) => {
                        handleSave({ dueDate: d ? format(d, 'yyyy-MM-dd') : undefined });
                        setDateOpen(false);
                      }}
                      className="p-0"
                    />
                    <PopoverArrow className="fill-[var(--bg-surface)] drop-shadow-[var(--elevation-sm)]" />
                  </PopoverContent>
                </Popover>
              </div>

              <span className={LABEL_CELL_CLASS}>Priority</span>
              <div className={cn(VALUE_CELL_CLASS, 'gap-[var(--space-2)]')}>
                <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                  <PopoverTrigger asChild>
                    {priority === 'none' || !priorityTone ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-[34px] rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)]"
                        aria-label="Set priority"
                      >
                        <Flag className="size-[var(--icon-sm)]" aria-hidden />
                      </Button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Change priority (${priorityLabel})`}
                        className={cn(
                          badgeVariants({ variant: 'soft', tone: priorityTone, size: 'sm' }),
                          'inline-flex items-center gap-[var(--space-1)] border border-[color:var(--border-subtle)] hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0 focus-visible:ring-0',
                        )}
                      >
                        <Flag className="size-[var(--icon-2xs)]" aria-hidden />
                        <span>{priorityLabel}</span>
                      </button>
                    )}
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    collisionPadding={overlayPadding}
                    className="w-[min(260px,100vw)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] p-[var(--space-2)] shadow-[var(--elevation-lg)]"
                  >
                    <div className="flex flex-col gap-[var(--space-1)]">
                      {(['high', 'medium', 'low'] as Task['priority'][]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className={cn(
                            'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] hover:bg-[var(--bg-surface)]',
                            priority === value && 'bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]',
                          )}
                          onClick={() => {
                            handleSave({ priority: value });
                            setPriorityOpen(false);
                          }}
                        >
                          <span className="flex items-center gap-[var(--space-2)]">
                            {renderPriorityChip(value)}
                          </span>
                          {priority === value && <Check className="size-4 text-[var(--primary)]" aria-hidden />}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:bg-[var(--bg-surface)]',
                          priority === 'none' && 'bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]',
                        )}
                        onClick={() => {
                          handleSave({ priority: 'none' });
                          setPriorityOpen(false);
                        }}
                      >
                        <span className="inline-flex h-[28px] w-[32px] items-center justify-center">—</span>
                        {priority === 'none' && <Check className="size-4 text-[var(--primary)]" aria-hidden />}
                      </button>
                    </div>
                    <PopoverArrow className="fill-[var(--bg-surface-elevated)] drop-shadow-[var(--elevation-sm)]" />
                  </PopoverContent>
                </Popover>
              </div>

              <span className={LABEL_CELL_CLASS}>Labels</span>
              <div className={cn(VALUE_CELL_CLASS, 'gap-[var(--space-2)]')}>
                <Popover
                  open={labelsOpen}
                  onOpenChange={(open) => {
                    setLabelsOpen(open);
                    if (open) {
                      requestAnimationFrame(focusLabelInput);
                    } else {
                      setLabelInput('');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    {selectedLabels.length > 0 ? (
                      <button
                        type="button"
                        aria-label={`Edit labels (${selectedLabels.map((label) => label.name).join(', ')})`}
                        className={cn(
                          'group flex min-h-[34px] max-w-full flex-wrap items-center gap-[var(--space-1)] rounded-full bg-transparent px-[var(--space-1)] py-[var(--space-1)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0 focus-visible:ring-0',
                        )}
                      >
                        {selectedLabels.map((label) => (
                          <Badge
                            key={`trigger-${label.name}`}
                            variant="soft"
                            size="sm"
                            className={cn(
                              'flex items-center gap-[var(--space-1)] border border-[color:var(--border-subtle)] group-hover:border-[color:var(--border-strong)] group-focus-visible:border-[color:var(--border-strong)]',
                              labelsOpen && 'border-[color:var(--border-strong)]',
                            )}
                            style={chipStyle(label.color ?? DEFAULT_LABEL_COLOR)}
                          >
                            <span className="max-w-[100px] truncate" title={label.name}>
                              {label.name}
                            </span>
                          </Badge>
                        ))}
                      </button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'size-[34px] rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0 focus-visible:ring-0 focus-visible:border-[color:var(--border-strong)]',
                          labelsOpen && 'border-[color:var(--border-strong)] text-[color:var(--text-primary)]',
                        )}
                        aria-label="Add labels"
                      >
                        <Tag className="size-[var(--icon-sm)]" aria-hidden />
                      </Button>
                    )}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[240px] p-3"
                    side="bottom"
                    sideOffset={8}
                    align="start"
                    alignOffset={140}
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
                        {mergedLabelOptions.map((label) => {
                          const isSelected = selectedLabels.some((item) => item.name === label.name);
                          return (
                            <button
                              key={label.name}
                              type="button"
                              onClick={() => toggleLabel(label)}
                              className={cn(
                                'rounded-[var(--chip-radius)] border border-transparent transition-shadow hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--border-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-0 focus-visible:ring-0',
                                isSelected && 'border-[color:var(--border-strong)]',
                              )}
                            >
                              <Badge
                                variant="soft"
                                size="sm"
                                className="flex items-center gap-[var(--space-1)]"
                                style={chipStyle(label.color ?? DEFAULT_LABEL_COLOR)}
                              >
                                <span>{label.name}</span>
                                {isSelected ? <Check className="size-3" aria-hidden /> : null}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <input
                          ref={labelInputRef}
                          type="text"
                          value={labelInput}
                          onChange={(event) => setLabelInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addFreeformLabel(labelInput);
                            }
                          }}
                          placeholder="Add label"
                          autoComplete="off"
                          spellCheck={false}
                          inputMode="text"
                          className="flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] caret-[var(--primary)] focus:border-[var(--primary)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedLabels.length === 0 ? (
                  <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">No labels</span>
                ) : null}
              </div>
            </div>

            <div className="h-px bg-[color:var(--border-subtle)]" />

            {/* Description */}
            <div className="space-y-[var(--space-2)]">
              <h2 className="text-[length:var(--text-sm)] font-semibold text-[color:var(--text-secondary)]">Description</h2>
              <textarea
                className="w-full min-h-[120px] resize-none rounded-[var(--radius-md)] border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                value={edited?.description ?? ''}
                onChange={(event) =>
                  setEdited((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                }
                onBlur={(event) =>
                  handleSave({ description: event.target.value.trim() || undefined })
                }
                placeholder="More details about this task"
              />
            </div>

            <div className="h-px bg-[color:var(--border-subtle)]" />

            {/* Subtasks */}
            <div className="space-y-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[length:var(--text-sm)] font-semibold text-[color:var(--text-secondary)]">Subtasks</h2>
                {subCount > 0 && (
                  <span className="px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-full)] bg-[color:var(--chip-label-bg)] text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                    {doneCount} of {subCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-[var(--space-1)]">
                {(edited.subtasks ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-[var(--space-3)] px-[var(--space-2)] py-[var(--space-2)] rounded-[var(--radius-sm)] hover:bg-[color:var(--hover-bg)]"
                  >
                    <button
                      type="button"
                      className="flex-shrink-0 grid size-[32px] place-items-center text-[color:var(--text-tertiary)]"
                      aria-label="Reorder subtask"
                    >
                      <GripVertical className="size-[var(--icon-sm)]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (edited.subtasks ?? []).map((st) =>
                          st.id === s.id ? { ...st, isCompleted: !st.isCompleted } : st,
                        );
                        handleSave({ subtasks: next });
                      }}
                      className="flex-shrink-0 grid size-[var(--check-size)] place-items-center rounded-[var(--radius-sm)] border-2"
                      style={{
                        backgroundColor: s.isCompleted ? 'var(--check-active-bg)' : 'var(--check-idle-bg)',
                        borderColor: s.isCompleted ? 'var(--check-active-bg)' : 'var(--check-ring)',
                        color: s.isCompleted ? 'var(--check-active-check)' : 'var(--check-idle-check)',
                      }}
                      aria-label={s.isCompleted ? `Mark ${s.title} as incomplete` : `Mark ${s.title} as complete`}
                    >
                      {s.isCompleted && <Check className="size-3" />}
                    </button>
                    <input
                      className={cn(
                        'flex-1 text-[length:var(--text-base)] bg-transparent border-none focus:outline-none',
                        s.isCompleted ? 'line-through text-[color:var(--text-tertiary)]' : 'text-[color:var(--text-primary)]'
                      )}
                      value={s.title}
                      onChange={(e) => {
                        const next = (edited.subtasks ?? []).map((st) =>
                          st.id === s.id ? { ...st, title: e.target.value } : st,
                        );
                        setEdited({ ...edited, subtasks: next });
                      }}
                      onBlur={() => handleSave({ subtasks: edited.subtasks })}
                      placeholder="Add task details"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-[var(--space-2)] self-start px-[var(--space-2)] py-[var(--space-1)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  onClick={() => {
                    const next: Subtask = {
                      id: `sub-${Date.now()}`,
                      title: '',
                      isCompleted: false,
                      dueDate: undefined,
                    };
                    const list = [...(edited.subtasks ?? []), next];
                    setEdited({ ...edited, subtasks: list });
                  }}
                >
                  <Plus className="size-[var(--icon-sm)]" />
                  <span>Add subtask</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 bg-[var(--bg-panel)] py-[var(--space-4)] px-[var(--space-6)] border-t border-[color:var(--border-subtle)] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[color:var(--danger)] hover:bg-[color:var(--accent-coral-tint-10)]"
            onClick={() => onDeleteTask(task.id)}
          >
            Delete task
          </Button>
        </footer>
      </aside>
    </>
  );
}

export default TaskDetailsDrawer;
