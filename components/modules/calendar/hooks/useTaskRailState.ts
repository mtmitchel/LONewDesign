import { useState, useEffect, useRef, useCallback } from 'react';
import { startOfDay, endOfWeek } from 'date-fns';
import { useTaskStore, useTasks, useTaskLists } from '../../tasks/taskStore';
import type { Task } from '../../tasks/types';
import type { TaskInput } from '../../tasks/taskStore';
import type { TaskFilterKey } from '../types';

export function useTaskRailState(externalFilter: TaskFilterKey = 'all') {
  // Store selectors
  const storeTasks = useTasks();
  const lists = useTaskLists();
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const duplicateTask = useTaskStore((state) => state.duplicateTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const setTaskDueDate = useTaskStore((state) => state.setTaskDueDate);

  // Local state
  const [filter, setFilter] = useState<TaskFilterKey>(externalFilter);
  const [sortBy, setSortBy] = useState<'date-created' | 'due-date' | 'title' | 'priority'>('date-created');
  const [composerActive, setComposerActive] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDueDate, setDraftDueDate] = useState<Date | undefined>(undefined);
  const [draftPriority, setDraftPriority] = useState<'low' | 'medium' | 'high' | 'none'>('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const listViewportRef = useRef<HTMLDivElement | null>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync external filter changes
  useEffect(() => {
    setFilter(externalFilter);
  }, [externalFilter]);

  // Clear live messages
  useEffect(() => {
    if (!liveMessage) return;
    const timeout = window.setTimeout(() => setLiveMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [liveMessage]);

  // Keyboard shortcuts
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

  const resetDraft = useCallback(() => {
    setDraftTitle('');
    setDraftDueDate(undefined);
    setDraftPriority('none');
    setShowDatePicker(false);
    setShowPriorityPicker(false);
    setComposerActive(false);
  }, []);

  const registerTaskNode = useCallback((taskId: string, node: HTMLDivElement | null) => {
    if (!node) {
      taskRefs.current.delete(taskId);
    } else {
      taskRefs.current.set(taskId, node);
    }
  }, []);

  const announce = useCallback((message: string) => {
    setLiveMessage(message);
  }, []);

  const handleCreateTask = useCallback(() => {
    if (!draftTitle.trim()) return;
    const dueDate = draftDueDate ? draftDueDate.toISOString().split('T')[0] : undefined;
    const priority = draftPriority !== 'none' ? draftPriority : 'none';

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

    addTask(taskInput);
    announce('Task created');
    resetDraft();
  }, [draftTitle, draftDueDate, draftPriority, addTask, announce, resetDraft]);

  const handleToggleCompletion = useCallback((task: Task) => {
    toggleTaskCompletion(task.id);
    const nextState = task.isCompleted ? 'task_reopened' : 'task_completed';
    announce(nextState === 'task_completed' ? 'Task completed' : 'Task reopened');
  }, [toggleTaskCompletion, announce]);

  const handleDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
    announce('Task deleted');
  }, [deleteTask, announce]);

  const handleDuplicate = useCallback(async (taskId: string) => {
    const duplicate = await duplicateTask(taskId);
    if (duplicate) {
      announce('Task duplicated');
    }
  }, [duplicateTask, announce]);

  const handleDueDateChange = useCallback((task: Task, date: Date | undefined) => {
    const iso = date ? date.toISOString().split('T')[0] : undefined;
    setTaskDueDate(task.id, iso);
    announce(`Due date set to ${date ? date.toLocaleDateString() : 'none'}`);
  }, [setTaskDueDate, announce]);

  const handleTitleCommit = useCallback((task: Task, title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) return;
    updateTask(task.id, { title: trimmed });
  }, [updateTask]);

  return {
    // State
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

    // Refs
    captureInputRef,
    listViewportRef,
    taskRefs,

    // Store data
    storeTasks,
    lists,

    // Actions
    resetDraft,
    registerTaskNode,
    announce,
    handleCreateTask,
    handleToggleCompletion,
    handleDelete,
    handleDuplicate,
    handleDueDateChange,
    handleTitleCommit,
  };
}