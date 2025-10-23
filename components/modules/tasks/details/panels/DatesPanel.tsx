
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '../../../../ui/calendar';
import { cn } from '../../../../ui/utils';
import { format } from 'date-fns';

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

const EMPTY_TILE_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--bg-surface-elevated)_92%,transparent)] hover:text-[color:var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)]';

interface DatesPanelProps {
  dueDate: Date | undefined;
  dueState: DueState;
  dueDisplayLabel: string | undefined;
  dateOpen: boolean;
  setDateOpen: (open: boolean) => void;
  handleSave: (updates: { dueDate: string | undefined }) => void;
}

export function DatesPanel({ dueDate, dueState, dueDisplayLabel, dateOpen, setDateOpen, handleSave }: DatesPanelProps) {
  return (
    <div className="grid grid-cols-[var(--task-drawer-label-col)_1fr] gap-x-[var(--space-8)] gap-y-[var(--space-3)]">
      <span className='text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center'>Due date</span>
      <div className='flex items-center min-h-[var(--row-min-h)] w-full text-[color:var(--text-primary)] gap-[var(--chip-gap)]'>
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
            className="w-auto p-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]"
          >
            <CalendarComponent
              mode="single"
              selected={dueDate}
              onSelect={(d: Date | undefined) => {
                handleSave({ dueDate: d ? format(d, 'yyyy-MM-dd') : undefined });
                setDateOpen(false);
              }}
              className="p-0"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
