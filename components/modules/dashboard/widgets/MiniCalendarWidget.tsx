"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../../ui/button';
import { cn } from '../../../ui/utils';
import type { WidgetProps } from '../types';

export function MiniCalendarWidget({ widget }: WidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };
  
  const hasEvent = (day: number) => {
    // Mock events for demo
    return [5, 12, 18, 25].includes(day);
  };
  
  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isNext: false
    });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isNext: false
    });
  }
  
  // Next month's leading days
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isNext: true
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-[var(--text-primary)]">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMonth}
            className="h-6 w-6 p-0"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-6 w-6 p-0"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-[var(--text-secondary)] text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.slice(0, 35).map((dateObj, index) => (
            <button
              key={index}
              className={cn(
                "relative text-xs p-1 rounded text-center hover:bg-[var(--primary-tint-10)] transition-colors",
                dateObj.isCurrentMonth 
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] opacity-50",
                isToday(dateObj.day) && dateObj.isCurrentMonth &&
                  "bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-hover)]"
              )}
            >
              {dateObj.day}
              {hasEvent(dateObj.day) && dateObj.isCurrentMonth && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[var(--warning)] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Today indicator */}
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <CalendarIcon size={12} />
          <span>Today: {today.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}