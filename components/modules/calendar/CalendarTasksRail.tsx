"use client";

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay
} from 'date-fns';
import {
  ArrowUpDown,
  Calendar as CalendarIcon,
  Check,
  Flag,
  MoreHorizontal,
  PanelRight,
  Plus
} from 'lucide-react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
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
import { useTaskStore } from '../tasks/taskStore';
import type { Task } from '../tasks/types';
import { TaskCard } from '../tasks/TaskCard';

// Modular imports
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTaskRailState } from './hooks/useTaskRailState';
import { DueChip } from './components/DueChip';
import { BASE_FILTER_OPTIONS, ChipHigh, ChipMedium, ChipLow } from './constants';
import { parseDueDate, formatHumanDate, emitAnalytics } from './utils';
import type { TaskFilterKey, CalendarTasksRailProps } from './types';
// #endregion Imports and constants

// Chip utility classes for soft priority badges


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
  // #region Store selectors and local state
  const createTaskList = useTaskStore((s) => s.createTaskList);
  const deleteTaskList = useTaskStore((s) => s.deleteTaskList);
  const updateTask = useTaskStore((state) => state.updateTask);

  // Use the modular hook for state management
  const {
    filter,
    setFilter,
    sortBy,
    setSortBy,
    composerActive,
    setComposerActive,
    draftTitle,
    setDraftTitle,
    draftDueDate,
    setDraftDueDate,
    draftPriority,
    setDraftPriority,
    showDatePicker,
    setShowDatePicker,
    showPriorityPicker,
    setShowPriorityPicker,
    liveMessage,
    captureInputRef,
    listViewportRef,
    taskRefs,
    storeTasks,
    lists,
    resetDraft,
    registerTaskNode,
    announce,
    handleCreateTask,
    handleToggleCompletion,
    handleDelete,
    handleDuplicate,
    handleDueDateChange,
    handleTitleCommit,
  } = useTaskRailState(externalFilter);

  const tasks = tasksProp ?? storeTasks;
  const availableLists = lists;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [inlineOpen, setInlineOpen] = React.useState(true);
  // #endregion Store selectors and local state

  // #region Responsive state effects
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
  // #endregion Responsive state effects

  // #region Derived data
  const now = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 0 }), [now]);

  // Generate dynamic filter options including lists from tasks
  const filterOptions = useMemo(() => {
    const listOptions = availableLists.map(list => ({
      value: `list:${list.id}`,
      label: list.name
    }));

    return [...BASE_FILTER_OPTIONS, ...listOptions];
  }, [availableLists]);

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
    
    // Apply sorting: completed tasks always sink to bottom
    return filtered.sort((a, b) => {
      // 1) Bucket by completion status: incomplete first, completed last
      const bucketA = a.isCompleted ? 1 : 0;
      const bucketB = b.isCompleted ? 1 : 0;
      if (bucketA !== bucketB) return bucketA - bucketB;

      // 2) Within each bucket, apply the selected sort mode
      let inner = 0;
      switch (sortBy) {
        case 'due-date': {
          const dateA = parseDueDate(a.dueDate);
          const dateB = parseDueDate(b.dueDate);
          if (!dateA && !dateB) inner = 0;
          else if (!dateA) inner = 1;
          else if (!dateB) inner = -1;
          else inner = dateA.getTime() - dateB.getTime();
          break;
        }
        case 'title':
          inner = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
          const orderA = priorityOrder[a.priority] ?? 3;
          const orderB = priorityOrder[b.priority] ?? 3;
          inner = orderA - orderB;
          break;
        }
        case 'date-created':
        default: {
          const dateA = new Date(a.createdAt || a.dateCreated || 0);
          const dateB = new Date(b.createdAt || b.dateCreated || 0);
          inner = dateB.getTime() - dateA.getTime(); // Newest first
          break;
        }
      }
      if (inner !== 0) return inner;

      // 3) Stable tie-breaker by ID
      return a.id.localeCompare(b.id);
    });
  }, [tasks, filter, sortBy, now, weekEnd]);

  const selectedListId = useMemo(
    () => (filter.startsWith('list:') ? filter.replace('list:', '') : null),
    [filter],
  );
  const selectedListMeta = useMemo(
    () => (selectedListId ? availableLists.find((candidate) => candidate.id === selectedListId) ?? null : null),
    [availableLists, selectedListId],
  );

  const completedCount = useMemo(() => tasks.filter((task) => task.isCompleted).length, [tasks]);
  // #endregion Derived data

  // #region Helpers and handlers
  const setFilterValue = (value: TaskFilterKey) => {
    setFilter(value);
    onFilterChange?.(value);
    emitAnalytics('task_filter_changed', { source: 'calendar_rail', value });
  };

  const focusRow = (index: number) => {
    if (index < 0 || index >= filteredTasks.length) return;
    const target = filteredTasks[index];
    const node = taskRefs.current.get(target.id);
    node?.focus();
  };

  const handleRefresh = () => {
    onRefresh?.();
    emitAnalytics('task_list_refresh', { source: 'calendar_rail' });
    announce('Task list refreshed');
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
  // #endregion Helpers and handlers

  // #region Render
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
              <DropdownMenuItem
                disabled={!selectedListMeta}
                onClick={() => {
                  if (selectedListMeta) {
                    deleteTaskList(selectedListMeta.id);
                  }
                }}
                className="text-[color:var(--accent-coral)]"
              >
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content area with lane wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
        <div className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-3)]">
          {/* Swim lane background */}
          <div className="bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] p-[var(--space-3)]">
          {/* Filter */}
          <div className="mb-3">
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
          {/* Task List */}
          <div
            ref={listViewportRef}
            role="presentation"
          >
            {loading ? (
              renderSkeleton()
            ) : filteredTasks.length === 0 ? (
              renderEmptyState()
            ) : (
              <ul
                role="list"
                className="flex flex-col gap-2"
              >
              {filteredTasks.map((task, index) => {
                const dueDate = task.dueDate ? format(parseDueDate(task.dueDate) ?? new Date(), 'MMM d') : undefined;
                return (
                  <TaskCard
                    key={task.id}
                    taskTitle={task.title}
                    dueDate={dueDate}
                    priority={task.priority}
                    labels={task.labels}
                    isCompleted={task.isCompleted}
                    onToggleCompletion={() => handleToggleCompletion(task)}
                    onClick={() => console.log('Open task:', task.id)}
                    onEdit={() => console.log('Edit task:', task.id)}
                    onDuplicate={() => handleDuplicate(task.id)}
                    onDelete={() => handleDelete(task.id)}
                  />
                );
              })}
            </ul>
          )}
          </div>
          
          {/* Add Task Button inside swim lane */}
          {!composerActive && !draftTitle && !draftDueDate && draftPriority === 'none' ? (
            <div className="mt-2">
              <button
                onClick={() => setComposerActive(true)}
                className="w-full inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface)] motion-safe:transition-colors duration-[var(--duration-fast)]"
              >
                <Plus className="w-4 h-4" />
                <span>Add task</span>
              </button>
            </div>
          ) : (
          <div className="rounded-[var(--radius-md)] bg-[var(--bg-surface)] border-2 border-[var(--primary)] px-[var(--space-3)] py-[var(--space-3)] mt-3">
              <div className="flex items-start gap-3">
                {/* Empty circular checkbox */}
                <div className="w-4 h-4 mt-0.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]"></div>
                
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
                    className="w-full h-auto px-0 border-0 text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
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
                    className="h-auto py-1 text-[length:var(--text-xs)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
                          draftDueDate ? 'text-[color:var(--text-primary)] bg-[var(--bg-surface-elevated)]' : 'text-[color:var(--text-tertiary)]'
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
                          draftPriority !== 'none' ? 'text-[color:var(--text-primary)] bg-[var(--bg-surface-elevated)]' : 'text-[color:var(--text-tertiary)]'
                        }`}
                        title="Set priority"
                      >
                        <Flag className="w-4 h-4" />
                        <span className="sr-only">Set priority</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="min-w-[240px] p-[var(--space-2)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--elevation-lg)] bg-[var(--bg-surface)]">
                      <div role="menu" className="flex flex-col gap-[var(--space-1)]">
                        {(['high', 'medium', 'low', 'none'] as const).map((p) => {
                          const isActive = draftPriority === p;
                          const labels = { high: 'High', medium: 'Medium', low: 'Low', none: 'No priority' };
                          return (
                            <button
                              key={p}
                              role="menuitemradio"
                              aria-checked={isActive}
                              data-checked={isActive}
                              type="button"
                              onClick={() => {
                                setDraftPriority(p);
                                setShowPriorityPicker(false);
                              }}
                              className="w-full grid grid-cols-[1fr_auto] items-center px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] hover:bg-[var(--primary-tint-5)] data-[checked=true]:bg-[var(--primary-tint-10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-0 rounded-[var(--radius-sm)]"
                              title={labels[p]}
                            >
                              <span className="flex items-center gap-[var(--space-2)]">
                                {isActive && <Check className="h-4 w-4 text-[color:var(--primary)]" aria-hidden="true" />}
                                <span>{labels[p]}</span>
                              </span>
                              {p === 'high' && <span className={ChipHigh}>High</span>}
                              {p === 'medium' && <span className={ChipMedium}>Medium</span>}
                              {p === 'low' && <span className={ChipLow}>Low</span>}
                              {p === 'none' && <span className="inline-block w-[var(--priority-dot-size)] h-[var(--priority-dot-size)] rounded-full bg-[var(--priority-dot-color)]" aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
          </div> {/* Close swim lane div */}
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {liveMessage}
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
// #endregion Render

// TaskRow component removed - now using TaskCard from tasks module
