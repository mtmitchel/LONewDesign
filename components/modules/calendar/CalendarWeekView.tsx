import React from 'react';
import { cn } from '../../ui/utils';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  color: string;
  description?: string;
  date?: Date; // Week view needs date association
}

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

// Parse time string like "9:00 AM" to decimal hours (9.0)
function parseEventTime(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  
  return hours + minutes / 60;
}

// Parse duration like "30 min", "1 hour", "2 hours" to decimal hours
function parseDuration(durationStr: string): number {
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10) / 60;
  
  const hourMatch = durationStr.match(/(\d+)\s*hour/i);
  if (hourMatch) return parseInt(hourMatch[1], 10);
  
  return 0.5; // default 30 minutes
}

// Get color styles based on event color
function getEventColors(color: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    'var(--primary)': {
      bg: 'var(--event-blue-bg)',
      text: 'var(--event-blue-text)',
      border: 'var(--primary)',
    },
    'var(--info)': {
      bg: 'var(--event-teal-bg)',
      text: 'var(--event-teal-text)',
      border: 'rgb(20, 184, 166)',
    },
    'var(--success)': {
      bg: 'var(--event-green-bg)',
      text: 'var(--event-green-text)',
      border: 'rgb(34, 197, 94)',
    },
    'var(--warning)': {
      bg: 'var(--event-orange-bg)',
      text: 'var(--event-orange-text)',
      border: 'rgb(251, 146, 60)',
    },
  };
  
  return colorMap[color] || colorMap['var(--primary)'];
}

export function CalendarWeekView({ currentDate, events, onEventClick }: CalendarWeekViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();
  
  // Calculate week start (Sunday)
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  // Generate 7 days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  const isToday = (date: Date): boolean => {
    return date.toDateString() === today.toDateString();
  };
  
  // For demo purposes, distribute events across the week
  // In production, events would have actual date associations
  const eventsForDay = (dayIndex: number) => {
    // Simple distribution: show different events on different days
    const eventIndices = [
      [0], // Sunday - first event
      [1], // Monday - second event
      [], // Tuesday - no events
      [2], // Wednesday - third event
      [], // Thursday - no events
      [3], // Friday - fourth event
      [], // Saturday - no events
    ];
    
    return (eventIndices[dayIndex] || []).map(idx => events[idx]).filter(Boolean);
  };
  
  // Calculate event positions for a specific day
  const getPositionedEvents = (dayIndex: number) => {
    const dayEvents = eventsForDay(dayIndex);
    
    return dayEvents.map((event) => {
      const startHour = parseEventTime(event.time);
      const durationHours = parseDuration(event.duration);
      const top = startHour * 60; // 60px per hour
      const height = durationHours * 60;
      
      return {
        ...event,
        top,
        height,
      };
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)]">
      {/* Week Header */}
      <div className="grid bg-[var(--bg-surface)] border-b border-[var(--border-divider)]" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
        {/* Empty corner cell */}
        <div className="border-r border-[var(--border-divider)]" />
        
        {/* Day Headers */}
        {weekDays.map((date, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-[var(--space-3)] px-[var(--space-2)] border-r border-[var(--border-divider)]"
          >
            <div className="text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] uppercase tracking-wider">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            {isToday(date) ? (
              <div className="w-10 h-10 flex items-center justify-center bg-[var(--primary)] text-white rounded-full text-[length:var(--text-2xl)] font-[var(--font-weight-semibold)] mt-[var(--space-1)]">
                {date.getDate()}
              </div>
            ) : (
              <div className="text-[length:var(--text-2xl)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)] mt-[var(--space-1)]">
                {date.getDate()}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Week Time Grid */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)]">
        <div className="grid" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time Label */}
              <div className="p-[var(--space-2)] text-right text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] border-r border-b border-[var(--border-divider)] h-[60px]">
                {formatHour(hour)}
              </div>
              
              {/* Day Time Slots */}
              {weekDays.map((_, dayIndex) => (
                <div
                  key={dayIndex}
                  className="relative border-r border-b border-[var(--border-divider)] h-[60px] transition-colors duration-[var(--duration-fast)] motion-safe:transition-colors hover:bg-[var(--bg-surface-elevated)]"
                >
                  {/* Events positioned absolutely (only render in first hour to avoid duplicates) */}
                  {hour === 0 && getPositionedEvents(dayIndex).map((event) => {
                    const colors = getEventColors(event.color);
                    return (
                      <div
                        key={event.id}
                        className="absolute left-[2px] right-[2px] p-[var(--space-1)] px-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-[var(--duration-fast)] motion-safe:transition-all hover:shadow-[var(--elevation-sm)] hover:z-10"
                        style={{
                          top: `${event.top}px`,
                          height: `${event.height}px`,
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderLeft: `2px solid ${colors.border}`,
                        }}
                        onClick={() => onEventClick(event)}
                        title={`${event.title} - ${event.time}`}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
