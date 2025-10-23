"use client";

import React from 'react';
import { Calendar, Check, Flag, Tag } from 'lucide-react';
import { format } from 'date-fns';


import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { Badge, badgeVariants } from '../../../../ui/badge';
import { TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS, getLabelHue } from '../../taskChipStyles';
import { Calendar as CalendarComponent } from '../../../../ui/calendar';
import { cn } from '../../../../ui/utils';
import { useTaskDetails } from '../TaskDetailsContext';
import type { Task } from '../../types';

const EMPTY_TILE_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--bg-surface-elevated)_92%,transparent)] hover:text-[color:var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)]';

const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

const DUE_PILL_BASE_CLASS =
  'inline-flex items-center gap-[var(--space-1)] h-[var(--chip-height)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--text-sm)] font-medium shadow-[inset_0_0_0_1px_var(--border-subtle)] transition-colors';

type DueState = 'none' | 'scheduled' | 'today' | 'overdue';

const DUE_TONE_CLASSES: Record<DueState, string> = {
  none: 'bg-transparent text-[color:var(--text-tertiary)]',
  scheduled: 'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)]',
  today:
    'bg-[color-mix(in_oklab,var(--due-today)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-today)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-today)_35%,transparent)]',
  overdue:
    'bg-[color-mix(in_oklab,var(--due-overdue)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-overdue)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-overdue)_35%,transparent)]',
};

const LABEL_CELL_CLASS =
  'text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center';
const VALUE_CELL_CLASS =
  'flex items-center min-h-[var(--row-min-h)] w-full text-[color:var(--text-primary)] gap-[var(--chip-gap)]';

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

