import * as React from 'react';
import { Calendar, ChevronDown, Flag, GripVertical, X } from 'lucide-react';
import { addDays, format } from 'date-fns';

import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from '../../ui/popover';
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
const getLabelColor = (label: TaskLabel) => (typeof label === 'string' ? 'var(--label-blue)' : label.color);
const QUICK_PICKS = [
  { label: 'Today', resolver: () => new Date() },
  { label: 'Tomorrow', resolver: () => addDays(new Date(), 1) },
  { label: 'Next week', resolver: () => addDays(new Date(), 7) },
  { label: 'No due date', resolver: () => undefined },
];

const GRID_TEMPLATE: React.CSSProperties = {
  gridTemplateColumns: 'minmax(120px, var(--task-drawer-label-col)) minmax(0, var(--task-drawer-field-max-w))',
  columnGap: 'var(--row-gap)',
};

const LABEL_CELL_CLASS = 'text-[length:var(--text-sm)] text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center min-h-[var(--row-min-h)]';
const VALUE_CELL_CLASS = 'flex items-center min-h-[var(--row-min-h)] w-full';
const CHIP_CLASS = 'inline-flex items-center gap-[var(--chip-gap)] h-[var(--chip-height)] px-[var(--chip-pad-x)] rounded-[var(--chip-radius)] border border-[var(--chip-border)] bg-[var(--chip-bg)] text-[color:var(--chip-text)] shadow-[var(--chip-inset-shadow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)] motion-safe:transition-[background-color,border-color,color] duration-[var(--duration-fast)] hover:bg-[var(--hover-bg)]';

type SectionProps = {
  framed?: boolean;
  children: React.ReactNode;
};

const Section = ({ framed = true, children }: SectionProps) => (
  <section
    className={cn(
      framed &&
        'bg-[var(--section-bg)] border border-[var(--section-border)] rounded-[var(--section-radius)] p-[var(--space-4)] shadow-[var(--section-shadow,none)]'
    )}
  >
    <div className="grid gap-y-[var(--row-gap)]" style={GRID_TEMPLATE}>
      {children}
    </div>
  </section>
);

type RowProps = {
  label?: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end' | 'between';
};

const Row = ({ label, children, align = 'start' }: RowProps) => (
  <>
    <div className={LABEL_CELL_CLASS}>{label ?? null}</div>
    <div
      className={cn(
        VALUE_CELL_CLASS,
        align === 'end' && 'justify-end',
        align === 'between' && 'justify-between',
      )}
    >
      {children}
    </div>
  </>
);

