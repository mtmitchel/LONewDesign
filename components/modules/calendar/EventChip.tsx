import { format } from 'date-fns';
import { cn } from '../../ui/utils';
import type { CalendarEvent } from './types';
import { EVENT_COLOR } from './types';

type EventChipProps = {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  onMouseEnter?: (event: CalendarEvent) => void;
  onMouseLeave?: (event: CalendarEvent) => void;
};

export function EventChip({ event, onClick, onMouseEnter, onMouseLeave }: EventChipProps) {
  const colorToken = event.category ? EVENT_COLOR[event.category] : 'var(--primary)';
  const hasTime = !event.allDay;
  const eventLabel = hasTime
    ? `${format(new Date(event.startsAt), 'HH:mm')} ${event.title}`
    : event.title;

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      onMouseEnter={() => onMouseEnter?.(event)}
      onMouseLeave={() => onMouseLeave?.(event)}
      className={cn(
        'group flex w-full items-center justify-start gap-[var(--space-2)] rounded-[var(--calendar-event-radius)] px-[var(--space-2)] text-left text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-white transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]'
      )}
      style={{
        backgroundColor: colorToken,
        lineHeight: 1.3,
        height: '28px'
      }}
      aria-label={eventLabel}
    >
      <span className="truncate">{eventLabel}</span>
    </button>
  );
}
