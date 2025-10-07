"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parseISO,
  startOfDay
} from 'date-fns';
import {
  ArrowUpDown,
  CalendarDays,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Copy,
  EllipsisVertical,
  Flag,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as DatePicker } from '../../ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { cn } from '../../ui/utils';
import { useTaskStore, TaskInput } from '../tasks/taskStore';
import { TASK_LISTS } from '../tasks/constants';
import type { Task } from '../tasks/types';

type TaskFilterKey = 'all' | 'today' | 'this-week' | 'completed' | string;

type CalendarTasksRailProps = {
  tasks?: Task[];
  className?: string;
  filter?: TaskFilterKey;
  loading?: boolean;
  onFilterChange?: (filter: TaskFilterKey) => void;
  onAdd?: (task: Partial<Task>) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
};

// Base filter options - list-based filters will be added dynamically
const BASE_FILTER_OPTIONS: { value: TaskFilterKey; label: string }[] = [
  { value: 'all', label: 'All tasks' }
];

const BUFFER_ROWS = 4;

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function parseDueDate(value?: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

function formatHumanDate(date: Date) {
  return format(date, 'EEE, MMM d');
}

function emitAnalytics(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('task:instrument', { detail: { event, payload } }));
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[task-rail] ${event}`, payload ?? {});
  }
}

// DueChip component - compact inline date display with state-based coloring
type DueState = 'default' | 'today' | 'overdue';

function computeDueState(dueDate: Date, isCompleted: boolean): { text: string; tone: DueState } {
  const now = startOfDay(new Date());
  const due = startOfDay(dueDate);
  
  if (isCompleted) {
    return { text: format(due, 'MMM d'), tone: 'default' };
  }
  
  if (isSameDay(due, now)) {
    return { text: 'Today', tone: 'today' };
  }
  
  if (isBefore(due, now)) {
    return { text: format(due, 'MMM d'), tone: 'overdue' };
  }
  
  return { text: format(due, 'MMM d'), tone: 'default' };
}

function DueChip({ isoDate, isCompleted }: { isoDate: string; isCompleted: boolean }) {
  const date = parseDueDate(isoDate);
  if (!date) return null;
  
  const { text, tone } = computeDueState(date, isCompleted);
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[var(--space-1)] text-xs leading-[var(--text-sm-line)]',
        tone === 'overdue' && 'text-[color:var(--due-overdue)]',
        tone === 'today' && 'text-[color:var(--due-today)]',
        tone === 'default' && 'text-[color:var(--due-default)]'
      )}
      title={date.toDateString()}
    >
      <CalendarDays className="h-[var(--icon-sm)] w-[var(--icon-sm)]" aria-hidden="true" />
      {text}
    </span>
  );
}

export function CalendarTasksRail({
  tasks: tasksProp,
  className,
  filter: externalFilter = 'all',
  loading = false,
  onFilterChange,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh
}: CalendarTasksRailProps) {
  const {
    tasks: storeTasks,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskCompletion,
    setTaskDueDate
  } = useTaskStore();

  const tasks = tasksProp ?? storeTasks;
  const [filter, setFilter] = useState<TaskFilterKey>(externalFilter);
  const [sortBy, setSortBy] = useState<'date-created' | 'due-date' | 'title' | 'priority'>('date-created');
  const [composerActive, setComposerActive] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDueDate, setDraftDueDate] = useState<Date | undefined>(undefined);
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high' | 'none'>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inlineOpen, setInlineOpen] = useState(true);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const listViewportRef = useRef<HTMLDivElement | null>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isBelowLg = useMediaQuery('(max-width: 1279px)');
  const isBelowMd = useMediaQuery('(max-width: 1023px)');

  useEffect(() => {
    setInlineOpen(!isBelowLg);
  }, [isBelowLg]);

  useEffect(() => {
    if (isBelowMd) {
      setDialogOpen(false);
    }
  }, [isBelowMd]);

  useEffect(() => {
    setFilter(externalFilter);
  }, [externalFilter]);

  useEffect(() => {
    if (!liveMessage) return;
    const timeout = window.setTimeout(() => setLiveMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [liveMessage]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      if (event.key.toLowerCase() === 't') {
        captureInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const now = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 0 }), [now]);

  // Generate dynamic filter options including lists from tasks
  const filterOptions = useMemo(() => {
    // Create list filter options from TASK_LISTS constant
    const listOptions = TASK_LISTS.map(list => ({
      value: `list:${list.id}`,
      label: list.title
    }));
    
    return [...BASE_FILTER_OPTIONS, ...listOptions];
  }, []);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      // Handle list-based filtering
      if (filter.startsWith('list:')) {
        const listId = filter.replace('list:', '');
        return task.listId === listId;
      }
      
      if (filter === 'completed') {
        return task.isCompleted;
      }

      if (filter === 'today' || filter === 'this-week') {
        const due = parseDueDate(task.dueDate);
        if (!due) return false;
        if (filter === 'today') {
          return isSameDay(due, now);
        }
        return isAfter(due, now) && isBefore(due, weekEnd);
      }

      return true;
    });
    
    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due-date': {
          const dateA = parseDueDate(a.dueDate);
          const dateB = parseDueDate(b.dueDate);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        }
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
          const orderA = priorityOrder[a.priority] ?? 3;
          const orderB = priorityOrder[b.priority] ?? 3;
          return orderA - orderB;
        }
        case 'date-created':
        default: {
          const dateA = new Date(a.createdAt || a.dateCreated || 0);
          const dateB = new Date(b.createdAt || b.dateCreated || 0);
          return dateB.getTime() - dateA.getTime(); // Newest first
        }
      }
    });
  }, [tasks, filter, sortBy, now, weekEnd]);

  const completedCount = useMemo(() => tasks.filter((task) => task.isCompleted).length, [tasks]);

  const setFilterValue = (value: TaskFilterKey) => {
    setFilter(value);
    onFilterChange?.(value);
    emitAnalytics('task_filter_changed', { source: 'calendar_rail', value });
  };

  const resetDraft = () => {
    setDraftTitle('');
    setDraftDueDate(undefined);
    setDraftPriority('none');
    setShowDatePicker(false);
    setShowPriorityPicker(false);
    setComposerActive(false);
  };

  const focusRow = (index: number) => {
    if (index < 0 || index >= filteredTasks.length) return;
    const target = filteredTasks[index];
    const node = taskRefs.current.get(target.id);
    node?.focus();
  };

  const registerTaskNode = useCallback((taskId: string, node: HTMLDivElement | null) => {
    if (!node) {
      taskRefs.current.delete(taskId);
    } else {
      taskRefs.current.set(taskId, node);
    }
  }, []);

  const announce = (message: string) => {
    setLiveMessage(message);
  };

  const handleRefresh = () => {
    onRefresh?.();
    emitAnalytics('task_list_refresh', { source: 'calendar_rail' });
    announce('Task list refreshed');
  };

  const handleCreateTask = () => {
    if (!draftTitle.trim()) return;
    const dueDate = draftDueDate ? format(draftDueDate, 'yyyy-MM-dd') : undefined;
    const priority = draftPriority !== 'none' ? draftPriority : 'none';
    const payload: Partial<Task> = {
      title: draftTitle.trim(),
      status: 'todo',
      listId: 'todo',
      priority,
      dueDate,
      isCompleted: false,
      labels: []
    };

    const taskInput: TaskInput = {
      title: draftTitle.trim(),
      status: 'todo',
      listId: 'todo',
      priority,
      dueDate,
      labels: [],
      isCompleted: false,
      source: 'calendar_rail'
    };

    if (onAdd) {
      onAdd(payload);
    } else {
      addTask(taskInput);
    }

    emitAnalytics('task_created', { source: 'calendar_rail' });
    announce('Task created');
    resetDraft();
  };

  const handleToggleCompletion = (task: Task) => {
    toggleTaskCompletion(task.id);
    const nextState = task.isCompleted ? 'task_reopened' : 'task_completed';
    emitAnalytics(nextState, { source: 'calendar_rail', id: task.id });
    announce(nextState === 'task_completed' ? 'Task completed' : 'Task reopened');
  };

  const handleDelete = (taskId: string) => {
    if (onDelete) {
      onDelete(taskId);
    } else {
      deleteTask(taskId);
    }
    emitAnalytics('task_deleted', { source: 'calendar_rail', id: taskId });
    announce('Task deleted');
  };

  const handleDuplicate = (taskId: string) => {
    const duplicate = duplicateTask(taskId);
    if (duplicate) {
      emitAnalytics('task_created', { source: 'calendar_rail', parentId: taskId, id: duplicate.id, reason: 'duplicate' });
      announce('Task duplicated');
    }
  };

  const handleDueDateChange = (task: Task, date: Date | undefined) => {
    const previous = task.dueDate ? formatHumanDate(parseDueDate(task.dueDate) ?? new Date(task.dueDate)) : 'none';
    const iso = date ? format(date, 'yyyy-MM-dd') : undefined;
    if (onUpdate) {
      onUpdate(task.id, { dueDate: iso });
    } else {
      setTaskDueDate(task.id, iso);
    }
    const nextLabel = iso ? formatHumanDate(date!) : 'none';
    emitAnalytics('task_due_changed', { source: 'calendar_rail', id: task.id, previous, next: nextLabel });
    announce(`Due date set to ${nextLabel}`);
  };

  const handlePinToggle = (task: Task) => {
    const next = !task.isPinned;
    if (onUpdate) {
      onUpdate(task.id, { isPinned: next });
    } else {
      updateTask(task.id, { isPinned: next });
    }
    emitAnalytics('task_pin_toggled', { source: 'calendar_rail', id: task.id, pinned: next });
    announce(next ? 'Task pinned' : 'Task unpinned');
  };

  const handleTitleCommit = (task: Task, title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) return;
    if (onUpdate) {
      onUpdate(task.id, { title: trimmed });
    } else {
      updateTask(task.id, { title: trimmed });
    }
  };

  const handleTasksToggle = (open: boolean, surface: 'dialog' | 'inline') => {
    emitAnalytics('task_rail_toggled', { open, surface });
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, absoluteIndex: number, task: Task) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusRow(absoluteIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusRow(absoluteIndex - 1);
      return;
    }
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      handleToggleCompletion(task);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      handleToggleCompletion(task);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      handleDuplicate(task.id);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
      handleDelete(task.id);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-[var(--space-4)] py-[var(--space-8)] text-center">
      <div className="rounded-full bg-[var(--bg-muted)] p-[var(--space-4)]">
        <Plus className="h-6 w-6 text-[color:var(--text-muted)]" aria-hidden="true" />
      </div>
      <div className="space-y-[var(--space-1)]">
        <p className="text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">No tasks</p>
        <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">Add a task to get started.</p>
      </div>
    </div>
  );

  const renderSkeleton = () => (
    <ul className="flex flex-col divide-y divide-[var(--border-subtle)]" role="list" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={`skeleton-${index}`} className="animate-pulse px-[var(--space-3)] py-[var(--space-3)]">
          <div className="h-4 w-3/4 rounded bg-[var(--bg-muted)]" />
        </li>
      ))}
    </ul>
  );

  const railCard = (
    <section
      role="region"
      aria-labelledby="tasks-rail-heading"
      className="flex min-w-0 flex-col rounded-[var(--tasks-rail-radius)] border border-[var(--tasks-rail-border)] bg-[var(--tasks-rail-card-bg)] shadow-[var(--tasks-rail-shadow)]"
    >
      {/* Header - 60px to match calendar header */}
      <div className="flex h-[60px] items-center justify-between border-b border-[var(--border-divider)] px-4">
        <div className="flex items-center gap-2">
          <h2 id="tasks-rail-heading" className="text-[length:var(--text-base)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)]">
            Tasks
          </h2>
          <span className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-[var(--bg-surface-elevated)] rounded" title="Sort tasks">
                <ArrowUpDown className="h-4 w-4 text-[color:var(--text-tertiary)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setSortBy('date-created')}
              >
                {sortBy === 'date-created' && <Check className="h-4 w-4" />}
                {sortBy !== 'date-created' && <span className="h-4 w-4"></span>}
                <span>Date created</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setSortBy('due-date')}
              >
                {sortBy === 'due-date' && <Check className="h-4 w-4" />}
                {sortBy !== 'due-date' && <span className="h-4 w-4"></span>}
                <span>Due date</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setSortBy('title')}
              >
                {sortBy === 'title' && <Check className="h-4 w-4" />}
                {sortBy !== 'title' && <span className="h-4 w-4"></span>}
                <span>Title</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setSortBy('priority')}
              >
                {sortBy === 'priority' && <Check className="h-4 w-4" />}
                {sortBy !== 'priority' && <span className="h-4 w-4"></span>}
                <span>Priority</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-[var(--bg-surface-elevated)] rounded" title="More options">
                <MoreHorizontal className="h-4 w-4 text-[color:var(--text-tertiary)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log('Toggle completed tasks')}>
                Hide completed tasks
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log('Rename list')}>
                Rename list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Delete list')} className="text-[color:var(--accent-coral)]">
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content area with proper spacing */}
      <div className="flex-1 overflow-y-auto">
        {/* Filter - reduce top margin */}
        <div className="px-4 pt-4 pb-3">
          <Select value={filter} onValueChange={(value) => setFilterValue(value as TaskFilterKey)}>
            <SelectTrigger className="h-9 w-full border-[var(--border-default)] bg-[var(--bg-surface)] text-[length:var(--text-sm)]">
              <SelectValue placeholder="Filter tasks" />
            </SelectTrigger>
            <SelectContent align="end">
              {filterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Task Input - reduce margins */}
        <div className="px-4 pb-2">
        {!composerActive && !draftTitle && !draftDueDate && draftPriority === 'none' ? (
          <button
            onClick={() => setComposerActive(true)}
            className="w-full bg-white rounded-[var(--radius-sm)] border border-[var(--border-subtle)] shadow-[var(--elevation-sm)] p-3 text-left hover:shadow-[var(--elevation-md)] motion-safe:transition-shadow duration-[var(--duration-fast)]"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-[color:var(--text-tertiary)]" />
              <span className="text-[length:var(--text-sm)] text-[var(--text-tertiary)]">Add task</span>
            </div>
          </button>
        ) : (
          <div className="bg-white rounded-[var(--radius-sm)] border-2 border-[var(--primary)] shadow-[var(--elevation-sm)] p-3">
              <div className="flex items-start gap-3">
                {/* Empty checkbox */}
                <div className="w-4 h-4 mt-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)]"></div>
                
                {/* Input */}
                <div className="flex-1">
                  <Input
                    ref={captureInputRef}
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);
                      setComposerActive(true);
                    }}
                    onFocus={() => setComposerActive(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleCreateTask();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        resetDraft();
                      }
                    }}
                    placeholder="Write a task name"
                    aria-label="Add task"
                    className="w-full h-auto px-0 border-0 text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    autoFocus
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-divider)]">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateTask}
                    className="h-auto py-1 text-[length:var(--text-xs)] font-[var(--font-weight-medium)]"
                    aria-keyshortcuts="Enter"
                  >
                    Add task
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetDraft}
                    aria-keyshortcuts="Escape"
                    className="h-auto py-1 text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`p-1 hover:bg-[var(--bg-surface-elevated)] rounded ${
                          draftDueDate ? 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)]' : 'text-[var(--text-tertiary)]'
                        }`}
                        title="Set due date"
                        aria-keyshortcuts="Ctrl+D"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span className="sr-only">Set due date</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="p-[var(--space-2)]">
                      <DatePicker
                        mode="single"
                        selected={draftDueDate}
                        onSelect={(date) => {
                          setDraftDueDate(date ?? undefined);
                          setShowDatePicker(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover open={showPriorityPicker} onOpenChange={setShowPriorityPicker}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`p-1 hover:bg-[var(--bg-surface-elevated)] rounded ${
                          draftPriority !== 'none' ? 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)]' : 'text-[var(--text-tertiary)]'
                        }`}
                        title="Set priority"
                      >
                        <Flag className="w-4 h-4" />
                        <span className="sr-only">Set priority</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1.5">
                      <div className="flex flex-col gap-0.5">
                        {(['high', 'medium', 'low', 'none'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setDraftPriority(p);
                              setShowPriorityPicker(false);
                            }}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] capitalize hover:bg-[var(--bg-surface-elevated)] text-left ${
                              draftPriority === p ? 'bg-[var(--bg-surface-elevated)]' : ''
                            }`}
                          >
                            {p === 'high' && <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] bg-red-500 text-white">High</span>}
                            {p === 'medium' && <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] bg-orange-500 text-white">Medium</span>}
                            {p === 'low' && <span className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] bg-blue-500 text-white">Low</span>}
                            {p === 'none' && <span>No priority</span>}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
        )}
        </div>

        {/* Task List - tighter card spacing */}
        <div className="px-4 pb-4">
          <div
            ref={listViewportRef}
            className="max-h-[calc(100dvh-320px)] overflow-y-auto"
            role="presentation"
          >
            {loading ? (
              renderSkeleton()
            ) : filteredTasks.length === 0 ? (
              renderEmptyState()
            ) : (
              <ul
                role="list"
                className="space-y-1.5"
              >
              {filteredTasks.map((task, index) => {
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => handleToggleCompletion(task)}
                    onTitleCommit={(title) => handleTitleCommit(task, title)}
                    onDueChange={(date) => handleDueDateChange(task, date)}
                    onDelete={() => handleDelete(task.id)}
                    onDuplicate={() => handleDuplicate(task.id)}
                    onPinToggle={() => handlePinToggle(task)}
                    onKeyDown={(event) => handleRowKeyDown(event, index, task)}
                    registerRef={(node) => registerTaskNode(task.id, node)}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      </div>
    </section>
  );

  if (isBelowMd) {
    return (
      <div className={cn('flex flex-col items-end gap-[var(--space-3)]', className)}>
        <Button
          size="sm"
          variant="outline"
          className="gap-[var(--space-2)]"
          onClick={() => {
            const next = !dialogOpen;
            setDialogOpen(next);
            handleTasksToggle(next, 'dialog');
          }}
        >
          <PanelRight className="h-4 w-4" /> Tasks
        </Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            handleTasksToggle(open, 'dialog');
          }}
        >
          <DialogContent className="max-w-lg overflow-hidden border-0 bg-transparent p-0 shadow-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Tasks</DialogTitle>
            </DialogHeader>
            {railCard}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-end gap-[var(--space-3)]', className)}>
      {isBelowLg && (
        <Button
          size="sm"
          variant="ghost"
          className="gap-[var(--space-2)] text-[color:var(--text-secondary)]"
          onClick={() => {
            const next = !inlineOpen;
            setInlineOpen(next);
            handleTasksToggle(next, 'inline');
          }}
        >
          <PanelRight className="h-4 w-4" /> Tasks
        </Button>
      )}
      <div
        className={cn(
          'w-[var(--calendar-rail-w)] transition-all duration-300 ease-in-out',
          isBelowLg && !inlineOpen ? 'pointer-events-none -translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        )}
      >
        {(!isBelowLg || inlineOpen) && railCard}
      </div>
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  onToggle: () => void;
  onTitleCommit: (title: string) => void;
  onDueChange: (date: Date | undefined) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPinToggle: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  registerRef: (node: HTMLDivElement | null) => void;
};

function TaskRow({
  task,
  onToggle,
  onTitleCommit,
  onDueChange,
  onDelete,
  onDuplicate,
  onPinToggle,
  onKeyDown,
  registerRef
}: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [dueOpen, setDueOpen] = useState(false);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);

  const commitTitle = () => {
    onTitleCommit(titleDraft);
    setEditing(false);
  };

  return (
    <li role="listitem">
      <div
        ref={registerRef}
        tabIndex={0}
        draggable="true"
        className={cn(
          'group bg-white rounded-[var(--radius-sm)] border border-[var(--border-subtle)] shadow-[var(--elevation-sm)] p-3 cursor-grab active:cursor-grabbing hover:shadow-[var(--elevation-md)] motion-safe:transition-shadow duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
          task.isCompleted && 'opacity-60'
        )}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={task.isCompleted}
            onCheckedChange={onToggle}
            aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            className="w-4 h-4 mt-0.5 rounded border border-[var(--border-default)] text-[var(--primary)]"
          />
          
          {/* Task content */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <Input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitTitle();
                  if (event.key === 'Escape') {
                    setTitleDraft(task.title);
                    setEditing(false);
                  }
                }}
                className="h-7 text-[length:var(--text-sm)]"
                autoFocus
              />
            ) : (
              <>
                {/* Task name */}
                <button
                  type="button"
                  className={cn(
                    'text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] text-left w-full truncate',
                    task.isCompleted && 'line-through opacity-60'
                  )}
                  title={task.title}
                  onClick={() => setEditing(true)}
                >
                  {task.title}
                </button>
                
                {/* Date - if exists */}
                {task.dueDate && (
                  <Popover open={dueOpen} onOpenChange={setDueOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="flex items-center gap-1 mt-1" aria-label="Change due date">
                        <CalendarIcon className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <span className="text-[length:var(--text-xs)] text-[var(--text-secondary)]">
                          {format(parseDueDate(task.dueDate) ?? new Date(), 'MMM d')}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-[var(--space-2)]">
                      <DatePicker
                        mode="single"
                        selected={parseDueDate(task.dueDate)}
                        onSelect={(date) => {
                          onDueChange(date ?? undefined);
                          setDueOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </>
            )}
          </div>
          
          {/* Actions - hidden by default, shown on hover */}
          <div className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-[var(--duration-fast)]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title="More options" className="grid place-items-center h-5 w-5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">
                  <EllipsisVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggle}>
                  <CheckCircle2 className="mr-[var(--space-2)] h-4 w-4" />
                  {task.isCompleted ? 'Reopen' : 'Mark as complete'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDueChange(startOfDay(new Date()))}
                >
                  <CalendarIcon className="mr-[var(--space-2)] h-4 w-4" />
                  Set to today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate} aria-keyshortcuts="Ctrl+D Meta+D">
                  <Copy className="mr-[var(--space-2)] h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditing(true)}>
                  <Pencil className="mr-[var(--space-2)] h-4 w-4" />
                  Edit title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-[color:var(--task-danger)]" aria-keyshortcuts="Ctrl+Backspace Meta+Backspace">
                  <Trash2 className="mr-[var(--space-2)] h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </li>
  );
}
