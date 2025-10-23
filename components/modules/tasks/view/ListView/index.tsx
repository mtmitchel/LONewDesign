"use client";

import React, { useState } from 'react';
import { 
  Plus, ChevronDown, CheckSquare, Edit, Copy, Trash, Flag
} from 'lucide-react';
import { Badge, badgeVariants } from '../../../../ui/badge';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '../../../../ui/context-menu';
import { cn } from '../../../../ui/utils';
import { TaskComposer } from '../../../tasks/TaskComposer';
import { DueDateChip, getDueMeta } from '../../../tasks/DueDateChip';
import { TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS, getLabelHue } from '../../../tasks/taskChipStyles';
import { useTaskStore } from '../../taskStore';
import { useTasksView } from '../TasksViewContext';
import type { Task, TaskLabel } from '../../types';

interface ListViewProps {
  columns: Array<{ id: string; title: string }>;
  filteredTasks: Task[];
  availableLabelOptions: Array<{ name: string; color: string }>;
  onAddTask: (listId: string, draft: {
    title: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'none';
    labels?: any[];
  }) => void;
  onToggleTaskCompletion: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  handleAddList: () => void;
  newListName: string;
  setNewListName: (name: string) => void;
  setIsAddingList: (adding: boolean) => void;
}

const LIST_VIEW_GRID_TEMPLATE = 'minmax(320px, 1fr) 140px 110px 240px';

const getLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;

