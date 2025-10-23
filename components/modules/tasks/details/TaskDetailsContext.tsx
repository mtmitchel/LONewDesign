"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { Task } from '../types';

interface TaskDetailsContextType {
  // Task state
  task: Task | null;
  edited: Task | null;
  setEdited: (task: Task | null) => void;
  savedHint: string | null;
  setSavedHint: (hint: string | null) => void;
  
  // UI state
  dateOpen: boolean;
  setDateOpen: (open: boolean) => void;
  labelsOpen: boolean;
  setLabelsOpen: (open: boolean) => void;
  priorityOpen: boolean;
  setPriorityOpen: (open: boolean) => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  
  // Label management
  labelInput: string;
  setLabelInput: (input: string) => void;
  labelInputRef: React.RefObject<HTMLInputElement | null>;
  
  // Subtask management
  isSubtaskComposerOpen: boolean;
  setIsSubtaskComposerOpen: (open: boolean) => void;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (title: string) => void;
  newSubtaskDueDate: string | undefined;
  setNewSubtaskDueDate: (date: string | undefined) => void;
  newSubtaskDateOpen: boolean;
  setNewSubtaskDateOpen: (open: boolean) => void;
  activeSubtaskDatePicker: string | null;
  setActiveSubtaskDatePicker: (id: string | null) => void;
  newSubtaskInputRef: React.RefObject<HTMLInputElement | null>;
  subtaskInputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  
  // Actions
  onUpdateTask: (task: Task, options?: { showToast?: boolean }) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
  
  // Helper functions
  handleClearFields: () => void;
  resetState: () => void;
}

const TaskDetailsContext = createContext<TaskDetailsContextType | undefined>(undefined);

interface TaskDetailsProviderProps {
  children: React.ReactNode;
  task: Task | null;
  onUpdateTask: (task: Task, options?: { showToast?: boolean }) => void;
  onDeleteTask: (taskId: string) => void;
  onClose: () => void;
}

export function TaskDetailsProvider({ 
  children, 
  task, 
  onUpdateTask, 
  onDeleteTask, 
  onClose 
}: TaskDetailsProviderProps) {
  // Task state
  const [edited, setEdited] = useState<Task | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  
  // UI state
  const [dateOpen, setDateOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Label management
  const [labelInput, setLabelInput] = useState('');
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  
  // Subtask management
  const [isSubtaskComposerOpen, setIsSubtaskComposerOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState<string | undefined>(undefined);
  const [newSubtaskDateOpen, setNewSubtaskDateOpen] = useState(false);
  const [activeSubtaskDatePicker, setActiveSubtaskDatePicker] = useState<string | null>(null);
  const newSubtaskInputRef = useRef<HTMLInputElement | null>(null);
  const subtaskInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const lastTaskIdRef = useRef<string | null>(null);

  // Reset state when task changes
  const resetState = useCallback(() => {
    setEdited(null);
    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setActiveSubtaskDatePicker(null);
    subtaskInputRefs.current.clear();
    setLabelInput('');
    setSavedHint(null);
    setDateOpen(false);
    setLabelsOpen(false);
    setPriorityOpen(false);
    setDeleteDialogOpen(false);
  }, []);

  // Handle task changes
  useEffect(() => {
    if (!task) {
      resetState();
      return;
    }

    if (task.id !== lastTaskIdRef.current) {
      lastTaskIdRef.current = task.id;
      setEdited(task);
      resetState();
    }
  }, [task, resetState]);

  // Handle clear fields
  const handleClearFields = useCallback(() => {
    setEdited((prev) => {
      if (!prev) return prev;
      const cleared: Task = {
        ...prev,
        description: undefined,
        dueDate: undefined,
        priority: 'none',
        labels: [],
        subtasks: [],
      };
      onUpdateTask(cleared, { showToast: false });
      return cleared;
    });

    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setActiveSubtaskDatePicker(null);
    setLabelInput('');
  }, [onUpdateTask]);

  const value: TaskDetailsContextType = {
    // Task state
    task,
    edited,
    setEdited,
    savedHint,
    setSavedHint,
    
    // UI state
    dateOpen,
    setDateOpen,
    labelsOpen,
    setLabelsOpen,
    priorityOpen,
    setPriorityOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    
    // Label management
    labelInput,
    setLabelInput,
    labelInputRef,
    
    // Subtask management
    isSubtaskComposerOpen,
    setIsSubtaskComposerOpen,
    newSubtaskTitle,
    setNewSubtaskTitle,
    newSubtaskDueDate,
    setNewSubtaskDueDate,
    newSubtaskDateOpen,
    setNewSubtaskDateOpen,
    activeSubtaskDatePicker,
    setActiveSubtaskDatePicker,
    newSubtaskInputRef,
    subtaskInputRefs,
    
    // Actions
    onUpdateTask,
    onDeleteTask,
    onClose,
    
    // Helper functions
    handleClearFields,
    resetState,
  };

  return (
    <TaskDetailsContext.Provider value={value}>
      {children}
    </TaskDetailsContext.Provider>
  );
}

export function useTaskDetails() {
  const context = useContext(TaskDetailsContext);
  if (context === undefined) {
    throw new Error('useTaskDetails must be used within a TaskDetailsProvider');
  }
  return context;
}