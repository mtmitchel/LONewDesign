"use client";

import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { Task } from './types';

type TaskSourceMeta = {
  source?: string;
};

export type TaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'labels' | 'checklist' | 'isPinned'>> & {
  title: string;
  listId?: string;
  labels?: Task['labels'];
  checklist?: Task['checklist'];
  isPinned?: boolean;
} & TaskSourceMeta;

export type TaskUpdates = Partial<Omit<Task, 'id' | 'createdAt'>>;

type TaskStoreState = {
  tasks: Task[];
};

type TaskStoreAction =
  | { type: 'ADD'; task: Task }
  | { type: 'UPDATE'; id: string; updates: TaskUpdates }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE'; id: string; completed: boolean }
  | { type: 'SET_TASKS'; tasks: Task[] };

type TaskStoreContextValue = {
  tasks: Task[];
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, updates: TaskUpdates) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  duplicateTask: (id: string) => Task | null;
  setTaskDueDate: (id: string, dueDate: string | undefined) => void;
};

const TaskStoreContext = createContext<TaskStoreContextValue | null>(null);

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Buy milk',
    status: 'todo',
    priority: 'medium',
    dueDate: '2025-08-17',
    createdAt: '2025-10-03T09:00:00.000Z',
    dateCreated: '2025-10-03T09:00:00.000Z',
    updatedAt: '2025-10-03T09:00:00.000Z',
    labels: [{ name: 'errands', color: 'var(--label-orange)' }],
    listId: 'todo',
    isCompleted: false,
  },
  {
    id: 'task-2',
    title: 'Buy bread',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2025-10-01',
    createdAt: '2025-10-07T10:00:00.000Z',
  dateCreated: '2025-10-07T10:00:00.000Z',
    updatedAt: '2025-10-07T10:00:00.000Z',
    labels: [{ name: 'errands', color: 'var(--label-orange)' }],
    listId: 'in-progress',
    isCompleted: false,
  },
  {
    id: 'task-3',
    title: 'Return library books',
    status: 'todo',
    priority: 'high',
    dueDate: '2025-08-13',
    createdAt: '2025-10-04T12:30:00.000Z',
  dateCreated: '2025-10-04T12:30:00.000Z',
    updatedAt: '2025-10-04T12:30:00.000Z',
    labels: [{ name: 'personal', color: 'var(--label-purple)' }],
    listId: 'todo',
    isCompleted: false,
  },
  {
    id: 'task-4',
    title: 'Draft quarterly review',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-10-29',
    createdAt: '2025-10-09T15:00:00.000Z',
  dateCreated: '2025-10-09T15:00:00.000Z',
    updatedAt: '2025-10-09T15:00:00.000Z',
    labels: [{ name: 'work', color: 'var(--label-blue)' }],
    listId: 'in-progress',
    isCompleted: false,
  },
  {
    id: 'task-5',
    title: 'Ship design QA doc',
    status: 'todo',
    priority: 'none',
    createdAt: '2025-10-02T14:00:00.000Z',
  dateCreated: '2025-10-02T14:00:00.000Z',
    updatedAt: '2025-10-02T14:00:00.000Z',
    labels: [],
    listId: 'todo',
    isCompleted: false,
  },
  {
    id: 'task-6',
    title: 'Organize files',
    status: 'done',
    priority: 'low',
    dueDate: '2025-08-28',
    createdAt: '2025-10-05T08:00:00.000Z',
  dateCreated: '2025-10-05T08:00:00.000Z',
    updatedAt: '2025-10-05T08:00:00.000Z',
    labels: [],
    listId: 'done',
    isCompleted: true,
  },
];

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `task-${Math.random().toString(36).slice(2, 10)}`;
}

function reducer(state: TaskStoreState, action: TaskStoreAction): TaskStoreState {
  switch (action.type) {
    case 'ADD':
      return { tasks: [action.task, ...state.tasks] };
    case 'UPDATE':
      return {
        tasks: state.tasks.map((task) => (task.id === action.id ? { ...task, ...action.updates, updatedAt: new Date().toISOString() } : task)),
      };
    case 'DELETE':
      return { tasks: state.tasks.filter((task) => task.id !== action.id) };
    case 'TOGGLE':
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, isCompleted: action.completed, updatedAt: new Date().toISOString() } : task
        ),
      };
    case 'SET_TASKS':
      return { tasks: action.tasks };
    default:
      return state;
  }
}

function createTask(input: TaskInput): Task {
  const timestamp = new Date().toISOString();
  return {
    id: createId(),
    title: input.title.trim(),
    description: input.description,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'none',
    dueDate: input.dueDate,
    createdAt: timestamp,
    dateCreated: timestamp,
    updatedAt: timestamp,
    assignee: input.assignee,
    labels: input.labels ?? [],
    listId: input.listId ?? input.status ?? 'todo',
    notes: input.notes,
    isCompleted: input.isCompleted ?? false,
    checklist: input.checklist ?? [],
  };
}

function emitTaskEvent(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('task:telemetry', {
        detail: { event, payload },
      })
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[task-event] ${event}`, payload ?? {});
  }
}

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tasks: initialTasks });

  const addTask = useCallback((input: TaskInput) => {
    const { source, ...payload } = input;
    const task = createTask(payload);
    dispatch({ type: 'ADD', task });
    emitTaskEvent('task_created', { source: source ?? 'task_store', id: task.id });
    return task;
  }, []);

  const updateTask = useCallback((id: string, updates: TaskUpdates) => {
    dispatch({ type: 'UPDATE', id, updates });
  }, []);

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE', id });
    emitTaskEvent('task_deleted', { id });
  }, []);

  const toggleTaskCompletion = useCallback((id: string) => {
    const target = state.tasks.find((task) => task.id === id);
    const nextCompleted = !target?.isCompleted;
    dispatch({ type: 'TOGGLE', id, completed: nextCompleted });
    emitTaskEvent(nextCompleted ? 'task_completed' : 'task_reopened', { id });
  }, [state.tasks]);

  const duplicateTask = useCallback((id: string) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return null;

    const duplicated = createTask({
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee,
      labels: task.labels,
      listId: task.listId,
      notes: task.notes,
      checklist: task.checklist,
      isCompleted: false,
    });

    dispatch({ type: 'ADD', task: duplicated });
    emitTaskEvent('task_duplicated', { parentId: id, id: duplicated.id });
    return duplicated;
  }, [state.tasks]);

  const setTaskDueDate = useCallback((id: string, dueDate: string | undefined) => {
    dispatch({ type: 'UPDATE', id, updates: { dueDate } });
    emitTaskEvent('task_due_changed', { id, dueDate });
  }, []);

  const value = useMemo(
    () => ({
      tasks: state.tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskCompletion,
      duplicateTask,
      setTaskDueDate,
    }),
    [state.tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, duplicateTask, setTaskDueDate]
  );

  return <TaskStoreContext.Provider value={value}>{children}</TaskStoreContext.Provider>;
}

export function useTaskStore() {
  const context = useContext(TaskStoreContext);
  if (!context) {
    throw new Error('useTaskStore must be used within a TaskStoreProvider');
  }
  return context;
}

export function useTaskList() {
  return useTaskStore().tasks;
}
