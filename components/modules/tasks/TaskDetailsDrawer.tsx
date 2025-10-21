import * as React from 'react';
import { Calendar, Check, CheckSquare, Copy, Edit, Flag, Plus, Tag, Trash, X } from 'lucide-react';
import { addDays, format } from 'date-fns';

import { Button } from '../../ui/button';
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Badge, badgeVariants } from '../../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';

import { Calendar as CalendarComponent } from '../../ui/calendar';
import { cn } from '../../ui/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../ui/context-menu';
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

const SUBTASK_ROW_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  columnGap: 'var(--list-row-gap)',
  minHeight: 'var(--list-row-min-h)',
  paddingLeft: 'var(--list-row-pad-x)',
  paddingRight: 'var(--list-row-pad-x)',
};

const LABEL_CELL_CLASS =
  'text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center';
const VALUE_CELL_CLASS =
  'flex items-center min-h-[var(--row-min-h)] w-full text-[color:var(--text-primary)] gap-[var(--chip-gap)]';
const CHIP_CLASS =
  'inline-flex h-[var(--chip-height)] items-center justify-start gap-[var(--chip-gap)] rounded-[var(--chip-radius)] px-[var(--chip-pad-x)] py-[var(--chip-pad-y)] text-[length:var(--text-sm)] font-medium border border-transparent transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]';
const LABEL_CHIP_BASE_CLASS =
  'bg-[color:var(--chip-label-bg)] text-[color:var(--chip-label-fg)] shadow-[var(--chip-inset-shadow)] hover:bg-[color:color-mix(in_oklab,var(--chip-label-bg)_calc(100%+var(--chip-hover-bg-boost)),transparent)]';

type DueState = 'none' | 'scheduled' | 'today' | 'overdue';

const EMPTY_META_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] grid place-items-center text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] hover:bg-[color:var(--caret-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)] transition-colors';

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

