import { EventPill } from './EventPill';
import { EventPreviewPopover } from './EventPreviewPopover';

type WeekDay = {
  key: string;
  label: string;
  isToday: boolean;
};

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
  dayKey: string;
  calendarName: string;
  allDay?: boolean;
  timeRangeText?: string;
};

type Props = {
  weekDays: WeekDay[];    // 7 days: { key, label, isToday }
  times: TimeSlot[];       // 24 (or 12) items: { key, label }
  eventsAllDay: Record<string, Array<{ id: string; title: string; tone?: "low" | "medium" | "high" | "neutral" }>>;// by dayKey
  eventsTimed: TimedEvent[]; // with start/end minutes, dayKey, tone
  nowPx?: number;       // optional current-minute → px offset
  onEventClick?: (id: string) => void;
  onEditEvent?: (id: string) => void;
  onDeleteEvent?: (id: string) => Promise<void> | void;
};

function pxFromMin(min: number): number {
  return (min / 60) * parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cal-hour-row-h"));
}

// Proper layout function for timed events following the spec
function layoutWeek(events: TimedEvent[]) {
  const layoutsByDay: Record<string, Array<{ event: TimedEvent; top: number; height: number; leftPct: number; widthPct: number }>> = {};
  
  // Group events by day
  const eventsByDay = events.reduce((acc, event) => {
    if (!acc[event.dayKey]) acc[event.dayKey] = [];
    acc[event.dayKey].push(event);
    return acc;
  }, {} as Record<string, TimedEvent[]>);
  
  // Process each day
  Object.entries(eventsByDay).forEach(([dayKey, dayEvents]) => {
    // 1) Sort by start time
    const sorted = [...dayEvents].sort((a, b) => a.startMin - b.startMin);
    
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
        const gapPercent = (gapPx / 300) * 100; // approximate conversion, could be more precise
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
    
    layoutsByDay[dayKey] = layouts;
  });
  
  return layoutsByDay;
}

function useWeekLayoutFor(event: TimedEvent, allEvents: TimedEvent[]): { top: number; height: number; leftPct: number; widthPct: number } {
  const layouts = layoutWeek(allEvents);
  const dayLayouts = layouts[event.dayKey] || [];
  const layout = dayLayouts.find(l => l.event.id === event.id);
  
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

function WeekTimedEvent({
  event,
  allEvents,
  onEditEvent,
  onDeleteEvent,
  onEventClick,
}: {
  event: TimedEvent;
  allEvents: TimedEvent[];
  onEditEvent?: (id: string) => void;
  onDeleteEvent?: (id: string) => Promise<void> | void;
  onEventClick?: (id: string) => void;
}) {
  const s = useWeekLayoutFor(event, allEvents);
  const shouldUseMultiline = s.height >= 48; // Allow 2 lines if height permits
  const hours = Math.floor(event.startMin / 60);
  const minutes = event.startMin % 60;
  const eventTime = `${hours}:${String(minutes).padStart(2, '0')}`;
  
  return (
    <div
      className="absolute"
      style={{ top: s.top, height: s.height, left: `${s.leftPct ?? 0}%`, width: `${s.widthPct ?? 100}%` }}>
      <EventPreviewPopover
        event={{
          id: event.id,
          title: event.title,
          calendarName: event.calendarName,
          allDay: event.allDay,
          timeRangeText: event.timeRangeText,
        }}
        onEdit={() => onEditEvent?.(event.id)}
        onConfirmDelete={() => onDeleteEvent?.(event.id)}
      >
        <EventPill
          label={`${eventTime} ${event.title}`}
          tone={event.tone ?? "low"}
          multiline={shouldUseMultiline ? "two" : "one"}
          density={s.height < 32 ? "dense" : "default"}
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onEventClick?.(event.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
            }
          }}
        />
      </EventPreviewPopover>
    </div>
  );
}

export function WeekView({
  weekDays,    // 7: { key,label,isToday }
  times,       // e.g., 0..23 -> { key,label }
  eventsAllDay = {},// [{id,dayKey,label,tone?}]
  eventsTimed = [], // [{id,dayKey,startMin,endMin,label,tone?}]
  nowPx,       // optional: minute->px mapping result
  onEventClick,
  onEditEvent,
  onDeleteEvent,
}: Props) {
  return (
    <div className="rounded-[var(--cal-frame-radius)] border border-[var(--cal-frame-border)]
                    bg-[var(--cal-bg)] overflow-hidden h-full flex flex-col">
      {/* header */}
      <div className="grid grid-cols-[var(--cal-rail-w)_repeat(7,1fr)] h-[var(--cal-header-h)]
                      bg-[var(--cal-bg)] flex-shrink-0">
        <div />
        {weekDays.map(d => (
          <div key={d.key}
               className="grid place-items-center border-l first:border-l-0 border-[var(--cal-gridline)]
                          text-[var(--text-sm)] font-medium text-[var(--text-primary)]">
            {d.label}
          </div>
        ))}
      </div>

      {/* scrollable container */}
      <div className="flex-1 overflow-y-auto">
        {/* all-day */}
        <div className="grid grid-cols-[var(--cal-rail-w)_repeat(7,1fr)] sticky top-0 bg-[var(--cal-bg)] z-10">
          <div className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right
                          text-[var(--text-xs)] text-[var(--text-tertiary)] leading-[var(--cal-hour-row-h)]">
            all day
          </div>
          {weekDays.map(d => (
            <div key={d.key}
                 className="h-[var(--cal-hour-row-h)] bg-[var(--bg-surface-elevated)]
                            border-y border-l last:border-r border-[var(--cal-gridline)]" />
          ))}
        </div>

        {/* timed grid */}
        <div className="grid grid-cols-[var(--cal-rail-w)_repeat(7,1fr)]">
        {/* rail: NO bottom borders */}
        <div className="flex flex-col border-t border-[var(--cal-gridline)]">
          {times.map(t => (
            <div key={t.key}
                 className="h-[var(--cal-hour-row-h)] pr-[var(--space-2)] text-right
                            text-[var(--text-xs)] text-[var(--text-tertiary)]">
              {t.label}
            </div>
          ))}
        </div>

        {/* day columns */}
        {weekDays.map(day => (
          <div key={day.key}
               className="relative border-t border-l last:border-r border-[var(--cal-gridline)] overflow-hidden">
            {/* hour lines (no fills) */}
            <div className="pointer-events-none absolute inset-0">
              {times.map(t => (
                <div key={t.key}
                     className="h-[var(--cal-hour-row-h)] border-b last:border-b-0 border-[var(--cal-gridline)]" />
              ))}
            </div>

            {/* events layer */}
            <div className="relative">
              {eventsTimed.filter(e => e.dayKey === day.key).map(e => (
                <WeekTimedEvent
                  key={e.id}
                  event={e}
                  allEvents={eventsTimed}
                  onEditEvent={onEditEvent}
                  onDeleteEvent={onDeleteEvent}
                  onEventClick={onEventClick}
                />
              ))}
            </div>

            {/* now line */}
            {day.isToday && typeof nowPx === "number" && (
              <>
                <div className="absolute left-0 right-0 h-px bg-[var(--cal-now-line)]" style={{ top: nowPx }} />
                <div className="absolute -ml-1 h-2 w-2 rounded-full bg-[var(--cal-now-dot)]" style={{ top: nowPx - 3, left: 0 }} />
              </>
            )}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}