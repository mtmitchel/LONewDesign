
import React, { useState } from 'react';
import { Calendar, Flag } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { format } from 'date-fns';

interface TaskComposerProps {
  onAddTask: (title: string, dueDate?: string, priority?: 'low' | 'medium' | 'high' | 'none') => void;
  onCancel: () => void;
}

export function TaskComposer({ onAddTask, onCancel }: TaskComposerProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'none'>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const handleAddTask = () => {
    if (title.trim()) {
      onAddTask(
        title.trim(),
        dueDate ? format(dueDate, 'MMM d') : undefined,
        priority !== 'none' ? priority : undefined
      );
      setTitle('');
      setDueDate(undefined);
      setPriority('none');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const priorityColors: { [key: string]: string } = {
    high: 'bg-red-500 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-blue-500 text-white',
    none: ''
  };

  return (
    <div className="mb-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-sm)] p-[var(--space-2)]">
      <div className="flex flex-col gap-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
          <input
            type="text"
            placeholder="Write a task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8 border-0 focus:outline-none focus:ring-0 bg-transparent text-[length:var(--text-sm)] font-[var(--font-weight-normal)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <button 
            onClick={handleAddTask}
            className="inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] h-8 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          >
            Add task
          </button>
          <button 
            onClick={onCancel}
            className="inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] h-8 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          >
            Cancel
          </button>
          <div className="flex-1"></div>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button 
                className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)] ${
                  dueDate 
                    ? 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date);
                  setShowDatePicker(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover open={showPriorityPicker} onOpenChange={setShowPriorityPicker}>
            <PopoverTrigger asChild>
              <button 
                className={`flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)] ${
                  priority !== 'none'
                    ? 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <Flag className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="flex flex-col gap-1">
                {['high', 'medium', 'low', 'none'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriority(p as any);
                      setShowPriorityPicker(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] capitalize hover:bg-[var(--bg-surface-elevated)] text-left ${
                      priority === p ? 'bg-[var(--bg-surface-elevated)]' : ''
                    }`}
                  >
                    {p !== 'none' && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] ${priorityColors[p]}`}>
                        {p}
                      </span>
                    )}
                    {p === 'none' && <span>No priority</span>}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
