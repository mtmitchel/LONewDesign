import { EventPill } from './EventPill';

type TimeSlot = {
  key: string;
  label: string;
};

type TimedEvent = {
  id: string;
  title: string;
  tone?: "low" | "medium" | "high" | "neutral";
  startMin: number;
  endMin: number;
};

type Props = {
  date: Date;
  dayLabel: string;
  times: TimeSlot[];       // 24 (or 12) items: { key, label }
  eventsAllDay: Array<{ id: string; title: string; tone?: "low" | "medium" | "high" | "neutral" }>;
  eventsTimed: TimedEvent[]; // with start/end minutes, tone
  nowPx?: number;       // optional current-minute → px offset
  onEventClick?: (id: string) => void;
};

function pxFromMin(min: number): number {
  return (min / 60) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cal-hour-row-h"));
}

// Day layout using same algorithm as Week but for single column
function layoutDay(events: TimedEvent[]) {
  // 1) Sort by start time
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  
  // 2) Cluster overlaps
  const clusters: TimedEvent[][] = [];
  for (const event of sorted) {
    let placed = false;
    for (const cluster of clusters) {
      // Check if this event overlaps with any event in the cluster
      const overlaps = cluster.some(clusterEvent => 
        (event.startMin < clusterEvent.endMin && event.endMin > clusterEvent.startMin)
      );
      if (overlaps) {
        cluster.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([event]);
    }
  }
  
  // 3) Greedy column assignment within each cluster
  const layouts: Array<{ event: TimedEvent; top: number; height: number; leftPct: number; widthPct: number }> = [];
  
  clusters.forEach(cluster => {
    const columns: TimedEvent[][] = [];
    
    cluster.forEach(event => {
      // Find the first column where this event fits
      let columnIndex = 0;
      while (columnIndex < columns.length) {
        const column = columns[columnIndex];
        const conflicts = column.some(colEvent => 
          event.startMin < colEvent.endMin && event.endMin > colEvent.startMin
        );
        if (!conflicts) break;
        columnIndex++;
      }
      
      // Create new column if needed
      if (columnIndex >= columns.length) {
        columns.push([]);
      }
      columns[columnIndex].push(event);
      
      // 4) Compute left/width with --event-overlap-gap
      const totalColumns = Math.max(columns.length, 1);
      const gapPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--event-overlap-gap")) || 8;
      const availableWidth = 100; // percentage
      const gapPercent = (gapPx / 300) * 100; // approximate conversion
      const columnWidth = (availableWidth - (totalColumns - 1) * gapPercent) / totalColumns;
      
      layouts.push({
        event,
        top: pxFromMin(event.startMin),
        height: pxFromMin(event.endMin - event.startMin),
        leftPct: columnIndex * (columnWidth + gapPercent),
        widthPct: columnWidth,
      });
    });
  });
  
  return layouts;
}

function useDayLayoutFor(event: TimedEvent, allEvents: TimedEvent[]): { top: number; height: number; leftPct: number; widthPct: number } {
  const layouts = layoutDay(allEvents);
  const layout = layouts.find(l => l.event.id === event.id);
  
  return layout ? {
    top: layout.top,
    height: layout.height,
    leftPct: layout.leftPct,
    widthPct: layout.widthPct,
  } : {
    top: pxFromMin(event.startMin),
    height: pxFromMin(event.endMin - event.startMin),
    leftPct: 0,
    widthPct: 100,
  };
}

function DayTimedEvent({ event, allEvents }: { event: TimedEvent; allEvents: TimedEvent[] }) {
  const s = useDayLayoutFor(event, allEvents);
  
  const toneBg = {
    low: "bg-[var(--chip-low-bg)] text-[var(--chip-low-fg)]",
    medium: "bg-[var(--chip-medium-bg)] text-[var(--chip-medium-fg)]",
    high: "bg-[var(--chip-high-bg)] text-[var(--chip-high-fg)]",
    neutral: "bg-[var(--chip-neutral-bg)] text-[var(--chip-neutral-text)]",
  }[event.tone || 'neutral'];
  
  return (
    <div
      className={[
        "absolute rounded-[var(--event-pill-r)]",
        "px-[var(--event-pill-px)] py-[var(--event-pill-py)]",
        "text-[var(--text-xs)] leading-tight hover:bg-[var(--cal-hover)]",
        "focus-visible:ring-1 ring-[var(--cal-ring)] outline-none cursor-pointer",
        toneBg,
      ].join(" ")}
      style={{ top: s.top, height: s.height, left: `${s.leftPct}%`, width: `${s.widthPct}%` }}
      role="button" 
      tabIndex={0} 
      title={event.title} 
      aria-label={`${event.title} ${event.startMin}-${event.endMin}`}
    >
      <div className="truncate">{event.title}</div>
    </div>
  );
}

export function DayView({
  date,
  dayLabel,
  times,       // 24 (or 12) items: { key, label }
  eventsAllDay = [],
  eventsTimed = [], // with start/end minutes, tone
  nowPx,       // optional current-minute → px offset
  onEventClick,
}: Props) {
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="rounded-[var(--cal-frame-radius)] border border-[var(--cal-frame-border)] bg-[var(--cal-bg)] overflow-hidden h-full flex flex-col">
      {/* header */}
      <div className="grid grid-cols-[var(--cal-rail-w)_1fr] h-[var(--cal-header-h)] flex-shrink-0 bg-[var(--cal-bg)] z-[1] border-b border-[var(--cal-gridline)]">
        <div />
        <div className="grid place-items-center text-[var(--text-sm)] font-medium text-[var(--text-primary)]
                       border-l border-[var(--cal-gridline)]">
          {dayLabel}
        </div>
      </div>

      {/* scrollable container */}
      <div className="flex-grow overflow-y-auto">
        {/* all-day */}
        <div className="grid grid-cols-[var(--cal-rail-w)_1fr] sticky top-0 bg-[var(--cal-bg)] z-[1]">
        <div className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right text-[var(--text-xs)] text-[var(--text-tertiary)] leading-[var(--cal-hour-row-h)]">
          all day
        </div>
        <div className="h-[var(--cal-hour-row-h)] border-t border-l border-r border-[var(--cal-gridline)]
                        bg-[var(--bg-surface-elevated)] flex items-center px-[var(--space-2)] gap-[var(--event-gap)]">
          {eventsAllDay.map(event => (
            <EventPill key={event.id} title={event.title} tone={event.tone} />
          ))}
        </div>
        </div>

        {/* timed grid */}
        <div className="grid grid-cols-[var(--cal-rail-w)_1fr]">
        {/* rail */}
        <div className="flex flex-col border-t border-[var(--cal-gridline)]">
          {times.map(t => (
            <div key={t.key} className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right text-[var(--text-xs)] text-[var(--text-tertiary)] border-b last:border-b-0 border-[var(--cal-gridline)] leading-[var(--cal-hour-row-h)]">
              {t.label}
            </div>
          ))}
        </div>

        {/* single day column */}
        <div className="relative border-t border-l border-r border-[var(--cal-gridline)]">
          {/* hour lines (no fills) */}
          <div className="pointer-events-none absolute inset-0">
            {times.map(t => (
              <div key={t.key} className="h-[var(--cal-hour-row-h)] border-b last:border-b-0 border-[var(--cal-gridline)]" />
            ))}
          </div>

          {/* events layer */}
          <div className="relative">
            {eventsTimed.map(e => (
              <DayTimedEvent key={e.id} event={e} allEvents={eventsTimed} />
            ))}
          </div>

          {/* now line */}
          {isToday && typeof nowPx === "number" && (
            <>
              <div className="absolute left-0 right-0 h-px bg-[var(--cal-now-line)]" style={{ top: nowPx }} />
              <div className="absolute -ml-1 h-2 w-2 rounded-full bg-[var(--cal-now-dot)]" style={{ top: nowPx - 3, left: 0 }} />
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}