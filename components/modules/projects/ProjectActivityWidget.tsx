"use client";

import React from 'react';
import { GitCommit, FileText, CheckSquare, Clock, AlertCircle, Target, Archive, Edit } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';

const iconMap = {
  GitCommit,
  FileText,
  CheckSquare,
  Clock,
  AlertCircle,
  Target,
  Archive,
  Edit
};

export interface ProjectActivity {
  id: string;
  type: 'commit' | 'task' | 'milestone' | 'phase' | 'note' | 'deadline' | 'archive' | 'edit';
  title: string;
  description: string;
  timestamp: string;
  icon: keyof typeof iconMap;
  color?: string;
}

interface ProjectActivityWidgetProps {
  activities?: ProjectActivity[];
  maxItems?: number;
  className?: string;
  onActivitySelect?: (activityId: string) => void;
}

const mockProjectActivities: ProjectActivity[] = [
  {
    id: '1',
    type: 'milestone',
    title: 'Milestone completed',
    description: 'Design system v2.0 finalized',
    timestamp: '30 minutes ago',
    icon: 'Target',
    color: 'var(--success)'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task completed',
    description: 'Gantt chart visualization implemented',
    timestamp: '2 hours ago',
    icon: 'CheckSquare'
  },
  {
    id: '3',
    type: 'commit',
    title: 'Changes saved',
    description: 'Timeline widget transformed to Gantt',
    timestamp: '3 hours ago',
    icon: 'GitCommit'
  },
  {
    id: '4',
    type: 'note',
    title: 'Note created',
    description: 'Added implementation details',
    timestamp: '4 hours ago',
    icon: 'FileText'
  },
  {
    id: '5',
    type: 'phase',
    title: 'Phase started',
    description: 'Implementation phase',
    timestamp: 'Yesterday',
    icon: 'Clock',
    color: 'var(--primary)'
  },
  {
    id: '6',
    type: 'deadline',
    title: 'Deadline approaching',
    description: 'MVP release in 5 days',
    timestamp: '2 days ago',
    icon: 'AlertCircle',
    color: 'var(--warning)'
  },
  {
    id: '7',
    type: 'edit',
    title: 'Project updated',
    description: 'Revised project timeline',
    timestamp: '3 days ago',
    icon: 'Edit'
  },
  {
    id: '8',
    type: 'archive',
    title: 'Phase archived',
    description: 'Research phase completed',
    timestamp: '3 days ago',
    icon: 'Archive',
    color: 'var(--text-tertiary)'
  }
];

export function ProjectActivityWidget({ 
  activities = mockProjectActivities,
  maxItems = 6,
  className,
  onActivitySelect
}: ProjectActivityWidgetProps) {
  
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card 
      className={cn(
        "border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]",
        className
      )}
    >
      <CardHeader className="pb-[var(--space-3)]">
        <CardTitle className="text-sm font-medium text-[color:var(--text-primary)]">
          Activity log
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-[var(--space-3)]">
          <div className="space-y-[var(--space-1)]">
            {displayActivities.map((activity) => {
              const Icon = iconMap[activity.icon] || FileText;
              const iconColor = activity.color || 'var(--text-secondary)';
              
              return (
                <button
                  key={activity.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-[var(--space-2)] p-[var(--space-2)] rounded-[var(--radius-md)]",
                    "hover:bg-[var(--bg-surface-elevated)] transition-colors text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  )}
                  onClick={() => onActivitySelect?.(activity.id)}
                >
                  <Icon 
                    size={16} 
                    className="flex-shrink-0 mt-[2px]" 
                    style={{ color: iconColor }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[var(--space-2)]">
                      <p className="text-sm font-medium text-[color:var(--text-primary)]">
                        {activity.title}
                      </p>
                      <span className="text-xs text-[color:var(--text-tertiary)]">
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--text-secondary)] mt-[var(--space-1)]">
                      {activity.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