const labelColorStyle = (color: string) => ({
  backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
  color: `color-mix(in oklab, ${color} 85%, var(--text-primary))`,
  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)`,
});

const priorityStyles: Record<Exclude<Task['priority'], undefined>, React.CSSProperties> = {
  high: {
    backgroundColor: 'var(--chip-high-bg)',
    color: 'var(--chip-high-text)',
    boxShadow: 'inset 0 0 0 1px var(--chip-high-border)',
  },
  medium: {
    backgroundColor: 'var(--chip-medium-bg)',
    color: 'var(--chip-medium-text)',
    boxShadow: 'inset 0 0 0 1px var(--chip-medium-border)',
  },
  low: {
    backgroundColor: 'var(--chip-low-bg)',
    color: 'var(--chip-low-text)',
    boxShadow: 'inset 0 0 0 1px var(--chip-low-border)',
  },
  none: {},
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
  const [isDescExpanded, setIsDescExpanded] = React.useState(false);
  const [savedHint, setSavedHint] = React.useState<string | null>(null);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [labelQuery, setLabelQuery] = React.useState('');
  const overlayPadding = useOverlayGutter();

  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion);
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

  const closeOnEsc = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  React.useEffect(() => {
    if (!task) return;
    window.addEventListener('keydown', closeOnEsc);
    return () => window.removeEventListener('keydown', closeOnEsc);
  }, [task, closeOnEsc]);

  // IMPORTANT: Keep all hooks above any conditional returns to preserve hook order across renders.
  // Build available labels from store on every render (memoized by tasksById).
  const availableLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    Object.values(tasksById).forEach((t) => {
      const labels = Array.isArray(t.labels) ? (t.labels as TaskLabel[]) : [];
      labels.forEach((l) => map.set(getLabelName(l), getLabelColor(l)));
    });
    const list = Array.from(map.entries()).map(([name, color]) => ({ name, color }));
    if (labelQuery) {
      return list.filter((l) => l.name.toLowerCase().includes(labelQuery.toLowerCase()));
    }
    return list;
  }, [tasksById, labelQuery]);

  if (!task || !edited) return null;

  const headingId = `task-drawer-title-${task.id}`;

  const dueDate = edited.dueDate ? new Date(edited.dueDate) : undefined;
  const isCompleted = Boolean(edited.isCompleted);
  const priority: Task['priority'] = edited.priority ?? 'none';
  const subCount = edited.subtasks?.length ?? 0;
  const doneCount = (edited.subtasks ?? []).filter((s) => s.isCompleted).length;

  const isOverdue = dueDate ? new Date(edited.dueDate!).getTime() < Date.now() && !isCompleted : false;
  const isToday = dueDate ? format(dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;

  const renderPriorityChip = (value: Task['priority']) => {
    if (value === 'none') {
      return <span className="text-[color:var(--text-tertiary)]">Set priority</span>;
    }
    const label = value[0].toUpperCase() + value.slice(1);
    return (
      <span className="flex items-center gap-[var(--space-1)] text-[length:var(--text-sm)]">
        <Flag className="size-[var(--icon-sm)]" aria-hidden />
        {label}
      </span>
    );
  };

  return (
    <>
      {/* overlay */}
      <button
        aria-hidden
        className="fixed inset-0 z-[69] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
        onClick={onClose}
      />

      <aside
        className="fixed right-0 top-0 bottom-0 z-[70] flex h-dvh flex-col bg-[var(--bg-panel)] shadow-[var(--elevation-xl)] motion-safe:transition-transform duration-[var(--duration-sm)] ease-[var(--ease-emphasized)] px-[var(--panel-pad-x)] py-[var(--panel-pad-y)]"
        style={{ width: 'var(--task-drawer-w)', maxWidth: 'calc(100vw - 2 * var(--task-drawer-edge))' }}
        role="dialog"
        aria-labelledby={headingId}
        aria-modal
      >
        {/* Sticky header */}
        <header className="sticky top-0 bg-[var(--bg-panel)] pb-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <button
              type="button"
              className={cn(
                'grid place-items-center size-[var(--check-size)] rounded-[var(--radius-sm)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-colors duration-[var(--duration-fast)]',
                isCompleted && 'bg-[var(--check-active-bg)] border-[var(--check-active-ring)]'
              )}
              aria-pressed={isCompleted}
              aria-label={isCompleted ? 'Mark as not completed' : 'Mark completed'}
              onClick={() => toggleTaskCompletion(task.id)}
            >
              {isCompleted && <span className="size-[var(--icon-sm)] bg-[var(--check-icon)]" aria-hidden />}
            </button>

            <input
              id={headingId}
              className={cn(
                'flex-1 bg-transparent outline-none text-[length:var(--text-xl)] font-[var(--font-weight-semibold)] leading-[var(--line-tight)] text-[color:var(--text-primary)] min-h-[var(--field-height)] motion-safe:transition-colors duration-[var(--duration-fast)]',
                isCompleted && 'text-[color:var(--text-tertiary)] line-through'
              )}
              placeholder="Task title"
              defaultValue={edited.title}
              onBlur={(e) => e.target.value !== edited.title && handleSave({ title: e.target.value.trim() })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === 'Escape') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <div aria-live="polite" className="sr-only">{savedHint ?? ''}</div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-[var(--section-gap)]">
            <Section>
              <Row
                label={<span>Due date</span>}
              >
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <button className={cn(CHIP_CLASS, 'justify-start text-left')}>
                      <Calendar className="size-[var(--icon-sm)] text-[color:var(--text-secondary)]" />
                      <span
                        className={cn(
                          'truncate',
                          isOverdue && 'text-[color:var(--due-overdue)]',
                          !isOverdue && isToday && 'text-[color:var(--due-today)]',
                          !dueDate && 'text-[color:var(--text-tertiary)]',
                        )}
                      >
                        {dueDate ? format(dueDate, 'EEE, MMM d') : 'Add due date'}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    collisionPadding={overlayPadding}
                    className="w-[min(100vw,calc(var(--field-max-w)+var(--space-6)))] max-w-[var(--field-max-w)] p-[var(--space-3)] space-y-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] shadow-[var(--elevation-lg)]"
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
                    <div className="flex items-center gap-[var(--space-2)] overflow-x-auto overscroll-contain pr-[var(--space-1)]">
                      {QUICK_PICKS.map(({ label, resolver }) => (
                        <button
                          key={label}
                          type="button"
                          className={cn(CHIP_CLASS, 'whitespace-nowrap')}
                          onClick={() => {
                            const nextDate = resolver();
                            handleSave({ dueDate: nextDate ? format(nextDate, 'yyyy-MM-dd') : undefined });
                            setDateOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="self-end text-[length:var(--text-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface-elevated)]"
                      onClick={() => {
                        setDateOpen(false);
                      }}
                    >
                      Repeat…
                    </button>
                    <PopoverArrow className="fill-[var(--bg-surface-elevated)] drop-shadow-[var(--elevation-sm)]" />
                  </PopoverContent>
                </Popover>
              </Row>
            </Section>

            <Section>
              <Row label={<span>Priority</span>}>
                <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(CHIP_CLASS, 'justify-between')}
                      style={priorityStyles[priority]}
                    >
                      <span className="flex items-center gap-[var(--space-2)]">
                        {renderPriorityChip(priority)}
                      </span>
                      <ChevronDown className="size-[var(--icon-sm)] text-[color:var(--text-tertiary)]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    collisionPadding={overlayPadding}
                    className="w-[min(100vw,260px)] max-w-[var(--field-max-w)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] p-[var(--space-2)] shadow-[var(--elevation-lg)]"
                  >
                    <div className="flex flex-col gap-[var(--space-1)]">
                      {(['high', 'medium', 'low'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={cn(CHIP_CLASS, 'justify-start w-full text-left')}
                          style={priorityStyles[p]}
                          onClick={() => {
                            handleSave({ priority: p });
                            setPriorityOpen(false);
                          }}
                        >
                          {renderPriorityChip(p)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={cn(CHIP_CLASS, 'justify-start w-full text-left text-[color:var(--text-tertiary)]')}
                        onClick={() => {
                          handleSave({ priority: 'none' });
                          setPriorityOpen(false);
                        }}
                      >
                        —
                      </button>
                    </div>
                    <PopoverArrow className="fill-[var(--bg-surface-elevated)] drop-shadow-[var(--elevation-sm)]" />
                  </PopoverContent>
                </Popover>
              </Row>
              <Row label={<span>Labels</span>}>
                <div className="flex flex-wrap items-center gap-[var(--space-2)]">
                  {(edited.labels as TaskLabel[] | undefined)?.map((label) => {
                    const name = getLabelName(label);
                    const color = getLabelColor(label);
                    return (
                      <span
                        key={name}
                        className={cn(CHIP_CLASS, 'pr-[var(--space-2)] pl-[var(--space-3)]')} // eslint-disable-line tailwindcss/no-custom-classname
                        style={labelColorStyle(color)}
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          className="-mr-[var(--space-1)] grid size-[var(--icon-sm)] place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
                          onClick={() => {
                            const next = (edited.labels as TaskLabel[] | undefined)?.filter((l) => getLabelName(l) !== name) ?? [];
                            handleSave({ labels: next });
                          }}
                          aria-label={`Remove label ${name}`}
                        >
                          <X className="size-[var(--icon-2xs)]" />
                        </button>
                      </span>
                    );
                  })}
                  <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                    <PopoverTrigger asChild>
                      <button className={cn(CHIP_CLASS, 'justify-center')} aria-label="Add label">
                        + Add label
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={8}
                      collisionPadding={overlayPadding}
                      className="w-[min(100vw,280px)] max-w-[var(--field-max-w)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)] shadow-[var(--elevation-lg)]"
                    >
                      <div className="flex flex-col gap-[var(--space-3)]">
                        <Input
                          value={labelQuery}
                          onChange={(e) => setLabelQuery(e.target.value)}
                          placeholder="Search or add label"
                          className="h-[var(--field-height)]"
                        />
                        <div className="flex max-h-48 flex-col gap-[var(--space-1_5)] overflow-y-auto">
                          {availableLabels.length === 0 && (
                            <span className="px-[var(--space-1_5)] text-[color:var(--text-tertiary)] text-[length:var(--text-sm)]">
                              No labels yet
                            </span>
                          )}
                          {availableLabels.map(({ name, color }) => (
                            <button
                              key={name}
                              type="button"
                              className="flex items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] hover:bg-[var(--bg-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface-elevated)]"
                              onClick={() => {
                                const existing = (edited.labels as TaskLabel[] | undefined) ?? [];
                                if (!existing.some((l) => getLabelName(l) === name)) {
                                  handleSave({ labels: [...existing, { name, color }] });
                                }
                                setLabelsOpen(false);
                              }}
                            >
                              <span className="flex items-center gap-[var(--space-2)]">
                                <span className={cn(CHIP_CLASS, 'px-[var(--space-2)]', 'bg-transparent shadow-none border-transparent')} style={labelColorStyle(color)}>
                                  {name}
                                </span>
                              </span>
                              <span className="text-[color:var(--text-tertiary)]">Select</span>
                            </button>
                          ))}
                        </div>
                        {labelQuery &&
                          !availableLabels.some((l) => l.name.toLowerCase() === labelQuery.toLowerCase()) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start"
                              onClick={() => {
                                const existing = (edited.labels as TaskLabel[] | undefined) ?? [];
                                handleSave({ labels: [...existing, { name: labelQuery.trim(), color: 'var(--label-blue)' }] });
                                setLabelQuery('');
                                setLabelsOpen(false);
                              }}
                            >
                              Create “{labelQuery}”
                            </Button>
                          )}
                      </div>
                      <PopoverArrow className="fill-[var(--bg-surface-elevated)] drop-shadow-[var(--elevation-sm)]" />
                    </PopoverContent>
                  </Popover>
                </div>
              </Row>
            </Section>

            <Section>
              <Row label={<span>Subtasks</span>} align="end">
                {subCount > 0 ? (
                  <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">{doneCount} of {subCount}</span>
                ) : (
                  <span className="text-[color:var(--text-tertiary)] text-[length:var(--text-sm)]">No subtasks</span>
                )}
              </Row>
              <Row>
                <div className="flex w-full flex-col gap-[var(--row-gap)]">
                  {(edited.subtasks ?? []).map((s) => (
                    <div key={s.id} className="group flex items-center gap-[var(--space-2)] min-h-[var(--row-min-h)]">
                      <button
                        type="button"
                        className="grid size-[var(--icon-md)] place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-tertiary)] opacity-0 focus:opacity-100 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
                        aria-label="Reorder subtask"
                      >
                        <GripVertical className="size-[var(--icon-sm)]" />
                      </button>
                      <Checkbox
                        checked={s.isCompleted}
                        onCheckedChange={(checked) => {
                          const next = (edited.subtasks ?? []).map((st) =>
                            st.id === s.id ? { ...st, isCompleted: Boolean(checked) } : st,
                          );
                          handleSave({ subtasks: next });
                        }}
                        className="size-[var(--check-size)]"
                      />
                      <input
                        className="flex-1 h-[var(--field-height)] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--field-pad-x)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
                        value={s.title}
                        onChange={(e) => {
                          const next = (edited.subtasks ?? []).map((st) =>
                            st.id === s.id ? { ...st, title: e.target.value } : st,
                          );
                          setEdited({ ...edited, subtasks: next });
                        }}
                        onBlur={() => handleSave({ subtasks: edited.subtasks })}
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={cn(CHIP_CLASS, 'text-[color:var(--text-secondary)]')}>
                            <Calendar className="size-[var(--icon-sm)]" />
                            {s.dueDate ? format(new Date(s.dueDate), 'MMM d') : 'Add due date'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          collisionPadding={overlayPadding}
                          className="w-[min(100vw,calc(var(--field-max-w)/1.5))] max-w-[var(--field-max-w)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)] shadow-[var(--elevation-lg)]"
                        >
                          <CalendarComponent
                            mode="single"
                            selected={s.dueDate ? new Date(s.dueDate) : undefined}
                            onSelect={(d) => {
                              const next = (edited.subtasks ?? []).map((st) =>
                                st.id === s.id ? { ...st, dueDate: d ? format(d, 'yyyy-MM-dd') : undefined } : st,
                              );
                              handleSave({ subtasks: next });
                            }}
                            className="p-0"
                          />
                          <PopoverArrow className="fill-[var(--bg-surface-elevated)] drop-shadow-[var(--elevation-sm)]" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="self-start text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
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
                    + Add a subtask
                  </button>
                </div>
              </Row>
            </Section>

            <Section framed={false}>
              <Row label={<span>Description</span>}>
                {isDescExpanded ? (
                  <textarea
                    className="w-full max-w-[var(--field-max-w)] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--field-pad-x)] py-[var(--field-pad-y)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
                    defaultValue={edited.description ?? ''}
                    onBlur={(e) => {
                      handleSave({ description: e.target.value.trim() || undefined });
                      setIsDescExpanded(false);
                    }}
                    autoFocus
                    rows={3}
                  />
                ) : (
                  <button
                    type="button"
                    className="text-left text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
                    onClick={() => setIsDescExpanded(true)}
                  >
                    {edited.description ? edited.description : 'Add notes…'}
                  </button>
                )}
              </Row>
            </Section>
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 mt-[var(--space-6)] bg-[var(--bg-panel)] py-[var(--space-3)] flex items-center justify-between">
          <Button variant="link" className="text-[color:var(--danger)]" onClick={() => onDeleteTask(task.id)}>
            Delete task
          </Button>
          <div className="flex items-center gap-[var(--space-2)]">
            <Button variant="ghost" onClick={() => onClose()}>Close</Button>
            {isCompleted ? (
              <Button onClick={() => handleSave({ isCompleted: false })}>Reopen</Button>
            ) : (
              <Button onClick={() => handleSave({ isCompleted: true })}>Mark complete</Button>
            )}
          </div>
        </footer>
      </aside>
    </>
  );
}

export default TaskDetailsDrawer;
