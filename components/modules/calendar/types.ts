import type { Task } from '../tasks/types';

export type EventId = string;

export type EventCategory = 'work' | 'meeting' | 'personal' | 'travel';

export type CalendarEvent = {
  id: EventId;
  title: string;
  calendarId: string;
  startsAt: string; // ISO8601 timestamp
  endsAt: string; // ISO8601 timestamp
  allDay?: boolean;
  category?: EventCategory;
  location?: string;
  description?: string;
  recurrenceRule?: string;
};

export type CalendarView = 'month' | 'week' | 'day';

export const EVENT_COLOR: Record<EventCategory, string> = {
  work: 'var(--event-blue)',
  meeting: 'var(--event-purple)',
  personal: 'var(--event-green)',
  travel: 'var(--event-orange)'
};

// #region CalendarTasksRail Types
export type TaskFilterKey = 'all' | 'today' | 'this-week' | 'completed' | string;

export type CalendarTasksRailProps = {
  tasks?: Task[];
  className?: string;
  filter?: TaskFilterKey;
  loading?: boolean;
  onFilterChange?: (filter: TaskFilterKey) => void;
  onAdd?: (task: Partial<Task>) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
};

export type DueState = 'default' | 'today' | 'overdue';
// #endregion CalendarTasksRail Types
