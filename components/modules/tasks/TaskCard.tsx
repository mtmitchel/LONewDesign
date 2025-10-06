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
import { Edit, Trash, Copy, CheckSquare } from 'lucide-react';

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
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
    isCompleted, 
    onToggleCompletion, 
    onClick, 
    onEdit, 
    onDuplicate, 
    onDelete 
}: TaskCardProps) {
  return (
    <ContextMenu>
        <ContextMenuTrigger>
            <Card 
              className={`mb-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--elevation-sm)] hover:shadow-[var(--elevation-lg)] motion-safe:transition-shadow duration-[var(--duration-base)] p-[var(--space-3)] cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
              onClick={onClick}
            >
              <CardContent className="">
                <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isCompleted}
                      onCheckedChange={onToggleCompletion}
                      className="mt-1 w-5 h-5"
                    />
                  <div className="flex-1">
                    <h4 className={`text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-primary)] ${isCompleted ? 'line-through' : ''}`}>
                      {taskTitle}
                    </h4>
                    {dueDate && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[length:var(--text-xs)] font-[var(--font-weight-normal)] text-[var(--text-secondary)]">
                          {dueDate}
                        </span>
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
            <ContextMenuItem onClick={onDelete} className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)] cursor-pointer text-[var(--danger)]">
                <Trash className="w-4 h-4 mr-2" />
                Delete
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}