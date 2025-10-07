
"use client";

import React, { useState } from 'react';
import { 
  KanbanSquare, List, Search, Plus, Filter, RefreshCw, ChevronDown,
  MoreHorizontal, CheckSquare, Clock, Calendar, ArrowUpDown,
  Trash, Edit, Copy, Move, Archive
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { TaskColumnHeader } from './tasks/TaskColumnHeader';
import { TaskAddButton } from './tasks/TaskAddButton';
import { TaskCard } from './tasks/TaskCard';
import { TaskComposer } from './tasks/TaskComposer';
import { TaskSidePanel } from './tasks/TaskSidePanel';
import { QuickTaskModal } from '../extended/QuickTaskModal';
import { SegmentedViewToggle } from './tasks/SegmentedViewToggle';
import { TASK_LISTS } from './tasks/constants';

type TaskLabel = string | { name: string; color: string };

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'none';
  dueDate?: string;
  dateCreated: string;
  completedAt?: string | null;
  order?: number;
  labels: TaskLabel[];
  isCompleted: boolean;
}

const getLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--accent)' : label.color;

const mockTasks: Task[] = [
  { id: '1', title: 'Dump', status: 'todo', priority: 'none', labels: [], isCompleted: false, dateCreated: '2025-10-01' },
  { id: '2', title: 'Hump', status: 'todo', priority: 'none', labels: [], isCompleted: false, dateCreated: '2025-10-02' },
  { id: '3', title: 'Buy milk', dueDate: 'Aug 17', status: 'todo', priority: 'medium', labels: ['errands'], isCompleted: false, dateCreated: '2025-10-03' },
  { id: '4', title: 'Return library books', dueDate: 'Aug 13', status: 'todo', priority: 'high', labels: ['personal'], isCompleted: false, dateCreated: '2025-10-04' },
  { id: '5', title: 'asdfasdfasdfsa', dueDate: 'Aug 28', status: 'todo', priority: 'low', labels: [], isCompleted: true, dateCreated: '2025-10-05' },
  { id: '6', title: 'Blah', status: 'in-progress', priority: 'none', labels: [], isCompleted: false, dateCreated: '2025-10-06' },
  { id: '7', title: 'Buy bread', dueDate: 'Oct 1', status: 'in-progress', priority: 'medium', labels: ['errands'], isCompleted: false, dateCreated: '2025-10-07' },
  { id: '8', title: 'Task 1', dueDate: 'Oct 2 – 3', status: 'todo', priority: 'low', labels: [], isCompleted: false, dateCreated: '2025-10-08' },
  { id: '9', title: 'tretre', dueDate: 'Oct 29', status: 'todo', priority: 'none', labels: [], isCompleted: false, dateCreated: '2025-10-09' },
];

const columns = TASK_LISTS;

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
    return Date.parse(a.dateCreated) - Date.parse(b.dateCreated);
  }

  // 3) Within completed tasks: oldest completion first (recently completed at bottom)
  const ac = a.completedAt ? Date.parse(a.completedAt) : 0;
  const bc = b.completedAt ? Date.parse(b.completedAt) : 0;
  return ac - bc;
}

