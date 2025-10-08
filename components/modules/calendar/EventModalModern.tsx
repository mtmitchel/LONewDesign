import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent } from '../../ui/dialog';
import { Calendar } from '../../ui/calendar';
import { X, Clock, Calendar as CalendarIcon, ChevronDown, Trash2, MapPin, Repeat, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  calendar: string;
  calendarColor: string;
  location?: string;
  repeat: string;
  description?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'edit' | 'create';
  event?: any;
  onSave: (event: any) => void;
  onDelete?: () => void;
}

export function EventModalModern({ isOpen, onClose, mode = 'edit', event, onSave, onDelete }: EventModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<CalendarEvent>({
    id: event?.id || '',
    title: event?.title || '',
    startDate: event?.startDate ? new Date(event.startDate) : new Date(),
    endDate: event?.endDate ? new Date(event.endDate) : new Date(),
    allDay: event?.allDay || false,
    calendar: event?.calendar || 'Personal',
    calendarColor: event?.calendarColor || 'rgb(52, 211, 153)',
    location: event?.location || '',
    repeat: event?.repeat || 'none',
    description: event?.description || ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatTimeRange = () => {
    if (formData.allDay) return 'All day';
    const start = format(formData.startDate, 'h:mm a');
    const end = format(formData.endDate, 'h:mm a');
    return `${start} – ${end}`;
  };

  const formatDateDisplay = () => {
    const today = new Date();
    const eventDate = formData.startDate;
    
    if (format(today, 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd')) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (format(tomorrow, 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd')) {
      return 'Tomorrow';
    }
    
    return format(eventDate, 'EEE, MMM d');
  };

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    return {
      value: format(time, 'HH:mm'),
      label: format(time, 'h:mm a')
    };
  });

  const handleSave = () => {
    onSave({
      ...formData,
      startDate: format(formData.startDate, 'yyyy-MM-dd'),
      startTime: format(formData.startDate, 'HH:mm'),
      endDate: format(formData.endDate, 'yyyy-MM-dd'),
      endTime: format(formData.endDate, 'HH:mm')
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[480px] max-w-[90vw] p-0 gap-0 rounded-xl border-0 overflow-visible [&>button]:hidden"
        style={{ boxShadow: 'var(--elevation-xl)' }}
      >
        {/* Header with single close button */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-sm font-medium text-[color:var(--text-secondary)]">
            {mode === 'edit' ? 'Edit event' : 'New event'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 -mr-1 text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            title="Close (Esc)"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Inline editable title */}
          <div className="relative">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xl font-semibold border-0 px-0 h-auto py-0 focus-visible:ring-0 placeholder:text-gray-400"
              placeholder="Add title"
              autoFocus
            />
          </div>

          {/* Compact date & time row with popovers */}
          <div className="flex items-center gap-2">
            {/* Date popover */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-sm font-normal border-gray-200 hover:bg-gray-50 justify-start gap-2"
                >
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  {formatDateDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[200]" align="start">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormData({ ...formData, startDate: date, endDate: date });
                      setShowDatePicker(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Time popover */}
            {!formData.allDay && (
              <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-sm font-normal border-gray-200 hover:bg-gray-50 justify-start gap-2"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatTimeRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-3 z-[200]" align="start">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Start time */}
                      <div>
                        <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block">
                          Start
                        </label>
                        <Select
                          value={format(formData.startDate, 'HH:mm')}
                          onValueChange={(value) => {
                            const [hours, minutes] = value.split(':');
                            const newDate = new Date(formData.startDate);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setFormData({ ...formData, startDate: newDate });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] z-[300]">
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value} className="text-sm">
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* End time */}
                      <div>
                        <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block">
                          End
                        </label>
                        <Select
                          value={format(formData.endDate, 'HH:mm')}
                          onValueChange={(value) => {
                            const [hours, minutes] = value.split(':');
                            const newDate = new Date(formData.endDate);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setFormData({ ...formData, endDate: newDate });
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] z-[300]">
                            {timeSlots.map((slot) => (
                              <SelectItem key={slot.value} value={slot.value} className="text-sm">
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Quick duration buttons */}
                    <div className="flex gap-1.5 pt-1">
                      {[15, 30, 60, 120].map((mins) => (
                        <Button
                          key={mins}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const newEnd = new Date(formData.startDate);
                            newEnd.setMinutes(newEnd.getMinutes() + mins);
                            setFormData({ ...formData, endDate: newEnd });
                            setShowTimePicker(false);
                          }}
                        >
                          {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* All-day toggle - now always visible */}
            <div className="flex items-center gap-2 ml-auto">
              <Switch
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
                id="all-day-toggle"
                className="
                  data-[state=unchecked]:bg-[var(--border-default)]
                  data-[state=checked]:bg-[var(--primary)]
                  transition-colors
                "
              />
              <label 
                htmlFor="all-day-toggle"
                className="text-sm text-[color:var(--text-secondary)] cursor-pointer select-none"
              >
                All day
              </label>
            </div>
          </div>

          {/* Calendar selector */}
          <div className="pt-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 py-1.5 px-0 hover:opacity-80 transition-opacity">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: formData.calendarColor }}
                  />
                  <span className="text-sm text-[color:var(--text-secondary)]">{formData.calendar}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[color:var(--text-tertiary)]" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-1 z-[200]" align="start">
              <div className="space-y-0.5">
                {[
                  { name: 'Personal', color: 'hsl(160 84% 51%)' },
                  { name: 'Work', color: 'hsl(217 91% 60%)' },
                  { name: 'Travel', color: 'hsl(25 95% 63%)' }
                ].map((cal) => (
                  <button
                    key={cal.name}
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        calendar: cal.name,
                        calendarColor: cal.color 
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 text-sm rounded hover:bg-[var(--bg-hover)] transition-colors text-[color:var(--text-primary)]"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: cal.color }}
                    />
                    {cal.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          </div>

          {/* Details section - fixed spacing */}
          {isExpanded && (
            <div className="space-y-3 pt-2">
              {/* Location - fixed icon alignment */}
              <button className="w-full flex items-center gap-2 py-1.5 group hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-md transition-colors">
                <MapPin className="h-4 w-4 text-[color:var(--text-tertiary)] flex-shrink-0" />
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location"
                  className="border-0 h-auto py-0 px-0 text-sm placeholder:text-[color:var(--text-tertiary)] focus-visible:ring-0 bg-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </button>

              {/* Repeat - fixed icon alignment */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center gap-2 py-1.5 hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-md transition-colors text-left">
                    <Repeat className="h-4 w-4 text-[color:var(--text-tertiary)] flex-shrink-0" />
                    <span className="text-sm text-[color:var(--text-secondary)]">
                      {formData.repeat === 'none' ? 'Does not repeat' : formData.repeat}
                    </span>
                  </button>
                </PopoverTrigger>
                  <PopoverContent className="w-[180px] p-1 z-[200]" align="start">
                    {['none', 'Daily', 'Weekly', 'Monthly', 'Yearly'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setFormData({ ...formData, repeat: option })}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--bg-hover)] text-[color:var(--text-primary)]"
                      >
                        {option === 'none' ? 'Does not repeat' : option}
                      </button>
                    ))}
                  </PopoverContent>
              </Popover>

              {/* Description - fixed icon alignment */}
              <div className="flex items-start gap-2 py-1.5 hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-md transition-colors">
                <FileText className="h-4 w-4 text-[color:var(--text-tertiary)] flex-shrink-0 mt-0.5" />
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add description"
                  className="min-h-[60px] resize-none text-sm border-0 px-0 py-0 placeholder:text-[color:var(--text-tertiary)] focus-visible:ring-0 bg-transparent"
                />
              </div>

              {/* Hide details button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 text-sm text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] transition-colors py-1 -mx-2 px-2"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
                Hide details
              </button>
            </div>
          )}

          {/* Show details button when collapsed */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 text-sm text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)] transition-colors py-1"
            >
              <ChevronDown className="h-4 w-4" />
              Add details
            </button>
          )}
        </div>

        {/* Action bar with system colors */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-canvas)]">
          {mode === 'edit' && onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 px-2 text-[color:var(--text-tertiary)] hover:text-[color:var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="h-8 px-3 text-sm text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleSave}
              className="h-8 px-4 text-sm bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
