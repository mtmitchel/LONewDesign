import { useMemo } from 'react';
import {
  addDays,
  addWeeks,
  addMonths,
  differenceInMinutes,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays
} from 'date-fns';

import type { CalendarEvent, CalendarView } from './types';

export type MonthCell = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type TimedEventPlacement = {
  event: CalendarEvent;
  lane: number;
  laneCount: number;
  top: number;
  height: number;
};

const TOTAL_DAY_MINUTES = 24 * 60;
const MIN_BLOCK_HEIGHT = 24; // px fallback for very short events

function buildMonthCells(date: Date): MonthCell[] {
  const monthStart = startOfMonth(date);
  const firstVisible = startOfWeek(monthStart, { weekStartsOn: 0 });
  const cells: MonthCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const current = addDays(firstVisible, i);
    cells.push({
      date: current,
      isCurrentMonth: isSameMonth(current, date),
      isToday: isSameDay(current, new Date())
    });
  }

  return cells;
}

function getEventsForDate(events: CalendarEvent[], target: Date) {
  return events
    .filter((event) => {
      const start = new Date(event.startsAt);
      const end = new Date(event.endsAt);
      return isSameDay(start, target) || isSameDay(end, target) || isWithinInterval(target, { start, end });
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

function getEventsForRange(events: CalendarEvent[], start: Date, end: Date) {
  return events.filter((event) => {
    const eventStart = new Date(event.startsAt);
    const eventEnd = new Date(event.endsAt);

    if (isAfter(eventStart, end) || isBefore(eventEnd, start)) {
      return false;
    }

    return true;
  });
}

function computeTimedPlacements(events: CalendarEvent[], day: Date): TimedEventPlacement[] {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);
  const relevant = events
    .filter((event) => !event.allDay && getOverlapMinutes(event, dayStart, dayEnd) > 0)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const lanes: CalendarEvent[][] = [];
  const placements: TimedEventPlacement[] = [];

  relevant.forEach((event) => {
    const eventStart = new Date(event.startsAt);
    const eventEnd = new Date(event.endsAt);
    const normalizedStart = eventStart < dayStart ? dayStart : eventStart;
    const normalizedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

    let laneIndex = lanes.findIndex((lane) => {
      const lastEvent = lane[lane.length - 1];
      return new Date(lastEvent.endsAt) <= normalizedStart;
    });

    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push([event]);
    } else {
      lanes[laneIndex].push(event);
    }

    const laneCount = lanes.length;
    const minutesFromStart = differenceInMinutes(normalizedStart, dayStart);
    const durationMinutes = Math.max(differenceInMinutes(normalizedEnd, normalizedStart), 15);
    const top = (minutesFromStart / TOTAL_DAY_MINUTES) * 100;
    const height = (durationMinutes / TOTAL_DAY_MINUTES) * 100;

    placements.push({
      event,
      lane: laneIndex,
      laneCount,
      top,
      height
    });
  });

  return placements;
}

function getOverlapMinutes(event: CalendarEvent, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);

  const effectiveStart = start < rangeStart ? rangeStart : start;
  const effectiveEnd = end > rangeEnd ? rangeEnd : end;

  return Math.max(differenceInMinutes(effectiveEnd, effectiveStart), 0);
}

export function useCalendarEngine(events: CalendarEvent[], view: CalendarView, date: Date) {
  return useMemo(() => {
    const monthCells = buildMonthCells(date);
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    const weekEvents = getEventsForRange(events, weekStart, weekEnd);

    const dayPlacementsMap = new Map<string, TimedEventPlacement[]>();

    for (let i = 0; i < 7; i += 1) {
      const dayDate = addDays(weekStart, i);
      const key = format(dayDate, 'yyyy-MM-dd');
      dayPlacementsMap.set(key, computeTimedPlacements(weekEvents, dayDate));
    }

    const dayPlacements = computeTimedPlacements(events, date);

    return {
      monthCells,
      getEventsForDate: (target: Date) => getEventsForDate(events, target),
      weekRange: { start: weekStart, end: weekEnd },
      weekEvents,
      weekPlacements: dayPlacementsMap,
      dayPlacements
    };
  }, [events, view, date]);
}

export function formatRangeLabel(view: CalendarView, date: Date) {
  switch (view) {
    case 'day':
      return format(date, 'EEEE, MMM d, yyyy');
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      const sameMonth = start.getMonth() === end.getMonth();
      const monthFormat = sameMonth ? 'MMM d' : 'MMM d';
      return `${format(start, monthFormat)} – ${format(end, 'MMM d, yyyy')}`;
    }
    default:
      return format(date, 'MMMM yyyy');
  }
}

export function navigate(date: Date, view: CalendarView, direction: 'prev' | 'next'): Date {
  if (view === 'day') {
    return direction === 'next' ? addDays(date, 1) : subDays(date, 1);
  }

  if (view === 'week') {
    return direction === 'next' ? addWeeks(date, 1) : subDays(date, 7);
  }

  return direction === 'next' ? addMonths(date, 1) : addMonths(date, -1);
}