export function TasksModule() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [sortOption, setSortOption] = useState<{[key: string]: string}>({});
  const [activeComposerSection, setActiveComposerSection] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null); // null means "All lists"
  const [globalSort, setGlobalSort] = useState<'due-date' | 'date-created' | 'priority'>('date-created');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabels = selectedLabels.length === 0 || 
      task.labels.some(label => selectedLabels.includes(getLabelName(label)));
    const matchesList = selectedList === null || task.status === selectedList;
    return matchesSearch && matchesLabels && matchesList;
  });

  // Get all unique labels from tasks
  const allLabels = Array.from(new Set(
    tasks.flatMap(task => task.labels.map(getLabelName))
  )).sort();

  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleAddTask = (title: string, status: string, dueDate?: string, priority?: 'low' | 'medium' | 'high' | 'none') => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      status: status as any,
      priority: priority || 'none',
      dueDate,
      labels: [],
      isCompleted: false,
      dateCreated: new Date().toISOString(),
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setActiveComposerSection(null);
  };

  const getTasksByStatus = (status: string) => {
    const tasks = filteredTasks.filter(task => task.status === status);
    // Use globalSort for list view, sortOption for board view columns
    const sortBy = viewMode === 'list' ? globalSort : (sortOption[status] || 'completed-at-bottom');

    // Default: completed tasks at bottom with smart ordering
    if (sortBy === 'completed-at-bottom' || sortBy === 'date-created') {
      return tasks.sort(compareTasks);
    }

    // Legacy sort options for backward compatibility
    return tasks.sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'due-date') {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else {
            return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        }
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newCompletedState = !task.isCompleted;
        return {
          ...task,
          isCompleted: newCompletedState,
          completedAt: newCompletedState ? new Date().toISOString() : null,
        };
      }
      return task;
    }));
  };

  const handleSort = (columnId: string, sortBy: string) => {
      setSortOption(prev => ({...prev, [columnId]: sortBy}));
  }

  const handleHideCompleted = () => console.log("Hide completed tasks");
  const handleRenameList = () => console.log("Rename list");
  const handleDeleteList = () => console.log("Delete list");

  const handleEditTask = (task: Task) => console.log("Edit task", task);
  const handleDuplicateTask = (task: Task) => console.log("Duplicate task", task);
  
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
    setSelectedTask(null); // Close side panel after update
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null); // Close side panel if the deleted task was open
    }
  };

  const handleQuickTaskCreate = (payload: { title: string; date?: string }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: payload.title,
      status: 'todo', // Default to "To Do" list
      priority: 'none',
      dueDate: payload.date,
      labels: [],
      isCompleted: false,
      dateCreated: new Date().toISOString(),
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const handleAddList = () => {
    if (newListName.trim()) {
      // In a real app, this would create a new column/list
      console.log('Creating new list:', newListName.trim());
      // For now, we'll just reset the form
      setNewListName('');
      setIsAddingList(false);
    }
  };

  const BoardView = () => (
    <div className="flex-1 overflow-x-auto px-6 py-4 bg-[var(--bg-canvas)]">
      <div className="density-compact flex items-start gap-[var(--space-4)] min-w-max">
        {columns.map((column) => (
          <div key={column.id} className="min-w-[280px] min-h-[160px] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] p-[var(--space-3)] flex flex-col">
            <div className="flex flex-col gap-[var(--task-card-gap)] flex-1">
              <TaskColumnHeader 
                columnTitle={column.title}
                taskCount={getTasksByStatus(column.id).length}
                currentSort={sortOption[column.id] || 'date-created'}
                onSort={(sortBy) => handleSort(column.id, sortBy)}
                onHideCompleted={handleHideCompleted}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
              />
              
              {/* Task cards stack */}
              <div className="flex flex-col gap-[var(--task-card-gap)]">
                {getTasksByStatus(column.id).map((task) => (
                  <TaskCard
                    key={task.id}
                    taskTitle={task.title}
                    dueDate={task.dueDate}
                    priority={task.priority}
                    labels={task.labels}
                    isCompleted={task.isCompleted}
                    onToggleCompletion={() => toggleTaskCompletion(task.id)}
                    onClick={() => {
                      setSelectedTask(task);
                    }}
                    onEdit={() => handleEditTask(task)}
                    onDuplicate={() => handleDuplicateTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>

              {/* Add task at bottom (primary) */}
              <div className="mt-auto pt-[var(--space-2)]">
                {activeComposerSection === column.id ? (
                  <TaskComposer 
                    onAddTask={(title, dueDate, priority) => handleAddTask(title, column.id, dueDate, priority)}
                    onCancel={() => setActiveComposerSection(null)}
                  />
                ) : (
                  <TaskAddButton onClick={() => setActiveComposerSection(column.id)} />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Add list button or inline form */}
        {isAddingList ? (
          <div className="min-w-[280px] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg p-2">
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New section"
              className="w-full h-8 px-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') { setIsAddingList(false); setNewListName(''); }
              }}
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                onClick={handleAddList}
                className="inline-flex items-center px-2 h-7 rounded text-xs font-medium bg-[var(--btn-primary-bg)] text-white hover:bg-[var(--btn-primary-hover)]"
              >
                Add list
              </button>
              <button
                onClick={() => { setIsAddingList(false); setNewListName(''); }}
                className="inline-flex items-center px-2 h-7 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] h-10 rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer ml-[var(--space-2)]"
          >
            <Plus className="w-4 h-4" />
            Add list
          </button>
        )}
      </div>
    </div>
  );

  const ListView = () => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(columns.map(c => c.id)));

    const toggleSection = (sectionId: string) => {
      const newSet = new Set(expandedSections);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      setExpandedSections(newSet);
    };

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div 
          className="grid items-center px-[var(--list-row-pad-x)] py-[var(--space-2)] border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
          style={{ gridTemplateColumns: "auto 1fr auto auto 1fr", columnGap: "var(--list-row-gap)" }}
        >
          <div></div> {/* checkbox column */}
          <div className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Task name</div>
          <div className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Due date</div>
          <div className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Priority</div>
          <div className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Labels</div>
        </div>

        {columns.map(column => (
          <div key={column.id} className="group">
            {/* Section header */}
            <div className="flex items-center gap-[var(--space-2)] py-[var(--space-3)] px-[var(--space-4)] cursor-pointer" onClick={() => toggleSection(column.id)}>
              <ChevronDown size={16} className={`text-[var(--text-secondary)] motion-safe:transition-transform duration-[var(--duration-fast)] ${expandedSections.has(column.id) ? '' : '-rotate-90'}`} />
              <h3 className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">{column.title}</h3>
              <span className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{getTasksByStatus(column.id).length}</span>
            </div>
            
            {expandedSections.has(column.id) && (
              <div>
                {getTasksByStatus(column.id).map(task => (
                  <ContextMenu key={task.id}>
                    <ContextMenuTrigger>
                      <div 
                        className="grid items-center border-b border-[var(--border-divider)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                        style={{
                          gridTemplateColumns: "auto 1fr auto auto 1fr", 
                          columnGap: "var(--list-row-gap)",
                          minHeight: "var(--list-row-min-h)",
                          paddingLeft: "var(--list-row-pad-x)",
                          paddingRight: "var(--list-row-pad-x)",
                        }}
                        onClick={() => setSelectedTask(task)}
                      >
                        {/* Checkbox cell */}
                        <div className="flex items-center justify-center py-[var(--list-row-pad-y)]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskCompletion(task.id);
                            }}
                            className="grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                            aria-pressed={task.isCompleted}
                            aria-label={task.isCompleted ? 'Mark as not done' : 'Mark as done'}
                          >
                            <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                              <circle
                                cx="10" cy="10" r="10"
                                className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${task.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                              />
                              <path
                                d="M5 10.5l3 3 7-7"
                                fill="none" strokeWidth="2"
                                className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${task.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                strokeLinecap="round" strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Task name cell */}
                        <div className="py-[var(--list-row-pad-y)]">
                          <span className={`text-[length:var(--list-row-font)] font-[var(--font-weight-medium)] ${task.isCompleted ? 'line-through text-[var(--text-tertiary)] opacity-60' : 'text-[var(--text-primary)]'}`}>
                            {task.title}
                          </span>
                        </div>

                        {/* Due date cell */}
                        <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] text-[var(--text-tertiary)]">
                          {task.dueDate || '—'}
                        </div>

                        {/* Priority cell */}
                        <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)]">
                          {task.priority !== 'none' ? (
                            <Badge variant="soft" size="sm" tone={task.priority as 'high' | 'medium' | 'low'}>
                              {task.priority[0].toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">—</span>
                          )}
                        </div>

                        {/* Labels cell */}
                        <div className="py-[var(--list-row-pad-y)] flex flex-wrap gap-[var(--chip-gap)] text-[length:var(--list-row-meta)]">
                          {task.labels.length > 0 ? (
                            task.labels.map((label, idx) => {
                              const labelName = getLabelName(label);
                              const labelColor = getLabelColor(label);
                              return (
                                <Badge
                                  key={`${labelName}-${idx}`}
                                  variant="soft"
                                  size="sm"
                                  tone="label"
                                  style={{ ['--label-neutral' as any]: labelColor }}
                                >
                                  {labelName}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-[var(--text-tertiary)]">—</span>
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
                      <ContextMenuItem onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.id); }} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                        <CheckSquare className="w-4 h-4 mr-2" />
                        {task.isCompleted ? 'Mark as not completed' : 'Mark completed'}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </ContextMenuItem>
                      <ContextMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicateTask(task); }} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                    {activeComposerSection === column.id ? (
                        <div className="px-4 py-2">
                            <TaskComposer 
                                onAddTask={(title, dueDate, priority) => handleAddTask(title, column.id, dueDate, priority)}
                                onCancel={() => setActiveComposerSection(null)}
                            />
                        </div>
                    ) : (
                        <button
                            className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-[var(--duration-fast)] inline-flex items-center gap-2 px-4 py-2 text-[length:var(--text-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                            onClick={() => setActiveComposerSection(column.id)}
                        >
                            <Plus className="w-4 h-4" />
                            Add task...
                        </button>
                    )}
                </div>
            )}
          </div>
        ))}
        
        {/* Add list button or inline form - always visible */}
        {isAddingList ? (
          <div className="flex items-center px-4 py-2">
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list"
              className="w-64 h-8 px-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') { setIsAddingList(false); setNewListName(''); }
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
                onClick={() => { setIsAddingList(false); setNewListName(''); }}
                className="inline-flex items-center px-2 h-7 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="inline-flex items-center gap-2 px-4 py-3 text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          >
            <Plus className="w-4 h-4" />
            Add list
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-default)] text-[var(--text-primary)]">
      <header className="h-[var(--pane-header-h)] px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <SegmentedViewToggle
            value={viewMode}
            onChange={setViewMode}
          />
          <h1 className="text-lg font-semibold">Tasks</h1>
        </div>

        <div className="flex-1 flex justify-center px-8">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
            {viewMode === 'list' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
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
                        <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
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
                <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
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
                  <div className="px-3 py-2 text-[length:var(--text-sm)] text-[var(--text-tertiary)] text-center">
                    No labels found
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-tertiary)] uppercase">
                      Filter by label
                    </div>
                    {allLabels.map(label => (
                      <DropdownMenuItem
                        key={label}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleLabelFilter(label);
                        }}
                      >
                        <Checkbox
                          checked={selectedLabels.includes(label)}
                          onCheckedChange={() => toggleLabelFilter(label)}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 capitalize">{label}</span>
                      </DropdownMenuItem>
                    ))}
                    {selectedLabels.length > 0 && (
                      <>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          className="px-2 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
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
            <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
              <RefreshCw size={14} className="mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateTask(true)}
              className="bg-primary text-primary-foreground h-9"
            >
              <Plus size={16} className="mr-2" />
              Add task
            </Button>
        </div>
      </header>

      {viewMode === 'board' ? <BoardView /> : <ListView />}

      <TaskSidePanel 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      <QuickTaskModal
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onCreate={handleQuickTaskCreate}
      />
    </div>
  );
}
