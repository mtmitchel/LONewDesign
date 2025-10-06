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

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'none';
  labels?: string[];
  isCompleted: boolean;
  onToggleCompletion: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

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
              className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-sm)] hover:shadow-[var(--elevation-lg)] motion-safe:transition-shadow duration-[var(--duration-base)] p-[var(--space-2)] cursor-pointer min-h-[44px]`}
              onClick={onClick}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-[var(--space-2)]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletion();
                      }}
                      className="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 motion-safe:transition-all duration-[var(--duration-fast)] hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      style={{
                        borderColor: isCompleted ? 'var(--primary)' : 'var(--border-default)',
                        backgroundColor: isCompleted ? 'var(--primary)' : 'transparent'
                      }}
                    >
                      {isCompleted && <Check className="w-3 h-3 text-white" />}
                    </button>
                  <div className="flex-1">
                    <h4 className={`text-[length:var(--text-sm)] font-[var(--font-weight-medium)] ${isCompleted ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                      {taskTitle}
                    </h4>
                    {(dueDate || priority !== 'none' || labels.length > 0) && (
                      <div className="flex items-center gap-1 mt-[var(--space-1)] flex-wrap">
                        {dueDate && (
                          <span className="text-[length:var(--text-xs)] font-[var(--font-weight-normal)] text-[var(--text-secondary)]">
                            {dueDate}
                          </span>
                        )}
                        {priority !== 'none' && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-[var(--font-weight-medium)] capitalize ${priorityColors[priority]}`}>
                            {priority}
                          </span>
                        )}
                        {labels.map(label => (
                          <Badge key={label} variant="secondary" className="text-[length:var(--text-xs)] font-[var(--font-weight-normal)] py-0.5">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-lg)] p-[var(--space-2)]">
            <ContextMenuItem onClick={onToggleCompletion} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <CheckSquare className="w-4 h-4 mr-2" />
                {isCompleted ? 'Mark as not completed' : 'Mark completed'}
            </ContextMenuItem>
            <ContextMenuItem onClick={onEdit} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--danger)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer">
                <Trash className="w-4 h-4 mr-2" />
                Delete
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}