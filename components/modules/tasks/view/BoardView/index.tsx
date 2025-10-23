"use client";

import { Plus } from 'lucide-react';
import { TasksBoard } from '../../../tasks/TasksBoard';
import { useTasksView } from '../TasksViewContext';
import type { ComposerLabel } from '../../../tasks/TaskComposer';

interface BoardViewProps {
  columns: Array<{ id: string; title: string }>;
  filteredTasks: Array<any>;
  availableLabelOptions: Array<{ name: string; color: string }>;
  onAddTask: (listId: string, draft: {
    title: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'none';
    labels?: ComposerLabel[];
  }) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: any) => void;
  onTaskSelect: (task: any) => void;
  onEditTask: (task: any) => void;
  onDeleteList: (listId: string) => void;
  onMoveTask: (taskId: string, newListId: string) => void;
  handleAddList: () => void;
  newListName: string;
  setNewListName: (name: string) => void;
  setIsAddingList: (adding: boolean) => void;
}

export function BoardView({
  columns,
  filteredTasks,
  availableLabelOptions,
  onAddTask,
  onToggleTaskCompletion,
  onDeleteTask,
  onDuplicateTask,
  onTaskSelect,
  onEditTask,
  onDeleteList,
  onMoveTask,
  handleAddList,
  newListName,
  setNewListName,
  setIsAddingList,
}: BoardViewProps) {
  const { isAddingList } = useTasksView();

  return (
    <div className="flex-1 bg-[var(--bg-canvas)]">
      <TasksBoard
        variant="standalone"
        columns={columns}
        tasks={filteredTasks}
        availableLabels={availableLabelOptions}
        onAddTask={onAddTask}
        onToggleTaskCompletion={onToggleTaskCompletion}
        onDeleteTask={onDeleteTask}
        onDuplicateTask={onDuplicateTask}
        onTaskSelect={onTaskSelect}
        onEditTask={onEditTask}
        onDeleteList={onDeleteList}
        onMoveTask={onMoveTask}
        className="bg-[var(--bg-canvas)] min-h-full"
        trailingColumn={
          isAddingList ? (
            <div className="flex min-w-[260px] flex-col gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list"
                className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[var(--primary)] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') {
                    setIsAddingList(false);
                    setNewListName('');
                  }
                }}
              />
              <div className="flex items-center gap-[var(--space-2)]">
                <button
                  onClick={handleAddList}
                  className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium bg-[var(--btn-primary-bg)] text-[color:var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)]"
                >
                  Add list
                </button>
                <button
                  onClick={() => {
                    setIsAddingList(false);
                    setNewListName('');
                  }}
                  className="inline-flex h-8 items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[color:var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingList(true)}
              className="flex min-w-[220px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-transparent px-[var(--space-4)] py-[var(--space-5)] text-sm font-medium text-[color:var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[color:var(--text-primary)]"
            >
              <Plus className="mr-[var(--space-2)] h-4 w-4" />
              Add list
            </button>
          )
        }
      />
    </div>
  );
}