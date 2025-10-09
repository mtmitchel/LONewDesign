import React, { useState } from 'react';
import { X, Calendar, Clock, Repeat, MapPin, FileText, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: {
    id: string;
    title: string;
    calendar: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    allDay: boolean;
    repeat: string;
    location: string;
    description: string;
  };
  onSave: (eventData: any) => void;
  onDelete?: () => void;
}

export function EditEventModal({ isOpen, onClose, event, onSave, onDelete }: EditEventModalProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [calendar, setCalendar] = useState(event?.calendar || 'Holidays in Germany');
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState(event?.startDate || '');
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endDate, setEndDate] = useState(event?.endDate || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [repeat, setRepeat] = useState(event?.repeat || 'Does not repeat');
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      calendar,
      allDay,
      startDate,
      startTime,
      endDate,
      endTime,
      repeat,
      location,
      description,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 grid place-items-center p-[var(--overlay-gutter)] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)] z-[var(--z-overlay)]">
  <div className="w-full max-w-[var(--modal-max-w-lg)] max-h-[var(--modal-max-h)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--modal-radius)] shadow-[var(--modal-elevation)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--space-4)] border-b border-[var(--border-divider)]">
          <h2 className="text-[length:var(--text-xl)] font-semibold text-[color:var(--text-primary)]">
            Edit event
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
          
          {/* Title input */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-[var(--space-3)] bg-[var(--input-background)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />
          </div>

          {/* Calendar selector */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              <Calendar className="w-4 h-4 text-[color:var(--text-secondary)]" />
              Calendar
            </label>
            <select
              value={calendar}
              onChange={(e) => setCalendar(e.target.value)}
              className="w-full h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] appearance-none cursor-pointer hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--border-subtle)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1.5 4.5 2.4 3.6 6 7.2 9.6 3.6 10.5 4.5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option>Holidays in Germany</option>
              <option>Work</option>
              <option>Personal</option>
            </select>
          </div>

          {/* Date and time */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              <Clock className="w-4 h-4 text-[color:var(--text-secondary)]" />
              Date and time
            </label>
            
            <label className="flex items-center gap-[var(--space-2)] py-[var(--space-2)]">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="w-5 h-5 border-2 border-[var(--border-default)] rounded-[var(--radius-sm)] cursor-pointer checked:bg-[var(--primary)] checked:border-[var(--primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              />
              <span className="text-[length:var(--text-base)] text-[color:var(--text-primary)] cursor-pointer">All day</span>
            </label>

            <div className="flex gap-[var(--space-3)]">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1 h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
                />
              )}
            </div>

            <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] px-[var(--space-2)]">to</span>

            <div className="flex gap-[var(--space-3)]">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1 h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
                />
              )}
            </div>
          </div>

          {/* Repeat */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              <Repeat className="w-4 h-4 text-[color:var(--text-secondary)]" />
              Repeat
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="w-full h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] appearance-none cursor-pointer motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1.5 4.5 2.4 3.6 6 7.2 9.6 3.6 10.5 4.5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option>Does not repeat</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              <MapPin className="w-4 h-4 text-[color:var(--text-secondary)]" />
              Location
            </label>
            <input
              type="text"
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-12 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-[var(--space-2)]">
            <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
              <FileText className="w-4 h-4 text-[color:var(--text-secondary)]" />
              Description
            </label>
            <textarea
              placeholder="Add description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-[var(--space-4)] border-t border-[var(--border-divider)]">
          <button
            onClick={handleDelete}
            className="flex items-center gap-[var(--space-2)] h-[var(--btn-primary-height)] px-[var(--space-4)] text-[color:var(--accent-coral)] hover:bg-[var(--accent-coral-tint-10)] rounded-[var(--btn-primary-radius)] font-medium motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-[var(--space-3)]">
            <button
              onClick={onClose}
              className="h-[var(--btn-primary-height)] px-[var(--space-4)] bg-[var(--btn-ghost-bg)] text-[color:var(--btn-ghost-text)] border border-[var(--btn-ghost-border)] rounded-[var(--btn-primary-radius)] font-medium hover:bg-[var(--btn-ghost-hover)] motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="h-[var(--btn-primary-height)] px-[var(--space-4)] bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] rounded-[var(--btn-primary-radius)] font-medium hover:bg-[var(--btn-primary-hover)] motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]"
            >
              Save changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
