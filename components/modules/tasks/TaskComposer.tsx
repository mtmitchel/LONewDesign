
import React from 'react';
import { Calendar, Flag, Tag, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { format } from 'date-fns';

export type ComposerLabel = {
  name: string;
  color: string;
};

interface TaskComposerProps {
  onAddTask: (
    title: string,
    dueDate?: string,
    priority?: 'low' | 'medium' | 'high' | 'none',
    labels?: ComposerLabel[],
  ) => void;
  onCancel: () => void;
  availableLabels: ComposerLabel[];
}

const LABEL_PALETTE: ComposerLabel[] = [
  { name: 'Blue', color: 'var(--label-blue)' },
  { name: 'Purple', color: 'var(--label-purple)' },
  { name: 'Pink', color: 'var(--label-pink)' },
  { name: 'Red', color: 'var(--label-red)' },
  { name: 'Orange', color: 'var(--label-orange)' },
  { name: 'Yellow', color: 'var(--label-yellow)' },
  { name: 'Green', color: 'var(--label-green)' },
  { name: 'Teal', color: 'var(--label-teal)' },
  { name: 'Gray', color: 'var(--label-gray)' },
];

const PRIORITY_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high: 'var(--label-red)',
  medium: 'var(--label-orange)',
  low: 'var(--label-blue)',
};

