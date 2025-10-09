import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { CalendarEvent, EventCategory } from './types';

const CALENDAR_OPTIONS = [
  { id: 'personal', label: 'Personal' },
  { id: 'team', label: 'Team' }
];

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'personal', label: 'Personal' },
  { value: 'travel', label: 'Travel' }
];

type EventModalProps = {
  open: boolean;
  initial?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
};

type EventDraft = {
  id?: string;
  title: string;
  calendarId: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category: EventCategory;
  location: string;
  description: string;
  recurrenceRule?: string;
};

function createDraft(initial?: CalendarEvent | null): EventDraft {
  if (!initial) {
    const now = new Date();
    const roundedStart = new Date(now);
    roundedStart.setMinutes(0, 0, 0);
    const defaultEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);

    return {
      title: '',
      calendarId: CALENDAR_OPTIONS[0]?.id ?? 'personal',
      date: format(now, 'yyyy-MM-dd'),
      startTime: format(roundedStart, 'HH:mm'),
      endTime: format(defaultEnd, 'HH:mm'),
      allDay: false,
      category: 'work',
      location: '',
      description: '',
      recurrenceRule: undefined
    };
  }

  const start = new Date(initial.startsAt);
  const end = new Date(initial.endsAt);

  return {
    id: initial.id,
    title: initial.title,
    calendarId: initial.calendarId,
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
    allDay: Boolean(initial.allDay),
    category: initial.category ?? 'work',
    location: initial.location ?? '',
    description: initial.description ?? '',
    recurrenceRule: initial.recurrenceRule
  };
}

function toCalendarEvent(draft: EventDraft): CalendarEvent {
  const { date, startTime, endTime, allDay } = draft;
  const startIso = new Date(`${date}T${allDay ? '00:00' : startTime}:00`);
  const endIso = new Date(`${date}T${allDay ? '23:59' : endTime}:00`);

  return {
    id: draft.id ?? `event-${Date.now()}`,
    title: draft.title,
    calendarId: draft.calendarId,
    startsAt: startIso.toISOString(),
    endsAt: endIso.toISOString(),
    allDay,
    category: draft.category,
    location: draft.location || undefined,
    description: draft.description || undefined,
    recurrenceRule: draft.recurrenceRule
  };
}

export function EventModal({ open, initial, onClose, onSave, onDelete }: EventModalProps) {
  const [draft, setDraft] = useState<EventDraft>(() => createDraft(initial));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(createDraft(initial));
      setError(null);
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      setError('Title is required.');
      return;
    }

    const start = new Date(`${draft.date}T${draft.allDay ? '00:00' : draft.startTime}`);
    const end = new Date(`${draft.date}T${draft.allDay ? '23:59' : draft.endTime}`);

    if (end < start) {
      setError('End time must be after the start time.');
      return;
    }

    onSave(toCalendarEvent(draft));
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === 's' || event.key === 'Enter')) {
        event.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, draft]);

  const recurringLabel = useMemo(() => draft.recurrenceRule ?? 'Does not repeat', [draft.recurrenceRule]);

  return (
    <Dialog open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
  <DialogContent className="max-w-[var(--modal-max-w-lg)]">
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>Fill out the event details and choose a calendar.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-[var(--space-4)]"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Event title"
                autoFocus
              />
            </div>
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="event-calendar">Calendar</Label>
              <Select
                value={draft.calendarId}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, calendarId: value }))}
              >
                <SelectTrigger id="event-calendar">
                  <SelectValue placeholder="Select calendar" />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-[auto_1fr] md:items-end">
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={draft.date}
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-[var(--space-4)]">
              {!draft.allDay && (
                <>
                  <div className="space-y-[var(--space-2)]">
                    <Label htmlFor="event-start">Start</Label>
                    <Input
                      id="event-start"
                      type="time"
                      value={draft.startTime}
                      onChange={(event) => setDraft((prev) => ({ ...prev, startTime: event.target.value }))}
                      step={900}
                    />
                  </div>
                  <div className="space-y-[var(--space-2)]">
                    <Label htmlFor="event-end">End</Label>
                    <Input
                      id="event-end"
                      type="time"
                      value={draft.endTime}
                      onChange={(event) => setDraft((prev) => ({ ...prev, endTime: event.target.value }))}
                      step={900}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-[var(--space-3)]">
            <div>
              <p className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">All day</p>
              <p className="text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">Hide time fields and block the full day.</p>
            </div>
            <Switch checked={draft.allDay} onCheckedChange={(value) => setDraft((prev) => ({ ...prev, allDay: value }))} />
          </div>

          <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="event-category">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft((prev) => ({ ...prev, category: value as EventCategory }))}
              >
                <SelectTrigger id="event-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-[var(--space-2)]">
              <Label htmlFor="event-repeat">Repeat</Label>
              <Button
                type="button"
                variant="outline"
                className="justify-between"
                id="event-repeat"
                onClick={() => setDraft((prev) => ({ ...prev, recurrenceRule: prev.recurrenceRule ? undefined : 'FREQ=WEEKLY' }))}
              >
                {recurringLabel}
              </Button>
            </div>
          </div>

          <div className="space-y-[var(--space-2)]">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={draft.location}
              onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Conference room, link, or address"
            />
          </div>

          <div className="space-y-[var(--space-2)]">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Add context or agenda"
              rows={4}
            />
          </div>

          {error && <p className="text-[length:var(--text-xs)] text-[color:var(--danger)]">{error}</p>}

          <DialogFooter className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <div>
              {draft.id && (
                <Button type="button" variant="destructive" onClick={() => draft.id && onDelete?.(draft.id)}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
