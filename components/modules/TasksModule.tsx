import React, { useState } from 'react';
import { Plus, MoreHorizontal, Calendar, User, Flag } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const mockColumns: Column[] = [
  {
    id: 'todo',
    title: 'New Requests',
    color: 'var(--text-secondary)',
    tasks: [
      {
        id: '1',
        title: 'Infographic on productivity',
        description: 'Create visual guide for team productivity best practices',
        priority: 'high',
        assignee: 'Design Team',
        tags: ['design', 'content']
      },
      {
        id: '2',
        title: 'Initial design review',
        description: 'Review mockups for the new dashboard',
        priority: 'medium',
        assignee: 'Sarah',
        dueDate: 'Today',
        tags: ['review']
      },
      {
        id: '3',
        title: 'Approved budget',
        description: 'Process Q1 budget approval documents',
        priority: 'low',
        tags: ['finance']
      },
      {
        id: '4',
        title: 'Add subtask',
        description: 'Break down project into smaller actionable items',
        priority: 'medium',
        tags: ['planning']
      },
      {
        id: '5',
        title: 'Poster for volunteer event',
        description: 'Design promotional material for community event',
        priority: 'low',
        assignee: 'Marketing',
        tags: ['design', 'event']
      },
      {
        id: '6',
        title: 'Case study layout designs',
        description: 'Create layout templates for client case studies',
        priority: 'medium',
        assignee: 'Alex',
        dueDate: 'Aug 13 - 14',
        tags: ['design', 'template']
      }
    ]
  },
  {
    id: 'progress',
    title: 'In Progress',
    color: 'var(--info)',
    tasks: [
      {
        id: '7',
        title: 'Blog and social posts',
        description: 'Create content for weekly blog and social media',
        priority: 'high',
        assignee: 'Content Team',
        dueDate: 'Tomorrow',
        tags: ['content', 'social']
      },
      {
        id: '8',
        title: 'New landing page',
        description: 'Develop responsive landing page for product launch',
        priority: 'high',
        assignee: 'Dev Team',
        dueDate: 'Aug 14 - 19',
        tags: ['development', 'web']
      },
      {
        id: '9',
        title: 'Landing page brief',
        description: 'Write comprehensive brief for landing page project',
        priority: 'medium',
        tags: ['documentation']
      },
      {
        id: '10',
        title: 'Landing page copy',
        description: 'Write compelling copy for new landing page',
        priority: 'medium',
        tags: ['copywriting']
      }
    ]
  },
  {
    id: 'complete',
    title: 'Complete',
    color: 'var(--success)',
    tasks: [
      {
        id: '11',
        title: 'Homepage design update',
        description: 'Refresh homepage with new brand guidelines',
        priority: 'high',
        assignee: 'Design Team',
        tags: ['design', 'branding']
      },
      {
        id: '12',
        title: 'Featured blog image',
        description: 'Create hero image for featured blog post',
        priority: 'medium',
        assignee: 'Sarah',
        tags: ['design', 'blog']
      },
      {
        id: '13',
        title: 'Leadership blog images',
        description: 'Design image set for leadership article series',
        priority: 'low',
        tags: ['design', 'blog']
      }
    ]
  }
];

const priorityColors = {
  low: 'var(--text-secondary)',
  medium: 'var(--warning)',
  high: 'var(--error)'
};

export function TasksModule() {
  const [columns, setColumns] = useState(mockColumns);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    return priorityColors[priority];
  };

  return (
    <div className="h-full bg-[var(--surface)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Task Board</h1>
          <Button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
            <Plus size={16} className="mr-2" />
            New Task
          </Button>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-[var(--text-secondary)]">
            <span className="font-medium">{columns.reduce((acc, col) => acc + col.tasks.length, 0)}</span> total tasks
          </div>
          <div className="text-[var(--text-secondary)]">
            <span className="font-medium">{columns.find(c => c.id === 'progress')?.tasks.length || 0}</span> in progress
          </div>
          <div className="text-[var(--text-secondary)]">
            <span className="font-medium">{columns.find(c => c.id === 'complete')?.tasks.length || 0}</span> completed
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 p-6 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="w-80 flex flex-col">
              {/* Column Header */}
              <div className="p-4 bg-[var(--elevated)] rounded-t-lg border border-[var(--border-subtle)] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    ></div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{column.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)] bg-[var(--primary-tint-10)] px-2 py-1 rounded-full">
                      {column.tasks.length}
                    </span>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 bg-[var(--primary-tint-10)]/20 border-x border-b border-[var(--border-subtle)] rounded-b-lg p-4 space-y-4 min-h-[400px]">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)] cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-[var(--text-primary)] leading-snug">{task.title}</h4>
                      <Flag 
                        size={14} 
                        className="mt-1 flex-shrink-0"
                        style={{ color: getPriorityColor(task.priority) }}
                        fill="currentColor"
                      />
                    </div>
                    
                    {/* Task Description */}
                    {task.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map((tag) => (
                          <Badge 
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-[var(--primary-tint-15)] text-[var(--primary)] border-none"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Task Meta */}
                    {(task.assignee || task.dueDate) && (
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{task.assignee}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{task.dueDate}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Task Button */}
                <button className="w-full p-4 border-2 border-dashed border-[var(--border-default)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                  <Plus size={16} className="mx-auto mb-1" />
                  <span className="text-sm">Add task</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}