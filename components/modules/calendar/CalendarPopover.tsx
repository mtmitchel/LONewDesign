import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';

interface CalendarPopoverProps {
  onDateSelect: (date: Date) => void;
  onClose?: () => void;
  selectedDate?: Date;
}

interface CalendarDay {
  number: number;
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
}

export function CalendarPopover({ onDateSelect, onClose, selectedDate }: CalendarPopoverProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const today = new Date();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
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
      
      days.push({
        number: date.getDate(),
        date: new Date(date),
        isCurrentMonth,
        isToday,
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

  const handleToday = () => {
    const todayDate = new Date();
    setCurrentDate(todayDate);
    onDateSelect(todayDate);
    if (onClose) onClose();
  };

  const handleClear = () => {
    if (onClose) onClose();
  };

  const handleDateSelect = (day: CalendarDay) => {
    onDateSelect(day.date);
    if (onClose) onClose();
  };

  return (
    <div className="p-[var(--space-3)] bg-[var(--bg-surface)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] border border-[var(--border-subtle)] min-w-[280px]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-2)]">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-[length:var(--text-base)] font-semibold text-[color:var(--text-primary)]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div 
            key={idx}
            className="h-8 flex items-center justify-center text-[length:var(--text-xs)] font-medium text-[color:var(--text-tertiary)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            className={cn(
              "h-8 flex items-center justify-center text-[length:var(--text-sm)] rounded-[var(--radius-sm)] transition-colors motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]",
              day.isToday && "bg-[var(--primary)] text-white font-semibold",
              !day.isToday && day.isCurrentMonth && "text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]",
              !day.isCurrentMonth && "text-[color:var(--text-tertiary)]"
            )}
            onClick={() => handleDateSelect(day)}
          >
            {day.number}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-[var(--space-3)] mt-[var(--space-3)] border-t border-[var(--border-divider)]">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-7 text-[color:var(--primary)] font-medium"
          onClick={handleToday}
        >
          Today
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-7 text-[color:var(--text-secondary)]"
          onClick={handleClear}
        >
          Clear
        </Button>
      </div>

    </div>
  );
}
