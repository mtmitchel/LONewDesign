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

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-[var(--calendar-event-radius)] border border-[color-mix(in_oklab,var(--border-subtle)_60%,transparent)] p-[var(--space-2)] text-left text-[length:var(--text-xs)] shadow-sm transition-colors',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]'
      )}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        background: `color-mix(in oklab, ${colorToken} 16%, transparent)`,
        borderLeft: `3px solid ${colorToken}`
      }}
      aria-label={`${event.title}, ${format(new Date(event.startsAt), 'p')} to ${format(new Date(event.endsAt), 'p')}`}
    >
      <span className="font-[var(--font-weight-semibold)] text-[color:var(--text-primary)] line-clamp-2">
        {event.title}
      </span>
      <span className="text-[color:var(--text-secondary)]">{format(new Date(event.startsAt), 'p')} – {format(new Date(event.endsAt), 'p')}</span>
      {event.location && (
        <span className="mt-1 text-[color:var(--text-tertiary)] line-clamp-1">{event.location}</span>
      )}
    </button>
  );
}
