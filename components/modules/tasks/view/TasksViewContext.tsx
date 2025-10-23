"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Task, TaskLabel } from '../types';
import { useTasks } from '../taskStore';
import { projects } from '../../projects/data';
import { openQuickAssistant } from '../../../assistant';

interface TasksViewContextType {
  // View mode
  viewMode: 'board' | 'list';
  setViewMode: (mode: 'board' | 'list') => void;
  
  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLabels: string[];
  setSelectedLabels: (labels: string[]) => void;
  selectedList: string | null;
  setSelectedList: (listId: string | null) => void;
  globalSort: 'due-date' | 'date-created' | 'priority';
  setGlobalSort: (sort: 'due-date' | 'date-created' | 'priority') => void;
  
  // Project scope
  projectFilter: string | null;
  setProjectFilter: (projectId: string | null) => void;
  activeProject?: typeof projects[0];
  
  // Dialog states
  isAddingList: boolean;
  setIsAddingList: (adding: boolean) => void;
  newListName: string;
  setNewListName: (name: string) => void;
  listComposerSection: string | null;
  setListComposerSection: (section: string | null) => void;
  deleteListDialog: { isOpen: boolean; listId: string; listTitle: string; taskCount: number } | null;
  setDeleteListDialog: (dialog: { isOpen: boolean; listId: string; listTitle: string; taskCount: number } | null) => void;
  fallbackList: string;
  setFallbackList: (listId: string) => void;
  
  // Task selection
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  
  // Label helpers
  labelsColorMap: Map<string, string>;
  allLabels: string[];
  availableLabelOptions: Array<{ name: string; color: string }>;
  
  // Actions
  toggleLabelFilter: (label: string) => void;
  handleOpenAssistant: () => void;
}

const TasksViewContext = createContext<TasksViewContextType | undefined>(undefined);

export function TasksViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [globalSort, setGlobalSort] = useState<'due-date' | 'date-created' | 'priority'>('date-created');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listComposerSection, setListComposerSection] = useState<string | null>(null);
  const [labelsColorMap, setLabelsColorMap] = useState<Map<string, string>>(new Map());
  const [deleteListDialog, setDeleteListDialog] = useState<{ isOpen: boolean; listId: string; listTitle: string; taskCount: number } | null>(null);
  const [fallbackList, setFallbackList] = useState<string>('todo');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasks = useTasks();
  const getLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
  const getLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;

  // Get all unique labels from tasks with their colors
  useEffect(() => {
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

  // Handle project scope events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: string }>).detail;
      setProjectFilter(detail?.projectId ?? null);
    };
    window.addEventListener('tasks:set-project-scope', listener as EventListener);
    return () => window.removeEventListener('tasks:set-project-scope', listener as EventListener);
  }, []);

  const activeProject = React.useMemo(() => projects.find((project) => project.id === projectFilter), [projectFilter]);

  const allLabels = Array.from(labelsColorMap.keys()).sort();
  const availableLabelOptions = React.useMemo(
    () => Array.from(labelsColorMap.entries()).map(([name, color]) => ({ name, color })),
    [labelsColorMap],
  );

  const toggleLabelFilter = (label: string) => {
    setSelectedLabels(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const handleOpenAssistant = () => {
    const scope = projectFilter ? { projectId: projectFilter } : undefined;
    openQuickAssistant({ mode: 'task', scope });
  };

  const value: TasksViewContextType = {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedLabels,
    setSelectedLabels,
    selectedList,
    setSelectedList,
    globalSort,
    setGlobalSort,
    projectFilter,
    setProjectFilter,
    activeProject,
    isAddingList,
    setIsAddingList,
    newListName,
    setNewListName,
    listComposerSection,
    setListComposerSection,
    deleteListDialog,
    setDeleteListDialog,
    fallbackList,
    setFallbackList,
    selectedTask,
    setSelectedTask,
    labelsColorMap,
    allLabels,
    availableLabelOptions,
    toggleLabelFilter,
    handleOpenAssistant,
  };

  return (
    <TasksViewContext.Provider value={value}>
      {children}
    </TasksViewContext.Provider>
  );
}

export function useTasksView() {
  const context = useContext(TasksViewContext);
  if (context === undefined) {
    throw new Error('useTasksView must be used within a TasksViewProvider');
  }
  return context;
}