const chipStyle = (color: string) => ({
  backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
  color: `color-mix(in oklab, ${color} 85%, var(--text-primary))`,
  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 35%, transparent)`,
});

export function TaskComposer({ onAddTask, onCancel, availableLabels }: TaskComposerProps) {
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined);
  const [priority, setPriority] = React.useState<'low' | 'medium' | 'high' | 'none'>('none');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = React.useState(false);
  const [showLabelsPopover, setShowLabelsPopover] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState('');
  const [labelColor, setLabelColor] = React.useState<string>(LABEL_PALETTE[0].color);
  const [selectedLabels, setSelectedLabels] = React.useState<ComposerLabel[]>([]);
  const composerRef = React.useRef<HTMLDivElement | null>(null);
  const interactionGuardRef = React.useRef(false);

  const normalizedAvailableLabels = React.useMemo(() => {
    const map = new Map<string, ComposerLabel>();
    availableLabels.forEach((label) => {
      if (!map.has(label.name)) {
        map.set(label.name, label);
      }
    });
    return Array.from(map.values());
  }, [availableLabels]);

  const handleAddTask = React.useCallback(() => {
    const trimmedTitle = title.trim();
    const hasData = Boolean(
      trimmedTitle || dueDate || priority !== 'none' || selectedLabels.length > 0,
    );

    if (!hasData) {
      return;
    }

    const normalizedTitle = trimmedTitle || 'Untitled';

    onAddTask(
      normalizedTitle,
      dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      priority !== 'none' ? priority : undefined,
      selectedLabels.length ? selectedLabels : undefined,
    );

    setTitle('');
    setDueDate(undefined);
    setPriority('none');
    setSelectedLabels([]);
    setLabelInput('');
    setLabelColor(LABEL_PALETTE[0].color);
    setShowDatePicker(false);
    setShowPriorityPicker(false);
    setShowLabelsPopover(false);
  }, [title, dueDate, priority, selectedLabels, onAddTask]);

  const hasComposerContent = React.useMemo(
    () => Boolean(title.trim() || dueDate || priority !== 'none' || selectedLabels.length > 0),
    [title, dueDate, priority, selectedLabels],
  );

  const finalizeComposer = React.useCallback(() => {
    if (hasComposerContent) {
      handleAddTask();
    } else {
      onCancel();
    }
  }, [hasComposerContent, handleAddTask, onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finalizeComposer();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  React.useEffect(() => {
    const markInternalInteraction = () => {
      interactionGuardRef.current = true;
      window.setTimeout(() => {
        interactionGuardRef.current = false;
      }, 150);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const root = composerRef.current;
      if (!root) return;

      if (root.contains(target) || target?.closest('[data-radix-popover-content]')) {
        markInternalInteraction();
        return;
      }

      finalizeComposer();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [finalizeComposer]);

  React.useEffect(() => {
    const root = composerRef.current;
    if (!root) return;

    const handleFocusOut = (event: FocusEvent) => {
      if (interactionGuardRef.current) {
        return;
      }

      window.setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl && (root.contains(activeEl) || activeEl.closest('[data-radix-popover-content]'))) {
          return;
        }

        const related = event.relatedTarget as HTMLElement | null;
        if (related && (root.contains(related) || related.closest('[data-radix-popover-content]'))) {
          return;
        }

        finalizeComposer();
      }, 0);
    };

    root.addEventListener('focusout', handleFocusOut);
    return () => {
      root.removeEventListener('focusout', handleFocusOut);
    };
  }, [finalizeComposer]);

  const toggleLabel = React.useCallback(
    (label: ComposerLabel) => {
      setSelectedLabels((prev) => {
        const exists = prev.some((item) => item.name === label.name);
        if (exists) {
          return prev.filter((item) => item.name !== label.name);
        }
        return [...prev, label];
      });
    },
    [],
  );

  const addFreeformLabel = React.useCallback(() => {
    const value = labelInput.trim();
    if (!value) return;

    toggleLabel({ name: value, color: labelColor });
    setLabelInput('');
  }, [labelInput, labelColor, toggleLabel]);

  return (
    <div
      ref={composerRef}
      className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-sm)] p-[var(--space-2)]"
    >
      <div className="flex flex-col gap-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
          <input
            type="text"
            placeholder="Write a task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 border-0 bg-transparent text-[length:var(--text-sm)] font-[var(--font-weight-normal)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-0"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-[var(--space-2)]">
          <div className="flex flex-col gap-[var(--space-2)] text-[color:var(--text-secondary)]">
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className={`flex size-8 items-center justify-center rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)] ${
                    dueDate
                      ? 'text-[color:var(--text-primary)] bg-[var(--bg-surface-elevated)]'
                      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  aria-label="Pick due date"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setShowDatePicker(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover open={showPriorityPicker} onOpenChange={setShowPriorityPicker}>
              <PopoverTrigger asChild>
                <button
                  className={`flex size-8 items-center justify-center rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)] ${
                    priority !== 'none'
                      ? 'text-[color:var(--text-primary)] bg-[var(--bg-surface-elevated)]'
                      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  aria-label="Set priority"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="start">
                <div className="flex flex-col gap-[var(--space-1)]">
                  {(['high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityPicker(false);
                      }}
                      className={`flex items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] font-[var(--font-weight-medium)] capitalize hover:bg-[var(--bg-surface-elevated)] ${
                        priority === p ? 'bg-[var(--bg-surface-elevated)]' : ''
                      }`}
                    >
                      <span
                        className="inline-flex items-center rounded-[var(--radius-pill)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--task-meta-size)] font-[var(--font-weight-medium)]"
                        style={chipStyle(PRIORITY_COLORS[p])}
                      >
                        {p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low'}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setPriority('none');
                      setShowPriorityPicker(false);
                    }}
                    className={`flex items-center gap-[var(--space-2)] rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--bg-surface-elevated)] ${
                      priority === 'none' ? 'bg-[var(--bg-surface-elevated)]' : ''
                    }`}
                  >
                    <span className="inline-flex h-[28px] w-[32px] items-center justify-center text-[length:var(--task-meta-size)] text-[color:var(--text-tertiary)]">
                      —
                    </span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showLabelsPopover} onOpenChange={setShowLabelsPopover}>
              <PopoverTrigger asChild>
                <button
                  className={`flex size-8 items-center justify-center rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)] ${
                    selectedLabels.length
                      ? 'text-[color:var(--text-primary)] bg-[var(--bg-surface-elevated)]'
                      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  aria-label="Add labels"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-3" align="start">
                <div className="flex flex-col gap-[var(--space-3)]">
                  {normalizedAvailableLabels.length > 0 && (
                    <div className="flex flex-col gap-[var(--space-1_5)]">
                      <span className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-tertiary)]">
                        Recent labels
                      </span>
                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {normalizedAvailableLabels.map((label) => {
                          const isSelected = selectedLabels.some((item) => item.name === label.name);
                          return (
                            <button
                              key={label.name}
                              type="button"
                              onClick={() => toggleLabel(label)}
                              className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-pill)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--task-meta-size)] font-[var(--font-weight-medium)] transition-colors ${
                                isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
                              }`}
                              style={chipStyle(label.color)}
                            >
                              <span>{label.name}</span>
                              {isSelected ? <Check className="w-3 h-3" aria-hidden /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-[var(--space-2)]">
                    <span className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-tertiary)]">
                      Create label
                    </span>
                    <div className="flex items-center gap-[var(--space-2)]">
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
                        placeholder="Label name"
                        className="flex-1 h-8 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                        aria-label="Label name"
                      />
                      <button
                        type="button"
                        onClick={addFreeformLabel}
                        className="inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[var(--btn-primary-bg)] px-[var(--space-3)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--btn-primary-text)] transition-colors hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!labelInput.trim()}
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-[var(--space-2)]">
                      {LABEL_PALETTE.map((option) => (
                        <button
                          key={option.color}
                          type="button"
                          onClick={() => setLabelColor(option.color)}
                          className={`size-6 rounded-full border transition-transform hover:scale-110 ${
                            labelColor === option.color ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
                          }`}
                          style={{
                            backgroundColor: `color-mix(in oklab, ${option.color} 18%, transparent)`,
                            borderColor: `color-mix(in oklab, ${option.color} 35%, transparent)`,
                          }}
                          aria-label={`Choose ${option.name} label color`}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedLabels.length > 0 ? (
                    <div className="flex flex-col gap-[var(--space-1_5)]">
                      <span className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[color:var(--text-tertiary)]">
                        Selected labels
                      </span>
                      <div className="flex flex-wrap gap-[var(--space-2)]">
                        {selectedLabels.map((label) => (
                          <button
                            key={label.name}
                            type="button"
                            onClick={() => toggleLabel(label)}
                            className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-pill)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--task-meta-size)] font-[var(--font-weight-medium)]"
                            style={chipStyle(label.color)}
                          >
                            <span>{label.name}</span>
                            <span aria-hidden>×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {selectedLabels.length > 0 ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {selectedLabels.map((label) => (
                <span
                  key={`summary-${label.name}`}
                  className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-pill)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--task-meta-size)] font-[var(--font-weight-medium)]"
                  style={chipStyle(label.color)}
                >
                  {label.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
