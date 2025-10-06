"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KanbanSquare,
  List,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Flag,
  Calendar as CalendarIcon,
  ChevronDown,
  Tag,
  Clock,
  CheckSquare,
  X,
  Trash,
  Move,
  ChevronRight,
  MoreHorizontal,
  Bold,
  Italic,
  ListTodo,
  Copy
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, differenceInCalendarDays, isTomorrow } from 'date-fns';
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
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '../ui/dropdown-menu';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '../ui/sheet';
import { cn } from '../ui/utils';
import { TaskCard, priorityBadgeClasses, priorityLabel } from './tasks/TaskCard';
import { TaskAddButton } from './tasks/TaskAddButton';
import { TaskColumnHeader } from './tasks/TaskColumnHeader';
import type {
  BoardSection,
  ChecklistItem,
  ComposerDraft,
  Priority,
  SortOption,
  Task,
  TaskList
} from './tasks/types';

const initialLists: TaskList[] = [
  { id: 'personal', name: 'Personal', color: 'var(--primary)', isVisible: true },
  { id: 'work', name: 'Work', color: 'var(--success)', isVisible: true },
  { id: 'shopping', name: 'Shopping', color: 'var(--warning)', isVisible: true },
  { id: 'ideas', name: 'Ideas', color: 'var(--info)', isVisible: false }
];

const initialSections: BoardSection[] = [
  { id: 'todo', name: 'To Do' },
  { id: 'doing', name: 'Doing' },
  { id: 'done', name: 'Done' }
];

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design new dashboard layout',
    description: 'Create wireframes and mockups for the new dashboard design',
    status: 'doing',
    priority: 'high',
    dueDate: '2025-10-15',
    createdAt: '2025-10-01',
    updatedAt: '2025-10-04',
    assignee: 'John Doe',
    labels: ['design', 'ui'],
    listId: 'work',
    notes: 'Align with brand updates from marketing.',
    isCompleted: false,
    checklist: [
      { id: 'task-1-check-1', text: 'Review stakeholder feedback', isCompleted: true },
      { id: 'task-1-check-2', text: 'Publish component spec draft', isCompleted: false }
    ]
  },
  {
    id: 'task-2',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, fruits',
    status: 'todo',
    priority: 'medium',
    dueDate: '2025-10-12',
    createdAt: '2025-09-30',
    updatedAt: '2025-09-30',
    labels: ['errands'],
    listId: 'personal',
    isCompleted: false
  },
  {
    id: 'task-3',
    title: 'Review pull requests',
    description: 'Approve pending PRs from the team',
    status: 'doing',
    priority: 'high',
    dueDate: '2025-10-13',
    createdAt: '2025-09-29',
    updatedAt: '2025-10-02',
    assignee: 'Jane Smith',
    labels: ['code-review', 'urgent'],
    listId: 'work',
    isCompleted: false
  },
  {
    id: 'task-4',
    title: 'Plan weekend trip',
    status: 'done',
    priority: 'low',
    createdAt: '2025-09-15',
    updatedAt: '2025-09-20',
    labels: ['travel', 'personal'],
    listId: 'personal',
    notes: 'Book cabin on Friday.',
    isCompleted: true,
    checklist: [
      { id: 'task-4-check-1', text: 'Confirm lodging', isCompleted: true },
      { id: 'task-4-check-2', text: 'Pack hiking gear', isCompleted: false }
    ]
  }
];



const emptyDraft = (listId: string): ComposerDraft => ({
  title: '',
  dueDate: undefined,
  priority: 'medium',
  listId
});

const priorityOptions: Priority[] = ['high', 'medium', 'low', 'none'];

const PRIORITY_SEGMENTS: Record<Priority, { label: string; active: string; inactive: string }> = {
  high: {
    label: 'High',
    active: 'bg-[var(--danger-tint-20)] text-[var(--danger)] border border-[var(--danger)] shadow-sm',
    inactive: 'text-[var(--danger)] hover:bg-[var(--danger-tint-10)]'
  },
  medium: {
    label: 'Medium',
    active: 'bg-[var(--warning-tint-20)] text-[var(--warning)] border border-[var(--warning)] shadow-sm',
    inactive: 'text-[var(--warning)] hover:bg-[var(--warning-tint-10)]'
  },
  low: {
    label: 'Low',
    active: 'bg-[var(--success-tint-20)] text-[var(--success)] border border-[var(--success)] shadow-sm',
    inactive: 'text-[var(--success)] hover:bg-[var(--success-tint-10)]'
  },
  none: {
    label: 'None',
    active: 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm',
    inactive: 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
  }
};

const formatDay = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return format(parsed, 'MMM d');
};

