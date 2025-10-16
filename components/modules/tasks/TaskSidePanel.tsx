type LabelEditorState =
  | { mode: 'create'; name: string }
  | { mode: 'edit'; index: number; name: string; color: string }
  | null;

type LabelsSectionProps = {
  availableLabels: TaskLabel[];
  labels: TaskLabel[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelectLabel: (label: TaskLabel) => void;
  onRemoveLabel: (name: string) => void;
  editorState: LabelEditorState;
  onEdit: (next: LabelEditorState) => void;
  onSubmitEdit: (index: number, updates: { name: string; color: string }) => void;
  onCreateLabel: (label: { name: string; color: string }) => void;
  onDismissEditor: () => void;
  labelInputRef: React.RefObject<HTMLInputElement>;
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
};

function LabelsSection({
  availableLabels,
  labels,
  query,
  onQueryChange,
  onSelectLabel,
  onRemoveLabel,
  editorState,
  onEdit,
  onSubmitEdit,
  onCreateLabel,
  onDismissEditor,
  labelInputRef,
  popoverOpen,
  onPopoverOpenChange,
}: LabelsSectionProps) {
  const normalizedLabels = React.useMemo(() => labels ?? [], [labels]);
  const hasLabels = normalizedLabels.length > 0;

  return (
    <div className="flex flex-col gap-[var(--space-2)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Labels</span>
        <Popover open={popoverOpen} onOpenChange={onPopoverOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-h-[36px] flex-wrap items-center justify-end gap-[var(--space-2)] text-right"
              aria-label="Manage labels"
            >
              {hasLabels ? (
                <div className="flex flex-wrap justify-end gap-[var(--space-2)]">
                  {normalizedLabels.slice(0, 6).map((label, idx) => {
                    const c = typeof label === 'string' ? 'var(--label-blue)' : label.color;
                    const name = getTaskLabelName(label);
                    return (
                      <Badge
                        key={`${name}-${idx}`}
                        variant="soft"
                        size="sm"
                        className="cursor-pointer"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${c} 18%, transparent)`,
                          color: `color-mix(in oklab, ${c} 85%, var(--text-primary))`,
                          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${c} 35%, transparent)`,
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onPopoverOpenChange(false);
                          onEdit({ mode: 'edit', index: idx, name, color: c });
                        }}
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); onRemoveLabel(name); }}
                          className="ml-[var(--space-1)] grid place-items-center size-4 rounded-full hover:bg-[color-mix(in_oklab,currentColor_15%,transparent)]"
                          aria-label={`Remove label ${name}`}
                          title="Remove"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </Badge>
                    );
                  })}
                  {normalizedLabels.length > 6 ? (
                    <Badge variant="outline" size="sm">+{normalizedLabels.length - 6}</Badge>
                  ) : null}
                </div>
              ) : (
                <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">
                  Search or add label
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px] p-0">
            <div className="p-[var(--space-2)]">
              <div className="mb-[var(--space-2)]">
                <input
                  ref={labelInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const name = query.trim();
                      if (name) onCreateLabel({ name, color: 'var(--label-blue)' });
                    }
                  }}
                  placeholder="Search or add label"
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div className="max-h-[240px] overflow-y-auto flex flex-col gap-[var(--space-1)]">
                {availableLabels
                  .filter((l) => !query.trim() || getTaskLabelName(l).toLowerCase().includes(query.trim().toLowerCase()))
                  .map((label, idx) => {
                  const name = getTaskLabelName(label);
                  const color = typeof label === 'string' ? 'var(--label-blue)' : label.color;
                  const isApplied = normalizedLabels.some((l) => getTaskLabelName(l) === name);
                  return (
                    <button
                      key={`${name}-${idx}`}
                      type="button"
                      className={cn('flex items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-sm hover:bg-[var(--bg-surface-elevated)]', isApplied && 'bg-[var(--bg-surface-elevated)]')}
                      onClick={() => onSelectLabel({ name, color })}
                    >
                      <Badge
                        variant="soft"
                        size="sm"
                        className="flex items-center gap-[var(--space-1)]"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
                          color: `color-mix(in oklab, ${color} 85%, var(--text-primary))`,
                          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)`,
                        }}
                      >
                        {name}
                      </Badge>
                      {isApplied ? <Check className="size-4 text-[color:var(--primary)]" aria-hidden /> : null}
                    </button>
                  );
                })}
                {query.trim() && !availableLabels.some((l) => getTaskLabelName(l).toLowerCase() === query.trim().toLowerCase()) ? (
                  <button
                    type="button"
                    className="flex items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-sm hover:bg-[var(--bg-surface-elevated)]"
                    onClick={() => {
                      onPopoverOpenChange(false);
                      onEdit({ mode: 'create', name: query.trim() });
                    }}
                  >
                    <span>Create “{query.trim()}”</span>
                    <Plus className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {editorState ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[var(--space-3)] shadow-[var(--elevation-sm)]">
          <div className="flex flex-col gap-[var(--space-3)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <label className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] w-24">Label name</label>
              <input
                ref={labelInputRef}
                type="text"
                defaultValue={editorState.name}
                onChange={(e) => onEdit(
                  editorState.mode === 'edit'
                    ? { mode: 'edit', index: editorState.index, name: e.target.value, color: editorState.color }
                    : { mode: 'create', name: e.target.value }
                )}
                className="flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <span className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] w-24">Color</span>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {labelColorPalette.map((option) => {
                  const activeColor = editorState.mode === 'edit' ? editorState.color : option.value;
                  const isActive = activeColor === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onEdit(
                        editorState.mode === 'edit'
                          ? { ...editorState, color: option.value }
                          : { mode: 'create', name: editorState.name }
                      )}
                      className={cn('size-5 rounded-full border transition-transform hover:scale-110', isActive && 'ring-2 ring-[var(--primary)] ring-offset-1')}
                      style={{
                        backgroundColor: `color-mix(in oklab, ${option.value} 18%, transparent)`,
                        borderColor: `color-mix(in oklab, ${option.value} 35%, transparent)`,
                      }}
                      aria-label={`Choose ${option.name}`}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-[var(--space-2)]">
              <Button variant="ghost" size="compact" onClick={onDismissEditor}>Cancel</Button>
              <Button
                variant="solid"
                size="compact"
                onClick={() => {
                  const name = (editorState?.name ?? '').trim();
                  if (!name) return onDismissEditor();
                  const color = editorState?.mode === 'edit' ? editorState.color : labelColorPalette[0].value;
                  if (editorState.mode === 'edit') {
                    onSubmitEdit(editorState.index, { name, color });
                  } else {
                    onCreateLabel({ name, color });
                  }
                  onDismissEditor();
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


import * as React from 'react';
import { Calendar, Check, ChevronDown, Flag, Pencil, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

import { Checkbox } from '../../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/command';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { PaneHeader } from '../../layout/PaneHeader';
import { useTaskStore } from './taskStore';
import type { Task, TaskLabel, Subtask } from './types';

const getTaskLabelName = (label: TaskLabel) => (typeof label === 'string' ? label : label.name);

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
  const [labelQuery, setLabelQuery] = React.useState('');
  const [labelEditorState, setLabelEditorState] = React.useState<
    | { mode: 'create'; name: string }
    | { mode: 'edit'; index: number; name: string; color: string }
    | null
  >(null);
  const [labelsPopoverOpen, setLabelsPopoverOpen] = React.useState(false);
  const [priorityPopoverOpen, setPriorityPopoverOpen] = React.useState(false);
  const titleFieldRef = React.useRef<HTMLTextAreaElement | null>(null);
  const labelNameInputRef = React.useRef<HTMLInputElement | null>(null);

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
      setLabelQuery('');
      setLabelEditorState(null);
      return;
    }

    setEditedTask(task);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setLabelQuery('');
    setLabelEditorState(null);
  }, [task]);

  React.useLayoutEffect(() => {
    adjustTitleHeight();
  }, [adjustTitleHeight, editedTask?.title, task?.id, presentation]);

  const headingId = task ? `task-panel-title-${task.id}` : undefined;

  // Build available labels from all tasks in store so search shows existing labels
  const tasksById = useTaskStore((s) => s.tasksById);
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    Object.values(tasksById).forEach((t) => {
      const labels = normalizeLabels(t?.labels ?? []);
      labels.forEach((lbl) => {
        const name = getTaskLabelName(lbl);
        const color = typeof lbl === 'string' ? 'var(--label-blue)' : lbl.color;
        if (name && !map.has(name.toLowerCase())) map.set(name.toLowerCase(), color);
      });
    });
    return Array.from(map.entries()).map(([k, color]) => ({ name: k, color }));
  }, [tasksById]);

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

  const handleRemoveLabel = React.useCallback((labelToRemove: string) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      const labels = normalizeLabels(prev.labels);
      return {
        ...prev,
        labels: labels.filter((label) => getTaskLabelName(label) !== labelToRemove),
      };
    });
  }, []);

  const handleSelectLabel = React.useCallback((label: TaskLabel) => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      const labels = normalizeLabels(prev.labels);
      const labelName = getTaskLabelName(label);
      if (labels.some((existing) => getTaskLabelName(existing) === labelName)) {
        return prev;
      }
      return { ...prev, labels: [...labels, label] };
    });
    setLabelQuery('');
  }, []);

  const handleUpdateLabelAtIndex = React.useCallback(
    (index: number, updates: { name?: string; color?: string }) => {
      setEditedTask((prev) => {
        if (!prev) return prev;
        const labels = normalizeLabels(prev.labels);
        if (!labels[index]) return prev;
        const current = labels[index];
        const nextName = updates.name ?? getTaskLabelName(current);
        const nextColor = updates.color ?? (typeof current === 'string' ? 'var(--label-gray)' : current.color);
        labels[index] = { name: nextName, color: nextColor };
        return { ...prev, labels: [...labels] };
      });
    },
  []);

  React.useEffect(() => {
    if (!labelEditorState) return;
    const frame = requestAnimationFrame(() => {
      labelNameInputRef.current?.focus();
      labelNameInputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [labelEditorState]);

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
  const hasDueDate = Boolean(dueDateValue);
  const dueDateLabel = hasDueDate && dueDateValue ? format(dueDateValue, 'MMM d') : 'No due date';
  const currentPriority: Task['priority'] = editedTask.priority ?? 'none';
  const priorityValues: Task['priority'][] = ['high', 'medium', 'low', 'none'];

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
        <Flag className="h-3 w-3" aria-hidden />
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
                    <button
                      type="button"
                      className="inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-left transition-colors hover:bg-[var(--bg-surface-elevated)]"
                    >
                      <Calendar className="size-4 text-[color:var(--text-secondary)]" aria-hidden />
                      <span
                        className={cn(
                          'text-[length:var(--text-sm)]',
                          hasDueDate
                            ? 'font-medium text-[color:var(--text-primary)]'
                            : 'text-[color:var(--text-tertiary)]',
                        )}
                      >
                        {dueDateLabel}
                      </span>
                    </button>
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
                  <button
                    type="button"
                    className="group inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-left transition-colors hover:bg-[var(--bg-surface-elevated)]"
                    aria-label="Change priority"
                  >
                    {renderPriorityChip(currentPriority) ?? (
                      <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">
                        {getPriorityLabel(currentPriority)}
                      </span>
                    )}
                    <ChevronDown className="size-4 text-[color:var(--text-tertiary)]" aria-hidden />
                  </button>
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

            <LabelsSection
              availableLabels={availableLabels}
              labels={normalizeLabels(editedTask.labels)}
              query={labelQuery}
              onQueryChange={setLabelQuery}
              onSelectLabel={handleSelectLabel}
              onRemoveLabel={handleRemoveLabel}
              editorState={labelEditorState}
              onEdit={setLabelEditorState}
              onSubmitEdit={handleUpdateLabelAtIndex}
              onCreateLabel={handleSelectLabel}
              onDismissEditor={() => setLabelEditorState(null)}
              labelInputRef={labelNameInputRef}
              popoverOpen={labelsPopoverOpen}
              onPopoverOpenChange={setLabelsPopoverOpen}
            />
          </section>

          <section className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-md)] border border-transparent px-[var(--space-3)] py-[var(--space-2_5)] transition-colors hover:border-[var(--border-default)] hover:bg-[var(--hover-bg)]">
            <header className="flex items-center justify-between">
              <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Subtasks</span>
            </header>
            <div className="flex flex-col gap-[var(--space-2)]">
              {(editedTask.subtasks ?? []).map((subtask, index) => (
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
                        aria-label="Set subtask due date"
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
                      aria-label="Set new subtask due date"
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

const labelColorPalette = [
  { name: 'Blue', value: 'var(--label-blue)' },
  { name: 'Purple', value: 'var(--label-purple)' },
  { name: 'Pink', value: 'var(--label-pink)' },
  { name: 'Red', value: 'var(--label-red)' },
  { name: 'Orange', value: 'var(--label-orange)' },
  { name: 'Yellow', value: 'var(--label-yellow)' },
  { name: 'Green', value: 'var(--label-green)' },
  { name: 'Teal', value: 'var(--label-teal)' },
  { name: 'Gray', value: 'var(--label-gray)' },
];

export { TaskSidePanel };
export default TaskSidePanel;
