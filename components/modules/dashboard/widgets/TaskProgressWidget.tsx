"use client";

import React from 'react';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '../../../ui/progress';
import { Badge } from '../../../ui/badge';
import { ScrollArea } from '../../../ui/scroll-area';
import type { WidgetProps } from '../types';

const mockTasks = [
  {
    id: '1',
    title: 'Update dashboard design',
    progress: 85,
    dueDate: '2024-10-05',
    priority: 'high',
    status: 'in-progress'
  },
  {
    id: '2',
    title: 'Review Q4 budget',
    progress: 60,
    dueDate: '2024-10-08',
    priority: 'medium',
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Team meeting prep',
    progress: 100,
    dueDate: '2024-10-03',
    priority: 'low',
    status: 'completed'
  },
  {
    id: '4',
    title: 'Client presentation',
    progress: 30,
    dueDate: '2024-10-10',
    priority: 'high',
    status: 'in-progress'
  }
];

export function TaskProgressWidget({ widget }: WidgetProps) {
  const showProgress = widget.config.showProgress ?? true;
  const showDueDate = widget.config.showDueDate ?? true;
  
  const totalTasks = mockTasks.length;
  const completedTasks = mockTasks.filter(task => task.status === 'completed').length;
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `${diffDays} days`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-[var(--error)] text-white';
      case 'medium': return 'bg-[var(--warning)] text-white';
      case 'low': return 'bg-[var(--success)] text-white';
      default: return 'bg-[var(--primary-tint-15)] text-[var(--primary)]';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Overall Progress */}
      <div className="mb-4 p-3 bg-[var(--elevated)] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Overall Progress
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          {overallProgress}% complete
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 min-h-0">
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3">
          Active Tasks
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckSquare 
                      size={16} 
                      className={
                        task.status === 'completed' 
                          ? "text-[var(--success)]" 
                          : "text-[var(--text-secondary)]"
                      }
                    />
                    <span 
                      className={`text-sm font-medium truncate ${
                        task.status === 'completed' 
                          ? "text-[var(--text-secondary)] line-through" 
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <Badge 
                    className={`text-xs ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </div>

                {showProgress && task.status !== 'completed' && (
                  <div className="mb-2">
                    <Progress value={task.progress} className="h-1" />
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {task.progress}% complete
                    </div>
                  </div>
                )}

                {showDueDate && (
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-[var(--text-secondary)]" />
                    <span 
                      className={`text-xs ${
                        formatDate(task.dueDate) === 'Overdue' 
                          ? "text-[var(--error)]" 
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      Due {formatDate(task.dueDate)}
                    </span>
                    {formatDate(task.dueDate) === 'Overdue' && (
                      <AlertCircle size={12} className="text-[var(--error)]" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}