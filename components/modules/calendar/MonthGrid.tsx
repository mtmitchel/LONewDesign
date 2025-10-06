import { useEffect, useMemo, useState } from 'react';
import { format, isAfter, isBefore, isEqual, isSameDay, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { cn } from '../../ui/utils';
import type { CalendarEvent } from './types';
import type { MonthCell } from './useCalendarEngine';
import { EventChip } from './EventChip';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

type MonthGridProps = {
  cells: MonthCell[];
  getEventsForDate: (date: Date) => CalendarEvent[];
  onSelectDay: (date: Date) => void;
  onSelectRange: (start: Date, end: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
};

type DragState = {
  start: Date;
  end: Date;
};

export function MonthGrid({ cells, getEventsForDate, onSelectDay, onSelectRange, onEventClick }: MonthGridProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    const handlePointerUp = () => {
      if (dragState) {
        const start = dragState.start < dragState.end ? dragState.start : dragState.end;
        const end = dragState.start < dragState.end ? dragState.end : dragState.start;
        onSelectRange(normalizeDate(start), normalizeDate(end));
        setDragState(null);
      }
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [dragState, onSelectRange]);

  const highlightMap = useMemo(() => {
    if (!dragState) {
      return new Set<string>();
    }

    const selected = new Set<string>();
    const rawStart = dragState.start < dragState.end ? dragState.start : dragState.end;
    const rawEnd = dragState.start < dragState.end ? dragState.end : dragState.start;

    cells.forEach(({ date }) => {
      if (
        isWithinInterval(date, { start: normalizeDate(rawStart), end: new Date(normalizeDate(rawEnd).getTime() + 1000 * 60 * 60 * 24 - 1) })
      ) {
        selected.add(format(date, 'yyyy-MM-dd'));
      }
    });

    return selected;
  }, [cells, dragState]);

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <div className="grid grid-cols-7 gap-[var(--space-2)]">
        {DAY_LABELS.map((day) => (
          <div key={day} className="text-center text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[color:var(--text-secondary)] uppercase tracking-wide">
            {day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[var(--space-2)]">
        {cells.map((cell) => {
          const dateKey = format(cell.date, 'yyyy-MM-dd');
          const events = getEventsForDate(cell.date);
          const visibleEvents = events.slice(0, 3);
          const overflowCount = Math.max(events.length - visibleEvents.length, 0);
          const isHighlighted = highlightMap.has(dateKey);

          return (
            <div
              key={dateKey}
              role="gridcell"
              aria-selected={isHighlighted}
              className={cn(
                'min-h-[var(--calendar-cell-min-h)] rounded-[var(--radius-lg)] border border-[var(--calendar-cell-border)] bg-[var(--bg-surface)] p-[var(--space-3)] transition-shadow',
                cell.isToday && 'border-[var(--primary)] shadow-[0_0_0_1px_var(--primary)]',
                !cell.isCurrentMonth && 'opacity-50',
                isHighlighted && 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-surface)]'
              )}
              onClick={() => onSelectDay(cell.date)}
              onPointerDown={(event) => {
                event.preventDefault();
                setDragState({ start: cell.date, end: cell.date });
              }}
              onPointerEnter={() => {
                setDragState((prev) => (prev ? { ...prev, end: cell.date } : prev));
              }}
            >
              <div className="mb-[var(--space-2)] flex items-center justify-between">
                <span className={cn('text-[length:var(--text-sm)] font-[var(--font-weight-medium)]', cell.isToday ? 'text-[color:var(--primary)]' : 'text-[color:var(--text-primary)]')}>
                  {format(cell.date, 'd')}
                </span>
              </div>

              <div className="flex flex-col gap-[var(--space-2)]">
                {visibleEvents.map((event) => (
                  <EventChip key={event.id} event={event} onClick={onEventClick} />
                ))}
                {overflowCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-left text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[color:var(--primary)] hover:underline"
                      >
                        +{overflowCount} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 space-y-[var(--space-2)]">
                      {events.slice(3).map((event) => (
                        <EventChip key={event.id} event={event} onClick={onEventClick} />
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
