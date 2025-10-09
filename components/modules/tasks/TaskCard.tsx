import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '../../ui/context-menu';
import { Edit, Trash, Copy, CheckSquare, Check } from 'lucide-react';

type TaskLabel = string | { name: string; color: string };

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'none';
  labels?: TaskLabel[];
  isCompleted: boolean;
  onToggleCompletion: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const getTaskLabelName = (label: TaskLabel) => typeof label === 'string' ? label : label.name;
const getTaskLabelColor = (label: TaskLabel) => typeof label === 'string' ? 'var(--label-gray)' : label.color;

export function TaskCard({ 
    taskTitle, 
    dueDate,
    priority = 'none',
    labels = [],
    isCompleted, 
    onToggleCompletion, 
    onClick, 
    onEdit, 
    onDuplicate, 
    onDelete 
}: TaskCardProps) {
  const priorityColors: { [key: string]: string } = {
    high: 'bg-red-500 text-white',
    medium: 'bg-orange-500 text-white',
    low: 'bg-blue-500 text-white',
    none: ''
  };

  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <Card 
              className={`bg-[var(--bg-surface)] border border-[var(--task-card-border)] rounded-[var(--task-card-radius)] shadow-[var(--task-card-shadow)] hover:shadow-[var(--elevation-sm)] motion-safe:transition-shadow duration-[var(--duration-base)] px-[var(--task-card-padding-x)] py-[var(--task-card-pad-y)] cursor-pointer min-h-[44px]`}
              onClick={onClick}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-[var(--task-leading-gap-x)]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion();
                      }}
                      className="mt-1 grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color,box-shadow] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                      aria-pressed={isCompleted}
                      aria-label={isCompleted ? 'Mark as not done' : 'Mark as done'}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="size-[calc(var(--check-size)-4px)]"
                        aria-hidden="true"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="10"
                          className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                        />
                        <path
                          d="M5 10.5l3 3 7-7"
                          fill="none"
                          strokeWidth="2"
                          className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[length:var(--task-title-size)] font-[var(--font-weight-medium)] leading-snug line-clamp-2 ${isCompleted ? 'line-through text-[color:var(--text-tertiary)] opacity-60' : 'text-[color:var(--text-primary)]'}`}>
                      {taskTitle}
                    </h4>
                    {(dueDate || priority !== 'none' || labels.length > 0) && (
                      <div className="mt-[var(--space-1)] flex items-center flex-wrap gap-x-[var(--task-meta-gap-x)] gap-y-[var(--space-2)]">
                        {dueDate && (
                          <span className="text-[length:var(--task-meta-size)] font-[var(--font-weight-normal)] text-[color:var(--text-tertiary)]">
                            {dueDate}
                          </span>
                        )}
                        {priority !== 'none' && (
                          <Badge 
                            variant="soft" 
                            tone={priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'}
                            size="sm"
                          >
                            {priority[0].toUpperCase() + priority.slice(1)}
                          </Badge>
                        )}
                        {labels.length > 0 ? (
                          <div className="flex items-center gap-[var(--task-chip-gap-x)]">
                            {labels.map((label, idx) => (
                              <Badge
                                key={`${getTaskLabelName(label)}-${idx}`}
                                variant="soft"
                                size="sm"
                                className="relative"
                                style={{ 
                                  backgroundColor: `color-mix(in oklab, ${getTaskLabelColor(label)} 18%, transparent)`,
                                  color: `color-mix(in oklab, ${getTaskLabelColor(label)} 85%, var(--text-primary))`,
                                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${getTaskLabelColor(label)} 35%, transparent)`
                                }}
                              >
                                {getTaskLabelName(label)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
            <ContextMenuItem onClick={onToggleCompletion} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <CheckSquare className="w-4 h-4 mr-2" />
                {isCompleted ? 'Mark as not completed' : 'Mark completed'}
            </ContextMenuItem>
            <ContextMenuItem onClick={onEdit} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[color:var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Trash className="w-4 h-4 mr-2" />
                Delete
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}