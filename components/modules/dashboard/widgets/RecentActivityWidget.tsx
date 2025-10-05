"use client";

import React from 'react';
import { Mail, MessageSquare, FileText, CheckSquare, Calendar, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { ScrollArea } from '../../../ui/scroll-area';
import type { WidgetProps } from '../types';

const mockActivities = [
  {
    id: '1',
    type: 'email',
    title: 'New email from Sarah Chen',
    description: 'Q4 Project Review Meeting',
    timestamp: '2 minutes ago',
    user: 'SC',
    icon: 'Mail'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task completed',
    description: 'Updated design mockups',
    timestamp: '15 minutes ago',
    user: 'You',
    icon: 'CheckSquare'
  },
  {
    id: '3',
    type: 'note',
    title: 'New note created',
    description: 'Meeting notes from standup',
    timestamp: '1 hour ago',
    user: 'You',
    icon: 'FileText'
  },
  {
    id: '4',
    type: 'chat',
    title: 'Message from Marcus',
    description: 'About the dashboard redesign',
    timestamp: '2 hours ago',
    user: 'MJ',
    icon: 'MessageSquare'
  },
  {
    id: '5',
    type: 'calendar',
    title: 'Meeting reminder',
    description: 'Team sync in 30 minutes',
    timestamp: '3 hours ago',
    user: 'Cal',
    icon: 'Calendar'
  },
  {
    id: '6',
    type: 'email',
    title: 'Email sent',
    description: 'Budget approval request',
    timestamp: '4 hours ago',
    user: 'You',
    icon: 'Mail'
  }
];

const iconMap = {
  Mail,
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar,
  User
};

export function RecentActivityWidget({ widget }: WidgetProps) {
  const maxItems = widget.config.maxItems || 6;
  const showAvatars = widget.config.showAvatars ?? true;
  
  const activities = mockActivities.slice(0, maxItems);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = iconMap[activity.icon as keyof typeof iconMap] || User;
          
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--elevated)] transition-colors cursor-pointer"
            >
              {showAvatars && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-[var(--primary-tint-15)] text-[var(--primary)]">
                    {activity.user === 'You' ? 'Y' : activity.user}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {activity.title}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}