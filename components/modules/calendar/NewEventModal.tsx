import React, { useState } from 'react';
import { X, Clock, Repeat, MapPin, FileText } from 'lucide-react';
import { Button } from '../../ui/button';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  defaultDate?: Date;
}

export function NewEventModal({ isOpen, onClose, onSave, defaultDate }: NewEventModalProps) {
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(defaultDate?.toISOString().split('T')[0] || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(defaultDate?.toISOString().split('T')[0] || '');
  const [endTime, setEndTime] = useState('10:00');
  const [repeat, setRepeat] = useState('Does not repeat');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
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

  return (
    <div className="fixed inset-0 grid place-items-center p-[var(--overlay-gutter)] bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)] z-[var(--z-overlay)]">
      
      <div className="w-full max-w-[600px] max-h-[var(--modal-max-h)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--modal-radius)] shadow-[var(--modal-elevation)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--border-divider)]">
          <h2 className="text-[length:var(--text-xl)] font-semibold text-[color:var(--text-primary)]">
            New event
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors motion-safe:duration-[var(--duration-fast)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-4)]">
            
            {/* Title */}
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
            />

            {/* Date & Time */}
            <div className="flex flex-col gap-[var(--space-2)]">
              <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
                <Clock className="h-4 w-4 text-[color:var(--text-secondary)]" />
                Date and time
              </label>
              
              <label className="flex items-center gap-[var(--space-2)]">
                <input 
                  type="checkbox" 
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-5 w-5 border-2 border-[var(--border-default)] rounded-[var(--radius-sm)] cursor-pointer checked:bg-[var(--primary)] checked:border-[var(--primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]" 
                />
                <span className="text-[length:var(--text-base)] text-[color:var(--text-primary)]">All day</span>
              </label>

              <div className="flex gap-[var(--space-3)]">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]" 
                />
                {!allDay && (
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex-1 h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]" 
                  />
                )}
              </div>

              <span className="text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] px-[var(--space-2)]">to</span>

              <div className="flex gap-[var(--space-3)]">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]" 
                />
                {!allDay && (
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="flex-1 h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]" 
                  />
                )}
              </div>
            </div>

            {/* Repeat */}
            <div className="flex flex-col gap-[var(--space-2)]">
              <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
                <Repeat className="h-4 w-4 text-[color:var(--text-secondary)]" />
                Repeat
              </label>
              <select 
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] cursor-pointer motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
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
                <MapPin className="h-4 w-4 text-[color:var(--text-secondary)]" />
                Location
              </label>
              <input
                type="text"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-10 px-[var(--space-3)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[var(--space-2)]">
              <label className="flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
                <FileText className="h-4 w-4 text-[color:var(--text-secondary)]" />
                Description
              </label>
              <textarea
                placeholder="Add description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-[var(--space-3)] py-[var(--space-2)] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-base)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-all motion-safe:duration-[var(--duration-fast)]"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-t border-[var(--border-divider)]">
          <Button 
            variant="ghost"
            onClick={onClose}
            className="h-[var(--btn-primary-height)]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="h-[var(--btn-primary-height)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
          >
            Create event
          </Button>
        </div>

      </div>

    </div>
  );
}