export function TaskForm() {
  const {
    edited,
    setEdited,
    dateOpen,
    setDateOpen,
    priorityOpen,
    setPriorityOpen,
    labelsOpen,
    setLabelsOpen,
    labelInput,
    setLabelInput,
    labelInputRef,
    onUpdateTask,
  } = useTaskDetails();

  const overlayPadding = useOverlayGutter();

  // Derived data
  const dueDate = edited?.dueDate ? new Date(edited.dueDate) : null;
  const priority = edited?.priority ?? 'none';
  const labels = edited?.labels ?? [];

  const getDueState = (task: Task): DueState => {
    if (!task.dueDate) return 'none';
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const targetKey = format(dueDate, 'yyyy-MM-dd');
    
    if (task.isCompleted) return 'scheduled';
    if (targetKey === todayKey) return 'today';
    if (!task.isCompleted && dueDate.getTime() < Date.now()) return 'overdue';
    return 'scheduled';
  };

  const dueState = edited ? getDueState(edited) : 'none';
  const dueDisplayLabel = dueDate ? format(dueDate, 'MMM d') : null;

  const priorityTone = priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : priority === 'low' ? 'low' : null;
  const priorityLabel = priority === 'high' ? 'High' : priority === 'medium' ? 'Medium' : priority === 'low' ? 'Low' : null;

  const renderPriorityChip = (value: Task['priority']) => {
    if (value === 'none') return null;
    const tone = value === 'high' ? 'high' : value === 'medium' ? 'medium' : 'low';
    const label = value === 'high' ? 'High' : value === 'medium' ? 'Medium' : 'Low';
    return (
      <Badge variant="soft" tone={tone} size="sm" className={TASK_META_CHIP_CLASS}>
        {label}
      </Badge>
    );
  };

  const handleSave = React.useCallback((updates: Partial<Task>) => {
    if (!edited) return;
    const updated = { ...edited, ...updates };
    setEdited(updated);
    onUpdateTask(updated, { showToast: false });
  }, [edited, setEdited, onUpdateTask]);

  // Label management
  const selectedLabels = React.useMemo(() => {
    return Array.isArray(labels) ? labels : [];
  }, [labels]);

  const mergedLabelOptions = React.useMemo(() => {
    const labelMap = new Map<string, string>();
    
    // Add existing labels from task
    selectedLabels.forEach(label => {
      const name = typeof label === 'string' ? label : label.name;
      const color = typeof label === 'string' ? DEFAULT_LABEL_COLOR : label.color || DEFAULT_LABEL_COLOR;
      labelMap.set(name, color);
    });

    return Array.from(labelMap.entries()).map(([name, color]) => ({ name, color }));
  }, [selectedLabels]);

  const toggleLabel = React.useCallback((label: { name: string; color: string }) => {
    if (!edited) return;
    
    const currentLabels = Array.isArray(edited.labels) ? edited.labels : [];
    const exists = currentLabels.some(l => 
      typeof l === 'string' ? l === label.name : l.name === label.name
    );
    
    const newLabels = exists
      ? currentLabels.filter(l => 
          typeof l === 'string' ? l !== label.name : l.name !== label.name
        )
      : [...currentLabels, { name: label.name, color: label.color }];
    
    handleSave({ labels: newLabels });
  }, [edited, handleSave]);

  const addFreeformLabel = React.useCallback((input: string) => {
    if (!input || !edited) return;
    
    const trimmed = input.trim();
    if (!trimmed) return;
    
    const currentLabels = Array.isArray(edited.labels) ? edited.labels : [];
    const exists = currentLabels.some(l => 
      typeof l === 'string' ? l === trimmed : l.name === trimmed
    );
    
    if (exists) return;
    
    const newLabels = [...currentLabels, { name: trimmed, color: DEFAULT_LABEL_COLOR }];
    handleSave({ labels: newLabels });
    setLabelInput('');
  }, [edited, handleSave, setLabelInput]);

  const focusLabelInput = React.useCallback(() => {
    if (!labelInputRef.current || !labelsOpen) return;
    const frame = requestAnimationFrame(() => {
      labelInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [labelInputRef, labelsOpen]);

  return (
    <div className="grid grid-cols-[var(--task-drawer-label-col)_1fr] gap-x-[var(--space-8)] gap-y-[var(--space-3)]">
      {/* Due Date */}
      <span className={LABEL_CELL_CLASS}>Due date</span>
      <div className={VALUE_CELL_CLASS}>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            {dueState === 'none' ? (
              <button
                type="button"
                aria-label="Choose date"
                className={EMPTY_TILE_BUTTON_CLASS}
              >
                <Calendar
                  className="h-[var(--icon-md)] w-[var(--icon-md)]"
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
              selected={dueDate || undefined}
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

      {/* Priority */}
      <span className={LABEL_CELL_CLASS}>Priority</span>
      <div className={VALUE_CELL_CLASS}>
        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            {priority === 'none' || !priorityTone ? (
              <button
                type="button"
                aria-label="Choose priority"
                className={EMPTY_TILE_BUTTON_CLASS}
              >
                <Flag className="h-[var(--icon-md)] w-[var(--icon-md)]" strokeWidth={1.25} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Choose priority (${priorityLabel})`}
                className={cn(
                  badgeVariants({ variant: 'soft', tone: priorityTone, size: 'sm' }),
                  TASK_META_CHIP_CLASS,
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

      {/* Labels */}
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
                aria-label={`Edit labels (${selectedLabels.map((label) => typeof label === 'string' ? label : label.name).join(', ')})`}
                className="group flex min-h-[34px] max-w-full flex-wrap items-center gap-[var(--chip-gap)] rounded-full bg-transparent px-[var(--space-1)] py-[var(--space-1)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-panel)]"
              >
                {selectedLabels.map((label) => {
                  const name = typeof label === 'string' ? label : label.name;
                  const color = typeof label === 'string' ? DEFAULT_LABEL_COLOR : label.color || DEFAULT_LABEL_COLOR;
                  const labelHue = getLabelHue(color);
                  return (
                    <Badge
                      key={`trigger-${name}`}
                      variant="soft"
                      size="sm"
                      data-label-color={labelHue}
                      className={cn(
                        TASK_META_CHIP_CLASS,
                        TASK_LABEL_CHIP_BASE_CLASS,
                        'group-hover:border-[color:var(--border-strong)] group-focus-visible:border-[color:var(--border-strong)]',
                        labelsOpen && 'border-[color:var(--border-strong)]',
                      )}
                    >
                      <span className="max-w-[100px] truncate" title={name}>
                        {name}
                      </span>
                    </Badge>
                  );
                })}
              </button>
            ) : (
              <button
                type="button"
                className={EMPTY_TILE_BUTTON_CLASS}
                aria-label="Choose labels"
              >
                <Tag className="h-[var(--icon-md)] w-[var(--icon-md)]" strokeWidth={1.25} aria-hidden />
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
                  const isSelected = selectedLabels.some((item) => 
                    (typeof item === 'string' ? item : item.name) === label.name
                  );
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
                          TASK_META_CHIP_CLASS,
                          TASK_LABEL_CHIP_BASE_CLASS,
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
                  ref={labelInputRef as any}
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
  );
}