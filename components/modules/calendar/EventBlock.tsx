import { format } from 'date-fns';
import { cn } from '../../ui/utils';
import type { CalendarEvent } from './types';
import { EVENT_COLOR } from './types';
import type { TimedEventPlacement } from './useCalendarEngine';

type EventBlockProps = {
  placement: TimedEventPlacement;
  onClick?: (event: CalendarEvent) => void;
};

export function EventBlock({ placement, onClick }: EventBlockProps) {
  const { event, lane, laneCount, top, height } = placement;
  const colorToken = event.category ? EVENT_COLOR[event.category] : 'var(--primary)';

  const widthPercent = 100 / laneCount;
  const leftPercent = lane * widthPercent;

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
      className={cn(
        'absolute left-0 right-0 flex flex-col items-[var(--calendar-event-content-align)] overflow-hidden',
        'rounded-[var(--calendar-event-radius)]',
        'border border-[var(--calendar-event-border)]',
        'px-[var(--calendar-event-pad-x)] py-[var(--calendar-event-pad-y)]',
        'text-left text-[length:var(--text-sm)]',
        'hover:bg-[var(--event-blue-hover)]',
        'focus:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--calendar-event-focus-ring)]',
        'focus-visible:ring-offset-0',
        'motion-safe:transition-colors'
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: colors.bg,
        color: colors.text,
        '--tw-hover-bg': colors.hover,
      } as React.CSSProperties}
      aria-label={`${event.title}, ${format(new Date(event.startsAt), 'p')} to ${format(new Date(event.endsAt), 'p')}`}
    >
      <span className="font-[var(--font-weight-semibold)] line-clamp-2">
        {event.title}
      </span>
      <span className="opacity-80">{format(new Date(event.startsAt), 'p')} – {format(new Date(event.endsAt), 'p')}</span>
      {event.location && (
        <span className="mt-1 opacity-60 line-clamp-1">{event.location}</span>
      )}
    </button>
  );
}
