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
              className={`mb-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow duration-fast cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
              onClick={onClick}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isCompleted}
                      onCheckedChange={onToggleCompletion}
                      className="mt-1"
                    />
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm text-[var(--text-primary)] ${isCompleted ? 'line-through' : ''}`}>
                      {taskTitle}
                    </h4>
                    {dueDate && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {dueDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem onClick={onToggleCompletion}>
                <CheckSquare className="w-4 h-4 mr-2" />
                {isCompleted ? 'Mark as not completed' : 'Mark completed'}
            </ContextMenuItem>
            <ContextMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onDelete} className="text-[var(--danger)]">
                <Trash className="w-4 h-4 mr-2" />
                Delete
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
  );
}