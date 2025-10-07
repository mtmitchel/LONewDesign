import React, { useState, useEffect } from 'react';
import { X, Trash2, MapPin, Repeat, FileText, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { format } from 'date-fns';

interface EventModalFixedProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'edit' | 'create';
  event?: {
    id?: string;
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

const CALENDAR_COLORS: Record<string, string> = {
  'Personal': 'var(--event-green)',  // Use design system colors
  'Work': 'var(--event-blue)',
  'Travel': 'var(--event-orange)',
};

export function EventModalFixed({ 
  isOpen, 
  onClose, 
  mode = 'edit',
  event, 
  onSave, 
  onDelete 
}: EventModalFixedProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [calendar, setCalendar] = useState(event?.calendar || 'Personal');
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    event?.startDate ? new Date(event.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.endDate ? new Date(event.endDate) : new Date()
  );
  const [startTime, setStartTime] = useState(event?.startTime || '09:00');
  const [endTime, setEndTime] = useState(event?.endTime || '10:00');
  const [repeat, setRepeat] = useState(event?.repeat || 'Does not repeat');
  const [location, setLocation] = useState(event?.location || '');
  const [description, setDescription] = useState(event?.description || '');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setCalendar(event.calendar || 'Personal');
      setAllDay(event.allDay || false);
      setStartDate(event.startDate ? new Date(event.startDate) : new Date());
      setEndDate(event.endDate ? new Date(event.endDate) : new Date());
      setStartTime(event.startTime || '09:00');
      setEndTime(event.endTime || '10:00');
      setRepeat(event.repeat || 'Does not repeat');
      setLocation(event.location || '');
      setDescription(event.description || '');
    }
  }, [event]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      title,
      calendar,
      allDay,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      startTime,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
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

  const calendarColor = CALENDAR_COLORS[calendar] || CALENDAR_COLORS['Personal'];
  const modalTitle = mode === 'edit' ? 'Edit event' : 'New event';

  return (
    <div className="fixed inset-0 grid place-items-center p-4 bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)] z-[var(--z-overlay)]">
      <div className="w-full max-w-[440px] bg-[var(--bg-surface)] rounded-[var(--radius-lg)] shadow-[var(--elevation-xl)]">
        
        {/* Header - Single close button */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-[var(--text-base)] font-medium text-[var(--text-primary)]">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full text-[var(--text-base)] font-medium bg-transparent border-0 outline-none focus:outline-none px-0 py-1 placeholder-[var(--text-tertiary)]"
            autoFocus
          />

          {/* Date & time section */}
          <div className="space-y-2">
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)]">Date & time</label>
            
            {/* Date/time inputs row */}
            <div className="flex items-center gap-2">
              {/* Start date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal border-[var(--border-default)]"
                  >
                    {startDate ? format(startDate, 'MM/dd/yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 border-[var(--border-default)]"
                />
              )}

              <span className="text-[var(--text-secondary)] text-sm">–</span>

              {/* End date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal border-[var(--border-default)]"
                  >
                    {endDate ? format(endDate, 'MM/dd/yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 border-[var(--border-default)]"
                />
              )}
            </div>

            {/* All day toggle - with actual Switch component */}
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={allDay}
                onCheckedChange={setAllDay}
                id="all-day"
                className="data-[state=checked]:bg-[var(--primary)]"
              />
              <label htmlFor="all-day" className="text-[var(--text-sm)] text-[var(--text-secondary)] cursor-pointer">
                All day
              </label>
            </div>
          </div>

          {/* Calendar selector - single dot */}
          <div className="space-y-2">
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)]">Calendar</label>
            <Select value={calendar} onValueChange={setCalendar}>
              <SelectTrigger className="w-full border-[var(--border-default)]">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: calendarColor }}
                  />
                  <span>{calendar}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALENDAR_COLORS).map(([name, color]) => (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progressive disclosure - correct text */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 text-[var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span>{showDetails ? 'Fewer details' : 'More details'}</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Expandable details section */}
          {showDetails && (
            <div className="space-y-4 pt-2">
              {/* Location */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full border-[var(--border-default)]"
                />
              </div>

              {/* Repeat */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  <Repeat className="w-4 h-4" />
                  Repeat
                </label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger className="w-full border-[var(--border-default)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Does not repeat">Does not repeat</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description"
                  className="w-full min-h-[80px] resize-none border-[var(--border-default)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-canvas)]">
          {mode === 'edit' && onDelete ? (
            <button
              onClick={handleDelete}
              className="p-2 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
              aria-label="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