const DEFAULT_LABEL_COLOR = 'var(--label-blue)';
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
  const [isSubtaskComposerOpen, setIsSubtaskComposerOpen] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = React.useState<string | undefined>(undefined);
  const [newSubtaskDateOpen, setNewSubtaskDateOpen] = React.useState(false);
  const [activeSubtaskDatePicker, setActiveSubtaskDatePicker] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const labelInputRef = React.useRef<HTMLInputElement | null>(null);
  const newSubtaskInputRef = React.useRef<HTMLInputElement | null>(null);
  const subtaskInputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());

  const handleClearFields = React.useCallback(() => {
    setEdited((prev) => {
      if (!prev) return prev;
      const cleared: Task = {
        ...prev,
        description: undefined,
        dueDate: undefined,
        priority: 'none',
        labels: [],
        subtasks: [],
      };
      onUpdateTask(cleared);
      return cleared;
    });

    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setActiveSubtaskDatePicker(null);
    setLabelInput('');
  }, [onUpdateTask]);

  const overlayPadding = useOverlayGutter();

  const tasksById = useTaskStore((s) => s.tasksById);

  React.useEffect(() => {
    setEdited(task);
    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setActiveSubtaskDatePicker(null);
    subtaskInputRefs.current.clear();
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

  const handleToggleSubtaskCompletion = React.useCallback(
    (subtaskId: string, isCompleted: boolean) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask,
      );
      handleSave({ subtasks: next });
    },
    [edited, handleSave],
  );

  const handleUpdateSubtaskDueDate = React.useCallback(
    (subtaskId: string, dueDate: string | undefined) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, dueDate } : subtask,
      );
      handleSave({ subtasks: next });
    },
    [edited, handleSave],
  );

  const handleDeleteSubtask = React.useCallback(
    (subtaskId: string) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId);
      handleSave({ subtasks: next });
    },
    [edited, handleSave],
  );

  const handleSubtaskTitleChange = React.useCallback((subtaskId: string, title: string) => {
    setEdited((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtasks: (prev.subtasks ?? []).map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, title } : subtask,
        ),
      };
    });
  }, []);

  const handleSubtaskTitleCommit = React.useCallback(() => {
    if (!edited) return;
    handleSave({ subtasks: edited.subtasks ?? [] });
  }, [edited, handleSave]);

  const handleAddSubtask = React.useCallback(() => {
    if (!edited) return;
    const trimmedTitle = newSubtaskTitle.trim();
    if (!trimmedTitle) return;
    const nextSubtask: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      isCompleted: false,
      dueDate: newSubtaskDueDate,
    };
    const current = edited.subtasks ?? [];
    handleSave({ subtasks: [...current, nextSubtask] });
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setIsSubtaskComposerOpen(false);
    setActiveSubtaskDatePicker(null);
  }, [edited, handleSave, newSubtaskDueDate, newSubtaskTitle]);

  const handleCancelNewSubtask = React.useCallback(() => {
    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
  }, []);

  const focusSubtaskInput = React.useCallback((subtaskId: string) => {
    const target = subtaskInputRefs.current.get(subtaskId);
    if (!target) return;
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.select?.();
    });
  }, []);

  const handleSubtaskDueDateSelection = React.useCallback(
    (subtaskId: string, date: Date | undefined) => {
      handleUpdateSubtaskDueDate(subtaskId, date ? format(date, 'yyyy-MM-dd') : undefined);
      setActiveSubtaskDatePicker(null);
    },
    [handleUpdateSubtaskDueDate],
  );

  const handleClearSubtaskDueDate = React.useCallback(
    (subtaskId: string) => {
      handleUpdateSubtaskDueDate(subtaskId, undefined);
      setActiveSubtaskDatePicker(null);
    },
    [handleUpdateSubtaskDueDate],
  );

  const handleNewSubtaskDateSelection = React.useCallback((date: Date | undefined) => {
    if (date) {
      setNewSubtaskDueDate(format(date, 'yyyy-MM-dd'));
    } else {
      setNewSubtaskDueDate(undefined);
    }
    setNewSubtaskDateOpen(false);
  }, []);

  const handleDuplicateSubtask = React.useCallback(
    (subtaskId: string) => {
      if (!edited) return;
      const current = edited.subtasks ?? [];
      const index = current.findIndex((item) => item.id === subtaskId);
      if (index === -1) return;
      const source = current[index];
      const duplicate: Subtask = {
        ...source,
        id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isCompleted: false,
      };
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      handleSave({ subtasks: next });
      requestAnimationFrame(() => {
        focusSubtaskInput(duplicate.id);
      });
    },
    [edited, handleSave, focusSubtaskInput],
  );

  React.useLayoutEffect(() => {
    if (!isSubtaskComposerOpen) return;
    const frame = requestAnimationFrame(() => {
      newSubtaskInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isSubtaskComposerOpen]);

  const renderPriorityChip = React.useCallback((value: Task['priority']) => {
    if (value === 'none') return null;
    const tone = value === 'high' ? 'high' : value === 'medium' ? 'medium' : 'low';
    return (
      <span
        className={cn(
          badgeVariants({ variant: 'soft', tone, size: 'sm' }),
          CHIP_CLASS,
        )}
      >
        <Flag className="size-[var(--icon-md)]" aria-hidden />
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

  const canClearFields = React.useMemo(() => {
    if (!edited) return false;
    const hasDescription = Boolean((edited.description ?? '').trim());
    const hasDueDate = Boolean(edited.dueDate);
    const hasPriority = Boolean(edited.priority && edited.priority !== 'none');
    const labels = Array.isArray(edited.labels) ? edited.labels : [];
    const subtasksList = Array.isArray(edited.subtasks) ? edited.subtasks : [];
    return hasDescription || hasDueDate || hasPriority || labels.length > 0 || subtasksList.length > 0;
  }, [edited]);

  const subtasks = edited?.subtasks ?? [];
  const newSubtaskSelectedDate = newSubtaskDueDate ? new Date(newSubtaskDueDate) : undefined;
  if (!task || !edited) return null;

  const headingId = `task-drawer-title-${task.id}`;

  const dueDate = edited.dueDate ? new Date(edited.dueDate) : undefined;
  const isCompleted = Boolean(edited.isCompleted);
  const priority: Task['priority'] = edited.priority ?? 'none';
  const priorityLabel = priority !== 'none' ? priority[0].toUpperCase() + priority.slice(1) : '';
  const priorityTone = priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : priority === 'low' ? 'low' : undefined;
  const dueState: DueState = (() => {
    if (!dueDate) return 'none';
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const targetKey = format(dueDate, 'yyyy-MM-dd');
    if (targetKey === todayKey) return 'today';
    if (!isCompleted && dueDate.getTime() < Date.now()) return 'overdue';
    return 'scheduled';
  })();
  const dueDisplayLabel = dueDate ? format(dueDate, 'EEE, MMM d') : undefined;
  return (
    <>
      {/* overlay */}
      <button
        aria-hidden
        className="fixed left-0 right-0 bottom-0 top-[var(--pane-header-h)] z-[69] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
        onClick={onClose}
      />

      <aside
        className="fixed right-0 bottom-0 top-[var(--pane-header-h)] z-[70] flex flex-col bg-[var(--bg-panel)] shadow-[var(--elevation-xl)] motion-safe:transition-transform duration-[var(--duration-sm)] ease-[var(--ease-emphasized)] px-[var(--panel-pad-x)] pb-0"
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
        <header className="sticky top-0 z-[var(--z-overlay)] bg-[color:var(--bg-surface)] px-[var(--space-4)] py-[var(--space-4)] border-b border-[color:var(--border-divider)]">
          <div className="flex items-center justify-between gap-[var(--space-3)]">
            <Button
              variant={isCompleted ? 'outline' : 'default'}
              className="h-[var(--btn-sm-height,36px)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
              onClick={() => handleSave({ isCompleted: !isCompleted })}
            >
              {isCompleted ? 'Reopen' : 'Mark complete'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-[var(--btn-sm-height,36px)] w-[var(--btn-sm-height,36px)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
              onClick={onClose}
            >
              <X className="size-[var(--icon-sm)]" />
            </Button>
          </div>
        </header>

        <section className="px-[var(--space-4)] pt-[var(--space-4)] pb-[var(--space-4)]">
          <h1 className="m-0 text-[length:var(--text-2xl)] font-semibold text-[color:var(--text-primary)] leading-tight">
            {task.title}
          </h1>
          <div aria-live="polite" className="sr-only">{savedHint ?? ''}</div>
        </section>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-5)]">

            {/* Metadata */}
            <div className="grid grid-cols-[var(--task-drawer-label-col)_1fr] gap-x-[var(--space-8)] gap-y-[var(--space-3)]">
              <span className={LABEL_CELL_CLASS}>Due date</span>
              <div className={VALUE_CELL_CLASS}>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    {dueState === 'none' ? (
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
                    ) : (
                      <button
                        type="button"
                        data-due-state={dueState}
                        className={cn(
                          DUE_PILL_BASE_CLASS,
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)]',
                          DUE_TONE_CLASSES[dueState],
                          dateOpen && 'ring-1 ring-[color:var(--border-strong)]'
                        )}
                        aria-label={dueDisplayLabel ? `Choose date (${dueDisplayLabel})` : 'Choose date'}
                      >
                        <Calendar
                          className="h-[var(--icon-sm)] w-[var(--icon-sm)]"
                          strokeWidth={1.25}
                          aria-hidden
                        />
                        <span>{dueDisplayLabel}</span>
                      </button>
                    )}
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
              <div className={VALUE_CELL_CLASS}>
                <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                  <PopoverTrigger asChild>
                    {priority === 'none' || !priorityTone ? (
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
                        aria-label={`Choose priority (${priorityLabel})`}
                        className={cn(
                          badgeVariants({ variant: 'soft', tone: priorityTone, size: 'sm' }),
                          CHIP_CLASS,
                          'hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-offset-[var(--bg-panel)]',
                          priorityOpen && 'border-[color:var(--border-strong)]'
                        )}
                      >
                        <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
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
              <div className={VALUE_CELL_CLASS}>
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
                        className="group flex min-h-[34px] max-w-full flex-wrap items-center gap-[var(--chip-gap)] rounded-full bg-transparent px-[var(--space-1)] py-[var(--space-1)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-panel)]"
                      >
                        {selectedLabels.map((label) => {
                          const labelHue = getLabelHue(label.color ?? DEFAULT_LABEL_COLOR);
                          return (
                            <Badge
                              key={`trigger-${label.name}`}
                              variant="soft"
                              size="sm"
                              data-label-color={labelHue}
                              className={cn(
                                CHIP_CLASS,
                                LABEL_CHIP_BASE_CLASS,
                                'group-hover:border-[color:var(--border-strong)] group-focus-visible:border-[color:var(--border-strong)]',
                                labelsOpen && 'border-[color:var(--border-strong)]',
                              )}
                            >
                              <span className="max-w-[100px] truncate" title={label.name}>
                                {label.name}
                              </span>
                            </Badge>
                          );
                        })}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={EMPTY_META_BUTTON_CLASS}
                        aria-label="Choose labels"
                      >
                        <Tag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                      </button>
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
                      <div className="flex flex-wrap gap-[var(--chip-gap)]">
                        {mergedLabelOptions.map((label) => {
                          const isSelected = selectedLabels.some((item) => item.name === label.name);
                          const labelHue = getLabelHue(label.color ?? DEFAULT_LABEL_COLOR);
                          return (
                            <button
                              key={label.name}
                              type="button"
                              onClick={() => toggleLabel(label)}
                              className={cn(
                                'rounded-[var(--chip-radius)] border border-transparent transition-shadow hover:border-[color:var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)] focus-visible:border-[color:var(--border-strong)]',
                                isSelected && 'border-[color:var(--border-strong)]',
                              )}
                            >
                              <Badge
                                variant="soft"
                                size="sm"
                                className={cn(
                                  CHIP_CLASS,
                                  LABEL_CHIP_BASE_CLASS,
                                )}
                                data-label-color={labelHue}
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
            <div className="flex flex-col gap-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[length:var(--text-sm)] font-semibold text-[color:var(--text-secondary)]">Subtasks</h2>
                {subtasks.length > 0 ? (
                  <span className="text-[length:var(--text-xs)] font-normal text-[color:var(--text-tertiary)]">
                    {subtasks.length} {subtasks.length === 1 ? 'item' : 'items'}
                  </span>
                ) : null}
              </div>
              <div className="density-compact overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <div className="divide-y divide-[var(--border-divider)]">
                  {subtasks.map((subtask) => {
                    const rawDue = (subtask.dueDate ?? '').trim();
                    const parsedDueDate = rawDue ? new Date(rawDue) : null;
                    const hasValidDue = parsedDueDate && !Number.isNaN(parsedDueDate.getTime());
                    const isDueToday =
                      hasValidDue && format(parsedDueDate as Date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const isDueOverdue = hasValidDue && (parsedDueDate as Date).getTime() < Date.now() && !isDueToday;

                    let dueChipState: 'none' | 'scheduled' | 'today' | 'overdue';
                    let dueChipLabel: string;
                    let showDueIcon = false;

                    if (hasValidDue) {
                      dueChipState = isDueOverdue ? 'overdue' : isDueToday ? 'today' : 'scheduled';
                      dueChipLabel = format(parsedDueDate as Date, 'MMM d');
                    } else if (rawDue) {
                      dueChipState = 'scheduled';
                      dueChipLabel = rawDue;
                    } else {
                      dueChipState = 'none';
                      dueChipLabel = '';
                      showDueIcon = true;
                    }

                    const dueButtonLabel =
                      dueChipState === 'none'
                        ? 'Choose subtask due date'
                        : `Change subtask due date (${dueChipLabel})`;
                    const dueButtonClass = cn(
                      CHIP_CLASS,
                      'justify-center focus-visible:ring-offset-[var(--bg-surface)] transition-colors',
                      (dueChipState === 'none' || dueChipState === 'scheduled') &&
                        'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)] hover:bg-[var(--hover-bg)] border-[color:var(--chip-border)]',
                      dueChipState === 'none' && 'px-[var(--space-1_5)]',
                    );
                    return (
                      <ContextMenu key={subtask.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className="group grid items-center hover:bg-[var(--hover-bg)] motion-safe:transition-colors duration-[var(--duration-fast)]"
                            style={SUBTASK_ROW_STYLE}
                          >
                        <div className="flex items-center justify-center py-[var(--list-row-pad-y)]">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              handleToggleSubtaskCompletion(subtask.id, !subtask.isCompleted);
                            }}
                            className="grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                            aria-pressed={subtask.isCompleted}
                            aria-label={subtask.isCompleted ? 'Mark subtask incomplete' : 'Mark subtask complete'}
                          >
                            <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                              <circle
                                cx="10"
                                cy="10"
                                r="10"
                                className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${subtask.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                              />
                              <path
                                d="M5 10.5l3 3 7-7"
                                fill="none"
                                strokeWidth="2"
                                className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${subtask.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="py-[var(--list-row-pad-y)] pr-[var(--space-3)]">
                          <input
                            ref={(element) => {
                              if (element) {
                                subtaskInputRefs.current.set(subtask.id, element);
                              } else {
                                subtaskInputRefs.current.delete(subtask.id);
                              }
                            }}
                            type="text"
                            value={subtask.title}
                            onChange={(event) => handleSubtaskTitleChange(subtask.id, event.target.value)}
                            onBlur={handleSubtaskTitleCommit}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                (event.currentTarget as HTMLInputElement).blur();
                              }
                              if (event.key === 'Escape') {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder="Untitled subtask"
                            className={cn(
                              'w-full border-0 bg-transparent text-[length:var(--list-row-font)] text-[color:var(--text-primary)] focus:outline-none focus:ring-0',
                              subtask.isCompleted && 'line-through text-[color:var(--text-tertiary)] opacity-60',
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-end py-[var(--list-row-pad-y)]">
                          <Popover
                            open={activeSubtaskDatePicker === subtask.id}
                            onOpenChange={(open) => setActiveSubtaskDatePicker(open ? subtask.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                data-due-state={dueChipState}
                                className={dueButtonClass}
                                aria-label={dueButtonLabel}
                              >
                                {showDueIcon ? <Calendar className="size-[var(--icon-md)]" aria-hidden /> : null}
                                {dueChipLabel ? <span>{dueChipLabel}</span> : null}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                                onSelect={(date) => handleSubtaskDueDateSelection(subtask.id, date)}
                                initialFocus
                              />
                              {subtask.dueDate ? (
                                <div className="border-t border-[var(--border-subtle)]">
                                  <button
                                    type="button"
                                    className="w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
                                    onClick={() => handleClearSubtaskDueDate(subtask.id)}
                                  >
                                    Clear due date
                                  </button>
                                </div>
                              ) : null}
                            </PopoverContent>
                          </Popover>
                        </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="min-w-[220px]">
                          <ContextMenuItem
                            onSelect={() => handleToggleSubtaskCompletion(subtask.id, !subtask.isCompleted)}
                          >
                            <CheckSquare className="size-4" />
                            {subtask.isCompleted ? 'Mark as not completed' : 'Mark completed'}
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => focusSubtaskInput(subtask.id)}>
                            <Edit className="size-4" />
                            Edit
                          </ContextMenuItem>
                          <ContextMenuItem onSelect={() => handleDuplicateSubtask(subtask.id)}>
                            <Copy className="size-4" />
                            Duplicate
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            variant="destructive"
                            onSelect={() => handleDeleteSubtask(subtask.id)}
                          >
                            <Trash className="size-4" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}
                </div>
                <div className="border-t border-[var(--border-divider)]">
                  {isSubtaskComposerOpen ? (
                    <div className="flex flex-col gap-[var(--space-2)] px-[var(--list-row-pad-x)] py-[var(--space-3)]">
                      <div className="flex items-center gap-[var(--space-2)]">
                        <div
                          className="grid size-[var(--check-size)] place-items-center rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                          aria-hidden
                        />
                        <input
                          ref={newSubtaskInputRef}
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(event) => setNewSubtaskTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleAddSubtask();
                            } else if (event.key === 'Escape') {
                              event.preventDefault();
                              handleCancelNewSubtask();
                            }
                          }}
                          placeholder="Write a task name"
                          className="flex-1 border-0 bg-transparent text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none"
                          aria-label="New subtask name"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                        <div className="flex items-center gap-[var(--space-2)]">
                          <Popover open={newSubtaskDateOpen} onOpenChange={setNewSubtaskDateOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  'grid size-8 place-items-center rounded-[var(--radius-sm)] transition-colors',
                                  newSubtaskDueDate
                                    ? 'bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)]'
                                    : 'text-[color:var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-secondary)]',
                                )}
                                aria-label={
                                  newSubtaskDueDate
                                    ? `Change due date (${newSubtaskDueDate})`
                                    : 'Choose subtask due date'
                                }
                              >
                                <Calendar className="size-4" aria-hidden />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={newSubtaskSelectedDate}
                                onSelect={handleNewSubtaskDateSelection}
                                initialFocus
                              />
                              {newSubtaskDueDate ? (
                                <div className="border-t border-[var(--border-subtle)]">
                                  <button
                                    type="button"
                                    className="w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
                                    onClick={() => {
                                      setNewSubtaskDueDate(undefined);
                                      setNewSubtaskDateOpen(false);
                                    }}
                                  >
                                    Clear due date
                                  </button>
                                </div>
                              ) : null}
                            </PopoverContent>
                          </Popover>
                          {newSubtaskDueDate ? (
                            <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] bg-[var(--bg-surface-elevated)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
                              <Calendar className="size-3" aria-hidden />
                              {format(newSubtaskSelectedDate ?? new Date(newSubtaskDueDate), 'MMM d')}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-[var(--space-2)]">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelNewSubtask}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddSubtask}
                            disabled={!newSubtaskTitle.trim()}
                          >
                            Add subtask
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-[var(--space-2)] px-[var(--list-row-pad-x)] py-[var(--space-3)] text-left text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-primary)]"
                      onClick={() => setIsSubtaskComposerOpen(true)}
                    >
                      <Plus className="size-4" aria-hidden />
                      Add subtask...
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <footer
          className="sticky bottom-0 mt-0 bg-[color:var(--bg-surface)] border-t border-[color:var(--border-divider)] px-[var(--space-4)] py-[var(--space-4)]"
          style={{ paddingBottom: 'calc(var(--space-4) + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center justify-between gap-[var(--space-3)]">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'm-0 h-[var(--btn-sm-height,36px)] px-3 border border-[color:var(--border-subtle)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]',
                !canClearFields && 'opacity-60',
              )}
              onClick={handleClearFields}
              disabled={!canClearFields}
              aria-disabled={!canClearFields}
            >
              Clear fields
            </Button>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="m-0 h-[var(--btn-sm-height,36px)] px-3 border border-[color:var(--accent-coral-tint-10)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
                >
                  Delete task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm border-[color:var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action permanently removes &ldquo;{task.title}&rdquo; and its subtasks. You can’t undo this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
                    onClick={() => {
                      onDeleteTask(task.id);
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Delete task
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </footer>
      </aside>
    </>
  );
}

export default TaskDetailsDrawer;
