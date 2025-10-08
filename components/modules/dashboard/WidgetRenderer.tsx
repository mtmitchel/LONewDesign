"use client";

import React from 'react';
import { X, Settings, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import type { WidgetProps } from './types';

// Import individual widget components
import { StatsCardWidget } from './widgets/StatsCardWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { MiniCalendarWidget } from './widgets/MiniCalendarWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TaskProgressWidget } from './widgets/TaskProgressWidget';
import { NotesPreviewWidget } from './widgets/NotesPreviewWidget';
import { EmailSummaryWidget } from './widgets/EmailSummaryWidget';
import { ChatStatusWidget } from './widgets/ChatStatusWidget';

export function WidgetRenderer({ widget, editMode, onUpdate, onRemove }: WidgetProps) {
  const handleRemove = () => {
    if (onRemove) {
      onRemove(widget.id);
    }
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'stats-card':
        return <StatsCardWidget widget={widget} />;
      case 'recent-activity':
        return <RecentActivityWidget widget={widget} />;
      case 'quick-actions':
        return <QuickActionsWidget widget={widget} />;
      case 'mini-calendar':
        return <MiniCalendarWidget widget={widget} />;
      case 'weather':
        return <WeatherWidget widget={widget} />;
      case 'chart':
        return <ChartWidget widget={widget} />;
      case 'task-progress':
        return <TaskProgressWidget widget={widget} />;
      case 'notes-preview':
        return <NotesPreviewWidget widget={widget} />;
      case 'email-summary':
        return <EmailSummaryWidget widget={widget} />;
      case 'chat-status':
        return <ChatStatusWidget widget={widget} />;
      default:
        return (
          <div className="flex items-center justify-center h-32 text-[color:var(--text-secondary)]">
            <p>Unknown widget type: {widget.type}</p>
          </div>
        );
    }
  };

  return (
    <Card 
      className={cn(
        "h-full transition-all duration-200 hover:shadow-lg",
        editMode && "ring-2 ring-[var(--primary)]/20 hover:ring-[var(--primary)]/40"
      )}
    >
      <CardHeader className={cn(
        "pb-3",
        editMode && "bg-[var(--primary-tint-10)]/30"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[color:var(--text-primary)] truncate">
            {widget.title}
          </h3>
          
          {editMode && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                <GripVertical size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              >
                <Settings size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0 text-[color:var(--text-secondary)] hover:text-[color:var(--error)]"
              >
                <X size={12} />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 h-full">
        <div className="h-full overflow-hidden">
          {renderWidgetContent()}
        </div>
      </CardContent>
    </Card>
  );
}