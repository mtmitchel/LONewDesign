
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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'none';
  dueDate?: string;
  dateCreated: string;
  labels: string[];
  isCompleted: boolean;
}

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

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

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
      task.labels.some(label => selectedLabels.includes(label));
    const matchesList = selectedList === null || task.status === selectedList;
    return matchesSearch && matchesLabels && matchesList;
  });

  // Get all unique labels from tasks
  const allLabels = Array.from(new Set(tasks.flatMap(task => task.labels))).sort();

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
    const sortBy = viewMode === 'list' ? globalSort : (sortOption[status] || 'date-created');

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
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
    ));
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
    <div className="flex-1 overflow-x-auto p-4 bg-[var(--bg-canvas)]">
      <div className="flex items-start gap-[var(--space-4)] min-w-max">
        {columns.map((column) => (
          <div key={column.id} className="min-w-[280px] min-h-[160px] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] p-[var(--space-3)] flex flex-col">
            <div className="flex flex-col gap-1.5">
              <TaskColumnHeader 
                columnTitle={column.title}
                taskCount={getTasksByStatus(column.id).length}
                currentSort={sortOption[column.id] || 'date-created'}
                onSort={(sortBy) => handleSort(column.id, sortBy)}
                onHideCompleted={handleHideCompleted}
                onRenameList={handleRenameList}
                onDeleteList={handleDeleteList}
              />
              {activeComposerSection === column.id ? (
                <TaskComposer 
                  onAddTask={(title, dueDate, priority) => handleAddTask(title, column.id, dueDate, priority)}
                  onCancel={() => setActiveComposerSection(null)}
                />
              ) : (
                <TaskAddButton onClick={() => setActiveComposerSection(column.id)} />
              )}
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

    const priorityColors: { [key in Task['priority']]: string } = {
        high: 'text-red-500',
        medium: 'text-yellow-500',
        low: 'text-blue-500',
        none: 'text-[var(--text-tertiary)]'
    }

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Table header */}
        <div className="flex items-center px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
            <div className="flex-1 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Task name</div>
            <div className="w-32 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Due date</div>
            <div className="w-32 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Priority</div>
            <div className="w-40 text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--text-secondary)] uppercase tracking-wide">Labels</div>
        </div>

        {columns.map(column => (
          <div key={column.id} className="group">
            {/* Section header - no background, no border, minimal */}
            <div className="flex items-center gap-2 py-3 px-4 cursor-pointer" onClick={() => toggleSection(column.id)}>
                <ChevronDown size={16} className={`text-[var(--text-secondary)] motion-safe:transition-transform duration-[var(--duration-fast)] ${expandedSections.has(column.id) ? '' : '-rotate-90'}`} />
                <h3 className="text-[length:var(--text-sm)] font-[var(--font-weight-semibold)] text-[var(--text-primary)]">{column.title}</h3>
                <span className="text-[length:var(--text-sm)] text-[var(--text-secondary)]">{getTasksByStatus(column.id).length}</span>
            </div>
            {expandedSections.has(column.id) && (
                <div>
                    {getTasksByStatus(column.id).map(task => {
                        const priorityColors: { [key: string]: string } = {
                            high: 'bg-red-500 text-white',
                            medium: 'bg-orange-500 text-white',
                            low: 'bg-blue-500 text-white',
                            none: ''
                        };
                        
                        return (
                        <ContextMenu key={task.id}>
                            <ContextMenuTrigger>
                                <div className="flex items-center px-4 py-2.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                                    onClick={() => setSelectedTask(task)}>
                                    <div className="flex-1 flex items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskCompletion(task.id);
                                          }}
                                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 motion-safe:transition-all duration-[var(--duration-fast)] hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                                          style={{
                                            borderColor: task.isCompleted ? 'var(--primary)' : 'var(--border-default)',
                                            backgroundColor: task.isCompleted ? 'var(--primary)' : 'transparent'
                                          }}
                                        >
                                          {task.isCompleted && <CheckSquare className="w-3 h-3 text-white" />}
                                        </button>
                                        <div className={`truncate text-[length:var(--text-sm)] font-[var(--font-weight-medium)] ${task.isCompleted ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>{task.title}</div>
                                    </div>
                                    <div className="w-32 text-[length:var(--text-sm)] text-[var(--text-secondary)]">{task.dueDate || '—'}</div>
                                    <div className="w-32">
                                        {task.priority !== 'none' && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] capitalize ${priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </span>
                                        )}
                                        {task.priority === 'none' && <span className="text-[var(--text-tertiary)]">—</span>}
                                    </div>
                                    <div className="w-40 flex items-center gap-1">
                                        {task.labels.map(label => <Badge key={label} variant="secondary" className="text-[length:var(--text-xs)] font-[var(--font-weight-normal)] py-0.5">{label}</Badge>)}
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
                    );})}
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
      <header className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex bg-[var(--bg-surface-elevated)] rounded-md p-1 border border-[var(--border-default)]">
              <Button
                variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className="h-8 w-20"
              >
                <KanbanSquare size={16} className="mr-2" />
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 w-20"
              >
                <List size={16} className="mr-2" />
                List
              </Button>
            </div>
            <h1 className="text-lg font-semibold">Tasks</h1>
          </div>

          <div className="flex-1 flex justify-center px-8">
            <div className="w-full max-w-lg relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 bg-[var(--bg-surface-elevated)]"
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
