import { format } from 'date-fns';
import { CalendarEvent, EVENT_COLOR } from './types';
import { Button } from '../../ui/button';

const DAY_FORMAT = 'EEEE, MMMM d';

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) {
    return 'All day';
  }

  const start = format(new Date(event.startsAt), 'p');
  const end = format(new Date(event.endsAt), 'p');
  return `${start} – ${end}`;
}

type ScheduleRailProps = {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
};

export function ScheduleRail({ date, events, onSelectEvent, onCreateEvent }: ScheduleRailProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
  const hasEvents = sorted.length > 0;

  return (
    <aside
      className="flex min-w-0 flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--calendar-cell-border)] bg-[var(--bg-surface)] p-[var(--space-4)] shadow-[var(--calendar-rail-shadow)]"
      aria-label="Today’s schedule"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-secondary)]">
            Today’s schedule
          </p>
          <p className="text-[length:var(--text-lg)] font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">
            {format(date, DAY_FORMAT)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCreateEvent} className="text-[color:var(--primary)]">
          New event
        </Button>
      </div>

      <div className="space-y-[var(--space-3)]">
        {hasEvents ? (
          sorted.map((event) => {
            const colorToken = event.category ? EVENT_COLOR[event.category] : 'var(--primary)';
            return (
              <button
                type="button"
                key={event.id}
                onClick={() => onSelectEvent?.(event)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--calendar-cell-border)] p-[var(--space-3)] text-left transition-colors hover:bg-[var(--bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)] truncate">
                    {event.title}
                  </h3>
                  <span
                    className="ml-[var(--space-3)] inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colorToken }}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
                  {formatEventTime(event)}
                </p>
                {event.location && (
                  <p className="mt-1 text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="mt-2 line-clamp-2 text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                    {event.description}
                  </p>
                )}
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center gap-[var(--space-3)] rounded-[var(--radius-md)] border border-dashed border-[var(--calendar-cell-border)] p-[var(--space-6)] text-center">
            <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">No events today</p>
            <Button variant="outline" onClick={onCreateEvent}>
              New event
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
