import React from 'react';
import { addDays, addMinutes, format, isSameDay, startOfDay } from 'date-fns';
import { cn } from '../../ui/utils';
import type { CalendarEvent } from './types';
import type { TimedEventPlacement } from './useCalendarEngine';
import { EventBlock } from './EventBlock';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const BODY_HEIGHT = 'calc(var(--calendar-hour-row-h) * 24)';

function computeNowPosition(day: Date) {
  const now = new Date();
  if (!isSameDay(now, day)) {
    return null;
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  return (minutes / (24 * 60)) * 100;
}

type WeekGridProps = {
  weekStart: Date;
  placements: Map<string, TimedEventPlacement[]>;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onCreateRange: (start: Date, end: Date) => void;
};

export function WeekGrid({ weekStart, placements, events, onEventClick, onCreateRange }: WeekGridProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className="space-y-[var(--space-2)]">
      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-[var(--space-2)]">
        <div />
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const allDayCount = events.filter((event) => event.allDay && isSameDay(new Date(event.startsAt), day)).length;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex h-16 flex-col justify-center rounded-[var(--radius-md)] border border-[var(--calendar-cell-border)] bg-[var(--bg-surface)] px-[var(--space-3)]',
                isToday && 'border-[var(--primary)] text-[color:var(--primary)]'
              )}
            >
              <span className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)]">{format(day, 'EEE d')}</span>
              {allDayCount > 0 && (
                <span className="text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
                  {allDayCount} all-day {allDayCount === 1 ? 'event' : 'events'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-[var(--space-2)]">
        <div
          className="relative rounded-[var(--radius-md)] border border-[var(--calendar-cell-border)] bg-[var(--bg-surface)]"
          style={{ height: BODY_HEIGHT }}
        >
          <div className="absolute inset-0 flex flex-col">
            {HOURS.map((hour) => (
              <React.Fragment key={`label-${hour}`}>
                <div
                  className="sticky left-0 flex items-center justify-end pr-[var(--space-2)] text-[length:var(--text-xs)] leading-none text-[var(--text-tertiary)] h-[var(--calendar-hour-row-h)]"
                >
                  {format(new Date().setHours(hour, 0, 0, 0), 'ha')}
                </div>
                <div className="border-t border-[var(--calendar-grid-line)]" />
              </React.Fragment>
            ))}
          </div>
        </div>

  {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const nowPosition = computeNowPosition(day);

          return (
            <div
              key={key}
              className="relative h-full px-[var(--calendar-week-column-pad-x)]"
            >
              <div
                className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--calendar-cell-border)] bg-[var(--bg-surface)] h-full"
                onDoubleClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const y = event.clientY - rect.top;
                  const minutes = Math.floor((y / rect.height) * 24 * 60 / 15) * 15;
                  const start = addMinutes(startOfDay(day), minutes);
                  const end = addMinutes(start, 60);
                  onCreateRange(start, end);
                }}
              >
              <div className="absolute inset-0 grid grid-rows-[repeat(24,var(--calendar-hour-row-h))]">
                {HOURS.map((hour) => (
                  <div
                    key={`${key}-${hour}`}
                    className="border-b border-dashed border-[color-mix(in_oklab,var(--calendar-cell-border)_60%,transparent)]"
                  />
                ))}
              </div>

              {nowPosition !== null && (
                <div
                  className="pointer-events-none absolute left-0 right-0 h-px bg-[var(--primary)]"
                  style={{ top: `${nowPosition}%` }}
                />
              )}

              {placements.get(key)?.map((placement) => (
                <EventBlock key={placement.event.id} placement={placement} onClick={onEventClick} />
              ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
