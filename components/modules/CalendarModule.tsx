import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { CalendarTasksRail } from './calendar/CalendarTasksRail';
import { EventModalModern } from './calendar/EventModalModern';
import { CalendarPopover } from './calendar/CalendarPopover';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SegmentedToggle } from '../controls/SegmentedToggle';
import { QUICK_ASSISTANT_EVENTS, openQuickAssistant } from '../assistant';

// Unified calendar engine and views
import { useCalendarEngine, formatRangeLabel, navigate } from './calendar/useCalendarEngine';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';
import type { CalendarEvent as UnifiedEvent, CalendarView, EventCategory } from './calendar/types';
import { addMinutes, format } from 'date-fns';
import { toast } from 'sonner';

// Demo legacy events mapped to unified events per current date
const DEMO_EVENTS = [
  { id: '1', title: 'Team Standup', time: '9:00 AM', duration: '30 min', category: 'work' as const },
  { id: '2', title: 'Project Review', time: '2:00 PM', duration: '1 hour', category: 'meeting' as const },
  { id: '3', title: 'Design Workshop', time: '10:00 AM', duration: '2 hours', category: 'personal' as const },
  { id: '4', title: 'Client Call', time: '4:00 PM', duration: '45 min', category: 'travel' as const },
];

function parseTimeToDate(base: Date, timeStr: string): Date {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date(base);
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function parseDurationToMinutes(durationStr: string): number {
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  const hourMatch = durationStr.match(/(\d+)\s*hour/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  return 30;
}

const CATEGORY_LABEL: Record<EventCategory, string> = {
  work: 'Work',
  meeting: 'Meetings',
  personal: 'Personal',
  travel: 'Travel',
};

function getCalendarName(event: UnifiedEvent): string {
  if (event.category && CATEGORY_LABEL[event.category]) {
    return CATEGORY_LABEL[event.category];
  }
  return 'Calendar';
}

// Map event categories to calendar colors  
function getCategoryTone(category?: string): "low" | "medium" | "high" | "neutral" {
  switch (category) {
    case 'work': return 'low';      // blue (primary)
    case 'meeting': return 'medium'; // yellow (warning)
    case 'travel': return 'high';    // coral (accent)
    case 'personal': return 'neutral'; // green (success) - no longer grey
    default: return 'low';           // default to blue
  }
}

function formatEventRange(event: UnifiedEvent): string | undefined {
  if (event.allDay) return undefined;
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const startTime = format(start, 'h:mm');
  const endTime = format(end, 'h:mm');
  const startPeriod = format(start, 'a');
  const endPeriod = format(end, 'a');
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay && startPeriod === endPeriod) {
    return `${startTime}–${endTime} ${endPeriod}`;
  }

  const startSegment = `${startTime} ${startPeriod}`;
  const endSegment = `${endTime} ${endPeriod}`;

  if (sameDay) {
    return `${startSegment}–${endSegment}`;
  }

  const startDate = format(start, 'MMM d');
  const endDate = format(end, 'MMM d');
  return `${startSegment} ${startDate} – ${endSegment} ${endDate}`;
}

export function CalendarModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{ mode: 'edit' | 'create'; isOpen: boolean }>({ mode: 'create', isOpen: false });
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);
  
  // State for managing events
  const [events, setEvents] = useState<UnifiedEvent[]>(() => {
    // Map demo events to the current month spread across a few days
    const baseDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
    return DEMO_EVENTS.map((e, idx) => {
      const day = new Date(baseDay);
      day.setDate(baseDay.getDate() + idx * 2);
      const start = parseTimeToDate(day, e.time);
      const minutes = parseDurationToMinutes(e.duration);
      const end = addMinutes(start, minutes);
      return {
        id: e.id,
        title: e.title,
        calendarId: 'demo',
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        allDay: false,
        category: e.category,
      };
    });
  });

  const engine = useCalendarEngine(events, viewMode, currentDate);

  const eventLookup = useMemo(() => {
    const map = new Map<string, UnifiedEvent>();
    events.forEach(evt => map.set(evt.id, evt));
    return map;
  }, [events]);

  const handleOpenEditModal = (eventId: string) => {
    const evt = eventLookup.get(eventId);
    if (!evt) return;
    setSelectedEvent(evt);
    setModalState({ mode: 'edit', isOpen: true });
  };
  
  const handleEditEvent = (eventData: any) => {
    if (!selectedEvent) return;
    
    // Update the event in the events array
    setEvents(prev => prev.map(evt => {
      if (evt.id === selectedEvent.id) {
        // Parse the date string from the modal
        const eventDate = eventData.startDate ? new Date(eventData.startDate) : new Date(evt.startsAt);
        
        // Combine date and time
        if (eventData.startTime) {
          const [hours, minutes] = eventData.startTime.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        }
        
        // Calculate end time
        const endDate = new Date(eventDate);
        if (eventData.endTime) {
          const [hours, minutes] = eventData.endTime.split(':').map(Number);
          endDate.setHours(hours, minutes, 0, 0);
        } else {
          endDate.setHours(endDate.getHours() + 1);
        }
        
        return {
          ...evt,
          title: eventData.title || evt.title,
          startsAt: eventDate.toISOString(),
          endsAt: endDate.toISOString(),
          allDay: eventData.allDay || false,
        };
      }
      return evt;
    }));
    
    setModalState({ ...modalState, isOpen: false });
    setSelectedEvent(null);
    toast.success('Event updated');
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    
    setEvents(prev => prev.filter(evt => evt.id !== selectedEvent.id));
    setModalState({ ...modalState, isOpen: false });
    setSelectedEvent(null);
    toast.success('Event deleted');
  };
  
  // Function to add a new event from modal
  const handleAddEvent = (eventData: any) => {
    // Parse the date string from the modal
    const eventDate = eventData.startDate ? new Date(eventData.startDate) : currentDate;
    
    // Combine date and time
    if (eventData.startTime) {
      const [hours, minutes] = eventData.startTime.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);
    }
    
    // Calculate end time (default 1 hour later)
    const endDate = new Date(eventDate);
    if (eventData.endTime) {
      const [hours, minutes] = eventData.endTime.split(':').map(Number);
      endDate.setHours(hours, minutes, 0, 0);
    } else {
      endDate.setHours(endDate.getHours() + 1);
    }
    
    const newEvent: UnifiedEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || 'New Event',
      calendarId: 'demo',
      startsAt: eventDate.toISOString(),
      endsAt: endDate.toISOString(),
      allDay: eventData.allDay || false,
      category: 'work',
    };
    
    setEvents(prev => [...prev, newEvent]);
    setModalState({ ...modalState, isOpen: false });
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleQuickEvent = (
      event: Event | CustomEvent<{
        id: string;
        title: string;
        startsAt: string;
        endsAt: string;
        scope?: { projectId?: string | null } | null;
        location?: string;
        description?: string;
        capture?: { originalContent: string; metadata?: Record<string, unknown> };
      }>
    ) => {
      const detail = (event as CustomEvent<{
        id: string;
        title: string;
        startsAt: string;
        endsAt: string;
        scope?: { projectId?: string | null } | null;
        location?: string;
        description?: string;
        capture?: { originalContent: string; metadata?: Record<string, unknown> };
      }>).detail;
      if (!detail) return;

      setEvents(prev => {
        const next: UnifiedEvent = {
          id: detail.id,
          title: detail.title,
          calendarId: detail.scope?.projectId ?? 'quick-assistant',
          startsAt: detail.startsAt,
          endsAt: detail.endsAt,
          location: detail.location,
          description: detail.description,
        };

        const existingIndex = prev.findIndex(evt => evt.id === next.id);
        if (existingIndex !== -1) {
          const clone = [...prev];
          clone[existingIndex] = next;
          return clone;
        }

        return [next, ...prev];
      });

      const nextDate = new Date(detail.startsAt);
      setCurrentDate(nextDate);
    };

    window.addEventListener(
      QUICK_ASSISTANT_EVENTS.createEvent,
      handleQuickEvent as EventListener
    );
    return () => {
      window.removeEventListener(
        QUICK_ASSISTANT_EVENTS.createEvent,
        handleQuickEvent as EventListener
      );
    };
  }, [setCurrentDate, setEvents]);

  const goToToday = () => setCurrentDate(new Date());
  const navigateView = (dir: 'prev' | 'next') => setCurrentDate((d) => navigate(d, viewMode, dir));
  
  const handleOpenCreateModal = React.useCallback(() => {
    setSelectedEvent(null);
    setModalState({ mode: 'create', isOpen: true });
  }, []);
  
  const handleOpenAssistant = React.useCallback(() => {
    openQuickAssistant({ mode: 'event', scope: { source: 'calendar' } });
  }, []);

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-surface)]">
      {/* Header */}
      <header className="relative h-12 flex items-center px-[var(--space-4)] border-b border-[var(--border-divider)] bg-[var(--bg-surface)]">
        {/* Left controls */}
        <div className="flex items-center gap-[var(--space-3)]">
          <Button variant="ghost" size="sm" className="h-8 px-[var(--space-3)]" onClick={goToToday}>Today</Button>
          <div className="flex items-center gap-[var(--space-1)]">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateView('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateView('next')}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)] ml-[var(--space-2)]">
            {formatRangeLabel(viewMode, currentDate)}
          </h2>
        </div>
        {/* Center search */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
            />
          </div>
        </div>
        {/* Right controls */}
        <div className="ml-auto flex items-center gap-[var(--space-3)]">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Jump to date">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarPopover selectedDate={currentDate} onDateSelect={(date) => setCurrentDate(date)} />
            </PopoverContent>
          </Popover>
          <SegmentedToggle
            id="calendar-view-toggle"
            ariaLabel="Select calendar view"
            surface="calendar"
            value={viewMode}
            onChange={(next) => setViewMode(next as CalendarView)}
            options={[
              { value: 'month', label: 'Month', ariaKeyShortcuts: 'Alt+M' },
              { value: 'week', label: 'Week', ariaKeyShortcuts: 'Alt+W' },
              { value: 'day', label: 'Day', ariaKeyShortcuts: 'Alt+D' },
            ]}
            dense
          />
          <Button
            className="h-8 px-[var(--space-3)] bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] ml-[var(--space-3)]"
            onClick={handleOpenCreateModal}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add event
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col">
              <MonthView
              days={(() => {
                // Ensure exactly 42 cells (6 rows × 7 columns) as per spec
                const cells = engine.monthCells.slice(0, 42);
                
                // If we have fewer than 42 cells, pad with empty cells to ensure 6 full rows
                while (cells.length < 42) {
                  const lastDate = cells[cells.length - 1]?.date || new Date(currentDate);
                  const nextDate = new Date(lastDate);
                  nextDate.setDate(lastDate.getDate() + 1);
                  
                  cells.push({
                    date: nextDate,
                    isToday: nextDate.toDateString() === new Date().toDateString(),
                    isCurrentMonth: nextDate.getMonth() === currentDate.getMonth(),
                  });
                }
                
                return cells.map((cell, i) => ({
                  key: `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`,
                  date: cell.date,
                  dayNumber: cell.date.getDate(),
                  isToday: cell.isToday,
                  isSelected: false,
                  isOutside: !cell.isCurrentMonth,
                  events: engine.getEventsForDate(cell.date).map(evt => ({
                    id: evt.id,
                    title: evt.title,
                    time: evt.allDay ? undefined : format(new Date(evt.startsAt), 'h:mm a'),
                    tone: getCategoryTone(evt.category),
                    calendarName: getCalendarName(evt),
                    allDay: evt.allDay,
                    timeRangeText: formatEventRange(evt),
                  }))
                }));
              })()}
              onSelectDay={(date) => setCurrentDate(date)}
              onEventClick={(id) => {
                const evt = events.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
              onEditEvent={handleOpenEditModal}
              onDeleteEvent={handleDeleteEvent}
              />
            </div>
          )}
          {viewMode === 'week' && (
            <WeekView
              weekDays={Array.from({ length: 7 }, (_, i) => {
                const date = new Date(engine.weekRange.start);
                date.setDate(date.getDate() + i);
                return {
                  key: i.toString(),
                  label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                  isToday: date.toDateString() === new Date().toDateString(),
                };
              })}
              times={Array.from({ length: 24 }, (_, i) => ({
                key: i.toString(),
                label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
              }))}
              eventsAllDay={{}}
              eventsTimed={engine.weekEvents.map(evt => ({
                id: evt.id,
                title: evt.title,
                tone: getCategoryTone(evt.category),
                startMin: new Date(evt.startsAt).getHours() * 60 + new Date(evt.startsAt).getMinutes(),
                endMin: new Date(evt.endsAt).getHours() * 60 + new Date(evt.endsAt).getMinutes(),
                dayKey: new Date(evt.startsAt).getDay().toString(),
                calendarName: getCalendarName(evt),
                allDay: evt.allDay,
                timeRangeText: formatEventRange(evt),
              }))}
              nowPx={(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 56}
              onEventClick={(id) => {
                const evt = events.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
              onEditEvent={handleOpenEditModal}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              day={{
                fullLabel: currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
                isToday: currentDate.toDateString() === new Date().toDateString(),
                date: currentDate
              }}
              times={Array.from({ length: 24 }, (_, i) => ({
                key: i.toString(),
                label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
              }))}
              eventsAllDay={events.filter(e => e.allDay).map(evt => ({
                id: evt.id,
                title: evt.title,
                tone: getCategoryTone(evt.category)
              }))}
              eventsTimed={events.filter(e => !e.allDay && new Date(e.startsAt).toDateString() === currentDate.toDateString()).map(evt => ({
                id: evt.id,
                title: evt.title,
                tone: getCategoryTone(evt.category),
                startMin: new Date(evt.startsAt).getHours() * 60 + new Date(evt.startsAt).getMinutes(),
                endMin: new Date(evt.endsAt).getHours() * 60 + new Date(evt.endsAt).getMinutes(),
                calendarName: getCalendarName(evt),
                allDay: evt.allDay,
                timeRangeText: formatEventRange(evt),
              }))}
              nowPx={(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 56}
              onEventClick={(id) => {
                const evt = events.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
              onEditEvent={handleOpenEditModal}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </div>

        <aside className="flex w-full flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:w-[var(--calendar-rail-w)] lg:flex-none lg:border-t-0 lg:border-l">
          <CalendarTasksRail className="w-full" />
        </aside>
      </div>

      <EventModalModern
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={() => {
          setModalState({ ...modalState, isOpen: false });
          setSelectedEvent(null);
        }}
        event={modalState.mode === 'edit' ? selectedEvent as any : {
          title: '',
          calendar: 'Personal',
          startDate: format(currentDate, 'yyyy-MM-dd'),
          startTime: '09:00',
          endDate: format(currentDate, 'yyyy-MM-dd'),
          endTime: '10:00',
          allDay: false,
          repeat: 'Does not repeat',
          location: '',
          description: ''
        }}
        onSave={modalState.mode === 'edit' ? handleEditEvent : handleAddEvent}
        onDelete={modalState.mode === 'edit' ? handleDeleteEvent : undefined}
      />
    </div>
  );
}
