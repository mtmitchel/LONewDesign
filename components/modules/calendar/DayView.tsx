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
  
  return (
    <div
      className="absolute rounded-[var(--event-pill-r)]
                 bg-[var(--chip-neutral-bg)] text-[var(--chip-neutral-text)]
                 px-[var(--event-pill-px)] py-[var(--event-pill-py)]
                 text-[var(--text-xs)] leading-tight
                 hover:bg-[var(--primary-tint-5)] focus-visible:ring-1 ring-[var(--cal-ring)] outline-none"
      style={{ top: s.top, height: s.height, left: `${s.leftPct ?? 0}%`, width: `${s.widthPct ?? 100}%` }}
      title={event.title || event.label}
      role="button"
      tabIndex={0}
    >
      <div className="truncate">{event.title || event.label}</div>
    </div>
  );
}

export function DayView({
  day, // { fullLabel, isToday }
  times,
  eventsAllDay = [],
  eventsTimed = [],
  nowPx,
  onEventClick,
}: Props) {
  return (
    <div className="rounded-[var(--cal-frame-radius)] border border-[var(--cal-frame-border)]
                    bg-[var(--cal-bg)] overflow-hidden">
      {/* header */}
      <div className="h-[var(--cal-header-h)] grid place-items-center text-[var(--text-lg)] font-semibold">
        {day?.fullLabel || day?.dayLabel || ""}
      </div>

      {/* all-day row */}
      <div className="grid grid-cols-[var(--cal-rail-w)_1fr]">
        <div className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right text-[var(--text-xs)] text-[var(--text-tertiary)] leading-[var(--cal-hour-row-h)]">all day</div>
        <div className="h-[var(--cal-hour-row-h)] bg-[var(--bg-surface-elevated)]
                        border-y border-l border-[var(--cal-gridline)]" />
      </div>

      {/* timed grid */}
      <div className="grid grid-cols-[var(--cal-rail-w)_1fr]">
        <div className="flex flex-col border-t border-[var(--cal-gridline)]">
          {times.map(t => (
            <div key={t.key}
                 className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right text-[var(--text-xs)] text-[var(--text-tertiary)]">
              {t.label}
            </div>
          ))}
        </div>

        <div className="relative border-t border-l border-[var(--cal-gridline)]">
          {/* hour lines */}
          <div className="pointer-events-none absolute inset-0">
            {times.map(t => (
              <div key={t.key} className="h-[var(--cal-hour-row-h)] border-b last:border-b-0 border-[var(--cal-gridline)]" />
            ))}
          </div>

          {/* events */}
          <div className="relative">
            {eventsTimed.map(e => <DayTimedEvent key={e.id} event={e} allEvents={eventsTimed} />)}
          </div>

          {/* now line */}
          {(day?.isToday || new Date().toDateString() === day?.date?.toDateString()) && typeof nowPx === "number" && (
            <>
              <div className="absolute left-0 right-0 h-px bg-[var(--cal-now-line)]" style={{ top: nowPx }} />
              <div className="absolute -ml-1 h-2 w-2 rounded-full bg-[var(--cal-now-dot)]" style={{ top: nowPx - 3, left: 0 }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}