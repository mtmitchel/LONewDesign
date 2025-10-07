import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { CalendarTasksRail } from './calendar/CalendarTasksRail';
import { EditEventModal } from './calendar/EditEventModal';
import { CalendarDayView } from './calendar/CalendarDayView';
import { CalendarWeekView } from './calendar/CalendarWeekView';
import { CalendarPopover } from './calendar/CalendarPopover';
import { NewEventModal } from './calendar/NewEventModal';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '../ui/utils';

interface LegacyCalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  color: string;
  description?: string;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: LegacyCalendarEvent[];
}

const legacyEvents: LegacyCalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    time: '9:00 AM',
    duration: '30 min',
    color: 'var(--primary)',
    description: 'Daily team sync'
  },
  {
    id: '2',
    title: 'Project Review',
    time: '2:00 PM',
    duration: '1 hour',
    color: 'var(--info)',
    description: 'Q4 project milestone review'
  },
  {
    id: '3',
    title: 'Design Workshop',
    time: '10:00 AM',
    duration: '2 hours',
    color: 'var(--success)',
    description: 'UX design workshop with team'
  },
  {
    id: '4',
    title: 'Client Call',
    time: '4:00 PM',
    duration: '45 min',
    color: 'var(--warning)',
    description: 'Weekly client check-in'
  }
];

export function CalendarModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const generateCalendarWeeks = (): CalendarDay[][] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks: CalendarDay[][] = [];
    
    // Generate exactly 6 weeks (42 days)
    for (let weekIdx = 0; weekIdx < 6; weekIdx++) {
      const week: CalendarDay[] = [];
      
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (weekIdx * 7) + dayIdx);
        
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === today.toDateString();
        const dayEvents = date.getDate() === 15 && isCurrentMonth ? legacyEvents.slice(0, 2) : 
                 date.getDate() === 22 && isCurrentMonth ? legacyEvents.slice(2, 4) : [];
        
        week.push({
          date: date.getDate(),
          isCurrentMonth,
          isToday,
          events: dayEvents
        });
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };

  const calendarWeeks = generateCalendarWeeks();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-surface)]">
      {/* Enhanced Header */}
      <header className="relative h-12 flex items-center px-[var(--space-4)] border-b border-[var(--border-divider)] bg-[var(--bg-surface)]">
        
        {/* Left: Navigation */}
        <div className="flex items-center gap-[var(--space-3)]">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-[var(--space-3)]"
            onClick={goToToday}
          >
            Today
          </Button>
          
          <div className="flex items-center gap-[var(--space-1)]">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)] ml-[var(--space-2)]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Center: Search (absolutely positioned) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-80 pl-9 pr-3 bg-[var(--input-background)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex items-center gap-[var(--space-3)]">
          
          {/* Calendar popover trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Jump to date"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0" 
              align="end"
            >
              <CalendarPopover 
                selectedDate={currentDate}
                onDateSelect={(date) => {
                  setCurrentDate(date);
                  setSelectedDate(date);
                }}
              />
            </PopoverContent>
          </Popover>

          {/* View toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'month' | 'week' | 'day')}
            className="border border-[var(--border-default)] rounded-[var(--radius-sm)] p-0.5 bg-[var(--bg-surface)]"
          >
            <ToggleGroupItem 
              value="month"
              className="h-7 px-3 text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white rounded-[var(--radius-sm)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            >
              Month
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="week"
              className="h-7 px-3 text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white rounded-[var(--radius-sm)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            >
              Week
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="day"
              className="h-7 px-3 text-[length:var(--text-sm)] font-medium data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white rounded-[var(--radius-sm)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            >
              Day
            </ToggleGroupItem>
          </ToggleGroup>

          {/* New event button */}
          <Button 
            className="h-8 px-[var(--space-3)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
            onClick={() => setIsNewEventModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New event
          </Button>
        </div>

      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar View Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'month' && (
            <>
              {/* Day Headers - cleaner minimal style */}
              <div className="grid grid-cols-7 bg-[var(--bg-surface)] border-b border-[var(--border-divider)]">
                {dayNames.map((day) => (
                  <div 
                    key={day} 
                    className="h-10 flex items-center justify-center"
                  >
                    <span className="text-[10px] font-semibold text-[color:var(--text-tertiary)] uppercase tracking-wider">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid - exactly 6 rows, no extra space */}
              <div className="flex-1 grid grid-rows-6 overflow-hidden">
                {calendarWeeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="grid grid-cols-7">
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={cn(
                          'border-r border-b border-[var(--border-divider)] last:border-r-0 p-2',
                          'hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer',
                          'flex flex-col',
                          day.isCurrentMonth ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-canvas)]'
                        )}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}
                      >
                        {/* Date number */}
                        <div className="flex items-start mb-1">
                          <span className={cn(
                            'text-[13px] font-medium',
                            day.isToday && 'inline-flex items-center justify-center min-w-[24px] h-[24px] bg-[var(--primary)] text-white rounded-full font-semibold',
                            !day.isToday && day.isCurrentMonth && 'text-[color:var(--text-primary)]',
                            !day.isCurrentMonth && 'text-[color:var(--text-tertiary)]'
                          )}>
                            {day.date}
                          </span>
                        </div>

                        {/* Events */}
                        <div className="flex flex-col gap-1 overflow-hidden">
                          {day.events.map((event) => {
                            // Map event color to token classes
                            const eventColorClass = 
                              event.color === 'var(--primary)' ? 'bg-[var(--event-blue-bg)] text-[color:var(--event-blue-text)] hover:bg-[var(--event-blue-hover)]' :
                              event.color === 'var(--info)' ? 'bg-[var(--event-teal-bg)] text-[color:var(--event-teal-text)] hover:bg-[var(--event-teal-hover)]' :
                              event.color === 'var(--success)' ? 'bg-[var(--event-green-bg)] text-[color:var(--event-green-text)] hover:bg-[var(--event-green-hover)]' :
                              'bg-[var(--event-orange-bg)] text-[color:var(--event-orange-text)] hover:bg-[var(--event-orange-hover)]';
                            
                            const hasTime = event.time && event.time !== 'All day';
                            
                            return (
                              <div
                                key={event.id}
                                className={cn(
                                  'px-1.5 py-0.5 rounded text-[11px] font-medium truncate cursor-pointer',
                                  'transition-colors duration-[var(--duration-fast)]',
                                  eventColorClass
                                )}
                                title={`${event.title} - ${event.time}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                {hasTime && (
                                  <span className="font-semibold">{event.time} </span>
                                )}
                                {event.title}
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {viewMode === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              events={legacyEvents}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setIsEditModalOpen(true);
              }}
            />
          )}
          
          {viewMode === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              events={legacyEvents}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setIsEditModalOpen(true);
              }}
            />
          )}
        </div>

        {/* Tasks Rail */}
        <aside className="flex w-full flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] lg:w-[var(--calendar-rail-w)] lg:flex-none lg:border-t-0 lg:border-l">
          <CalendarTasksRail className="w-full" />
        </aside>
      </div>

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={(eventData) => {
          console.log('Save event:', eventData);
          // Handle event save logic here
        }}
        onDelete={() => {
          console.log('Delete event:', selectedEvent);
          // Handle event delete logic here
        }}
      />

      {/* New Event Modal */}
      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        defaultDate={selectedDate || currentDate}
        onSave={(eventData) => {
          console.log('Create event:', eventData);
          // Handle event creation logic here
        }}
      />
    </div>
  );
}