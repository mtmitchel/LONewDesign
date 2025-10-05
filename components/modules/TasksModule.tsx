"use client";

import React, { useState } from 'react';
import { 
  KanbanSquare, List, Search, Plus, Filter, RefreshCw, ChevronDown,
  MoreHorizontal, CheckSquare, Clock, Flag, User, Tag, Calendar,
  ArrowRight, ArrowUp, ArrowDown, Trash, Edit, Copy, Move,
  Eye, EyeOff, SortAsc, Grip, X, Star, Archive
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
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
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignee?: string;
  labels: string[];
  listId: string;
  subtasks?: Task[];
  isCompleted: boolean;
}

interface TaskList {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  isVisible: boolean;
}

const mockTaskLists: TaskList[] = [
  { id: 'personal', name: 'Personal Tasks', color: '#3b82f6', taskCount: 8, isVisible: true },
  { id: 'work', name: 'Work Projects', color: '#10b981', taskCount: 12, isVisible: true },
  { id: 'shopping', name: 'Shopping List', color: '#f59e0b', taskCount: 5, isVisible: true },
  { id: 'ideas', name: 'Ideas & Notes', color: '#8b5cf6', taskCount: 3, isVisible: false }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new dashboard layout',
    description: 'Create wireframes and mockups for the new dashboard design',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-10-15',
    assignee: 'John Doe',
    labels: ['design', 'ui'],
    listId: 'work',
    isCompleted: false
  },
  {
    id: '2',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, fruits',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-10-12',
    labels: ['errands'],
    listId: 'personal',
    isCompleted: false
  },
  {
    id: '3',
    title: 'Review pull requests',
    description: 'Review and approve pending PRs from the team',
    status: 'review',
    priority: 'high',
    dueDate: '2024-10-13',
    assignee: 'Jane Smith',
    labels: ['code-review', 'urgent'],
    listId: 'work',
    isCompleted: false
  },
  {
    id: '4',
    title: 'Plan weekend trip',
    status: 'completed',
    priority: 'low',
    labels: ['travel', 'personal'],
    listId: 'personal',
    isCompleted: true
  }
];

