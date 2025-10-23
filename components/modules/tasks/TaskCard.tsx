"use client";

import React from 'react';
import { TaskCardProvider, TaskCardContent, TaskCardMenu } from './card';

type TaskLabel = string | { name: string; color: string };

interface TaskCardProps {
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'none';
  labels?: TaskLabel[];
  isCompleted: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  onToggleCompletion: () => void;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function TaskCard(props: TaskCardProps) {
  return (
    <TaskCardProvider>
      <TaskCardMenu
        isCompleted={props.isCompleted}
        onToggleCompletion={props.onToggleCompletion}
        onEdit={props.onEdit}
        onDuplicate={props.onDuplicate}
        onDelete={props.onDelete}
      >
        <TaskCardContent
          taskTitle={props.taskTitle}
          dueDate={props.dueDate}
          priority={props.priority}
          labels={props.labels}
          isCompleted={props.isCompleted}
          subtaskCount={props.subtaskCount}
          completedSubtaskCount={props.completedSubtaskCount}
          onToggleCompletion={props.onToggleCompletion}
          onClick={props.onClick}
        />
      </TaskCardMenu>
    </TaskCardProvider>
  );
}
