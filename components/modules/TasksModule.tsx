"use client";

// #region Imports and constants
import React from 'react';
import { toast } from 'sonner';
import { TASK_LISTS } from './tasks/constants';
import type { Task, TaskLabel } from './tasks/types';
import { useTaskStore, useTasks } from './tasks/taskStore';
import { shallow } from 'zustand/shallow';
import { 
  TasksViewProvider, 
  TasksHeader, 
  BoardView, 
  ListView,
  DeleteListDialog,
  useTasksView 
} from './tasks/view';
import TaskDetailsDrawer from './tasks/TaskDetailsDrawer';

const getLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;
// #endregion Imports and constants

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
    const aCreated = a.dateCreated ?? a.createdAt;
    const bCreated = b.dateCreated ?? b.createdAt;
    return Date.parse(aCreated) - Date.parse(bCreated);
  }

  // 3) Within completed tasks: oldest completion first (recently completed at bottom)
  const ac = a.completedAt ? Date.parse(a.completedAt) : 0;
  const bc = b.completedAt ? Date.parse(b.completedAt) : 0;
  return ac - bc;
}

function TasksModuleShell() {
  const tasks = useTasks();
  const tasksById = useTaskStore((state) => state.tasksById);
  const addTask = useTaskStore((state) => state.addTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);
  const duplicateTask = useTaskStore((state) => state.duplicateTask);
  
  const {
    viewMode,
    searchQuery,
    selectedLabels,
    selectedList,
    globalSort,
    projectFilter,
    activeProject,
    isAddingList,
    newListName,
    setNewListName,
    setIsAddingList,
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
  } = useTasksView();
  
  // Use task lists from store (Google Tasks sync)
  const taskLists = useTaskStore((state) => 
    state.listOrder.map((id) => state.listsById[id]).filter(Boolean)
  );
  const columns = React.useMemo(() => 
    taskLists.map(list => ({ id: list.id, title: list.name })),
    [taskLists]
  );

  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const taskLabels = Array.isArray(task.labels)
        ? task.labels
        : typeof task.labels === 'string'
          ? (() => { try { const v = JSON.parse(task.labels as unknown as string); return Array.isArray(v) ? v : []; } catch { return []; } })()
          : [];
      const matchesLabels = selectedLabels.length === 0 || 
        taskLabels.some(label => selectedLabels.includes(getLabelName(label)));
      const matchesList =
        selectedList === null ||
        task.listId === selectedList ||
        task.boardListId === selectedList ||
        task.status === selectedList;
      const matchesProject = projectFilter === null || task.projectId === projectFilter;
      return matchesSearch && matchesLabels && matchesList && matchesProject;
    });
  }, [tasks, searchQuery, selectedLabels, selectedList, projectFilter]);

  // Get all unique labels from tasks with their colors
  React.useEffect(() => {
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
  }, [tasks]);

  // Event handlers
  const handleAddTaskToColumn = React.useCallback((
    listId: string,
    draft: {
      title: string;
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high' | 'none';
      labels?: any[];
    },
  ) => {
    addTask({
      title: draft.title,
      status: listId,
      priority: draft.priority ?? 'none',
      dueDate: draft.dueDate,
      labels: draft.labels?.map((label: any) => ({ name: label.name, color: label.color })) ?? [],
      isCompleted: false,
      listId,
      projectId: projectFilter ?? undefined,
      source: 'tasks_module',
    });
  }, [addTask, projectFilter]);

  const moveTask = useTaskStore((s) => s.moveTask);
  const handleMoveTask = React.useCallback((taskId: string, newListId: string) => {
    const task = useTaskStore.getState().tasksById[taskId];
    if (!task) return;
    if (task.listId === newListId) {
      // within-list reorder handled elsewhere
      return;
    }
    void moveTask(taskId, newListId);
  }, [moveTask]);

  const handleEditTask = React.useCallback(
    (task: Task) => {
      if (!task) {
        return;
      }
      const latest = tasksById[task.id] ?? task;
      setSelectedTask(latest);
    },
    [tasksById, setSelectedTask],
  );
  
  const handleDuplicateTask = React.useCallback((task: Task) => {
    duplicateTask(task.id);
    toast.success('Task duplicated');
  }, [duplicateTask]);
  
  const handleUpdateTask = React.useCallback(async (updatedTask: Task, options?: { showToast?: boolean }) => {
    const shouldToast = options?.showToast ?? true;
    try {
      await updateTask(updatedTask.id, updatedTask);
      if (shouldToast) {
        toast.success('Task updated');
      }
    } catch (e) {
      toast.error('Failed to update task');
    }
  }, [updateTask]);

  const handleDeleteTask = React.useCallback((taskId: string) => {
    deleteTask(taskId);
    toast.success('Task deleted');
    if (selectedTask?.id === taskId) {
      setSelectedTask(null); // Close side panel if deleted task was open
    }
  }, [deleteTask, selectedTask, setSelectedTask]);

  const createTaskList = useTaskStore((s) => s.createTaskList);
  const deleteTaskList = useTaskStore((s) => s.deleteTaskList);

  const handleAddList = React.useCallback(async () => {
    const title = newListName.trim();
    if (!title) return;
    try {
      await createTaskList(title);
      toast.success('List created');
    } catch (e) {
      console.error('[TasksModule] Failed to create list:', e);
      toast.error('Failed to create list');
    } finally {
      setNewListName('');
      setIsAddingList(false);
    }
  }, [newListName, createTaskList, setNewListName, setIsAddingList]);

  const handleDeleteList = React.useCallback((listId: string) => {
    // Don't allow deleting default lists
    const defaultListIds = TASK_LISTS.map(list => list.id as string);
    if (defaultListIds.includes(listId)) {
      return; // Silently ignore - default lists shouldn't show delete option
    }
    
    const list = columns.find(col => col.id === listId);
    const tasksInList = tasks.filter(task => task.listId === listId);
    
    // Show confirmation dialog
    setDeleteListDialog({
      isOpen: true,
      listId,
      listTitle: list?.title || 'this list',
      taskCount: tasksInList.length
    });
  }, [columns, tasks, setDeleteListDialog]);

  const confirmDeleteList = React.useCallback(async () => {
    if (!deleteListDialog) return;
    const { listId } = deleteListDialog;
    try {
      await deleteTaskList(listId, fallbackList);
      toast.success('List deleted');
    } catch (e) {
      console.error('[TasksModule] Failed to delete list:', e);
      toast.error('Failed to delete list');
    } finally {
      setDeleteListDialog(null);
    }
  }, [deleteListDialog, deleteTaskList, fallbackList, setDeleteListDialog]);

  // #region Render
  return (
    <div className="h-full flex flex-col bg-[var(--bg-default)] text-[color:var(--text-primary)]">
      <TasksHeader 
        columns={columns}
        taskLists={taskLists}
      />

      {viewMode === 'board' ? (
        <BoardView
          columns={columns}
          filteredTasks={filteredTasks}
          availableLabelOptions={availableLabelOptions}
          onAddTask={handleAddTaskToColumn}
          onToggleTaskCompletion={toggleTaskCompletion}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onTaskSelect={setSelectedTask}
          onEditTask={handleEditTask}
          onDeleteList={handleDeleteList}
          onMoveTask={handleMoveTask}
          handleAddList={handleAddList}
          newListName={newListName}
          setNewListName={setNewListName}
          setIsAddingList={setIsAddingList}
        />
      ) : (
        <ListView
          columns={columns}
          filteredTasks={filteredTasks}
          availableLabelOptions={availableLabelOptions}
          onAddTask={handleAddTaskToColumn}
          onToggleTaskCompletion={toggleTaskCompletion}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={handleDuplicateTask}
          onEditTask={handleEditTask}
          handleAddList={handleAddList}
          newListName={newListName}
          setNewListName={setNewListName}
          setIsAddingList={setIsAddingList}
        />
      )}

      <TaskDetailsDrawer 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      <DeleteListDialog
        isOpen={deleteListDialog?.isOpen || false}
        onClose={() => setDeleteListDialog(null)}
        onConfirm={confirmDeleteList}
        listTitle={deleteListDialog?.listTitle || ''}
        taskCount={deleteListDialog?.taskCount || 0}
        taskLists={taskLists}
        fallbackList={fallbackList}
        setFallbackList={setFallbackList}
        listId={deleteListDialog?.listId || ''}
      />
    </div>
  );
  // #endregion Render
}

export function TasksModule() {
  return (
    <TasksViewProvider>
      <TasksModuleShell />
    </TasksViewProvider>
  );
}