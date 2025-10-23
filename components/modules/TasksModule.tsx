
"use client";

import React, { useEffect, useState } from 'react';
import { 
  KanbanSquare, List, Search, Plus, Filter, RefreshCw, ChevronDown,
  MoreHorizontal, CheckSquare, Clock, Calendar, ArrowUpDown,
  Trash, Edit, Copy, Move, Archive, Flag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge, badgeVariants } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '../ui/context-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { cn } from '../ui/utils';
import { TaskComposer, type ComposerLabel } from './tasks/TaskComposer';
import { DueDateChip, getDueMeta } from './tasks/DueDateChip';
import { TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS, getLabelHue } from './tasks/taskChipStyles';
import { TasksBoard } from './tasks/TasksBoard';
import TaskDetailsDrawer from './tasks/TaskDetailsDrawer';
import { SegmentedToggle } from '../controls/SegmentedToggle';
import { TASK_LISTS } from './tasks/constants';
import type { Task, TaskLabel } from './tasks/types';
import { projects } from './projects/data';
import { openQuickAssistant } from '../assistant';
import { useTaskStore, useTasks, selectSyncStatus } from './tasks/taskStore';
import { shallow } from 'zustand/shallow';
import { toast } from 'sonner';

const getLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;
const LIST_VIEW_GRID_TEMPLATE = 'minmax(320px, 1fr) 140px 110px 240px';

// Sort comparator: completed tasks at bottom, manual order for active tasks
function compareTasks(a: Task, b: Task): number {
  // 1) Incomplete tasks above completed tasks
  if (a.isCompleted !== b.isCompleted) {
    return a.isCompleted ? 1 : -1;
  }

  // 2) Within active tasks: manual order if present, else due date soonest first
  if (!a.isCompleted) {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    
    // Due date comparison (tasks with due dates come first)
    const ad = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
    const bd = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;

    // Priority tie-breaker (high → medium → low)
    const pr = (p: Task['priority']) => (p === 'high' ? 0 : p === 'medium' ? 1 : p === 'low' ? 2 : 3);
    if (pr(a.priority) !== pr(b.priority)) {
      return pr(a.priority) - pr(b.priority);
    }

    // Final tie-breaker: creation date (oldest first)
    const aCreated = a.dateCreated ?? a.createdAt;
    const bCreated = b.dateCreated ?? b.createdAt;
    return Date.parse(aCreated) - Date.parse(bCreated);
  }

  // 3) Within completed tasks: oldest completion first (recently completed at bottom)
  const ac = a.completedAt ? Date.parse(a.completedAt) : 0;
  const bc = b.completedAt ? Date.parse(b.completedAt) : 0;
  return ac - bc;
}