export function ListView({
  columns,
  filteredTasks,
  availableLabelOptions,
  onAddTask,
  onToggleTaskCompletion,
  onDeleteTask,
  onDuplicateTask,
  onEditTask,
  handleAddList,
  newListName,
  setNewListName,
  setIsAddingList,
}: ListViewProps) {
  const { 
    globalSort, 
    selectedList, 
    isAddingList, 
    listComposerSection, 
    setListComposerSection,
    selectedTask,
    setSelectedTask,
  } = useTasksView();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(columns.map((c) => c.id)));
  const listViewPreferences = useTaskStore((state) => state.listViewPreferences);
  const toggleListCompletedVisibility = useTaskStore((state) => state.toggleListCompletedVisibility);
  const updateTask = useTaskStore((state) => state.updateTask);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getTasksForList = (listId: string): Task[] => {
    const tasksForList = filteredTasks.filter((task) => {
      if (!listId) return false;
      if (task.listId === listId) return true;
      if (task.boardListId === listId) return true;
      return task.status === listId;
    });

    if (globalSort === 'due-date') {
      return [...tasksForList].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    if (globalSort === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
      return [...tasksForList].sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0));
    }

    return [...tasksForList].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (!a.isCompleted) {
        if (typeof a.order === 'number' && typeof b.order === 'number') {
          return a.order - b.order;
        }
        const ad = a.dueDate ? Date.parse(a.dueDate) : Number.POSITIVE_INFINITY;
        const bd = b.dueDate ? Date.parse(b.dueDate) : Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
        const pr = (p: Task['priority']) => (p === 'high' ? 0 : p === 'medium' ? 1 : p === 'low' ? 2 : 3);
        if (pr(a.priority) !== pr(b.priority)) {
          return pr(a.priority) - pr(b.priority);
        }
        const aCreated = a.dateCreated ?? a.createdAt;
        const bCreated = b.dateCreated ?? b.createdAt;
        return Date.parse(aCreated) - Date.parse(bCreated);
      }
      const ac = a.completedAt ? Date.parse(a.completedAt) : 0;
      const bc = b.completedAt ? Date.parse(b.completedAt) : 0;
      return ac - bc;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto">
        {/* Table header */}
        <div
          className="grid items-center px-[var(--list-row-pad-x)] py-[var(--space-3)] border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
          style={{ gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE, columnGap: 'var(--list-row-gap)' }}
        >
          <div className="th--task-name text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
            Task name
          </div>
          <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
            Due date
          </div>
          <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
            Priority
          </div>
          <div className="text-[length:var(--text-base)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
            Labels
          </div>
        </div>

        {columns.map((column) => {
          const tasksForList = getTasksForList(column.id);
          const showCompleted = listViewPreferences[column.id]?.showCompleted ?? true;
          const activeTasks = tasksForList.filter((task) => !task.isCompleted);
          const visibleTasks = showCompleted ? tasksForList : activeTasks;
          const activeCount = activeTasks.length;
          const isExpanded = expandedSections.has(column.id);

          return (
            <div key={column.id} className="group">
              <div
                className="tr--group group grid items-center cursor-pointer select-none px-[var(--list-row-pad-x)] py-[var(--space-3)]"
                style={{ gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE, columnGap: 'var(--list-row-gap)' }}
                onClick={() => toggleSection(column.id)}
                role="button"
                aria-expanded={isExpanded}
              >
                <div className="td--task-name flex items-center gap-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)]">
                  <ChevronDown
                    size={16}
                    className={`motion-safe:transition-transform duration-[var(--duration-fast)] text-[color:var(--text-secondary)] ${isExpanded ? '' : '-rotate-90'}`}
                  />
                  <span className="group-title font-[var(--font-weight-semibold)]">
                    {column.title}
                    <span className="ml-1 font-normal text-[color:var(--text-secondary)]">
                      ({activeCount})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleListCompletedVisibility(column.id, !showCompleted);
                    }}
                    className="inline-flex items-center rounded-[var(--radius-sm)] px-[var(--space-2)] py-[calc(var(--space-1))] text-[length:var(--text-xs)] font-medium text-[color:var(--text-secondary)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-opacity"
                  >
                    {showCompleted ? 'Hide completed' : 'Show completed'}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div>
                  {visibleTasks.map((task) => {
                    const dueMeta = getDueMeta(task.dueDate);
                    const priorityTone = task.priority === 'high' || task.priority === 'medium' || task.priority === 'low'
                      ? task.priority
                      : null;
                    const priorityChip = priorityTone
                      ? (
                          <span
                            className={cn(
                              badgeVariants({
                                variant: 'soft',
                                tone: priorityTone,
                                size: 'sm',
                              }),
                              TASK_META_CHIP_CLASS,
                            )}
                          >
                            <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                            <span>{priorityTone[0].toUpperCase() + priorityTone.slice(1)}</span>
                          </span>
                        )
                      : null;
                    const labelChips = task.labels.length > 0
                      ? task.labels.map((label: TaskLabel, idx: number) => {
                          const labelName = getLabelName(label);
                          const labelColor = getLabelColor(label);
                          const labelHue = getLabelHue(labelColor);
                          return (
                            <Badge
                              key={`${labelName}-${idx}`}
                              variant="soft"
                              size="sm"
                              data-label-color={labelHue}
                              className={cn(TASK_META_CHIP_CLASS, TASK_LABEL_CHIP_BASE_CLASS)}
                            >
                              {labelName}
                            </Badge>
                          );
                        })
                      : [];
                    const rowStyle = {
                      gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE,
                      columnGap: 'var(--list-row-gap)',
                      minHeight: 'var(--list-row-min-h)',
                      paddingLeft: 'var(--list-row-pad-x)',
                      paddingRight: 'var(--list-row-pad-x)',
                    } as React.CSSProperties;

                    const visibleSubtasks = showCompleted
                      ? task.subtasks ?? []
                      : (task.subtasks ?? []).filter((subtask) => !subtask.isCompleted);
                    const hasSubtasks = visibleSubtasks.length > 0;
                    return (
                      <ContextMenu key={task.id}>
                        <ContextMenuTrigger>
                          <div className="task-list-group">
                            <div
                              className="task-row task-list-row grid items-center border-b border-[var(--border-divider)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                              style={rowStyle}
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="td--task-name task-list-cell--name py-[var(--list-row-pad-y)]">
                                <div className="task-line">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleTaskCompletion(task.id);
                                  }}
                                  className="check grid shrink-0 place-items-center size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                                  aria-pressed={task.isCompleted}
                                  aria-label={task.isCompleted ? 'Mark as not done' : 'Mark as done'}
                                >
                                  <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                                    <circle
                                      cx="10"
                                      cy="10"
                                      r="10"
                                      className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${task.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                                    />
                                    <path
                                      d="M5 10.5l3 3 7-7"
                                      fill="none"
                                      strokeWidth="2"
                                      className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${task.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <span
                                  className={`title text-[length:var(--list-row-font)] font-[var(--font-weight-medium)] ${
                                    task.isCompleted ? 'line-through text-[color:var(--text-tertiary)] opacity-60' : 'text-[color:var(--text-primary)]'
                                  }`}
                                >
                                  {task.title}
                                </span>
                                </div>
                              </div>

                              <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] flex items-center">
                                {dueMeta.label ? (
                                  <DueDateChip meta={dueMeta} />
                                ) : (
                                  <span className="text-[color:var(--text-tertiary)]">—</span>
                                )}
                              </div>

                              <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
                                {priorityChip ?? <span className="text-[color:var(--text-tertiary)]">—</span>}
                              </div>

                              <div className="py-[var(--list-row-pad-y)] flex flex-wrap gap-[var(--chip-gap)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)]">
                                {labelChips.length > 0 ? labelChips : <span className="text-[color:var(--text-tertiary)]">—</span>}
                              </div>
                            </div>

                            {hasSubtasks
                              ? visibleSubtasks.map((subtask) => {
                                  const subtaskDueMeta = getDueMeta(subtask.dueDate);
                                  return (
                                    <div
                                      key={subtask.id}
                                      className="task-row task-list-row grid items-center border-b border-[var(--border-divider)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                                      style={{
                                        gridTemplateColumns: LIST_VIEW_GRID_TEMPLATE,
                                        columnGap: 'var(--list-row-gap)',
                                        minHeight: 'var(--list-row-min-h)',
                                        paddingLeft: 'calc(var(--list-row-pad-x) + var(--check-size) + var(--space-4))',
                                        paddingRight: 'var(--list-row-pad-x)',
                                      }}
                                      onClick={() => setSelectedTask(task)}
                                    >
                                      <div className="td--task-name task-list-cell--name py-[var(--list-row-pad-y)]">
                                        <div className="task-line">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const currentTask = useTaskStore.getState().tasksById[task.id];
                                              if (!currentTask?.subtasks) return;
                                              const nextSubtasks = currentTask.subtasks.map((entry) =>
                                                entry.id === subtask.id
                                                  ? { ...entry, isCompleted: !entry.isCompleted }
                                                  : entry,
                                              );
                                              void updateTask(task.id, { subtasks: nextSubtasks });
                                            }}
                                            className="check grid shrink-0 place-items-center size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                                            aria-pressed={subtask.isCompleted}
                                            aria-label={subtask.isCompleted ? 'Mark subtask as not done' : 'Mark subtask as done'}
                                          >
                                            <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                                              <circle
                                                cx="10"
                                                cy="10"
                                                r="10"
                                                className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${subtask.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                                              />
                                              <path
                                                d="M5 10.5l3 3 7-7"
                                                fill="none"
                                                strokeWidth="2"
                                                className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${subtask.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </button>
                                          <span
                                            className={cn(
                                              'title text-[length:var(--list-row-font)] font-[var(--font-weight-medium)]',
                                              subtask.isCompleted
                                                ? 'line-through text-[color:var(--text-tertiary)] opacity-60'
                                                : 'text-[color:var(--text-primary)]',
                                            )}
                                          >
                                            {subtask.title}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] flex items-center">
                                        {subtaskDueMeta.label ? (
                                          <DueDateChip meta={subtaskDueMeta} />
                                        ) : (
                                          <span className="text-[color:var(--text-tertiary)]">—</span>
                                        )}
                                      </div>

                                      <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] text-[color:var(--text-tertiary)]">
                                        —
                                      </div>

                                      <div className="py-[var(--list-row-pad-y)] text-[length:var(--list-row-meta)] border-l border-[var(--border-divider)] pl-[var(--list-row-gap)] text-[color:var(--text-tertiary)]">
                                        —
                                      </div>
                                    </div>
                                  );
                                })
                              : null}
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTaskCompletion(task.id);
                            }}
                            className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            {task.isCompleted ? 'Mark as not completed' : 'Mark completed'}
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                            className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateTask(task);
                            }}
                            className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(task.id);
                            }}
                            className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    );
                  })}

                  {listComposerSection === column.id ? (
                    <div className="px-4 py-2">
                      <TaskComposer
                        onAddTask={(title, dueDate, priority, labels) => {
                          onAddTask(column.id, { title, dueDate, priority, labels });
                          setListComposerSection(null);
                        }}
                        onCancel={() => setListComposerSection(null)}
                        availableLabels={availableLabelOptions}
                      />
                    </div>
                  ) : (
                    <button
                      className="opacity-0 group-hover:opacity-100 motion-safe:transition-opacity duration-[var(--duration-fast)] inline-flex items-center gap-2 px-4 py-2 text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
                      onClick={() => setListComposerSection(column.id)}
                    >
                      <Plus className="w-4 h-4" />
                      Add task...
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {isAddingList ? (
          <div className="flex items-center px-4 py-2">
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list"
              className="w-64 h-8 px-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') {
                  setIsAddingList(false);
                  setNewListName('');
                }
              }}
            />
            <div className="inline-flex items-center gap-1.5 ml-2">
              <button
                onClick={handleAddList}
                className="inline-flex items-center px-2 h-7 rounded text-xs font-medium bg-[var(--btn-primary-bg)] text-white hover:bg-[var(--btn-primary-hover)]"
              >
                Add list
              </button>
              <button
                onClick={() => {
                  setIsAddingList(false);
                  setNewListName('');
                }}
                className="inline-flex items-center px-2 h-7 rounded text-xs font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="inline-flex items-center gap-2 px-4 py-3 text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] rounded-[var(--radius-sm)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          >
            <Plus className="w-4 h-4" />
            Add list
          </button>
        )}
      </div>
    </div>
  );
}