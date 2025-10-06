
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
];

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

export function TasksModule() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskSidePanel, setShowTaskSidePanel] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [sortOption, setSortOption] = useState<{[key: string]: string}>({});

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksByStatus = (status: string) => {
    const tasks = filteredTasks.filter(task => task.status === status);
    const sortBy = sortOption[status] || 'date-created';

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
  const handleDeleteTask = (taskId: string) => setTasks(tasks.filter(t => t.id !== taskId));

  const BoardView = () => (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 min-w-max">
        {columns.map((column) => (
          <div key={column.id} className="w-72 flex-shrink-0">
            <TaskColumnHeader 
              columnTitle={column.title}
              taskCount={getTasksByStatus(column.id).length}
              onSort={(sortBy) => handleSort(column.id, sortBy)}
              onHideCompleted={handleHideCompleted}
              onRenameList={handleRenameList}
              onDeleteList={handleDeleteList}
            />
            <TaskAddButton onClick={() => setShowCreateTask(true)} />
            <div className="space-y-2">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard
                  key={task.id}
                  taskTitle={task.title}
                  dueDate={task.dueDate}
                  isCompleted={task.isCompleted}
                  onToggleCompletion={() => toggleTaskCompletion(task.id)}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskSidePanel(true);
                  }}
                  onEdit={() => handleEditTask(task)}
                  onDuplicate={() => handleDuplicateTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          </div>
        ))}
        <Button variant="ghost" className="w-72 justify-start items-center gap-2 h-10 px-2 text-[var(--text-secondary)]">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add list</span>
        </Button>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-[1fr_120px_120px_120px] items-center px-4 h-10">
            <div className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wider">Task name</div>
            <div className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wider">Due date</div>
            <div className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wider">Priority</div>
            <div className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wider">Labels</div>
        </div>

        {columns.map(column => (
          <div key={column.id} className="group">
            <div className="flex items-center gap-2 px-4 h-10 cursor-pointer" onClick={() => toggleSection(column.id)}>
                <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform ${expandedSections.has(column.id) ? '' : '-rotate-90'}`} />
                <h3 className="font-medium text-sm text-[var(--text-primary)]">{column.title}</h3>
                <span className="text-sm text-[var(--text-tertiary)]">{getTasksByStatus(column.id).length}</span>
            </div>
            {expandedSections.has(column.id) && (
                <div className="border-t border-[var(--border-subtle)]">
                    {getTasksByStatus(column.id).map(task => (
                        <ContextMenu key={task.id}>
                            <ContextMenuTrigger>
                                <div className="grid grid-cols-[1fr_120px_120px_120px] items-center px-4 h-12 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]">
                                    <div className="flex items-center gap-3">
                                        <Checkbox checked={task.isCompleted} onCheckedChange={() => toggleTaskCompletion(task.id)} />
                                        <div className={`truncate ${task.isCompleted ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>{task.title}</div>
                                    </div>
                                    <div className={`text-sm ${task.dueDate ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`}>{task.dueDate || '-'}</div>
                                    <div className={`text-sm capitalize ${priorityColors[task.priority]}`}>{task.priority !== 'none' ? task.priority : '-'}</div>
                                    <div className="flex gap-1">
                                        {task.labels.map(label => <Badge key={label} variant="secondary">{label}</Badge>)}
                                    </div>
                                </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                <ContextMenuItem onClick={() => toggleTaskCompletion(task.id)}>
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    {task.isCompleted ? 'Mark as not completed' : 'Mark completed'}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleEditTask(task)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleDuplicateTask(task)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => handleDeleteTask(task.id)} className="text-[var(--danger)]">
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    ))}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 h-12 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <Plus size={16} />
                        <span className="text-sm font-medium">Add task...</span>
                    </div>
                </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 px-4 h-12 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <Plus size={16} />
            <span className="text-sm font-medium">Add section</span>
          </div>
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
                            All lists
                            <ChevronDown size={14} className="ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>All lists</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            {viewMode === 'list' && (
                <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
                    <ArrowUpDown size={14} className="mr-2" />
                    Sort
                </Button>
            )}
            <Button variant="ghost" size="sm" className="h-9 text-[var(--text-secondary)]">
              <Filter size={14} className="mr-2" />
              Filter
            </Button>
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

      {/* Side panel and dialogs would go here, but are excluded as per instructions */}
    </div>
  );
}
