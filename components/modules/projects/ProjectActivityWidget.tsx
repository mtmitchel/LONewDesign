"use client";

import React from 'react';
import { FileText, CheckSquare, Clock, Edit, FolderOpen, StickyNote, Code, ArrowRight } from 'lucide-react';
import { ScrollArea } from '../../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';

const iconMap = {
  FileText,
  CheckSquare,
  Clock,
  Edit,
  FolderOpen,
  StickyNote,
  Code,
  ArrowRight
};

export interface ProjectActivity {
  id: string;
  type: 'note' | 'task' | 'document' | 'code' | 'phase' | 'spec';
  title: string;
  description: string;
  timestamp: string;
  status?: 'in-progress' | 'draft' | 'active';
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
    type: 'task',
    title: 'Implement data export',
    description: 'Working on CSV export functionality',
    timestamp: '30 min ago',
    status: 'in-progress',
    icon: 'CheckSquare',
    color: 'var(--primary)'
  },
  {
    id: '2',
    type: 'note',
    title: 'API integration notes',
    description: 'Draft notes on REST endpoint structure',
    timestamp: '2 hours ago',
    status: 'draft',
    icon: 'StickyNote'
  },
  {
    id: '3',
    type: 'code',
    title: 'ProjectTimelineWidget.tsx',
    description: 'Last edited: Gantt chart implementation',
    timestamp: '3 hours ago',
    icon: 'Code'
  },
  {
    id: '4',
    type: 'document',
    title: 'Project requirements',
    description: 'MVP feature list and timeline',
    timestamp: '5 hours ago',
    icon: 'FileText'
  },
  {
    id: '5',
    type: 'phase',
    title: 'Implementation phase',
    description: '3 tasks remaining',
    timestamp: 'Yesterday',
    status: 'active',
    icon: 'FolderOpen',
    color: 'var(--primary)'
  },
  {
    id: '6',
    type: 'spec',
    title: 'Dashboard redesign spec',
    description: 'Component architecture planning',
    timestamp: 'Yesterday',
    icon: 'Edit'
  },
  {
    id: '7',
    type: 'task',
    title: 'Review PR feedback',
    description: 'Address code review comments',
    timestamp: '2 days ago',
    icon: 'CheckSquare'
  },
  {
    id: '8',
    type: 'note',
    title: 'Meeting notes',
    description: 'Q4 planning discussion points',
    timestamp: '3 days ago',
    icon: 'StickyNote'
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
          Recent work
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
                    "group flex w-full items-start gap-[var(--space-2)] p-[var(--space-2)] rounded-[var(--radius-md)]",
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
                    <div className="flex items-center justify-between gap-[var(--space-2)]">
                      <div className="flex items-center gap-[var(--space-2)] min-w-0">
                        <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                          {activity.title}
                        </p>
                        {activity.status && (
                          <span className={cn(
                            "text-xs px-[var(--space-1)] py-[1px] rounded-[var(--radius-sm)]",
                            activity.status === 'in-progress' && "bg-[var(--primary-tint-10)] text-[color:var(--primary)]",
                            activity.status === 'draft' && "bg-[var(--warning-tint-10)] text-[color:var(--warning)]",
                            activity.status === 'active' && "bg-[var(--success-tint-10)] text-[color:var(--success)]"
                          )}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                      <ArrowRight 
                        size={14} 
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[color:var(--text-tertiary)]" 
                      />
                    </div>
                    <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-1)]">
                      <p className="text-xs text-[color:var(--text-secondary)]">
                        {activity.description}
                      </p>
                      <span className="text-xs text-[color:var(--text-tertiary)] flex-shrink-0">
                        {activity.timestamp}
                      </span>
                    </div>
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
