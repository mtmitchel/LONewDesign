import { EventPill } from './EventPill';

type MonthCell = {
  key: string;
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  isOutside: boolean;
  events: Array<{
    id: string;
    title: string;
    time?: string;
    tone?: "low" | "medium" | "high" | "neutral";
  }>;
};

type Props = {
  days: MonthCell[];   // 42 cells; each: { key, date, dayNumber, isToday, isSelected, isOutside, events:[{id,title,time,tone}] }
  weekdays?: string[];
  onSelectDay?: (date: Date) => void;
  onEventClick?: (id: string) => void;
};

export function MonthView({
  days,   // 42 cells; each: { key, date, dayNumber, isToday, isSelected, isOutside, events:[{id,title,time,tone}] }
  weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  onSelectDay,
  onEventClick,
}: Props) {
  return (
    <div className="rounded-[var(--cal-frame-radius)] border border-[var(--cal-frame-border)] bg-[var(--cal-bg)] overflow-hidden min-h-[var(--calendar-min-h)]">
      {/* header */}
      <div className="grid grid-cols-7 h-[var(--cal-header-h)]">
        {weekdays.map(w => (
          <div key={w} className="grid place-items-center text-[var(--text-tertiary)] text-[var(--text-xs)] font-medium border-r last:border-r-0 border-[var(--cal-gridline)]">
            {w}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const isFirstRow = i < 7;
          const isLastCol = (i % 7) === 6;
          return (
            <button
              key={d.key}
              type="button"
              aria-pressed={d.isSelected || undefined}
              aria-label={`${d.date.toDateString()}, ${d.events.length} events`}
              className={[
                "relative h-[var(--cal-cell-min-h)] text-left align-top",
                "border-[var(--cal-gridline)] border-b border-r",
                isFirstRow && "border-t",
                isLastCol  && "border-r-0",
                "focus-visible:ring-1 ring-[var(--cal-ring)] focus:outline-none transition-colors",
                "hover:bg-[var(--cal-hover)]",
                d.isOutside ? "opacity-[var(--cal-outside-ink)] cursor-default" : "cursor-pointer",
              ].join(" ")}
              onClick={() => !d.isOutside && onSelectDay?.(d.date)}
              disabled={d.isOutside}
            >
              {/* day number */}
              <span className="absolute top-[var(--space-2)] left-[var(--space-2)] text-[var(--text-xs)] font-medium text-[var(--text-tertiary)]">{d.dayNumber}</span>

              {/* events */}
              <div className="absolute left-[var(--space-2)] right-[var(--space-2)] bottom-[var(--space-2)] flex flex-col gap-[var(--event-gap)]">
                {d.events.map(ev => (
                  <EventPill key={ev.id} title={ev.title} meta={ev.time} tone={ev.tone} />
                ))}
              </div>

              {/* rings */}
              {d.isToday && <span className="pointer-events-none absolute inset-0 ring-1 ring-[var(--cal-ring)]/35 rounded-none" />}
              {d.isSelected && <span className="pointer-events-none absolute inset-0 ring-1 ring-[var(--cal-ring)] rounded-none" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}