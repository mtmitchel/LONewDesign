"use client";

import React from 'react';
import { GitCommit, MessageSquare, FileText, CheckSquare, Clock, Users, AlertCircle, Target } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { ScrollArea } from '../../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { cn } from '../../ui/utils';

const iconMap = {
  GitCommit,
  MessageSquare,
  FileText,
  CheckSquare,
  Clock,
  Users,
  AlertCircle,
  Target
};

export interface ProjectActivity {
  id: string;
  type: 'commit' | 'task' | 'comment' | 'milestone' | 'phase' | 'note' | 'issue';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  userInitials?: string;
  icon: keyof typeof iconMap;
  color?: string;
}

interface ProjectActivityWidgetProps {
  activities?: ProjectActivity[];
  maxItems?: number;
  showAvatars?: boolean;
  className?: string;
  onActivitySelect?: (activityId: string) => void;
}

const mockProjectActivities: ProjectActivity[] = [
  {
    id: '1',
    type: 'milestone',
    title: 'Milestone reached',
    description: 'Design system v2.0 complete',
    timestamp: '30 minutes ago',
    user: 'Sarah Chen',
    userInitials: 'SC',
    icon: 'Target',
    color: 'var(--success)'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task completed',
    description: 'Implement Gantt chart visualization',
    timestamp: '2 hours ago',
    user: 'You',
    userInitials: 'Y',
    icon: 'CheckSquare'
  },
  {
    id: '3',
    type: 'comment',
    title: 'New comment',
    description: 'Marcus: Great progress on the timeline widget!',
    timestamp: '3 hours ago',
    user: 'Marcus Johnson',
    userInitials: 'MJ',
    icon: 'MessageSquare'
  },
  {
    id: '4',
    type: 'commit',
    title: 'Code pushed',
    description: 'Transform timeline widget into Gantt chart',
    timestamp: '4 hours ago',
    user: 'You',
    userInitials: 'Y',
    icon: 'GitCommit'
  },
  {
    id: '5',
    type: 'phase',
    title: 'Phase started',
    description: 'Implementation phase begun',
    timestamp: 'Yesterday',
    user: 'Team',
    userInitials: 'T',
    icon: 'Clock',
    color: 'var(--primary)'
  },
  {
    id: '6',
    type: 'issue',
    title: 'Issue flagged',
    description: 'API integration needs review',
    timestamp: '2 days ago',
    user: 'Alex Rivera',
    userInitials: 'AR',
    icon: 'AlertCircle',
    color: 'var(--warning)'
  },
  {
    id: '7',
    type: 'note',
    title: 'Documentation updated',
    description: 'Project specs revised',
    timestamp: '3 days ago',
    user: 'You',
    userInitials: 'Y',
    icon: 'FileText'
  },
  {
    id: '8',
    type: 'task',
    title: 'Task assigned',
    description: 'Review pull request #234',
    timestamp: '3 days ago',
    user: 'Emma Wilson',
    userInitials: 'EW',
    icon: 'CheckSquare'
  }
];

export function ProjectActivityWidget({ 
  activities = mockProjectActivities,
  maxItems = 6,
  showAvatars = true,
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
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px] pr-[var(--space-3)]">
          <div className="space-y-[var(--space-2)]">
            {displayActivities.map((activity) => {
              const Icon = iconMap[activity.icon] || FileText;
              const iconColor = activity.color || 'var(--text-secondary)';
              
              return (
                <button
                  key={activity.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-[var(--space-3)] p-[var(--space-2)] rounded-[var(--radius-md)]",
                    "hover:bg-[var(--bg-surface-elevated)] transition-colors text-left",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  )}
                  onClick={() => onActivitySelect?.(activity.id)}
                >
                  {showAvatars && (
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback 
                        className="text-xs bg-[var(--primary-tint-10)] text-[color:var(--primary)]"
                      >
                        {activity.userInitials || activity.user.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-1)]">
                      <Icon 
                        size={14} 
                        className="flex-shrink-0" 
                        style={{ color: iconColor }}
                      />
                      <p className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                        {activity.title}
                      </p>
                    </div>
                    <p className="text-xs text-[color:var(--text-secondary)] truncate mb-[var(--space-1)]">
                      {activity.description}
                    </p>
                    <p className="text-xs text-[color:var(--text-tertiary)]">
                      {activity.timestamp}
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
