import { format, differenceInMinutes } from 'date-fns';
import { cn } from '../../ui/utils';
import type { CalendarEvent as CalendarEventType } from './types';
import type { TimedEventPlacement } from './useCalendarEngine';
import { CalendarEvent as CalendarEventPill } from '../../calendar/CalendarEvent';

type EventBlockProps = {
  placement: TimedEventPlacement;
  onClick?: (event: CalendarEventType) => void;
};

export function EventBlock({ placement, onClick }: EventBlockProps) {
  const { event, lane, laneCount, top, height } = placement;

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

  const minutes = Math.max(1, differenceInMinutes(new Date(event.endsAt), new Date(event.startsAt)));
  const density = minutes <= 30 ? 'micro' : minutes <= 60 ? 'compact' : 'default';
  const minH = minutes <= 15
    ? 'min-h-[var(--cal-15m-min-h)]'
    : minutes <= 30
    ? 'min-h-[var(--cal-30m-min-h)]'
    : '';

  return (
    <CalendarEventPill
      title={event.title}
      time={format(new Date(event.startsAt), 'p')}
      tone={eventColor}
      density={density as any}
      className={cn('absolute inset-x-0', minH, 'hover:shadow-[var(--elevation-sm)] hover:-translate-y-px')}
      style={{
        top: `${top}%`,
        height: `${height}%`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
      onClick={() => onClick?.(event)}
      aria-label={`${event.title}, ${format(new Date(event.startsAt), 'p')} to ${format(new Date(event.endsAt), 'p')}`}
    />
  );
}
