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

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
  const dayEvents = date.getDate() === 15 && isCurrentMonth ? legacyEvents.slice(0, 2) : 
           date.getDate() === 22 && isCurrentMonth ? legacyEvents.slice(2, 4) : [];
      
      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        events: dayEvents
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

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
      <header className="h-12 flex items-center justify-between px-[var(--space-4)] border-b border-[var(--border-divider)] bg-[var(--bg-surface)]">
        
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

        {/* Right: Actions */}
        <div className="flex items-center gap-[var(--space-3)]">
          
          {/* Search input */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64 pl-9 pr-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />
          </div>

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

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Calendar View Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'month' && (
            <div className="h-full overflow-auto p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-4">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{day}</span>
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0 border border-[var(--border-divider)]">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      'min-h-[120px] p-[var(--space-2)] border-b border-r border-[var(--border-divider)] cursor-pointer transition-colors duration-[var(--duration-fast)] motion-safe:transition-colors',
                      'hover:bg-[var(--bg-surface-elevated)]',
                      day.isToday ? 'bg-[var(--bg-surface)]' : 'bg-[var(--bg-surface)]',
                      !day.isCurrentMonth && 'opacity-40'
                    )}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}
                  >
                    <div className="mb-[var(--space-2)]">
                      {day.isToday ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-[length:var(--text-sm)] font-[var(--font-weight-bold)] text-white">
                          {day.date}
                        </span>
                      ) : (
                        <span className={cn(
                          'text-[length:var(--text-sm)] font-[var(--font-weight-semibold)]',
                          day.isCurrentMonth ? 'text-[color:var(--text-secondary)]' : 'text-[color:var(--text-tertiary)]'
                        )}>
                          {day.date}
                        </span>
                      )}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-[var(--space-1)]">
                      {day.events.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'group p-[var(--space-1)] px-[var(--space-2)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] rounded-[var(--radius-sm)] truncate cursor-pointer',
                            'transition-all duration-[var(--duration-fast)] motion-safe:transition-all',
                            'hover:shadow-[var(--elevation-sm)] hover:-translate-y-px'
                          )}
                          style={{
                            backgroundColor: event.color === 'var(--primary)' ? 'var(--primary-tint-10)' :
                                           event.color === 'var(--info)' ? 'rgba(20, 184, 166, 0.1)' :
                                           event.color === 'var(--success)' ? 'rgba(34, 197, 94, 0.1)' :
                                           'rgba(251, 146, 60, 0.1)',
                            color: event.color === 'var(--primary)' ? 'var(--primary)' :
                                  event.color === 'var(--info)' ? 'rgb(20, 184, 166)' :
                                  event.color === 'var(--success)' ? 'rgb(34, 197, 94)' :
                                  'rgb(251, 146, 60)'
                          }}
                          title={`${event.title} - ${event.time}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsEditModalOpen(true);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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