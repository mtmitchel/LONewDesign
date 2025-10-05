"use client";

import React, { useState } from 'react';
import { X, Eye, EyeOff, Settings, Trash2, Grid, LayoutDashboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Separator } from '../../ui/separator';
import { ScrollArea } from '../../ui/scroll-area';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import type { Widget, DashboardLayout } from './types';

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: Widget[];
  onUpdateWidgets: (widgets: Widget[]) => void;
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
}

export function DashboardSettings({
  isOpen,
  onClose,
  widgets,
  onUpdateWidgets,
  layout,
  onLayoutChange
}: DashboardSettingsProps) {
  const [localWidgets, setLocalWidgets] = useState(widgets);

  const handleVisibilityToggle = (widgetId: string) => {
    setLocalWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, isVisible: !widget.isVisible }
          : widget
      )
    );
  };

  const handleDeleteWidget = (widgetId: string) => {
    setLocalWidgets(prev => prev.filter(widget => widget.id !== widgetId));
  };

  const handleSave = () => {
    onUpdateWidgets(localWidgets);
    onClose();
  };

  const handleCancel = () => {
    setLocalWidgets(widgets);
    onClose();
  };

  const visibleCount = localWidgets.filter(w => w.isVisible).length;
  const hiddenCount = localWidgets.filter(w => !w.isVisible).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Dashboard Settings</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X size={16} />
            </Button>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Customize your dashboard layout and manage widgets visibility.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[var(--elevated)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--text-primary)]">
                {localWidgets.length}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Total Widgets</div>
            </div>
            <div className="text-center p-3 bg-[var(--elevated)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--primary)]">
                {visibleCount}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Visible</div>
            </div>
            <div className="text-center p-3 bg-[var(--elevated)] rounded-lg">
              <div className="text-2xl font-semibold text-[var(--text-secondary)]">
                {hiddenCount}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Hidden</div>
            </div>
          </div>

          {/* Layout Settings */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Layout</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                onClick={() => onLayoutChange('grid')}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  layout === 'grid' ? 'bg-[var(--primary)] text-white' : ''
                }`}
              >
                <LayoutDashboard size={24} />
                <span>Grid Layout</span>
                <span className="text-xs opacity-75">Structured grid system</span>
              </Button>
              <Button
                variant={layout === 'masonry' ? 'default' : 'outline'}
                onClick={() => onLayoutChange('masonry')}
                className={`h-auto p-4 flex flex-col items-center gap-2 ${
                  layout === 'masonry' ? 'bg-[var(--primary)] text-white' : ''
                }`}
              >
                <Grid size={24} />
                <span>Masonry Layout</span>
                <span className="text-xs opacity-75">Dynamic flowing layout</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Widget Management */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Widgets</h3>
            
            {localWidgets.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No widgets available. Add widgets from the Widget Library to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {localWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`widget-${widget.id}`} className="text-sm font-medium">
                            {widget.title}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {widget.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {widget.size.width}×{widget.size.height}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`widget-${widget.id}`}
                            checked={widget.isVisible}
                            onCheckedChange={() => handleVisibilityToggle(widget.id)}
                          />
                          {widget.isVisible ? (
                            <Eye size={16} className="text-[var(--success)]" />
                          ) : (
                            <EyeOff size={16} className="text-[var(--text-secondary)]" />
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Settings size={14} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWidget(widget.id)}
                          className="text-[var(--text-secondary)] hover:text-[var(--error)]"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}