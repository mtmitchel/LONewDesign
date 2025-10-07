import { EventPill } from './EventPill';
import { EventPreviewPopover } from './EventPreviewPopover';

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
    calendarName: string;
    allDay?: boolean;
    timeRangeText?: string;
  }>;
};

type Props = {
  days: MonthCell[];   // 42 cells; each: { key, date, dayNumber, isToday, isSelected, isOutside, events:[{id,title,time,tone}] }
  weekdays?: string[];
  onSelectDay?: (date: Date) => void;
  onEventClick?: (id: string) => void;
  onEditEvent?: (id: string) => void;
  onDeleteEvent?: (id: string) => Promise<void> | void;
};

export function MonthView({
  days, // 42 items: { key,date,dayNumber,isToday,isSelected,isOutside, events:[{id,label,tone?}] }
  weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  onSelectDay,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
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
                "px-[var(--calendar-month-cell-pad-x)] py-[var(--calendar-month-cell-pad-y)]",
                "hover:bg-[var(--cal-hover)] focus-visible:ring-1 ring-[var(--cal-ring)] focus:outline-none",
                d.isOutside ? "opacity-[var(--cal-outside-ink)] cursor-default" : "cursor-pointer",
              ].join(" ")}
              onClick={() => !d.isOutside && onSelectDay?.(d.date)}
              disabled={d.isOutside}
            >
              <span className="absolute top-[var(--calendar-month-cell-pad-y)] left-[var(--calendar-month-cell-pad-x)]
                               text-[length:var(--text-xs)] font-medium text-[color:var(--cal-daynum-ink)]">
                {d.dayNumber}
              </span>

              {/* events: top stack - positioned below day number */}
              <div className="absolute left-[var(--calendar-month-cell-pad-x)] right-[var(--calendar-month-cell-pad-x)] top-[calc(var(--calendar-month-cell-pad-y)+1.5rem)] flex flex-col gap-[var(--event-gap)]">
                {d.events.map(ev => (
                  <EventPreviewPopover
                    key={ev.id}
                    event={{
                      id: ev.id,
                      title: ev.title,
                      calendarName: ev.calendarName,
                      allDay: ev.allDay,
                      timeRangeText: ev.timeRangeText,
                    }}
                    onEdit={() => onEditEvent?.(ev.id)}
                    onConfirmDelete={() => onDeleteEvent?.(ev.id)}
                  >
                    <EventPill
                      label={`${ev.time ? ev.time + ' ' : ''}${ev.title}`}
                      tone={ev.tone ?? "low"}
                      density="dense"
                      multiline="one"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(ev.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}
                    />
                  </EventPreviewPopover>
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