const toISODate = (value?: Date) => (value ? format(value, 'yyyy-MM-dd') : undefined);

export function TasksModule() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sections, setSections] = useState<BoardSection[]>(initialSections);
  const [lists] = useState<TaskList[]>(initialLists);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selectedList, setSelectedList] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('created');
  const [labelFilters, setLabelFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [activeComposerSection, setActiveComposerSection] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<ComposerDraft>(emptyDraft('personal'));
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const detailTask = useMemo(
    () => tasks.find((task) => task.id === detailTaskId) ?? null,
    [detailTaskId, tasks]
  );
  const [detailDraft, setDetailDraft] = useState<Task | null>(detailTask);
  const [labelInput, setLabelInput] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [hiddenCompletedSections, setHiddenCompletedSections] = useState<Set<string>>(new Set());
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const detailList = useMemo(
    () => (detailTask ? lists.find((list) => list.id === detailTask.listId) ?? null : null),
    [detailTask, lists]
  );

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => task.labels.forEach((label) => set.add(label)));
    return Array.from(set);
  }, [tasks]);

  const labelSuggestions = useMemo(() => {
    if (!detailDraft) return [] as string[];
    const normalized = labelInput.trim().toLowerCase();
    return allLabels
      .filter((label) => !detailDraft.labels.includes(label))
      .filter((label) => !normalized || label.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [allLabels, detailDraft, labelInput]);

  const checklist: ChecklistItem[] = detailDraft?.checklist ?? [];

  useEffect(() => {
    if (detailTask) {
      setDetailDraft({
        ...detailTask,
        labels: [...detailTask.labels],
        checklist: detailTask.checklist ? detailTask.checklist.map((item) => ({ ...item })) : []
      });
    } else {
      setDetailDraft(null);
    }
  }, [detailTask]);

  useEffect(() => {
    setLabelInput('');
    setChecklistInput('');
  }, [detailTaskId]);

  useEffect(() => {
    if (activeComposerSection) {
      const defaultListId = selectedList === 'all' ? lists[0]?.id ?? 'personal' : selectedList;
      setComposerDraft(emptyDraft(defaultListId));
    }
  }, [activeComposerSection, selectedList, lists]);

  const applyDetailUpdate = useCallback(
    (updater: (task: Task) => Task) => {
      if (!detailTaskId) return;
      let normalizedTask: Task | null = null;
      setTasks((current) =>
        current.map((task) => {
          if (task.id !== detailTaskId) return task;
          let updated = updater(task);
          if (!updated.updatedAt || updated.updatedAt === task.updatedAt) {
            updated = { ...updated, updatedAt: new Date().toISOString() };
          }
          normalizedTask = {
            ...updated,
            labels: [...updated.labels],
            checklist: updated.checklist
              ? updated.checklist.map((item: ChecklistItem) => ({ ...item }))
              : []
          };
          return updated;
        })
      );
      if (normalizedTask) {
        setDetailDraft(normalizedTask);
      }
    },
    [detailTaskId]
  );

  const applyDetailPatch = useCallback(
    (patch: Partial<Task>) => {
      applyDetailUpdate((task) => ({ ...task, ...patch }));
    },
    [applyDetailUpdate]
  );

  const handleLabelAdd = (rawLabel: string) => {
    if (!detailDraft) return;
    const trimmed = rawLabel.trim();
    if (!trimmed || detailDraft.labels.includes(trimmed)) {
      setLabelInput('');
      return;
    }
    applyDetailUpdate((task) => ({
      ...task,
      labels: [...task.labels, trimmed]
    }));
    setLabelInput('');
  };

  const handleLabelRemove = (label: string) => {
    applyDetailUpdate((task) => ({
      ...task,
      labels: task.labels.filter((value) => value !== label)
    }));
  };

  const handleLabelInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab' || event.key === ',') {
      event.preventDefault();
      if (labelInput.trim()) {
        handleLabelAdd(labelInput);
      }
    } else if (event.key === 'Backspace' && !labelInput && detailDraft && detailDraft.labels.length) {
      event.preventDefault();
      handleLabelRemove(detailDraft.labels[detailDraft.labels.length - 1]);
    }
  };

  const handleChecklistAdd = () => {
    if (!detailDraft) return;
    const trimmed = checklistInput.trim();
    if (!trimmed) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      isCompleted: false
    };
    applyDetailUpdate((task) => ({
      ...task,
      checklist: [...(task.checklist ?? []), newItem]
    }));
    setChecklistInput('');
  };

  const toggleChecklistItem = (itemId: string, checked: boolean) => {
    applyDetailUpdate((task) => ({
      ...task,
      checklist: (task.checklist ?? []).map((item) =>
        item.id === itemId ? { ...item, isCompleted: checked } : item
      )
    }));
  };

  const handleChecklistTextChange = (itemId: string, text: string) => {
    applyDetailUpdate((task) => ({
      ...task,
      checklist: (task.checklist ?? []).map((item) =>
        item.id === itemId ? { ...item, text } : item
      )
    }));
  };

  const handleChecklistRemove = (itemId: string) => {
    applyDetailUpdate((task) => ({
      ...task,
      checklist: (task.checklist ?? []).filter((item) => item.id !== itemId)
    }));
  };

  const handleCloseDetail = () => {
    setDetailTaskId(null);
    setLabelInput('');
    setChecklistInput('');
  };

  const handleNotesChange = (value: string) => {
    applyDetailPatch({ notes: value });
  };

  const insertAtCursor = (before: string, after = before) => {
    if (!detailDraft) return;
    const textarea = notesTextareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const nextValue = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;
    handleNotesChange(nextValue);
    const nextStart = selectionStart + before.length;
    const nextEnd = nextStart + selected.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  };

  const handleNotesFormatting = (format: 'bold' | 'italic' | 'bulleted' | 'checklist') => {
    if (!detailDraft) return;
    const textarea = notesTextareaRef.current;
    if (!textarea) return;
    const { selectionStart, value } = textarea;

    switch (format) {
      case 'bold':
        insertAtCursor('**', '**');
        break;
      case 'italic':
        insertAtCursor('*', '*');
        break;
      case 'bulleted': {
        const prefixIndex = value.lastIndexOf('\n', selectionStart - 1);
        const insertPosition = prefixIndex === -1 ? 0 : prefixIndex + 1;
        const nextValue = `${value.slice(0, insertPosition)}- ${value.slice(insertPosition)}`;
        handleNotesChange(nextValue);
        requestAnimationFrame(() => {
          const caret = selectionStart + 2;
          textarea.focus();
          textarea.setSelectionRange(caret, caret);
        });
        break;
      }
      case 'checklist': {
        const prefixIndex = value.lastIndexOf('\n', selectionStart - 1);
        const insertPosition = prefixIndex === -1 ? 0 : prefixIndex + 1;
        const nextValue = `${value.slice(0, insertPosition)}- [ ] ${value.slice(insertPosition)}`;
        handleNotesChange(nextValue);
        requestAnimationFrame(() => {
          const caret = selectionStart + 6;
          textarea.focus();
          textarea.setSelectionRange(caret, caret);
        });
        break;
      }
      default:
        break;
    }
  };

  const handleDuplicateTask = () => {
    if (!detailDraft) return;
    const timestamp = new Date().toISOString();
    const duplicate: Task = {
      ...detailDraft,
      id: crypto.randomUUID(),
      title: `${detailDraft.title} (copy)`,
      createdAt: timestamp,
      updatedAt: timestamp,
      isCompleted: false,
      labels: [...detailDraft.labels],
      checklist: detailDraft.checklist
        ? detailDraft.checklist.map((item: ChecklistItem) => ({
            ...item,
            id: crypto.randomUUID()
          }))
        : []
    };
    setTasks((current) => [duplicate, ...current]);
    setDetailTaskId(duplicate.id);
  };

  const handleDeleteTask = () => {
    if (!detailDraft) return;
    setTasks((current) => current.filter((task) => task.id !== detailDraft.id));
    handleCloseDetail();
  };

  const getDueDateDisplay = (value?: string) => {
    if (!value) {
      return {
        primary: 'Set due date',
        secondary: 'No due date',
        tone: 'neutral' as const
      };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return {
        primary: 'Set due date',
        secondary: 'No due date',
        tone: 'neutral' as const
      };
    }

    let primary = format(date, 'MMM d, yyyy');
    let secondary: string | null = null;
    let tone: 'neutral' | 'warning' | 'danger' = 'neutral';

    if (isToday(date)) {
      primary = 'Today';
      secondary = format(date, 'MMM d, yyyy');
      tone = 'warning';
    } else if (isTomorrow(date)) {
      primary = 'Tomorrow';
      secondary = format(date, 'MMM d, yyyy');
    } else if (isPast(date)) {
      primary = format(date, 'MMM d, yyyy');
      secondary = `${formatDistanceToNow(date, { addSuffix: true })}`;
      tone = 'danger';
    } else {
      const daysAway = differenceInCalendarDays(date, new Date());
      if (daysAway <= 7) {
        secondary = formatDistanceToNow(date, { addSuffix: true });
      } else {
        secondary = format(date, 'EEE, MMM d');
      }
    }

    if (!secondary) {
      secondary = format(date, 'MMM d, yyyy');
    }

    return { primary, secondary, tone };
  };

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const base = tasks.filter((task) => {
      const matchesList = selectedList === 'all' || task.listId === selectedList;
      const matchesLabels =
        labelFilters.length === 0 || labelFilters.every((label) => task.labels.includes(label));
      const matchesSearch =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description?.toLowerCase().includes(normalizedQuery) ||
        task.labels.some((label) => label.toLowerCase().includes(normalizedQuery));
      return matchesList && matchesLabels && matchesSearch;
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueDate': {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
        }
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [tasks, selectedList, labelFilters, searchQuery, sortOption]);

  const tasksBySection = useMemo(() => {
    const map = new Map<string, Task[]>();
    sections.forEach((section) => map.set(section.id, []));
    filteredTasks.forEach((task) => {
      if (!map.has(task.status)) {
        map.set(task.status, []);
      }
      map.get(task.status)!.push(task);
    });
    return map;
  }, [filteredTasks, sections]);

  const handleToggleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTasks((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const clearBulkSelection = () => setSelectedTasks(new Set());

  const handleComposerSubmit = (sectionId: string) => {
    const title = composerDraft.title.trim();
    if (!title) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      status: sectionId,
      priority: composerDraft.priority,
      dueDate: toISODate(composerDraft.dueDate),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: [],
      listId: composerDraft.listId,
      isCompleted: false,
      checklist: []
    };

    setTasks((current) => [newTask, ...current]);
    setActiveComposerSection(null);
  };

  const handleComposerCancel = () => {
    setActiveComposerSection(null);
  };

  const handleAddSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const uniqueId = sections.some((section) => section.id === id) ? `${id}-${Date.now()}` : id;
    setSections((current) => [...current, { id: uniqueId, name }]);
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const toggleLabelFilter = (label: string, checked: boolean) => {
    setLabelFilters((current) => {
      if (checked) return [...current, label];
      return current.filter((item) => item !== label);
    });
  };

  const handlePriorityToggle = () => {
    setComposerDraft((draft) => ({
      ...draft,
      priority: draft.priority === 'high' ? 'medium' : 'high'
    }));
  };

  const updateTaskCompletion = (taskId: string, checked: boolean) => {
    let normalizedTask: Task | null = null;
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;
        const updated: Task = {
          ...task,
          isCompleted: checked,
          status: checked ? 'done' : task.status,
          updatedAt: new Date().toISOString()
        };
        normalizedTask = {
          ...updated,
          labels: [...updated.labels],
          checklist: updated.checklist
            ? updated.checklist.map((item: ChecklistItem) => ({ ...item }))
            : []
        };
        return updated;
      })
    );
    if (normalizedTask && taskId === detailTaskId) {
      setDetailDraft(normalizedTask);
    }
  };

  const handleOpenTask = (taskId: string) => {
    setDetailTaskId(taskId);
  };

  const renderComposer = (sectionId: string) => {
    const dueLabel = composerDraft.dueDate ? format(composerDraft.dueDate, 'MMM d, yyyy') : 'Due date';
    const isFlagged = composerDraft.priority === 'high';
    return (
      <div
        className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-[var(--space-3)]"
        style={{ boxShadow: 'var(--elevation-sm)' }}
      >
        <Input
          placeholder="Write a task name"
          value={composerDraft.title}
          onChange={(event) =>
            setComposerDraft((draft) => ({ ...draft, title: event.target.value }))
          }
          autoFocus
          className="mb-[var(--space-2)] h-[var(--field-height)] placeholder:text-[var(--text-secondary)]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleComposerSubmit(sectionId)}
            disabled={!composerDraft.title.trim()}
          >
            Add task
          </Button>
          <Button variant="ghost" size="sm" onClick={handleComposerCancel}>
            Cancel
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-[var(--field-height)] gap-2 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] px-[var(--space-3)] text-xs text-[var(--text-secondary)]"
                aria-label="Set due date"
              >
                <CalendarIcon size={16} className="mr-2" />
                <span className="text-xs text-[var(--text-secondary)]">{dueLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={composerDraft.dueDate}
                onSelect={(date) => setComposerDraft((draft) => ({ ...draft, dueDate: date ?? undefined }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant={isFlagged ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-[var(--field-height)] rounded-[var(--radius-sm)] px-[var(--space-3)]',
              !isFlagged && 'text-[var(--text-secondary)]'
            )}
            onClick={handlePriorityToggle}
            aria-pressed={isFlagged}
            aria-label={isFlagged ? 'Remove high priority' : 'Mark as high priority'}
          >
            <Flag size={16} className={isFlagged ? 'text-white' : 'text-[var(--text-secondary)]'} />
          </Button>
        </div>
      </div>
    );
  };

  const toggleHideCompleted = (sectionId: string) => {
    setHiddenCompletedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleRenameSection = (sectionId: string) => {
    const target = sections.find((section) => section.id === sectionId);
    if (!target) return;
    const name = window.prompt('Rename list', target.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === target.name) return;
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              name: trimmed
            }
          : section
      )
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections((current) => current.filter((section) => section.id !== sectionId));
    setTasks((current) => current.filter((task) => task.status !== sectionId));
    setCollapsedSections((current) => {
      if (!current.has(sectionId)) return current;
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });
    setHiddenCompletedSections((current) => {
      if (!current.has(sectionId)) return current;
      const next = new Set(current);
      next.delete(sectionId);
      return next;
    });
    if (activeComposerSection === sectionId) {
      setActiveComposerSection(null);
    }
  };

  const renderBoard = () => (
    <div className="h-full overflow-x-auto">
      <div className="mx-auto flex min-w-max gap-[var(--space-4)] px-[var(--space-4)] pb-[var(--space-6)] pt-[var(--space-4)]">
        {sections.map((section) => {
          const tasksInSection = tasksBySection.get(section.id) ?? [];
          const isHidingCompleted = hiddenCompletedSections.has(section.id);
          const visibleTasks = isHidingCompleted
            ? tasksInSection.filter((task) => !task.isCompleted)
            : tasksInSection;
          return (
            <div key={section.id} className="flex w-[18.5rem] flex-shrink-0 flex-col">
              <TaskColumnHeader
                title={section.name}
                taskCount={visibleTasks.length}
                isHidingCompleted={isHidingCompleted}
                onToggleHideCompleted={() => toggleHideCompleted(section.id)}
                onRename={() => handleRenameSection(section.id)}
                onDelete={() => handleDeleteSection(section.id)}
                sortOption={sortOption}
                onSortChange={setSortOption}
              />
              {activeComposerSection === section.id ? (
                <div className="mb-[var(--space-3)]">{renderComposer(section.id)}</div>
              ) : (
                <div className="mb-[var(--space-3)]">
                  <TaskAddButton onClick={() => setActiveComposerSection(section.id)} />
                </div>
              )}
              <div className="space-y-[var(--space-3)]">
                {visibleTasks.length === 0 && (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-[var(--space-4)] text-center text-[var(--text-tertiary)]">
                    {isHidingCompleted ? 'All tasks completed' : 'No tasks yet'}
                  </div>
                )}
                {visibleTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dueLabel={formatDay(task.dueDate)}
                    onToggleComplete={updateTaskCompletion}
                    onOpen={setDetailTaskId}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex w-[18.5rem] flex-shrink-0 flex-col rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-[var(--space-3)] shadow-[var(--elevation-sm)]">
          {isAddingSection ? (
            <div className="space-y-[var(--space-3)]">
              <Input
                placeholder="Section name"
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                className="h-[var(--field-height)]"
                autoFocus
              />
              <div className="flex items-center gap-[var(--space-2)]">
                <Button size="sm" onClick={handleAddSection} disabled={!newSectionName.trim()}>
                  Add section
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsAddingSection(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <TaskAddButton onClick={() => setIsAddingSection(true)} label="Add section" />
          )}
        </div>
      </div>
    </div>
  );

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const renderList = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid grid-cols-[minmax(0,2fr)_140px_110px_110px] gap-4 px-8 pt-6 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
        <span>Task name</span>
        <span className="border-l border-[var(--border-subtle)] pl-4">Due date</span>
        <span className="border-l border-[var(--border-subtle)] pl-4">Priority</span>
        <span className="border-l border-[var(--border-subtle)] pl-4">Labels</span>
      </div>
      <div className="mt-2 flex-1 overflow-y-auto px-6 pb-12">
        <div className="space-y-6">
          {sections.map((section) => {
            const tasksInSection = tasksBySection.get(section.id) ?? [];
            const isCollapsed = collapsedSections.has(section.id);
            return (
              <div key={section.id} className="group/list">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--primary-tint-10)]/40"
                  onClick={() => toggleSectionCollapse(section.id)}
                >
                  <span className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    {section.name}
                    <span className="text-xs text-[var(--text-tertiary)]">{tasksInSection.length}</span>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="mt-2 divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                    {tasksInSection.map((task) => {
                      const dueLabel = formatDay(task.dueDate);
                      return (
                        <div
                          key={task.id}
                          className="grid grid-cols-[minmax(0,2fr)_140px_110px_110px] items-center gap-4 px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--primary-tint-10)]/40"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedTasks.has(task.id)}
                              onCheckedChange={(checked) => handleToggleTaskSelection(task.id, !!checked)}
                              aria-label={`Select ${task.title}`}
                            />
                            <button
                              type="button"
                              className={`flex-1 text-left ${task.isCompleted ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}
                              onClick={() => handleOpenTask(task.id)}
                            >
                              {task.title}
                            </button>
                          </div>
                          <div className="border-l border-[var(--border-subtle)] pl-4 text-xs text-[var(--text-tertiary)]">
                            {dueLabel ?? '—'}
                          </div>
                          <div className="border-l border-[var(--border-subtle)] pl-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${priorityBadgeClasses[task.priority]}`}>
                              {priorityLabel(task.priority)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 border-l border-[var(--border-subtle)] pl-4 text-xs">
                            {task.labels.length > 0 ? (
                              task.labels.map((label) => (
                                <Badge key={label} variant="secondary" className="bg-[var(--primary-tint-10)] text-[var(--primary)]">
                                  #{label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[var(--text-tertiary)]">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {activeComposerSection === section.id ? (
                      <div className="border-t border-[var(--border-subtle)] px-4 py-3">{renderComposer(section.id)}</div>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover/list:opacity-100 hover:text-[var(--primary)] focus:opacity-100"
                        onClick={() => setActiveComposerSection(section.id)}
                      >
                        <Plus size={16} />
                        Add task…
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--text-secondary)]"
            onClick={() => setIsAddingSection(true)}
          >
            <Plus size={16} className="mr-2" />
            Add section
          </Button>
        </div>
      </div>
    </div>
  );

  const bulkActionsActive = selectedTasks.size > 0;

  const dueDateDisplay = detailDraft
    ? getDueDateDisplay(detailDraft.dueDate)
    : { primary: 'Set due date', secondary: 'No due date', tone: 'neutral' as const };

  const dueToneClasses = {
    neutral: '',
    warning: 'border-[var(--warning)] text-[var(--warning)] hover:border-[var(--warning)] hover:text-[var(--warning)]',
    danger: 'border-[var(--danger)] text-[var(--danger)] hover:border-[var(--danger)] hover:text-[var(--danger)]'
  } as const;

  const updatedCopy = detailDraft
    ? detailDraft.updatedAt
      ? `Auto-saved ${formatDistanceToNow(new Date(detailDraft.updatedAt), { addSuffix: true })}`
      : `Created ${formatDistanceToNow(new Date(detailDraft.createdAt), { addSuffix: true })}`
    : '';

  const checklistCompleted = checklist.filter((item) => item.isCompleted).length;

  return (
    <Sheet open={Boolean(detailTask)} onOpenChange={(open) => !open && setDetailTaskId(null)}>
      <div className="flex h-full flex-col bg-[var(--surface)]">
        <header className="border-b border-[var(--border-subtle)] bg-[var(--surface)] px-6 py-5 shadow-sm">
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface)] p-1">
                <Button
                  variant={viewMode === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  className={viewMode === 'board' ? 'bg-[var(--primary)] text-white' : ''}
                  onClick={() => setViewMode('board')}
                >
                  <KanbanSquare size={16} className="mr-2" />
                  Board
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={viewMode === 'list' ? 'bg-[var(--primary)] text-white' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} className="mr-2" />
                  List
                </Button>
              </div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Tasks</h1>
            </div>
            <div className="flex justify-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search tasks..."
                  className="h-9 w-full pl-10 bg-[var(--bg-surface)] border-[var(--border-default)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter size={16} className="mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Labels</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allLabels.length === 0 && (
                    <DropdownMenuItem disabled>No labels yet</DropdownMenuItem>
                  )}
                  {allLabels.map((label) => (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={labelFilters.includes(label)}
                      onCheckedChange={(checked) => toggleLabelFilter(label, !!checked)}
                    >
                      <Tag size={14} className="mr-2" />
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTasks(initialTasks)}>Reset demo data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setActiveComposerSection(sections[0]?.id ?? null)}>
                <Plus size={16} className="mr-2" />
                Add task
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[140px] justify-between">
                    <span>{selectedList === 'all' ? 'All lists' : lists.find((list) => list.id === selectedList)?.name ?? 'Select list'}</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSelectedList('all')} className={selectedList === 'all' ? 'bg-[var(--primary-tint-10)]' : ''}>
                    All lists
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {lists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => setSelectedList(list.id)}
                      className={selectedList === list.id ? 'bg-[var(--primary-tint-10)]' : ''}
                    >
                      <span className="mr-2 inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                      {list.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[120px] justify-between">
                    <span>Sort</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <DropdownMenuRadioItem value="created">Date created</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dueDate">Due date</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {bulkActionsActive && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--primary-tint-10)] px-4 py-3 text-sm text-[var(--primary)]">
              <span>{selectedTasks.size} selected</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <CheckSquare size={14} className="mr-2" />
                  Complete
                </Button>
                <Button variant="ghost" size="sm">
                  <Move size={14} className="mr-2" />
                  Move
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash size={14} className="mr-2" />
                  Delete
                </Button>
                <Button variant="ghost" size="icon" onClick={clearBulkSelection}>
                  <X size={14} />
                </Button>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-hidden">
          {viewMode === 'board' ? renderBoard() : renderList()}
        </main>
      </div>
      <SheetContent
        side="right"
        className="fixed inset-y-0 right-0 w-[var(--tripane-right-width)] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col p-0 shadow-[var(--elevation-xl)] z-[var(--z-overlay)]"
      >
        {detailDraft && (
          <>
            <div className="flex items-start justify-between px-[var(--space-6)] py-[var(--space-4)] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  {detailList && (
                    <Badge className="flex items-center gap-2 border-0 bg-[var(--bg-surface-elevated)] px-3 py-1 text-[var(--text-xs)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: detailList.color }}
                        aria-hidden="true"
                      />
                      {detailList.name}
                    </Badge>
                  )}
                  {updatedCopy && <span>{updatedCopy}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)]"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Task actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleDuplicateTask} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteTask}
                      className="gap-2 text-[var(--danger)] focus:text-[var(--danger)]"
                    >
                      <Trash className="h-4 w-4" />
                      Delete task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full hover:bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors duration-[var(--duration-fast)]"
                  onClick={handleCloseDetail}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="px-[var(--space-6)] py-[var(--space-5)]">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={detailDraft.isCompleted}
                  onCheckedChange={(checked) => updateTaskCompletion(detailDraft.id, Boolean(checked))}
                  aria-label={detailDraft.isCompleted ? 'Reopen task' : 'Mark task complete'}
                  className="mt-1"
                />
                <textarea
                  value={detailDraft.title}
                  onChange={(event) => applyDetailPatch({ title: event.target.value })}
                  className="flex-1 resize-none border-none bg-transparent text-[var(--text-xl)] font-[var(--font-weight-semibold)] leading-tight tracking-tight text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                  placeholder="Task title"
                  rows={1}
                  style={{ minHeight: '32px' }}
                />
              </div>
            </div>

            <div className="px-[var(--space-6)] space-y-[var(--space-5)]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] min-w-[80px]">
                  Due date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-11 w-[220px] justify-start gap-3 bg-[var(--bg-surface)] px-3 text-left text-[var(--text-sm)] font-[var(--font-weight-normal)] transition-all duration-[var(--duration-fast)]',
                        'border-[var(--border-subtle)] hover:bg-[var(--bg-surface-elevated)]',
                        dueToneClasses[dueDateDisplay.tone]
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                      <div className="flex flex-col">
                        <span className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                          {dueDateDisplay.primary}
                        </span>
                        <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                          {dueDateDisplay.secondary}
                        </span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={detailDraft.dueDate ? new Date(detailDraft.dueDate) : undefined}
                      onSelect={(date) =>
                        applyDetailPatch({ dueDate: date ? format(date, 'yyyy-MM-dd') : undefined })
                      }
                      initialFocus
                    />
                    <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--text-secondary)] hover:text-[var(--danger)]"
                        onClick={() => applyDetailPatch({ dueDate: undefined })}
                      >
                        Clear date
                      </Button>
                      <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        {detailDraft.dueDate ? dueDateDisplay.secondary : 'No reminder set'}
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] min-w-[80px]">
                  Priority
                </span>
                <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] p-1 gap-1">
                  {priorityOptions.map((option) => {
                    const segment = PRIORITY_SEGMENTS[option];
                    const isActive = detailDraft.priority === option;
                    return (
                      <Button
                        key={option}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          'h-7 px-3 text-[var(--text-xs)] font-[var(--font-weight-medium)] rounded-[var(--radius-sm)] transition-all duration-[var(--duration-fast)]',
                          isActive ? segment.active : segment.inactive
                        )}
                        onClick={() => applyDetailPatch({ priority: option })}
                      >
                        {segment.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] min-w-[80px] pt-1">
                  Labels
                </span>
                <div className="flex-1 ml-[var(--space-4)]">
                  <div className="mb-[var(--space-3)] flex flex-wrap gap-2">
                    {detailDraft.labels.map((label, index) => (
                      <Badge
                        key={label}
                        className={cn(
                          'flex items-center gap-1 rounded-[var(--radius-pill)] border-0 px-2 text-[var(--text-xs)] font-[var(--font-weight-medium)]',
                          index === 0
                            ? 'bg-[var(--primary-tint-10)] text-[var(--primary)]'
                            : 'bg-[var(--accent-coral-tint-10)] text-[var(--accent-coral)]'
                        )}
                      >
                        {label}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-5 w-5 rounded-full p-0 text-[var(--text-tertiary)] transition-colors duration-[var(--duration-fast)]',
                            index === 0
                              ? 'hover:bg-[var(--primary-tint-15)] hover:text-[var(--primary)]'
                              : 'hover:bg-[var(--accent-coral-tint-15)] hover:text-[var(--accent-coral)]'
                          )}
                          onClick={() => handleLabelRemove(label)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={labelInput}
                      onChange={(event) => setLabelInput(event.target.value)}
                      onKeyDown={handleLabelInputKeyDown}
                      placeholder="Add label..."
                      className="h-8 text-[var(--text-xs)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    />
                    {labelSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {labelSuggestions.map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-[var(--text-xs)] font-[var(--font-weight-medium)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--primary-tint-10)] hover:text-[var(--primary)] transition-all duration-[var(--duration-fast)]"
                            onClick={() => handleLabelAdd(suggestion)}
                          >
                            #{suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    {labelInput && labelSuggestions.length === 0 && (
                      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                        Press Enter to create “{labelInput.trim()}”.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-[var(--space-6)] py-[var(--space-5)] border-t border-[var(--border-subtle)] space-y-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <label className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                  Notes
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    onClick={() => handleNotesFormatting('bold')}
                    aria-label="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    onClick={() => handleNotesFormatting('italic')}
                    aria-label="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    onClick={() => handleNotesFormatting('bulleted')}
                    aria-label="Insert bullet list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    onClick={() => handleNotesFormatting('checklist')}
                    aria-label="Insert checklist"
                  >
                    <ListTodo className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={notesTextareaRef}
                  value={detailDraft.notes ?? ''}
                  onChange={(event) => handleNotesChange(event.target.value)}
                  className="w-full min-h-[160px] resize-y rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3 text-[var(--text-sm)] text-[var(--text-primary)] shadow-[var(--elevation-xs)] transition-all duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20 placeholder:text-[var(--text-tertiary)]"
                  placeholder="Add notes, decisions, and context..."
                />
              </div>
              <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                Markdown shortcuts and checklists are supported.
              </p>
            </div>

            <div className="px-[var(--space-6)] py-[var(--space-5)] border-t border-[var(--border-subtle)] space-y-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <label className="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                  Checklist
                </label>
                {checklist.length > 0 && (
                  <span className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
                    {checklistCompleted}/{checklist.length} complete
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {checklist.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-[var(--space-3)] py-[var(--space-3)] text-[var(--text-sm)] text-[var(--text-tertiary)]">
                    Break down the task into actionable steps.
                  </div>
                ) : (
                  checklist.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-transparent bg-[var(--bg-surface-elevated)] px-[var(--space-3)] py-2 transition-colors duration-[var(--duration-fast)] hover:border-[var(--border-subtle)]"
                    >
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={(checked) => toggleChecklistItem(item.id, Boolean(checked))}
                        aria-label={`Toggle ${item.text}`}
                      />
                      <Input
                        value={item.text}
                        onChange={(event) => handleChecklistTextChange(item.id, event.target.value)}
                        className="flex-1 border-none bg-transparent text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus-visible:ring-0"
                        placeholder="Checklist item"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                        onClick={() => handleChecklistRemove(item.id)}
                        aria-label="Remove checklist item"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={checklistInput}
                  onChange={(event) => setChecklistInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleChecklistAdd();
                    }
                  }}
                  placeholder="Add checklist item..."
                  className="h-8 flex-1 text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-[var(--text-sm)] font-[var(--font-weight-medium)] border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)] transition-all duration-[var(--duration-fast)]"
                  onClick={handleChecklistAdd}
                  disabled={!checklistInput.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-auto px-[var(--space-6)] py-[var(--space-4)] border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-tertiary)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{updatedCopy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={detailDraft.isCompleted ? 'outline' : 'ghost'}
                    size="sm"
                    className="h-8 px-4 text-[var(--text-sm)] font-[var(--font-weight-medium)] transition-all duration-[var(--duration-fast)]"
                    onClick={() => updateTaskCompletion(detailDraft.id, !detailDraft.isCompleted)}
                  >
                    {detailDraft.isCompleted ? 'Reopen task' : 'Mark complete'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        More
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Task actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={handleDuplicateTask} className="gap-2">
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDeleteTask}
                        className="gap-2 text-[var(--danger)] focus:text-[var(--danger)]"
                      >
                        <Trash className="h-4 w-4" />
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}