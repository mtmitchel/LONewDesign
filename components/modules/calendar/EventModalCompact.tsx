import React, { useState, useEffect } from 'react';
import { X, Trash2, MapPin, Repeat, FileText, ChevronDown } from 'lucide-react';
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

interface EventModalCompactProps {
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
  'Personal': '#10B981', // emerald-500
  'Work': '#3B82F6',     // blue-500
  'Travel': '#F97316',   // orange-500
};

export function EventModalCompact({ 
  isOpen, 
  onClose, 
  mode = 'edit',
  event, 
  onSave, 
  onDelete 
}: EventModalCompactProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [calendar, setCalendar] = useState(event?.calendar || 'Personal');
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startDate, setStartDate] = useState(event?.startDate || '');
  const [startTime, setStartTime] = useState(event?.startTime || '09:00');
  const [endDate, setEndDate] = useState(event?.endDate || '');
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
      setStartDate(event.startDate || '');
      setStartTime(event.startTime || '09:00');
      setEndDate(event.endDate || event.startDate || '');
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

  const calendarColor = CALENDAR_COLORS[calendar] || CALENDAR_COLORS['Personal'];
  const modalTitle = mode === 'edit' ? 'Edit event' : 'New event';

  return (
    <div className="fixed inset-0 grid place-items-center p-4 bg-black/50 backdrop-blur-sm z-50">
      <div className="w-full max-w-[440px] bg-white rounded-lg shadow-xl">
        
        {/* Header - Single close button properly positioned */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-base font-medium text-gray-900">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
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
            className="w-full text-base font-medium bg-transparent border-0 outline-none focus:outline-none px-0 py-1 placeholder-gray-400"
            autoFocus
          />

          {/* Date & time section */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">Date & time</label>
            
            {/* Date/time inputs row */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <span className="text-gray-500 text-sm">–</span>
              <input
                type="date"
                value={endDate || startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* All day toggle - properly positioned below date/time */}
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={allDay}
                onCheckedChange={setAllDay}
                id="all-day"
              />
              <label htmlFor="all-day" className="text-sm text-gray-600 cursor-pointer">
                All day
              </label>
            </div>
          </div>

          {/* Calendar selector */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">Calendar</label>
            <Select value={calendar} onValueChange={setCalendar}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: calendarColor }}
                  />
                  <SelectValue />
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

          {/* Progressive disclosure - shows "More details" when closed */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="w-full"
                />
              </div>

              {/* Repeat */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Repeat className="w-4 h-4" />
                  Repeat
                </label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger className="w-full">
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
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description"
                  className="w-full min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          {mode === 'edit' && onDelete ? (
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
