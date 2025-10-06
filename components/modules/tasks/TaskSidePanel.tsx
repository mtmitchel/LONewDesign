
import React from 'react';
import { Checkbox } from '../../ui/checkbox';
import { Calendar, Flag, Tag, Trash2, X, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { format } from 'date-fns';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'none';
  dueDate?: string;
  dateCreated: string;
  labels: string[];
  isCompleted: boolean;
  subtasks?: Subtask[];
}

interface TaskSidePanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskSidePanel({ task, onClose, onUpdateTask, onDeleteTask }: TaskSidePanelProps) {
  if (!task) return null;

  const [editedTask, setEditedTask] = React.useState<Task>(task);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = React.useState<string | undefined>(undefined);
  const [newLabel, setNewLabel] = React.useState('');

  // Helper function to parse formatted date strings like "Oct 30" or "2025-10-30" back to Date
  const parseDisplayDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    
    // If it's already in ISO format (yyyy-MM-dd), parse it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr);
    }
    
    // If it's in display format (MMM d), assume current year
    const currentYear = new Date().getFullYear();
    try {
      const date = new Date(`${dateStr}, ${currentYear}`);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  const handleFieldChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev!, [field]: value }));
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        isCompleted: false,
        dueDate: newSubtaskDueDate,
      };
      setEditedTask(prev => ({ ...prev!, subtasks: [...(prev?.subtasks || []), newSubtask] }));
      setNewSubtaskTitle('');
      setNewSubtaskDueDate(undefined);
    }
  };

  const handleToggleSubtaskCompletion = (subtaskId: string, isCompleted: boolean) => {
    setEditedTask(prev => ({
      ...prev!,
      subtasks: prev!.subtasks?.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask
      ),
    }));
  };

  const handleUpdateSubtaskTitle = (subtaskId: string, title: string) => {
    setEditedTask(prev => ({
      ...prev!,
      subtasks: prev!.subtasks?.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, title } : subtask
      ),
    }));
  };

  const handleUpdateSubtaskDueDate = (subtaskId: string, dueDate: string | undefined) => {
    setEditedTask(prev => ({
      ...prev!,
      subtasks: prev!.subtasks?.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, dueDate } : subtask
      ),
    }));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setEditedTask(prev => ({
      ...prev!,
      subtasks: prev!.subtasks?.filter(subtask => subtask.id !== subtaskId),
    }));
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !editedTask.labels.includes(newLabel.trim())) {
      setEditedTask(prev => ({
        ...prev!,
        labels: [...prev!.labels, newLabel.trim()],
      }));
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setEditedTask(prev => ({
      ...prev!,
      labels: prev!.labels.filter(label => label !== labelToRemove),
    }));
  };

  const handleKeyDownLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddLabel();
    }
  };

  const handleSaveChanges = () => {
    onUpdateTask(editedTask);
    onClose();
  };

  return (
    <div className={`fixed top-[var(--pane-header-h)] bottom-0 right-0 w-[480px] bg-[var(--bg-surface)] shadow-[var(--elevation-xl)] flex flex-col z-50 ${task ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300`}>
      
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task details</h2>
        <button 
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col gap-6">
          
          {/* POLISH TASK 1: Task Title - Prominent */}
          <div>
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full text-2xl font-semibold text-[var(--text-primary)] bg-transparent border-0 focus:outline-none focus:ring-0 px-0 py-2"
              placeholder="Task name"
            />
          </div>

          {/* POLISH TASK 2 & 3: Due Date Section */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6">
            <div className="flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              <span>Due date</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-tertiary)] hover:border-[var(--border-hover)] transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>{editedTask.dueDate || "Pick a date"}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={parseDisplayDate(editedTask.dueDate || '')}
                  onSelect={(date) => handleFieldChange('dueDate', date ? format(date, "MMM d") : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* POLISH TASK 4: Priority Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">
              <Flag className="w-4 h-4" />
              <span>Priority</span>
            </div>
            <div className="flex gap-2">
              {['high', 'medium', 'low', 'none'].map(p => (
                <button 
                  key={p}
                  onClick={() => handleFieldChange('priority', p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border-2 capitalize transition-colors ${
                    editedTask.priority === p
                      ? 'border-[var(--primary)] bg-[var(--primary-tint-10)] text-[var(--primary)]'
                      : 'border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint-5)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* POLISH TASK 5: Labels Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">
              <Tag className="w-4 h-4" />
              <span>Labels</span>
            </div>
            {editedTask.labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {editedTask.labels.map((label) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-1 px-[var(--space-2)] py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-normal)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]"
                  >
                    <span>{label}</span>
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleKeyDownLabel}
                className="flex-1 h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] focus:ring-offset-0"
              />
              <button 
                onClick={handleAddLabel}
                disabled={!newLabel.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* POLISH TASK 6: Subtasks Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">
              <span>Subtasks</span>
            </div>
            <div className="flex flex-col gap-2">
              {(editedTask.subtasks || []).map(subtask => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox 
                    checked={subtask.isCompleted}
                    onCheckedChange={(checked) => handleToggleSubtaskCompletion(subtask.id, !!checked)}
                    className="w-5 h-5 shrink-0"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) => handleUpdateSubtaskTitle(subtask.id, e.target.value)}
                    className={`flex-1 h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] ${subtask.isCompleted ? 'line-through text-[var(--text-tertiary)]' : ''}`}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                        onSelect={(date) => handleUpdateSubtaskDueDate(subtask.id, date ? format(date, "yyyy-MM-dd") : undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <button 
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox disabled className="w-5 h-5 shrink-0 opacity-30" />
                <input
                  type="text"
                  placeholder="Add a subtask"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSubtask();
                    }
                  }}
                  className="flex-1 h-9 px-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newSubtaskDueDate ? new Date(newSubtaskDueDate) : undefined}
                      onSelect={(date) => setNewSubtaskDueDate(date ? format(date, "yyyy-MM-dd") : undefined)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <button 
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="flex items-center justify-center w-9 h-9 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* POLISH TASK 7: Description Section */}
          <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-6">
            <div className="flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">
              <span>Description</span>
            </div>
            <textarea
              placeholder="Add notes..."
              value={editedTask.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full min-h-[120px] px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] focus:ring-offset-0 resize-y"
            />
          </div>

        </div>
      </div>
      
      {/* POLISH TASK 8: Footer - Sticky */}
      <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
        <button 
          onClick={() => onDeleteTask(task.id)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete task
        </button>
        
        <button 
          onClick={handleSaveChanges}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-[var(--btn-primary-bg)] text-white hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          Done
        </button>
      </div>
      
    </div>
  );
}