export function TasksModule() {
  const tasks = useTasks();
  const tasksById = useTaskStore((state) => state.tasksById);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const duplicateTask = useTaskStore((state) => state.duplicateTask);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null); // null means "All lists"
  const [globalSort, setGlobalSort] = useState<'due-date' | 'date-created' | 'priority'>('date-created');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listComposerSection, setListComposerSection] = useState<string | null>(null);
  const [labelsColorMap, setLabelsColorMap] = useState<Map<string, string>>(new Map());
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  
  // Use task lists from store (Google Tasks sync)
  const taskLists = useTaskStore((state) => 
    state.listOrder.map((id) => state.listsById[id]).filter(Boolean)
  );
  const columns = React.useMemo(() => 
    taskLists.map(list => ({ id: list.id, title: list.name })),
    [taskLists]
  );
  
  const [deleteListDialog, setDeleteListDialog] = useState<{ isOpen: boolean; listId: string; listTitle: string; taskCount: number } | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      setProjectFilter(detail?.projectId ?? null);
    };
    window.addEventListener('tasks:set-project-scope', listener as EventListener);
    return () => window.removeEventListener('tasks:set-project-scope', listener as EventListener);
  }, []);

  const activeProject = React.useMemo(() => projects.find((project) => project.id === projectFilter), [projectFilter]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const taskLabels = Array.isArray(task.labels)
      ? task.labels
      : typeof task.labels === 'string'
        ? (() => { try { const v = JSON.parse(task.labels as unknown as string); return Array.isArray(v) ? v : []; } catch { return []; } })()
        : [];
    const matchesLabels = selectedLabels.length === 0 || 
      taskLabels.some(label => selectedLabels.includes(getLabelName(label)));
    const matchesList =
      selectedList === null ||
      task.listId === selectedList ||
      task.boardListId === selectedList ||
      task.status === selectedList;
    const matchesProject = projectFilter === null || task.projectId === projectFilter;
    return matchesSearch && matchesLabels && matchesList && matchesProject;
  });

  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[TasksModule]', {
        totalTasks: tasks.length,
        filteredTasks: filteredTasks.length,
        columns: columns.length,
        selectedList,
        projectFilter,
      });
    }
  }, [tasks.length, filteredTasks.length, columns.length, selectedList, projectFilter]);

  // Get all unique labels from tasks with their colors
  React.useEffect(() => {
    const newMap = new Map<string, string>();
    tasks.forEach(task => {
      const taskLabels = Array.isArray(task.labels)
        ? task.labels
        : typeof task.labels === 'string'
          ? (() => { try { const v = JSON.parse(task.labels as unknown as string); return Array.isArray(v) ? v : []; } catch { return []; } })()
          : [];
      taskLabels.forEach(label => {
        const name = getLabelName(label);
        const color = getLabelColor(label);
        if (!newMap.has(name)) {
          newMap.set(name, color);
        }
      });
    });
    setLabelsColorMap(newMap);
  }, [tasks]);
  
  const allLabels = Array.from(labelsColorMap.keys()).sort();
  const availableLabelOptions = React.useMemo(
    () => Array.from(labelsColorMap.entries()).map(([name, color]) => ({ name, color })),
    [labelsColorMap],
  );

  const getTaskLevel = React.useCallback(
    (task: Task): number => {
      const record = task as unknown as Record<string, unknown>;

      const directLevelKeys: readonly string[] = ['level', 'depth', 'indentLevel', 'nestingLevel', 'hierarchyLevel'];
      for (const key of directLevelKeys) {
        const candidate = record[key];
        if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
          return Math.floor(candidate);
        }
      }

      const ancestors = record.ancestors;
      if (Array.isArray(ancestors)) {
        return Math.max(0, ancestors.length);
      }

      const findParentId = (source: Record<string, unknown>): string | undefined => {
        const candidates = [source.parentId, source.parent_id, source.parentTaskId, source.parentTaskID, source.parent];
        for (const value of candidates) {
          if (typeof value === 'string' && value.trim().length > 0) {
            return value;
          }
        }
        return undefined;
      };

      let currentParent = findParentId(record);
      if (!currentParent) {
        return 0;
      }

      let depth = 0;
      const visited = new Set<string>();
      while (currentParent) {
        if (visited.has(currentParent)) {
          break;
        }
        visited.add(currentParent);
        depth += 1;
        const parentTask = tasksById[currentParent];
        if (!parentTask) {
          break;
        }
        currentParent = findParentId(parentTask as unknown as Record<string, unknown>);
      }

      return Math.max(0, depth);
    },
    [tasksById],
  );

  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleAddTaskToColumn = (
    listId: string,
    draft: {
      title: string;
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high' | 'none';
      labels?: ComposerLabel[];
    },
  ) => {
    addTask({
      title: draft.title,
      status: listId,
      priority: draft.priority ?? 'none',
      dueDate: draft.dueDate,
      labels: draft.labels?.map((label) => ({ name: label.name, color: label.color })) ?? [],
      isCompleted: false,
      listId,
      projectId: projectFilter ?? undefined,
      source: 'tasks_module',
    });
  };

  const moveTask = useTaskStore((s) => s.moveTask);
  const handleMoveTask = (taskId: string, newListId: string) => {
    const task = useTaskStore.getState().tasksById[taskId];
    if (!task) return;
    if (task.listId === newListId) {
      // within-list reorder handled elsewhere
      return;
    }
    void moveTask(taskId, newListId);
  };

  const getTasksForList = (listId: string): Task[] => {
    const tasksForList = filteredTasks.filter((task) => {
      if (!listId) return false;
      if (task.listId === listId) return true;
      if (task.boardListId === listId) return true;
      return task.status === listId;
    });

    if (globalSort === 'due-date') {
      return [...tasksForList].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    if (globalSort === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
      return [...tasksForList].sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0));
    }

    return [...tasksForList].sort(compareTasks);
  };

  const handleEditTask = (task: Task) => console.log("Edit task", task);
  
  const handleDuplicateTask = (task: Task) => {
    duplicateTask(task.id);
    toast.success('Task duplicated');
  };
  
  const handleUpdateTask = async (updatedTask: Task, options?: { showToast?: boolean }) => {
    const shouldToast = options?.showToast ?? true;
    try {
      await updateTask(updatedTask.id, updatedTask);
      if (shouldToast) {
        toast.success('Task updated');
      }
    } catch (e) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
    toast.success('Task deleted');
    if (selectedTask?.id === taskId) {
      setSelectedTask(null); // Close side panel if the deleted task was open
    }
  };

  const handleOpenAssistant = React.useCallback(() => {
    const scope = projectFilter ? { projectId: projectFilter } : undefined;
    openQuickAssistant({ mode: 'task', scope });
  }, [projectFilter]);

  const createTaskList = useTaskStore((s) => s.createTaskList);
  const deleteTaskList = useTaskStore((s) => s.deleteTaskList);
  const syncNow = useTaskStore((s) => s.syncNow);

  const handleAddList = async () => {
    const title = newListName.trim();
    if (!title) return;
    try {
      await createTaskList(title);
      toast.success('List created');
    } catch (e) {
      console.error('[TasksModule] Failed to create list:', e);
      toast.error('Failed to create list');
    } finally {
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const handleDeleteList = (listId: string) => {
    // Don't allow deleting default lists
    const defaultListIds = TASK_LISTS.map(list => list.id as string);
    if (defaultListIds.includes(listId)) {
      return; // Silently ignore - default lists shouldn't show delete option
    }
    
    const list = columns.find(col => col.id === listId);
    const tasksInList = tasks.filter(task => task.listId === listId);
    
    // Show confirmation dialog
    setDeleteListDialog({
      isOpen: true,
      listId,
      listTitle: list?.title || 'this list',
      taskCount: tasksInList.length
    });
  };

  const [fallbackList, setFallbackList] = useState<string>('todo');

  const confirmDeleteList = async () => {
    if (!deleteListDialog) return;
    const { listId } = deleteListDialog;
    try {
      await deleteTaskList(listId, fallbackList);
      toast.success('List deleted');
    } catch (e) {
      console.error('[TasksModule] Failed to delete list:', e);
      toast.error('Failed to delete list');
    } finally {
      setDeleteListDialog(null);
    }
  };

  const BoardView = () => (
    <div className="flex-1 bg-[var(--bg-canvas)]">
      <TasksBoard
        variant="standalone"
        columns={columns}
        tasks={filteredTasks}
        availableLabels={availableLabelOptions}
        onAddTask={handleAddTaskToColumn}
        onToggleTaskCompletion={toggleTaskCompletion}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onTaskSelect={setSelectedTask}
        onEditTask={handleEditTask}
        onDeleteList={handleDeleteList}
        onMoveTask={handleMoveTask}
        className="bg-[var(--bg-canvas)] min-h-full"
        trailingColumn={
          isAddingList ? (
            <div className="flex min-w-[260px] flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list"
                className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') {
                    setIsAddingList(false);
                    setNewListName('');
                  }
                }}
              />
              <div className="flex items-center gap-[var(--space-2)]">
                <button
                  onClick={handleAddList}
                  className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
                >
                  Add list
                </button>
                <button
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListName('');
                  }}
                  className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[color:var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="flex min-w-[220px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-transparent px-[var(--space-4)] py-[var(--space-5)] text-sm font-medium text-[color:var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[color:var(--text-primary)]"
            >
              <Plus className="mr-[var(--space-2)] h-4 w-4" />
              Add list
            </button>
          )
        }
      />
    </div>
  );

  const ListView = () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(columns.map((c) => c.id)));
  const listViewPreferences = useTaskStore((state) => state.listViewPreferences, shallow);
    const toggleListCompletedVisibility = useTaskStore((state) => state.toggleListCompletedVisibility);

    const toggleSection = (sectionId: string) => {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
        return next;
      });
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          {/* Table header */}
          <div
            className="grid items-center px-[var(--list-row-pad-x)] py-[var(--space-3)] border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
            style={{ gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE, columnGap: 'var(--list-row-gap)' }}
          >
            <div className="th--task-name text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
              Task name
            </div>
            <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
              Due date
            </div>
            <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
              Priority
            </div>
            <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
              Labels
            </div>
          </div>

          {columns.map((column) => {
            const tasksForList = getTasksForList(column.id);
            const showCompleted = listViewPreferences[column.id]?.showCompleted ?? true;
            const activeTasks = tasksForList.filter((task) => !task.isCompleted);
            const visibleTasks = showCompleted ? tasksForList : activeTasks;
            const activeCount = activeTasks.length;
            const isExpanded = expandedSections.has(column.id);

            return (
              <div key={column.id} className="group">
                <div
                  className="tr--group group grid items-center cursor-pointer select-none px-[var(--list-row-pad-x)] py-[var(--space-3)]"
                  style={{ gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE, columnGap: 'var(--list-row-gap)' }}
                  onClick={() => toggleSection(column.id)}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  <div className="td--task-name flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)]">
                    <ChevronDown
                      size={16}
                      className={`motion-safe:transition-transform duration-[var(--duration-fast)] text-[color:var(--text-secondary)] ${isExpanded ? '' : '-rotate-90'}`}
                    />
                    <span className="group-title font-[var(--font-weight-semibold)]">
                      {column.title}
                      <span className="ml-1 font-normal text-[color:var(--text-secondary)]">
                        ({activeCount})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleListCompletedVisibility(column.id, !showCompleted);
                      }}
                      className="inline-flex items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[calc(var(--space-1))] text-[length:var(--text-xs)] font-medium text-[color:var(--text-secondary)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-opacity"
                    >
                      {showCompleted ? 'Hide completed' : 'Show completed'}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div>
                    {visibleTasks.map((task) => {
                      const level = getTaskLevel(task);
                      const dueMeta = getDueMeta(task.dueDate);
                      const priorityTone = task.priority === 'high' || task.priority === 'medium' || task.priority === 'low'
                        ? task.priority
                        : null;
                      const priorityChip = priorityTone
                        ? (
                            <span
                              className={cn(
                                badgeVariants({
                                  variant: 'soft',
                                  tone: priorityTone,
                                  size: 'sm',
                                }),
                                TASK_META_CHIP_CLASS,
                              )}
                            >
                              <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                              <span>{priorityTone[0].toUpperCase() + priorityTone.slice(1)}</span>
                            </span>
                          )
                        : null;
                      const labelChips = task.labels.length > 0
                        ? task.labels.map((label: TaskLabel, idx: number) => {
                            const labelName = getLabelName(label);
                            const labelColor = getLabelColor(label);
                            const labelHue = getLabelHue(labelColor);
                            return (
                              <Badge
                                key={`${labelName}-${idx}`}
                                variant="soft"
                                size="sm"
                                data-label-color={labelHue}
                                className={cn(TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS)}
                              >
                                {labelName}
                              </Badge>
                            );
                          })
                        : [];
                      const rowStyle = {
                        gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE,
                        columnGap: 'var(--list-row-gap)',
                        minHeight: 'var(--list-row-min-h)',
                        paddingLeft: 'var(--list-row-pad-x)',
                        paddingRight: 'var(--list-row-pad-x)',
                        '--level': level,
                      } as React.CSSProperties;

                      const visibleSubtasks = showCompleted
                        ? task.subtasks ?? []
                        : (task.subtasks ?? []).filter((subtask) => !subtask.isCompleted);
                      const hasSubtasks = visibleSubtasks.length > 0;
                      return (
                        <ContextMenu key={task.id}>
                          <ContextMenuTrigger>
                            <div className="task-list-group">
                              <div
                                className="task-row task-list-row grid items-center border-b border-[var(--border-divider)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                                style={rowStyle}
                                onClick={() => setSelectedTask(task)}
                              >
                                <div className="td--task-name task-list-cell--name py-[var(--list-row-pad-y)]">
                                  <div className="task-line">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskCompletion(task.id);
                                    }}
                                    className="check grid shrink-0 place-items-center size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                                    aria-pressed={task.isCompleted}
                                    aria-label={task.isCompleted ? 'Mark as not done' : 'Mark as done'}
                                  >
                                    <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                                      <circle
                                        cx="10"
                                        cy="10"
                                        r="10"
                                        className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${task.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                                      />
                                      <path
                                        d="M5 10.5l3 3 7-7"
                                        fill="none"
                                        strokeWidth="2"
                                        className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${task.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                  <span
                                    className={`title text-[length:var(--list-row-font)] font-[var(--font-weight-medium)] ${
                                      task.isCompleted ? 'line-through text-[color:var(--text-tertiary)] opacity-60' : 'text-[color:var(--text-primary)]'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  </div>
                                </div>

                                <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] flex items-center">
                                  {dueMeta.label ? (
                                    <DueDateChip meta={dueMeta} />
                                  ) : (
                                    <span className="text-[color:var(--text-tertiary)]">—</span>
                                  )}
                                </div>

                                <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
                                  {priorityChip ?? <span className="text-[color:var(--text-tertiary)]">—</span>}
                                </div>

                                <div className="py-[var(--list-row-pad-y)] flex flex-wrap gap-[var(--chip-gap)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
                                  {labelChips.length > 0 ? labelChips : <span className="text-[color:var(--text-tertiary)]">—</span>}
                                </div>
                              </div>

                              {hasSubtasks
                                ? visibleSubtasks.map((subtask) => {
                                    const subtaskDueMeta = getDueMeta(subtask.dueDate);
                                    return (
                                      <div
                                        key={subtask.id}
                                        className="task-row task-list-row grid items-center border-b border-[var(--border-divider)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                                        style={{
                                          gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE,
                                          columnGap: 'var(--list-row-gap)',
                                          minHeight: 'var(--list-row-min-h)',
                                          paddingLeft: 'calc(var(--list-row-pad-x) + var(--check-size) + var(--space-4))',
                                          paddingRight: 'var(--list-row-pad-x)',
                                        }}
                                        onClick={() => setSelectedTask(task)}
                                      >
                                        <div className="td--task-name task-list-cell--name py-[var(--list-row-pad-y)]">
                                          <div className="task-line">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const currentTask = useTaskStore.getState().tasksById[task.id];
                                                if (!currentTask?.subtasks) return;
                                                const nextSubtasks = currentTask.subtasks.map((entry) =>
                                                  entry.id === subtask.id
                                                    ? { ...entry, isCompleted: !entry.isCompleted }
                                                    : entry,
                                                );
                                                void updateTask(task.id, { subtasks: nextSubtasks });
                                              }}
                                              className="check grid shrink-0 place-items-center size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                                              aria-pressed={subtask.isCompleted}
                                              aria-label={subtask.isCompleted ? 'Mark subtask as not done' : 'Mark subtask as done'}
                                            >
                                              <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                                                <circle
                                                  cx="10"
                                                  cy="10"
                                                  r="10"
                                                  className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${subtask.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                                                />
                                                <path
                                                  d="M5 10.5l3 3 7-7"
                                                  fill="none"
                                                  strokeWidth="2"
                                                  className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${subtask.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </svg>
                                            </button>
                                            <span
                                              className={cn(
                                                'title text-[length:var(--list-row-font)] font-[var(--font-weight-medium)]',
                                                subtask.isCompleted
                                                  ? 'line-through text-[color:var(--text-tertiary)] opacity-60'
                                                  : 'text-[color:var(--text-primary)]',
                                              )}
                                            >
                                              {subtask.title}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] flex items-center">
                                          {subtaskDueMeta.label ? (
                                            <DueDateChip meta={subtaskDueMeta} />
                                          ) : (
                                            <span className="text-[color:var(--text-tertiary)]">—</span>
                                          )}
                                        </div>

                                        <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] text-[color:var(--text-tertiary)]">
                                          —
                                        </div>

                                        <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] text-[color:var(--text-tertiary)]">
                                          —
                                        </div>
                                      </div>
                                    );
                                  })
                                : null}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
                            <ContextMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompletion(task.id);
                              }}
                              className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            >
                              <CheckSquare className="w-4 h-4 mr-2" />
                              {task.isCompleted ? 'Mark as not completed' : 'Mark completed'}
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(task);
                              }}
                              className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateTask(task);
                              }}
                              className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id);
                              }}
                              className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}

                    {listComposerSection === column.id ? (
                      <div className="px-4 py-2">
                        <TaskComposer
                          onAddTask={(title, dueDate, priority, labels) => {
                            handleAddTaskToColumn(column.id, { title, dueDate, priority, labels });
                            setListComposerSection(null);
                          }}
                          onCancel={() => setListComposerSection(null)}
                          availableLabels={availableLabelOptions}
                        />
                      </div>
                    ) : (
                      <button
                        className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-[var(--duration-fast)] inline-flex items-center gap-2 px-4 py-2 text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
                        onClick={() => setListComposerSection(column.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Add task...
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}

          {isAddingList ? (
            <div className="flex items-center px-4 py-2">
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list"
                className="w-64 h-8 px-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') {
                    setIsAddingList(false);
                    setNewListName('');
                  }
                }}
              />
              <div className="inline-flex items-center gap-1.5 ml-2">
                <button
                  onClick={handleAddList}
                  className="inline-flex items-center px-2 h-7 rounded text-xs font-medium bg-[var(--btn-primary-bg)] text-white hover:bg-[var(--btn-primary-hover)]"
                >
                  Add list
                </button>
                <button
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListName('');
                  }}
                  className="inline-flex items-center px-2 h-7 rounded text-xs font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="inline-flex items-center gap-2 px-4 py-3 text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
            >
              <Plus className="w-4 h-4" />
              Add list
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
  <div className="h-full flex flex-col bg-[var(--bg-default)] text-[color:var(--text-primary)]">
      <header className="h-[var(--pane-header-h)] px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <SegmentedToggle
            id="tasks-view-toggle"
            ariaLabel="Switch task view"
            surface="tasks"
            value={viewMode}
            onChange={(next) => setViewMode(next as typeof viewMode)}
            options={[
              {
                value: 'board',
                label: 'Board',
                icon: KanbanSquare,
                title: 'Switch to board view',
                ariaKeyShortcuts: 'Alt+B',
              },
              {
                value: 'list',
                label: 'List',
                icon: List,
                title: 'Switch to list view',
                ariaKeyShortcuts: 'Alt+L',
              },
            ]}
            dense
          />
          <h1 className="text-lg font-semibold">Tasks</h1>
          {projectFilter ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 whitespace-nowrap text-[color:var(--text-secondary)]"
              onClick={() => setProjectFilter(null)}
            >
              {activeProject?.name ?? "Filtered"}
              <span aria-hidden className="ml-2 text-[color:var(--text-tertiary)]">×</span>
              <span className="sr-only">Clear project filter</span>
            </Button>
          ) : null}
        </div>

        <div className="flex-1 flex justify-center px-8">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
            {viewMode === 'list' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)]">
                            {selectedList ? columns.find(c => c.id === selectedList)?.title : 'All lists'}
                            <ChevronDown size={14} className="ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
                        <DropdownMenuItem 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            onClick={() => setSelectedList(null)}
                        >
                            {selectedList === null && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                            {selectedList !== null && <span className="w-4 h-4"></span>}
                            <span className={selectedList === null ? 'font-semibold' : ''}>All lists</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        {columns.map(column => (
                            <DropdownMenuItem 
                                key={column.id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                                onClick={() => setSelectedList(column.id)}
                            >
                                {selectedList === column.id && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                                {selectedList !== column.id && <span className="w-4 h-4"></span>}
                                <span className={selectedList === column.id ? 'font-semibold' : ''}>{column.title}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            {viewMode === 'list' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)]">
                            <ArrowUpDown size={14} className="mr-2" />
                            Sort
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
                        <DropdownMenuItem 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            onClick={() => setGlobalSort('due-date')}
                        >
                            {globalSort === 'due-date' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                            {globalSort !== 'due-date' && <span className="w-4 h-4"></span>}
                            <span className={globalSort === 'due-date' ? 'font-semibold' : ''}>Due date</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            onClick={() => setGlobalSort('date-created')}
                        >
                            {globalSort === 'date-created' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                            {globalSort !== 'date-created' && <span className="w-4 h-4"></span>}
                            <span className={globalSort === 'date-created' ? 'font-semibold' : ''}>Date created</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                            onClick={() => setGlobalSort('priority')}
                        >
                            {globalSort === 'priority' && <span className="w-4 h-4 flex items-center justify-center text-primary">✓</span>}
                            {globalSort !== 'priority' && <span className="w-4 h-4"></span>}
                            <span className={globalSort === 'priority' ? 'font-semibold' : ''}>Priority</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 text-[color:var(--text-secondary)]">
                  <Filter size={14} className="mr-2" />
                  Filter
                  {selectedLabels.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                      {selectedLabels.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-1.5">
                {allLabels.length === 0 ? (
                  <div className="px-3 py-2 text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] text-center">
                    No labels found
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[color:var(--text-tertiary)] uppercase">
                      Filter by label
                    </div>
                    {allLabels.map(label => {
                      const labelColor = labelsColorMap.get(label) || 'var(--label-gray)';
                      const isSelected = selectedLabels.includes(label);
                      return (
                        <DropdownMenuItem
                          key={label}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleLabelFilter(label);
                          }}
                        >
                          <Badge
                            variant="soft"
                            size="sm"
                            className={`relative ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''}`}
                            style={{ 
                              backgroundColor: `color-mix(in oklab, ${labelColor} ${isSelected ? '25' : '18'}%, transparent)`,
                              color: `color-mix(in oklab, ${labelColor} 85%, var(--text-primary))`,
                              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${labelColor} ${isSelected ? '45' : '35'}%, transparent)`,
                              minWidth: 'fit-content'
                            }}
                          >
                            {label}
                          </Badge>
                        </DropdownMenuItem>
                      );
                    })}
                    {selectedLabels.length > 0 && (
                      <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          className="px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          onClick={() => setSelectedLabels([])}
                        >
                          Clear all filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {(() => {
              const { status } = useTaskStore(selectSyncStatus);
              const isSyncing = status === 'syncing';
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 text-[color:var(--text-secondary)] ${isSyncing ? 'animate-pulse' : ''}`}
                  title="Sync lists and tasks"
                  onClick={() => { void syncNow(); }}
                  disabled={isSyncing}
                >
                  <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing…' : 'Sync'}
                </Button>
              );
            })()}
            <Button
              onClick={handleOpenAssistant}
              className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] md:hidden"
              aria-keyshortcuts="Meta+K,Control+K"
            >
              <Plus size={16} className="mr-2" />
              Add task
            </Button>
        </div>
      </header>

      {viewMode === 'board' ? <BoardView /> : <ListView />}

      <TaskDetailsDrawer 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Delete List Confirmation Dialog */}
      <Dialog open={deleteListDialog?.isOpen || false} onOpenChange={(open) => !open && setDeleteListDialog(null)}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete list?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[color:var(--text-secondary)]">
              {deleteListDialog?.taskCount ? (
                <>
                  Delete <span className="font-semibold text-[color:var(--text-primary)]">"{deleteListDialog.listTitle}"</span>? 
                  {' '}{deleteListDialog.taskCount} task{deleteListDialog.taskCount > 1 ? 's' : ''} will be moved to "To Do".
                </>
              ) : (
                <>
                  Delete <span className="font-semibold text-[color:var(--text-primary)]">"{deleteListDialog?.listTitle}"</span>?
                </>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteListDialog(null)}>
              Cancel
            </Button>
           <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-2">
               <span className="text-sm text-[color:var(--text-secondary)]">Reassign tasks to</span>
               <Select value={fallbackList} onValueChange={(v) => setFallbackList(v)}>
                 <SelectTrigger className="w-40 h-8">
                   <SelectValue placeholder="Select list" />
                 </SelectTrigger>
                 <SelectContent>
                   {taskLists
                     .filter(l => l.id !== deleteListDialog?.listId)
                     .map(l => (
                       <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                     ))}
                 </SelectContent>
               </Select>
             </div>
             <Button 
               variant="destructive" 
               onClick={confirmDeleteList}
               className="bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white"
             >
               Delete
             </Button>
           </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
