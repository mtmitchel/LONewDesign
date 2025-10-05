"use client";

import React from 'react';
import { Mail, Plus, Calendar, FileText, MessageSquare, CheckSquare } from 'lucide-react';
import { Button } from '../../../ui/button';
import type { WidgetProps } from '../types';

const iconMap = {
  Mail,
  Plus,
  Calendar,
  FileText,
  MessageSquare,
  CheckSquare
};

export function QuickActionsWidget({ widget }: WidgetProps) {
  const actions = widget.config.actions || [];

  const handleAction = (actionType: string) => {
    // In a real app, these would integrate with the respective modules
    console.log('Quick action triggered:', actionType);
    
    switch (actionType) {
      case 'compose-email':
        // Navigate to mail module and open compose
        break;
      case 'new-task':
        // Navigate to tasks module and create new task
        break;
      case 'schedule-meeting':
        // Navigate to calendar module and create event
        break;
      case 'new-note':
        // Navigate to notes module and create new note
        break;
      default:
        break;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {actions.map((action: any, index: number) => {
        const Icon = iconMap[action.icon as keyof typeof iconMap] || Plus;
        
        return (
          <Button
            key={index}
            variant="outline"
            onClick={() => handleAction(action.action)}
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-[var(--primary-tint-10)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Icon size={20} />
            <span className="text-sm text-center leading-tight">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}