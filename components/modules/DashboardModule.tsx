"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  MoreHorizontal, 
  Grid,
  LayoutDashboard,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Card } from '../ui/card';
import { EmptyState, LoadingSpinner } from '../extended';
import { DashboardGrid } from './dashboard/DashboardGrid';
import { WidgetLibrary } from './dashboard/WidgetLibrary';
import { DashboardSettings } from './dashboard/DashboardSettings';
import { defaultWidgets, type Widget, type DashboardLayout } from './dashboard/types';

export function DashboardModule() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [layout, setLayout] = useState<DashboardLayout>('grid');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddWidget = (widgetType: string) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetType as any,
      title: `New ${widgetType}`,
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
      config: {},
      isVisible: true
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setShowWidgetLibrary(false);
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const handleUpdateWidget = (updatedWidget: Widget) => {
    setWidgets(prev => prev.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
  };

  const handleLayoutChange = (newLayout: DashboardLayout) => {
    setLayout(newLayout);
  };

  const handleResetDashboard = () => {
    setIsLoading(true);
    setTimeout(() => {
      setWidgets(defaultWidgets);
      setLayout('grid');
      setIsEditMode(false);
      setIsLoading(false);
    }, 500);
  };

  const visibleWidgets = widgets.filter(w => w.isVisible);

  return (
    <div className={`h-full flex flex-col bg-[var(--canvas-bg)] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Dashboard Header */}
      <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Dashboard</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Welcome back! Here's your productivity overview.
              </p>
            </div>
            
            {isEditMode && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--primary-tint-10)] text-[var(--primary)] rounded-lg">
                <Settings size={16} />
                <span className="text-sm font-medium">Edit Mode</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Layout Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Grid size={16} className="mr-2" />
                  Layout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dashboard Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange('grid')}
                  className={layout === 'grid' ? 'bg-[var(--primary-tint-10)]' : ''}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Grid Layout
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLayoutChange('masonry')}
                  className={layout === 'masonry' ? 'bg-[var(--primary-tint-10)]' : ''}
                >
                  <Grid size={16} className="mr-2" />
                  Masonry Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Widget */}
            <Button 
              onClick={() => setShowWidgetLibrary(true)}
              disabled={!isEditMode}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
            >
              <Plus size={16} className="mr-2" />
              Add Widget
            </Button>

            {/* Edit Mode Toggle */}
            <Button 
              variant={isEditMode ? "default" : "outline"}
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? "bg-[var(--primary)] text-white" : ""}
            >
              <Settings size={16} className="mr-2" />
              {isEditMode ? 'Done' : 'Edit'}
            </Button>

            {/* Fullscreen Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings size={16} className="mr-2" />
                  Dashboard Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleResetDashboard}>
                  Reset to Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner size="lg" variant="primary" />
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Loading dashboard...</p>
            </div>
          </div>
        ) : visibleWidgets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={LayoutDashboard}
              title="No widgets on your dashboard"
              description="Add some widgets to get started with your personalized dashboard experience."
              action={{
                label: "Add Your First Widget",
                onClick: () => {
                  setIsEditMode(true);
                  setShowWidgetLibrary(true);
                }
              }}
              secondaryAction={{
                label: "Use Default Layout",
                onClick: handleResetDashboard
              }}
            />
          </div>
        ) : (
          <DashboardGrid
            widgets={visibleWidgets}
            layout={layout}
            editMode={isEditMode}
            onUpdateWidget={handleUpdateWidget}
            onRemoveWidget={handleRemoveWidget}
          />
        )}
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          isOpen={showWidgetLibrary}
          onClose={() => setShowWidgetLibrary(false)}
          onAddWidget={handleAddWidget}
          existingWidgets={widgets}
        />
      )}

      {/* Dashboard Settings Modal */}
      {showSettings && (
        <DashboardSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          widgets={widgets}
          onUpdateWidgets={setWidgets}
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
      )}
    </div>
  );
}