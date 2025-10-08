"use client";

import React from 'react';
import { Plus, X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { widgetDefinitions, type WidgetType, type Widget } from './types';

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetType: WidgetType) => void;
  existingWidgets: Widget[];
}

export function WidgetLibrary({ isOpen, onClose, onAddWidget, existingWidgets }: WidgetLibraryProps) {
  const getWidgetCount = (type: WidgetType) => {
    return existingWidgets.filter(w => w.type === type && w.isVisible).length;
  };

  const categories = {
    'Productivity': ['stats-card', 'quick-actions', 'task-progress'],
    'Communication': ['email-summary', 'chat-status', 'recent-activity'],
    'Information': ['mini-calendar', 'weather', 'notes-preview'],
    'Analytics': ['chart']
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Widget Library</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Choose widgets to add to your dashboard. You can customize them after adding.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {Object.entries(categories).map(([category, widgetTypes]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {widgetTypes.map((type) => {
                    const definition = widgetDefinitions[type as keyof typeof widgetDefinitions];
                    const IconComponent = Icons[definition.icon as keyof typeof Icons] as any;
                    const count = getWidgetCount(type as WidgetType);
                    
                    return (
                      <Card 
                        key={type}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onAddWidget(type as WidgetType)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {IconComponent && (
                                <div className="w-10 h-10 bg-[var(--primary-tint-10)] rounded-lg flex items-center justify-center">
                                  <IconComponent size={20} className="text-[color:var(--primary)]" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-[color:var(--text-primary)]">
                                  {definition.name}
                                </h4>
                                {count > 0 && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {count} active
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                              <Plus size={14} />
                            </Button>
                          </div>
                          <p className="text-sm text-[color:var(--text-secondary)] mb-3">
                            {definition.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                            <span>
                              Size: {definition.defaultSize.width}×{definition.defaultSize.height}
                            </span>
                            <span>
                              {definition.minSize.width}×{definition.minSize.height} - {definition.maxSize.width}×{definition.maxSize.height}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}