const columns = [
  { id: 'todo', title: 'To Do', color: '#6b7280' },
  { id: 'in-progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'review', title: 'Review', color: '#f59e0b' },
  { id: 'completed', title: 'Completed', color: '#10b981' }
];

export function TasksModule() {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedList, setSelectedList] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskSidePanel, setShowTaskSidePanel] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set(['personal', 'work']));

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesList = selectedList === 'all' || task.listId === selectedList;
    return matchesSearch && matchesList;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getTasksByList = (listId: string) => {
    return filteredTasks.filter(task => task.listId === listId);
  };

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const toggleListExpansion = (listId: string) => {
    const newExpanded = new Set(expandedLists);
    if (newExpanded.has(listId)) {
      newExpanded.delete(listId);
    } else {
      newExpanded.add(listId);
    }
    setExpandedLists(newExpanded);
  };

  // Board View Component
  const BoardView = () => (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-6 min-w-max">
        {columns.map((column) => (
          <div key={column.id} className="w-80 bg-[var(--elevated)] rounded-lg">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-medium">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {getTasksByStatus(column.id).length}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <SortAsc className="w-4 h-4 mr-2" />
                      Sort by Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="w-4 h-4 mr-2" />
                      Sort by Due Date
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {getTasksByStatus(column.id).map((task) => (
                <ContextMenu key={task.id}>
                  <ContextMenuTrigger>
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskSidePanel(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                          <div className="flex items-center gap-1">
                            {task.priority === 'high' && (
                              <Flag size={12} className="text-red-500" />
                            )}
                            <Grip size={12} className="text-[var(--text-secondary)] cursor-grab" />
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 flex-wrap">
                            {task.labels.slice(0, 2).map((label) => (
                              <Badge key={label} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                            {task.labels.length > 2 && (
                              <span className="text-xs text-[var(--text-secondary)]">
                                +{task.labels.length - 2}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="text-[var(--text-secondary)]" />
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {task.assignee && (
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {task.assignee.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Task
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Mark Complete
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>
                      <Move className="w-4 h-4 mr-2" />
                      Move to List
                    </ContextMenuItem>
                    <ContextMenuItem className="text-[var(--error)]">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-[var(--text-secondary)] hover:text-[var(--primary)]"
                onClick={() => setShowCreateTask(true)}
              >
                <Plus size={16} className="mr-2" />
                Add a task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="flex-1 overflow-y-auto">
      {mockTaskLists.filter(list => list.isVisible).map((list) => (
        <div key={list.id} className="border-b border-[var(--border-subtle)]">
          <div 
            className="p-4 bg-[var(--elevated)] cursor-pointer hover:bg-[var(--primary-tint-10)]/30"
            onClick={() => toggleListExpansion(list.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform ${
                    expandedLists.has(list.id) ? 'rotate-0' : '-rotate-90'
                  }`}
                />
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: list.color }}
                />
                <h3 className="font-medium">{list.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {getTasksByList(list.id).length}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus size={14} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Rename List
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <SortAsc className="w-4 h-4 mr-2" />
                      Sort Tasks
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive List
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[var(--error)]">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {expandedLists.has(list.id) && (
            <div className="divide-y divide-[var(--border-subtle)]">
              {getTasksByList(list.id).map((task) => (
                <ContextMenu key={task.id}>
                  <ContextMenuTrigger>
                    <div className="p-4 hover:bg-[var(--primary-tint-10)]/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedTasks.has(task.id)}
                          onCheckedChange={(checked) => handleTaskSelect(task.id, !!checked)}
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Toggle completion
                          }}
                        >
                          <CheckSquare 
                            size={16} 
                            className={task.isCompleted ? 'text-green-600' : 'text-[var(--text-secondary)]'} 
                          />
                        </Button>
                        
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskSidePanel(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h4 className={`text-sm font-medium ${
                                task.isCompleted ? 'line-through text-[var(--text-secondary)]' : ''
                              }`}>
                                {task.title}
                              </h4>
                              
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`text-xs ${priorityColors[task.priority]}`}
                                  variant="secondary"
                                >
                                  {task.priority}
                                </Badge>
                                
                                {task.labels.map((label) => (
                                  <Badge key={label} variant="secondary" className="text-xs">
                                    #{label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Clock size={14} className="text-[var(--text-secondary)]" />
                                  <span className="text-sm text-[var(--text-secondary)]">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              
                              {task.assignee && (
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Open Task
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Mark Complete
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>
                      <Move className="w-4 h-4 mr-2" />
                      Move to List
                    </ContextMenuItem>
                    <ContextMenuItem className="text-[var(--error)]">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-[var(--surface)] rounded-lg p-1 border border-[var(--border-default)]">
              <Button
                variant={viewMode === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('board')}
                className={viewMode === 'board' ? 'bg-[var(--primary)] text-white' : ''}
              >
                <KanbanSquare size={16} className="mr-2" />
                Board
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[var(--primary)] text-white' : ''}
              >
                <List size={16} className="mr-2" />
                List
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </Button>
            
            <Button variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Sync
            </Button>
            
            <Button 
              onClick={() => setShowCreateTask(true)}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              <Plus size={16} className="mr-2" />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-32 justify-between">
                <span>
                  {selectedList === 'all' ? 'All Lists' : 
                   mockTaskLists.find(l => l.id === selectedList)?.name || 'Select List'}
                </span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem 
                onClick={() => setSelectedList('all')}
                className={selectedList === 'all' ? 'bg-[var(--primary-tint-10)]' : ''}
              >
                All Lists
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {mockTaskLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={selectedList === list.id ? 'bg-[var(--primary-tint-10)]' : ''}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: list.color }}
                    />
                    <span>{list.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <div className="mt-4 p-3 bg-[var(--primary-tint-10)] rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--primary)]">
              {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <CheckSquare className="w-4 h-4 mr-1" />
                Complete
              </Button>
              <Button variant="ghost" size="sm">
                <Move className="w-4 h-4 mr-1" />
                Move
              </Button>
              <Button variant="ghost" size="sm">
                <Trash className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'board' ? <BoardView /> : <ListView />}

      {/* Task Side Panel */}
      {showTaskSidePanel && selectedTask && (
        <Dialog open={showTaskSidePanel} onOpenChange={setShowTaskSidePanel}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="task-title">Title</Label>
                <Input 
                  id="task-title" 
                  defaultValue={selectedTask.title}
                  className="text-lg font-medium"
                />
              </div>
              
              <div>
                <Label htmlFor="task-description">Description</Label>
                <Textarea 
                  id="task-description"
                  defaultValue={selectedTask.description}
                  placeholder="Add a description..."
                  className="min-h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input 
                    id="due-date" 
                    type="date"
                    defaultValue={selectedTask.dueDate}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority"
                    defaultValue={selectedTask.priority}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="labels">Labels</Label>
                <Input 
                  id="labels"
                  defaultValue={selectedTask.labels.join(', ')}
                  placeholder="Add labels separated by commas..."
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch id="completed" defaultChecked={selectedTask.isCompleted} />
                  <Label htmlFor="completed">Mark as completed</Label>
                </div>
                
                <Button 
                  variant="outline"
                  className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error)] hover:text-white"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Task
                </Button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTaskSidePanel(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Task Dialog */}
      {showCreateTask && (
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-task-title">Title</Label>
                <Input id="new-task-title" placeholder="Enter task title..." />
              </div>
              
              <div>
                <Label htmlFor="new-task-list">List</Label>
                <select 
                  id="new-task-list"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {mockTaskLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="new-task-description">Description (optional)</Label>
                <Textarea 
                  id="new-task-description"
                  placeholder="Add a description..."
                  className="min-h-20"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                  Cancel
                </Button>
                <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}