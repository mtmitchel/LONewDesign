import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { CalendarTasksRail } from './calendar/CalendarTasksRail';
import { EditEventModal } from './calendar/EditEventModal';
import { CalendarPopover } from './calendar/CalendarPopover';
import { NewEventModal } from './calendar/NewEventModal';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '../ui/utils';

// Unified calendar engine and views
import { useCalendarEngine, formatRangeLabel, navigate } from './calendar/useCalendarEngine';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';
import type { CalendarEvent as UnifiedEvent, CalendarView } from './calendar/types';
import { addMinutes } from 'date-fns';

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

export function CalendarModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedEvent | null>(null);

  // Map demo events to the current month spread across a few days
  const baseDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
  const unifiedEvents: UnifiedEvent[] = DEMO_EVENTS.map((e, idx) => {
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

  const engine = useCalendarEngine(unifiedEvents, viewMode, currentDate);

  const goToToday = () => setCurrentDate(new Date());
  const navigateView = (dir: 'prev' | 'next') => setCurrentDate((d) => navigate(d, viewMode, dir));

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)]">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
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
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as CalendarView)}
            className="inline-flex rounded-[var(--radius-pill)] border border-[var(--border-subtle)] p-[2px] bg-[var(--bg-surface)]"
          >
            <ToggleGroupItem value="month" className="px-[var(--space-3)] h-[32px] rounded-[var(--radius-pill)] text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary-tint-10)] data-[state=on]:text-[var(--primary)]">Month</ToggleGroupItem>
            <ToggleGroupItem value="week" className="px-[var(--space-3)] h-[32px] rounded-[var(--radius-pill)] text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary-tint-10)] data-[state=on]:text-[var(--primary)]">Week</ToggleGroupItem>
            <ToggleGroupItem value="day" className="px-[var(--space-3)] h-[32px] rounded-[var(--radius-pill)] text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary-tint-10)] data-[state=on]:text-[var(--primary)]">Day</ToggleGroupItem>
          </ToggleGroup>
          <Button className="h-8 px-[var(--space-3)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] ml-[var(--space-3)]" onClick={() => setIsNewEventModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New event
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden p-[var(--space-3)]">
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
                    time: evt.allDay ? undefined : new Date(evt.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                    tone: 'neutral' as const,
                  }))
                }));
              })()}
              onSelectDay={(date) => setCurrentDate(date)}
              onEventClick={(id) => {
                const evt = unifiedEvents.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
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
              eventsAllDay={[]}
              eventsTimed={engine.weekEvents.map(evt => ({
                id: evt.id,
                title: evt.title,
                label: evt.title,
                tone: 'neutral' as const,
                startMin: new Date(evt.startsAt).getHours() * 60 + new Date(evt.startsAt).getMinutes(),
                endMin: new Date(evt.endsAt).getHours() * 60 + new Date(evt.endsAt).getMinutes(),
                dayKey: new Date(evt.startsAt).getDay().toString(),
              }))}
              nowPx={(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 56}
              onEventClick={(id) => {
                const evt = unifiedEvents.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
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
              eventsAllDay={unifiedEvents.filter(e => e.allDay).map(evt => ({
                id: evt.id,
                title: evt.title,
                label: evt.title,
                tone: 'neutral' as const
              }))}
              eventsTimed={unifiedEvents.filter(e => !e.allDay && new Date(e.startsAt).toDateString() === currentDate.toDateString()).map(evt => ({
                id: evt.id,
                title: evt.title,
                label: evt.title,
                tone: 'neutral' as const,
                startMin: new Date(evt.startsAt).getHours() * 60 + new Date(evt.startsAt).getMinutes(),
                endMin: new Date(evt.endsAt).getHours() * 60 + new Date(evt.endsAt).getMinutes(),
              }))}
              nowPx={(new Date().getHours() * 60 + new Date().getMinutes()) / 60 * 56}
              onEventClick={(id) => {
                const evt = unifiedEvents.find(e => e.id === id);
                if (evt) setSelectedEvent(evt);
              }}
            />
          )}
        </div>

        <aside className="flex w-full flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:w-[var(--calendar-rail-w)] lg:flex-none lg:border-t-0 lg:border-l">
          <CalendarTasksRail className="w-full" />
        </aside>
      </div>

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
        event={selectedEvent as any}
        onSave={() => {}}
        onDelete={() => {}}
      />

      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        defaultDate={currentDate}
        onSave={() => {}}
      />
    </div>
  );
}
