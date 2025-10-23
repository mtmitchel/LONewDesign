import React from 'react';
import { format } from 'date-fns';
import type { Task } from '../../tasks/types';
import { TaskCard } from '../../tasks/TaskCard';
import { parseDueDate } from '../utils';

interface TaskRailSectionProps {
  tasks: Task[];
  onToggleCompletion: (task: Task) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskRailSection({
  tasks,
  onToggleCompletion,
  onDuplicate,
  onDelete,
}: TaskRailSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul role="list" className="flex flex-col gap-2">
      {tasks.map((task) => {
        const dueDate = task.dueDate 
          ? format(parseDueDate(task.dueDate) ?? new Date(), 'MMM d') 
          : undefined;
        
        return (
          <TaskCard
            key={task.id}
            taskTitle={task.title}
            dueDate={dueDate}
            priority={task.priority}
            labels={task.labels}
            isCompleted={task.isCompleted}
            onToggleCompletion={() => onToggleCompletion(task)}
            onClick={() => console.log('Open task:', task.id)}
            onEdit={() => console.log('Edit task:', task.id)}
            onDuplicate={() => onDuplicate(task.id)}
            onDelete={() => onDelete(task.id)}
          />
        );
      })}
    </ul>
  );
}
