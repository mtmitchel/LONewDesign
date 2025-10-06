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
