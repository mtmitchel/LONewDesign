
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import { Separator } from '../../ui/separator';
import { Calendar, Flag, Tag, Trash2, X, ChevronDown, Plus } from 'lucide-react';
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
    <Sheet open={!!task} onOpenChange={onClose}>
      <SheetContent className="fixed inset-y-0 right-0 w-[400px] sm:w-[540px] top-[66px] h-[calc(100vh-64px)] flex flex-col">
        <SheetHeader>
          <SheetTitle>Task details</SheetTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3">
            <X className="w-4 h-4" />
          </Button>
        </SheetHeader>
        <div className="p-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
            <div>
                <Input 
                    id="task-title"
                    value={editedTask.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="text-lg font-semibold border-none focus:ring-0 px-0 h-10"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="due-date" className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Calendar className="w-4 h-4" />
                    Due date
                </Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            {editedTask.dueDate || "Pick a date"}
                        </Button>
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

            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Flag className="w-4 h-4" />
                    Priority
                </Label>
                <div className="flex gap-2">
                    {['high', 'medium', 'low', 'none'].map(p => (
                        <Button 
                            key={p} 
                            variant={editedTask.priority === p ? 'secondary' : 'outline'} 
                            onClick={() => handleFieldChange('priority', p)}
                            className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-pill)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] capitalize"
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="labels" className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Tag className="w-4 h-4" />
                    Labels
                </Label>
                {editedTask.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
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
                <div className="flex gap-2">
                    <Input 
                      id="labels" 
                      placeholder="Add a label" 
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={handleKeyDownLabel}
                      className="h-10 px-[var(--space-3)]" 
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleAddLabel}
                      disabled={!newLabel.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="subtasks" className="text-[var(--text-secondary)]">Subtasks</Label>
                <div className="space-y-2">
                    {(editedTask.subtasks || []).map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2">
                            <Checkbox 
                                checked={subtask.isCompleted}
                                onCheckedChange={(checked) => handleToggleSubtaskCompletion(subtask.id, !!checked)}
                                className="w-5 h-5"
                            />
                            <Input 
                                value={subtask.title}
                                onChange={(e) => handleUpdateSubtaskTitle(subtask.id, e.target.value)}
                                className={`flex-1 h-10 px-[var(--space-3)] ${subtask.isCompleted ? 'line-through text-[var(--text-tertiary)]' : ''}`}
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Calendar className="w-4 h-4" />
                                    </Button>
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
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSubtask(subtask.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <Checkbox disabled className="w-5 h-5" />
                        <Input 
                            placeholder="Add a subtask"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddSubtask();
                                }
                            }}
                            className="flex-1 h-10 px-[var(--space-3)]"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Calendar className="w-4 h-4" />
                                </Button>
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
                        <Button variant="ghost" size="icon" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="text-[var(--text-secondary)]">Description</Label>
                <Textarea 
                    id="description" 
                    placeholder="Add notes..." 
                    value={editedTask.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="min-h-[100px] h-10 px-[var(--space-3)]"
                />
            </div>
        </div>
        <SheetFooter className="mt-auto">
            <div className="flex justify-between w-full">
                <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onDeleteTask(task.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                </Button>
                <Button onClick={handleSaveChanges}>Done</Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
