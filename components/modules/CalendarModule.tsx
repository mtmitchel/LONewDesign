import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '../ui/button';

interface CalendarEvent {
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
  events: CalendarEvent[];
}

const mockEvents: CalendarEvent[] = [
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
      const dayEvents = date.getDate() === 15 && isCurrentMonth ? mockEvents.slice(0, 2) : 
                       date.getDate() === 22 && isCurrentMonth ? mockEvents.slice(2, 4) : [];
      
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

  const todaysEvents = mockEvents;

  return (
    <div className="h-full bg-[var(--surface)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft size={16} />
              </Button>
              <h2 className="text-lg font-medium text-[var(--text-primary)] min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
            <Plus size={16} className="mr-2" />
            New Event
          </Button>
        </div>
        
        {/* Today's Overview */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <CalendarIcon size={16} />
            <span>Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Clock size={16} />
            <span>{todaysEvents.length} events scheduled</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center">
                <span className="text-sm font-medium text-[var(--text-secondary)]">{day}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 h-[calc(100%-60px)]">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-3 border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                  day.isToday ? 'bg-[var(--primary-tint-10)] border-[var(--primary)]' : 'bg-[var(--surface)]'
                } ${
                  !day.isCurrentMonth ? 'opacity-40' : ''
                }`}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isToday ? 'text-[var(--primary)]' : day.isCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}>
                  {day.date}
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {day.events.map((event) => (
                    <div
                      key={event.id}
                      className="p-1.5 text-xs rounded text-white truncate"
                      style={{ backgroundColor: event.color }}
                      title={`${event.title} - ${event.time}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Events Sidebar */}
        <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--elevated)] flex flex-col">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Today's Schedule</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {todaysEvents.length > 0 ? (
              <div className="space-y-4">
                {todaysEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-[var(--text-primary)]">{event.title}</h4>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-2">
                      <span>{event.time}</span>
                      <span>{event.duration}</span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-[var(--text-secondary)]">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
                <p className="text-[var(--text-secondary)]">No events scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}