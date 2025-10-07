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
  days, // 42 items: { key,date,dayNumber,isToday,isSelected,isOutside, events:[{id,label,tone?}] }
  weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  onSelectDay,
  onEventClick,
}: Props) {
  return (
    <div className="rounded-[var(--cal-frame-radius)] border border-[var(--cal-frame-border)]
                    overflow-hidden bg-[var(--cal-bg)] h-full flex flex-col">
      {/* header */}
      <div className="grid grid-cols-7 h-[var(--cal-header-h)] flex-shrink-0">
        {weekdays.map(w => (
          <div key={w}
               className="grid place-items-center text-[var(--text-xs)] font-medium
                          text-[var(--text-tertiary)] border-r last:border-r-0 border-[var(--cal-gridline)]">
            {w}
          </div>
        ))}
      </div>

      {/* grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {days.map((d, i) => {
          const firstRow = i < 7;
          const lastCol  = (i % 7) === 6;
          return (
            <button
              key={d.key}
              type="button"
              aria-pressed={d.isSelected || undefined}
              aria-label={`${d.date.toDateString()}, ${d.events.length} events`}
              className={[
                "relative min-h-0 text-left align-top",
                "border-[var(--cal-gridline)] border-b border-r",
                firstRow && "border-t",
                lastCol  && "border-r-0",
                "hover:bg-[var(--cal-hover)] focus-visible:ring-1 ring-[var(--cal-ring)] focus:outline-none",
                d.isOutside ? "opacity-[var(--cal-outside-ink)] cursor-default" : "cursor-pointer",
              ].join(" ")}
              onClick={() => !d.isOutside && onSelectDay?.(d.date)}
              disabled={d.isOutside}
            >
              <span className="absolute top-[var(--space-2)] left-[var(--space-2)]
                               text-[var(--text-xs)] font-medium text-[var(--cal-daynum-ink)]">
                {d.dayNumber}
              </span>

              {/* events: top stack - positioned below day number */}
              <div className="absolute top-[calc(var(--space-2)+1.5rem)] left-[var(--space-2)] right-[var(--space-2)] flex flex-col gap-[var(--event-gap)]">
                {d.events.map(ev => (
                  <EventPill
                    key={ev.id}
                    label={`${ev.time ? ev.time + ' ' : ''}${ev.title}`}
                    tone={ev.tone ?? "low"}
                    density="dense"
                    multiline="one"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('calendar.event.open', ev.id, 'month');
                    }}
                  />
                ))}
              </div>

              {d.isToday    && <span className="pointer-events-none absolute inset-0 ring-1 ring-[var(--cal-ring-today)]" />}
              {d.isSelected && <span className="pointer-events-none absolute inset-0 ring-1 ring-[var(--cal-ring)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}