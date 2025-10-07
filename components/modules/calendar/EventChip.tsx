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

  // Map category colors to event color variants
  const getEventColor = (category: string | undefined) => {
    const colorMap: Record<string, 'blue' | 'green' | 'teal' | 'orange'> = {
      'work': 'blue',
      'personal': 'green',
      'meeting': 'teal',
      'reminder': 'orange',
    };
    return category ? colorMap[category] || 'blue' : 'blue';
  };

  const eventColor = getEventColor(event.category);
  const colorTokens = {
    blue: { bg: 'var(--event-blue-bg)', text: 'var(--event-blue-text)', hover: 'var(--event-blue-hover)' },
    green: { bg: 'var(--event-green-bg)', text: 'var(--event-green-text)', hover: 'var(--event-green-hover)' },
    teal: { bg: 'var(--event-teal-bg)', text: 'var(--event-teal-text)', hover: 'var(--event-teal-hover)' },
    orange: { bg: 'var(--event-orange-bg)', text: 'var(--event-orange-text)', hover: 'var(--event-orange-hover)' },
  };

  const colors = colorTokens[eventColor];

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      onMouseEnter={() => onMouseEnter?.(event)}
      onMouseLeave={() => onMouseLeave?.(event)}
      className={cn(
        'w-full',
        'rounded-[var(--calendar-event-radius)]',
        'border border-[var(--calendar-event-border)]',
        'px-[var(--calendar-event-pad-x)] py-[var(--calendar-event-pad-y-compact)]', // compact for month
        'text-[length:var(--text-xs)]', // smaller text for month
        'hover:bg-[var(--event-blue-hover)]',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--calendar-event-focus-ring)]',
        'focus-visible:ring-offset-0',
        'motion-safe:transition-colors'
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        '--tw-hover-bg': colors.hover,
      } as React.CSSProperties}
      aria-label={eventLabel}
    >
      {hasTime && <span className="mr-2 opacity-80">{format(new Date(event.startsAt), 'HH:mm')}</span>}
      <span className="truncate">{event.title}</span>
    </button>
  );
}
