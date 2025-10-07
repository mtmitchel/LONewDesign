import React from 'react';
import { CalendarEvent } from '../../calendar/CalendarEvent';
import { cn } from '../../ui/utils';

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  color: string;
  description?: string;
}

interface CalendarDayViewProps {
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



export function CalendarDayView({ currentDate, events, onEventClick }: CalendarDayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };
  
  const formatDate = (date: Date): { primary: string; secondary: string } => {
    const primary = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    const secondary = date.toLocaleDateString('en-US', { year: 'numeric' });
    return { primary, secondary };
  };
  
  const dateInfo = formatDate(currentDate);
  
  // Calculate event positions
  const positionedEvents = events.map((event) => {
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
  
  return (
    <div className="flex flex-col h-full bg-[var(--bg-canvas)]">
      {/* Header */}
      <div className="flex items-center justify-between h-[60px] px-[var(--space-4)] bg-[var(--bg-surface)] border-b border-[var(--border-divider)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <div className="text-[length:var(--text-xl)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)]">
            {dateInfo.primary}
          </div>
          <div className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
            {dateInfo.secondary}
          </div>
        </div>
      </div>
      
      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)]">
        <div className="grid" style={{ gridTemplateColumns: '60px 1fr' }}>
          {hours.map((hour) => (
            <React.Fragment key={hour}>
               {/* Time Label */}
               <div className="sticky left-0 pr-[var(--space-2)] text-right text-[length:var(--text-xs)] leading-none text-[var(--text-tertiary)] border-r border-b border-[var(--border-divider)] h-[60px] flex items-center justify-end">
                 {formatHour(hour)}
               </div>
              
               {/* Time Slot */}
               <div className="relative border-b border-[var(--border-divider)] h-[60px] px-[var(--calendar-day-column-pad-x)] transition-colors duration-[var(--duration-fast)] motion-safe:transition-colors hover:bg-[var(--bg-surface-elevated)]">
                {/* Events positioned absolutely */}
                {hour === 0 && positionedEvents.map((event) => {
                  // Map legacy color to simple color name
                  const mapEventColor = (legacyColor: string): 'blue' | 'green' | 'teal' | 'orange' => {
                    const colorMap: Record<string, 'blue' | 'green' | 'teal' | 'orange'> = {
                      'var(--primary)': 'blue',
                      'var(--info)': 'teal',
                      'var(--success)': 'green',
                      'var(--warning)': 'orange',
                    };
                    return colorMap[legacyColor] || 'blue';
                  };
                  
                  return (
                    <CalendarEvent
                      key={event.id}
                      title={event.title}
                      time={event.time}
                      color={mapEventColor(event.color)}
                      density="default"
                      className="absolute left-0 right-0 hover:shadow-[var(--elevation-sm)] hover:-translate-y-px z-[1]"
                      style={{
                        top: `${event.top}px`,
                        height: `${event.height}px`,
                      }}
                      onClick={() => onEventClick(event)}
                    />
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
