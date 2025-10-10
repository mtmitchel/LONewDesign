"use client";

import React from 'react';
import { Plus, FileText, Calendar, Palette, MessageCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';

type CreationActionType = 'task' | 'note' | 'event' | 'canvas' | 'chat' | 'email';

interface ProjectQuickActionsProps {
  project: {
    id: string;
    name: string;
    tags?: string[];
  };
  className?: string;
  onTaskCreate?: (projectId: string) => void;
  onNoteCreate?: (projectId: string) => void;
  onEventCreate?: (projectId: string) => void;
  onCanvasCreate?: (projectId: string) => void;
  onChatCreate?: (projectId: string) => void;
  onEmailCreate?: (projectId: string) => void;
}

const actionConfig = [
  {
    type: 'task' as CreationActionType,
    icon: Plus,
    label: 'Task'
  },
  {
    type: 'note' as CreationActionType,
    icon: FileText,
    label: 'Note'
  },
  {
    type: 'event' as CreationActionType,
    icon: Calendar,
    label: 'Event'
  },
  {
    type: 'canvas' as CreationActionType,
    icon: Palette,
    label: 'Canvas'
  },
  {
    type: 'chat' as CreationActionType,
    icon: MessageCircle,
    label: 'Chat'
  },
  {
    type: 'email' as CreationActionType,
    icon: Mail,
    label: 'Email'
  }
];

export function ProjectQuickActionsWidget({
  project,
  className,
  onTaskCreate,
  onNoteCreate,
  onEventCreate,
  onCanvasCreate,
  onChatCreate,
  onEmailCreate
}: ProjectQuickActionsProps) {
  
  const handleCreateAction = (actionType: CreationActionType) => {
    const projectContext = {
      projectId: project.id,
      projectName: project.name,
      projectTags: project.tags || [project.name]
    };

    console.log(`Creating ${actionType} with context:`, projectContext);

    switch (actionType) {
      case 'task':
        if (onTaskCreate) {
          onTaskCreate(project.id);
        } else {
          // Default navigation behavior
          console.log('Navigate to task creation with:', projectContext);
        }
        break;
      case 'note':
        if (onNoteCreate) {
          onNoteCreate(project.id);
        } else {
          console.log('Navigate to note creation with:', projectContext);
        }
        break;
      case 'event':
        if (onEventCreate) {
          onEventCreate(project.id);
        } else {
          console.log('Navigate to event creation with:', {
            ...projectContext,
            subject: `${project.name} - `
          });
        }
        break;
      case 'canvas':
        if (onCanvasCreate) {
          onCanvasCreate(project.id);
        } else {
          console.log('Navigate to canvas creation with:', projectContext);
        }
        break;
      case 'chat':
        if (onChatCreate) {
          onChatCreate(project.id);
        } else {
          console.log('Navigate to chat creation with:', {
            ...projectContext,
            initialMessage: `I'm working on the ${project.name} project...`
          });
        }
        break;
      case 'email':
        if (onEmailCreate) {
          onEmailCreate(project.id);
        } else {
          console.log('Navigate to email compose with:', {
            ...projectContext,
            subject: `Re: ${project.name} project`
          });
        }
        break;
    }
  };

  return (
    <Card 
      className={cn(
        "bg-[var(--bg-surface)] border-[var(--border-default)] shadow-[var(--elevation-sm)]",
        className
      )}
    >
      <CardHeader className="pb-[var(--space-3)]">
        <CardTitle className="text-[color:var(--text-primary)] text-sm font-medium">
          Quick actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-[var(--space-3)]">
          {actionConfig.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              variant="ghost"
              className={cn(
                "h-auto p-[var(--space-4)] flex flex-col items-center justify-center",
                "hover:bg-[var(--bg-surface-elevated)] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              )}
              onClick={() => handleCreateAction(type)}
              aria-label={`Create new ${label.toLowerCase()} for ${project.name}`}
            >
              <Icon 
                className="w-5 h-5 mb-[var(--space-1)] text-[color:var(--text-secondary)]" 
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-[color:var(--text-primary)]">
                {label}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
