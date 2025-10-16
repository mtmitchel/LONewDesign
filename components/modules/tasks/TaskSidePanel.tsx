
import * as React from 'react';
import { Calendar, ChevronDown, Flag, Tag, Trash2, X, Plus } from 'lucide-react';
import { format } from 'date-fns';

import { Checkbox } from '../../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { Badge } from '../../ui/badge';
import { cn } from '../../ui/utils';
import { PaneHeader } from '../../layout/PaneHeader';
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
  const [newLabel, setNewLabel] = React.useState('');
  const [selectedLabelColor, setSelectedLabelColor] = React.useState('var(--label-blue)');
  const [editingLabelIndex, setEditingLabelIndex] = React.useState<number | null>(null);
  const [priorityPopoverOpen, setPriorityPopoverOpen] = React.useState(false);

  const titleFieldRef = React.useRef<HTMLTextAreaElement | null>(null);

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
      setNewLabel('');
      setEditingLabelIndex(null);
      return;
    }

    setEditedTask(task);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewLabel('');
    setEditingLabelIndex(null);
  }, [task]);

  React.useLayoutEffect(() => {
    adjustTitleHeight();
  }, [adjustTitleHeight, editedTask?.title, task?.id, presentation]);

  const headingId = task ? `task-panel-title-${task.id}` : undefined;

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

  const handleAddLabel = React.useCallback(() => {
    setEditedTask((prev) => {
      if (!prev) return prev;
      const next = newLabel.trim();
      if (!next) return prev;
      const labels = normalizeLabels(prev.labels);
      if (labels.some((label) => getTaskLabelName(label) === next)) return prev;
      return { ...prev, labels: [...labels, { name: next, color: selectedLabelColor }] };
    });
    setNewLabel('');
  }, [newLabel, selectedLabelColor]);

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
        'clamp(var(--task-panel-min-width, 320px), calc((100vw - var(--sidebar-current-width, var(--sidebar-width))) * var(--task-panel-ratio, 0.38)), var(--task-panel-max-width, 640px))',
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
      <PaneHeader role="heading" className="justify-between">
        <h2 id={headingId} className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
          Task details
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
          aria-label="Close task details"
        >
          <X className="size-5" aria-hidden />
        </button>
      </PaneHeader>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-[var(--space-6)]">
          <div>
            <textarea
              ref={titleFieldRef}
              value={editedTask.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full resize-none overflow-hidden border-0 bg-transparent px-0 py-[var(--space-2)] text-[length:var(--text-2xl)] font-semibold leading-tight text-[color:var(--text-primary)] focus:outline-none focus:ring-0 whitespace-pre-wrap"
              placeholder="Task name"
              rows={1}
              onInput={() => adjustTitleHeight()}
            />
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-[var(--space-6)]">
            <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Due date</span>
            <div className="flex items-center gap-[var(--space-2)]">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="group flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-left transition-colors hover:bg-[var(--bg-surface-elevated)]"
                  >
                    <span
                      className={cn(
                        'grid size-8 place-items-center rounded-full border text-[color:var(--text-secondary)] transition-colors',
                        hasDueDate
                          ? 'border-[var(--border-default)] group-hover:border-[var(--border-hover)]'
                          : 'border-dashed border-[var(--border-subtle)] group-hover:border-[var(--border-default)]'
                      )}
                    >
                      <Calendar className="size-4" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        'text-[length:var(--text-sm)] transition-colors',
                        hasDueDate ? 'text-[color:var(--text-primary)] font-medium' : 'text-[color:var(--text-tertiary)]'
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
                  className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] transition-colors hover:text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                  aria-label="Clear due date"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between pt-[var(--space-4)]">
            <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">Priority</span>
            <Popover open={priorityPopoverOpen} onOpenChange={setPriorityPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="group flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-left transition-colors hover:bg-[var(--bg-surface-elevated)]"
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
              <PopoverContent align="end" className="w-56 p-0">
                <div className="flex flex-col py-[var(--space-1)]">
                  {priorityValues.map((value) => {
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
                          'flex w-full items-center justify-between gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] text-left text-sm transition-colors',
                          isActive
                            ? 'bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] text-[color:var(--text-primary)]'
                            : 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[color:var(--text-primary)]'
                        )}
                      >
                        <span className={cn(isActive ? 'font-medium' : undefined)}>
                          {getPriorityLabel(value)}
                        </span>
                        {renderPriorityChip(value)}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-[var(--space-3)]">
            <div className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-secondary)]">
              <Tag className="size-4" aria-hidden />
              <span>Labels</span>
            </div>
            {editedTask.labels.length > 0 ? (
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {normalizeLabels(editedTask.labels).map((label, index) => {
                  const labelName = getTaskLabelName(label);
                  const labelColor = typeof label === 'string' ? 'var(--label-gray)' : label.color;
                  return (
                    <div key={`${labelName}-${index}`} className="relative inline-flex">
                      <div
                        className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--text-xs)] font-medium"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${labelColor} 18%, transparent)`,
                          color: `color-mix(in oklab, ${labelColor} 85%, var(--text-primary))`,
                          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${labelColor} 35%, transparent)`,
                        }}
                        onClick={() => setEditingLabelIndex(editingLabelIndex === index ? null : index)}
                      >
                        <span>{labelName}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveLabel(labelName);
                          }}
                          className="grid size-4 place-items-center rounded-full text-current hover:bg-[color-mix(in oklab,currentColor_15%,transparent)]"
                          aria-label={`Remove label ${labelName}`}
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </div>
                      {editingLabelIndex === index ? (
                        <div className="absolute left-0 top-full z-30 mt-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-[var(--space-3)] shadow-[var(--elevation-lg)]">
                          <div className="flex flex-wrap gap-[var(--space-2)]">
                            {labelColorPalette.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setEditedTask((prev) => {
                                    if (!prev) return prev;
                                    const labels = normalizeLabels(prev.labels);
                                    return {
                                      ...prev,
                                      labels: labels.map((existing, idx) =>
                                        idx === index ? { name: labelName, color: option.value } : existing,
                                      ),
                                    };
                                  });
                                  setEditingLabelIndex(null);
                                }}
                                className="size-5 rounded-full border transition-transform hover:scale-110"
                                style={{
                                  backgroundColor: `color-mix(in oklab, ${option.value} 18%, transparent)`,
                                  borderColor: `color-mix(in oklab, ${option.value} 35%, transparent)`,
                                }}
                                aria-label={`Set ${labelName} label to ${option.name}`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
              <span>Color:</span>
              <div className="flex items-center gap-[var(--space-1)]">
                {labelColorPalette.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedLabelColor(option.value)}
                    className={cn(
                      'size-5 rounded-full border transition-transform hover:scale-110',
                      selectedLabelColor === option.value && 'ring-2 ring-[var(--primary)] ring-offset-1 scale-110',
                    )}
                    style={{
                      backgroundColor: `color-mix(in oklab, ${option.value} 18%, transparent)`,
                      borderColor: `color-mix(in oklab, ${option.value} 35%, transparent)`,
                    }}
                    aria-label={`Choose ${option.name}`} 
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <input
                type="text"
                value={newLabel}
                onChange={(event) => setNewLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddLabel();
                  }
                }}
                placeholder="Add a label"
                className="flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-tint-10)]"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                disabled={!newLabel.trim()}
                className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--border-default)] text-[color:var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:text-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Add label"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[var(--space-3)]">
            <div className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-secondary)]">
              <span>Subtasks</span>
            </div>
            <div className="flex flex-col gap-[var(--space-2)]">
              {(editedTask.subtasks ?? []).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-[var(--space-2)]">
                  <Checkbox
                    checked={subtask.isCompleted}
                    onCheckedChange={(checked) => handleToggleSubtaskCompletion(subtask.id, Boolean(checked))}
                    className="size-5"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(event) => handleUpdateSubtaskTitle(subtask.id, event.target.value)}
                    className={cn(
                      'flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] focus:border-[var(--primary)] focus:outline-none',
                      subtask.isCompleted && 'line-through text-[color:var(--text-tertiary)]',
                    )}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                        aria-label="Set subtask due date"
                      >
                        <Calendar className="size-4" aria-hidden />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                        onSelect={(date) => handleUpdateSubtaskDueDate(subtask.id, date ? format(date, 'yyyy-MM-dd') : undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-[var(--space-2)]">
                <Checkbox disabled className="size-5 opacity-30" aria-hidden />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(event) => setNewSubtaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask"
                  className="flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
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
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Add subtask"
                >
                  <Plus className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[var(--space-3)] border-t border-[var(--border-subtle)] pt-[var(--space-6)]">
            <div className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-secondary)]">
              <span>Description</span>
            </div>
            <textarea
              value={editedTask.description ?? ''}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              placeholder="Add notes..."
              className="min-h-[120px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-canvas)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-tint-10)]"
            />
          </div>

        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-4">
        <button
          type="button"
          onClick={() => {
            onDeleteTask(task.id);
            onClose();
          }}
          className="inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)] text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 className="size-4" aria-hidden />
          Delete task
        </button>
        <button
          type="button"
          onClick={handleSaveChanges}
          className="inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--btn-primary-bg)] px-[var(--space-4)] py-[var(--space-2_5)] text-sm font-medium text-[color:var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)]"
        >
          Done
        </button>
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
