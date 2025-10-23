
import * as React from 'react';
import { useTaskStore } from '../taskStore';
import type { Task, TaskLabel, Subtask } from '../types';
import { format } from 'date-fns';

const getLabelName = (label: TaskLabel) => (typeof label === 'string' ? label : label.name);
const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

export function useTaskDetails(
  task: Task | null,
  onUpdateTask: (task: Task, options?: { showToast?: boolean }) => void,
  onClose: () => void
) {
  const [edited, setEdited] = React.useState<Task | null>(null);
  const [savedHint, setSavedHint] = React.useState<string | null>(null);
  const [dateOpen, setDateOpen] = React.useState(false);
  const [labelsOpen, setLabelsOpen] = React.useState(false);
  const [priorityOpen, setPriorityOpen] = React.useState(false);
  const [labelInput, setLabelInput] = React.useState('');
  const [isSubtaskComposerOpen, setIsSubtaskComposerOpen] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = React.useState<string | undefined>(undefined);
  const [newSubtaskDateOpen, setNewSubtaskDateOpen] = React.useState(false);
  const [activeSubtaskDatePicker, setActiveSubtaskDatePicker] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const labelInputRef = React.useRef<HTMLInputElement | null>(null);
  const newSubtaskInputRef = React.useRef<HTMLInputElement | null>(null);
  const subtaskInputRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());
  const lastTaskIdRef = React.useRef<string | null>(null);

  const tasksById = useTaskStore((s) => s.tasksById);

  React.useEffect(() => {
    if (!task) {
      setEdited(null);
      setIsSubtaskComposerOpen(false);
      setNewSubtaskTitle('');
      setNewSubtaskDueDate(undefined);
      setNewSubtaskDateOpen(false);
      setActiveSubtaskDatePicker(null);
      subtaskInputRefs.current.clear();
      lastTaskIdRef.current = null;
      return;
    }

    setEdited(task);

    const previousId = lastTaskIdRef.current;
    const isDifferentTask = previousId !== task.id;

    if (isDifferentTask) {
      setIsSubtaskComposerOpen(false);
      setNewSubtaskTitle('');
      setNewSubtaskDueDate(undefined);
      setNewSubtaskDateOpen(false);
      setActiveSubtaskDatePicker(null);
      subtaskInputRefs.current.clear();
    }

    lastTaskIdRef.current = task.id;
  }, [task]);

  const handleSave = React.useCallback(
    (updates: Partial<Task>) => {
      setEdited((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...updates } as Task;
        onUpdateTask(next, { showToast: false });
        setSavedHint('Saved');
        const t = setTimeout(() => setSavedHint(null), 1200);
        return next;
      });
    },
    [onUpdateTask]
  );

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave({ isCompleted: !edited?.isCompleted });
        return;
      }
    },
    [onClose, handleSave, edited]
  );

  React.useEffect(() => {
    if (!task) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, handleKeyDown]);

  const availableLabels = React.useMemo(() => {
    const map = new Map<string, string>();
    Object.values(tasksById).forEach((t) => {
      const labels = Array.isArray(t.labels) ? (t.labels as TaskLabel[]) : [];
      labels.forEach((l) => map.set(getLabelName(l), typeof l === 'string' ? 'var(--label-blue)' : l.color));
    });
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [tasksById]);

  const currentLabels = React.useMemo(() => {
    const raw = (edited?.labels as TaskLabel[] | undefined) ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [edited]);

  const selectedLabels = React.useMemo(
    () =>
      currentLabels.map((label) =>
        typeof label === 'string'
          ? { name: label, color: DEFAULT_LABEL_COLOR }
          : { name: label.name, color: label.color ?? DEFAULT_LABEL_COLOR }
      ),
    [currentLabels]
  );

  const normalizedAvailableLabels = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    availableLabels.forEach((label) => {
      const key = label.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: label.name, color: label.color });
      }
    });
    return Array.from(map.values());
  }, [availableLabels]);

  const mergedLabelOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    [...normalizedAvailableLabels, ...selectedLabels].forEach((label) => {
      const key = label.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, label);
      }
    });
    return Array.from(map.values());
  }, [normalizedAvailableLabels, selectedLabels]);

  const toggleLabel = React.useCallback(
    (label: { name: string; color: string }) => {
      const exists = currentLabels.some((item) => getLabelName(item) === label.name);
      const normalized = { name: label.name, color: label.color ?? DEFAULT_LABEL_COLOR };
      handleSave({
        labels: exists
          ? currentLabels.filter((item) => getLabelName(item) !== label.name)
          : [...currentLabels, normalized],
      });
    },
    [currentLabels, handleSave]
  );

  const focusLabelInput = React.useCallback(() => {
    const input = labelInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const value = input.value;
    input.setSelectionRange?.(value.length, value.length);
  }, []);

  const addFreeformLabel = React.useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      toggleLabel({ name: trimmed, color: DEFAULT_LABEL_COLOR });
      setLabelInput('');
    },
    [toggleLabel]
  );

  React.useLayoutEffect(() => {
    if (!labelsOpen) return;
    const frame = requestAnimationFrame(() => {
      focusLabelInput();
    });
    return () => cancelAnimationFrame(frame);
  }, [labelsOpen, focusLabelInput]);

  const handleToggleSubtaskCompletion = React.useCallback(
    (subtaskId: string, isCompleted: boolean) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, isCompleted } : subtask
      );
      handleSave({ subtasks: next });
    },
    [edited, handleSave]
  );

  const handleUpdateSubtaskDueDate = React.useCallback(
    (subtaskId: string, dueDate: string | undefined) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, dueDate } : subtask
      );
      handleSave({ subtasks: next });
    },
    [edited, handleSave]
  );

  const handleDeleteSubtask = React.useCallback(
    (subtaskId: string) => {
      if (!edited) return;
      const next = (edited.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId);
      handleSave({ subtasks: next });
    },
    [edited, handleSave]
  );

  const handleSubtaskTitleChange = React.useCallback(
    (subtaskId: string, title: string) => {
      setEdited((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: (prev.subtasks ?? []).map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, title } : subtask
          ),
        };
      });
    },
    []
  );

  const handleSubtaskTitleCommit = React.useCallback(() => {
    if (!edited) return;
    handleSave({ subtasks: edited.subtasks ?? [] });
  }, [edited, handleSave]);

  const openSubtaskComposer = React.useCallback(() => {
    setIsSubtaskComposerOpen(true);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
    setActiveSubtaskDatePicker(null);
    if (isSubtaskComposerOpen) {
      requestAnimationFrame(() => {
        newSubtaskInputRef.current?.focus();
      });
    }
  }, [isSubtaskComposerOpen]);

  const handleAddSubtask = React.useCallback(() => {
    if (!edited) return;
    const trimmedTitle = newSubtaskTitle.trim();
    if (!trimmedTitle) return;
    const nextSubtask: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle,
      isCompleted: false,
      dueDate: newSubtaskDueDate,
    };
    const current = edited.subtasks ?? [];
    handleSave({ subtasks: [...current, nextSubtask] });
    openSubtaskComposer();
  }, [edited, handleSave, newSubtaskDueDate, newSubtaskTitle, openSubtaskComposer]);

  const handleCancelNewSubtask = React.useCallback(() => {
    setIsSubtaskComposerOpen(false);
    setNewSubtaskTitle('');
    setNewSubtaskDueDate(undefined);
    setNewSubtaskDateOpen(false);
  }, []);

  const focusSubtaskInput = React.useCallback((subtaskId: string) => {
    const target = subtaskInputRefs.current.get(subtaskId);
    if (!target) return;
    requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.select?.();
    });
  }, []);

  const handleSubtaskDueDateSelection = React.useCallback(
    (subtaskId: string, date: Date | undefined) => {
      handleUpdateSubtaskDueDate(subtaskId, date ? format(date, 'yyyy-MM-dd') : undefined);
      setActiveSubtaskDatePicker(null);
    },
    [handleUpdateSubtaskDueDate]
  );

  const handleClearSubtaskDueDate = React.useCallback(
    (subtaskId: string) => {
      handleUpdateSubtaskDueDate(subtaskId, undefined);
      setActiveSubtaskDatePicker(null);
    },
    [handleUpdateSubtaskDueDate]
  );

  const handleNewSubtaskDateSelection = React.useCallback((date: Date | undefined) => {
    if (date) {
      setNewSubtaskDueDate(format(date, 'yyyy-MM-dd'));
    } else {
      setNewSubtaskDueDate(undefined);
    }
    setNewSubtaskDateOpen(false);
  }, []);

  const handleDuplicateSubtask = React.useCallback(
    (subtaskId: string) => {
      if (!edited) return;
      const current = edited.subtasks ?? [];
      const index = current.findIndex((item) => item.id === subtaskId);
      if (index === -1) return;
      const source = current[index];
      const duplicate: Subtask = {
        ...source,
        id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isCompleted: false,
      };
      const next = [...current];
      next.splice(index + 1, 0, duplicate);
      handleSave({ subtasks: next });
      requestAnimationFrame(() => {
        focusSubtaskInput(duplicate.id);
      });
    },
    [edited, handleSave, focusSubtaskInput]
  );

  React.useLayoutEffect(() => {
    if (!isSubtaskComposerOpen) return;
    const frame = requestAnimationFrame(() => {
      newSubtaskInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isSubtaskComposerOpen]);

  const handleTitleChange = React.useCallback((value: string) => {
    setEdited((prev) => (prev ? { ...prev, title: value } : prev));
  }, []);

  const handleTitleCommit = React.useCallback(
    (rawValue: string) => {
      if (!edited) return;
      const trimmed = rawValue.trim();
      const nextValue = trimmed.length > 0 ? trimmed : 'Untitled';
      handleSave({ title: nextValue });
    },
    [edited, handleSave]
  );

  const canClearFields = React.useMemo(() => {
    if (!edited) return false;
    const hasDescription = Boolean((edited.description ?? '').trim());
    const hasDueDate = Boolean(edited.dueDate);
    const hasPriority = Boolean(edited.priority && edited.priority !== 'none');
    const labels = Array.isArray(edited.labels) ? edited.labels : [];
    const subtasksList = Array.isArray(edited.subtasks) ? edited.subtasks : [];
    return hasDescription || hasDueDate || hasPriority || labels.length > 0 || subtasksList.length > 0;
  }, [edited]);

  return {
    edited,
    setEdited,
    savedHint,
    dateOpen,
    setDateOpen,
    labelsOpen,
    setLabelsOpen,
    priorityOpen,
    setPriorityOpen,
    labelInput,
    setLabelInput,
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
    deleteDialogOpen,
    setDeleteDialogOpen,
    labelInputRef,
    newSubtaskInputRef,
    subtaskInputRefs,
    handleSave,
    availableLabels,
    currentLabels,
    selectedLabels,
    mergedLabelOptions,
    toggleLabel,
    addFreeformLabel,
    handleToggleSubtaskCompletion,
    handleUpdateSubtaskDueDate,
    handleDeleteSubtask,
    handleSubtaskTitleChange,
    handleSubtaskTitleCommit,
    openSubtaskComposer,
    handleAddSubtask,
    handleCancelNewSubtask,
    focusSubtaskInput,
    handleSubtaskDueDateSelection,
    handleClearSubtaskDueDate,
    handleNewSubtaskDateSelection,
    handleDuplicateSubtask,
    handleTitleChange,
    handleTitleCommit,
    canClearFields,
  };
}
