"use client";

import React from 'react';
import { cn } from '../../ui/utils';
import { WidgetRenderer } from './WidgetRenderer';
import type { Widget, DashboardLayout } from './types';

interface DashboardGridProps {
  widgets: Widget[];
  layout: DashboardLayout;
  editMode: boolean;
  onUpdateWidget: (widget: Widget) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function DashboardGrid({
  widgets,
  layout,
  editMode,
  onUpdateWidget,
  onRemoveWidget
}: DashboardGridProps) {
  if (layout === 'masonry') {
    return (
      <div className="p-6 h-full overflow-y-auto">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="break-inside-avoid mb-6"
            >
              <WidgetRenderer
                widget={widget}
                editMode={editMode}
                onUpdate={onUpdateWidget}
                onRemove={onRemoveWidget}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 auto-rows-fr">
        {widgets.map((widget) => {
          // Calculate grid span based on widget size
          const colSpan = Math.min(widget.size.width, 6);
          const rowSpan = widget.size.height;
          
          return (
            <div
              key={widget.id}
              className={cn(
                "min-h-0", // Important for proper grid sizing
                // Column spanning
                colSpan === 1 && "col-span-1",
                colSpan === 2 && "col-span-1 md:col-span-2",
                colSpan === 3 && "col-span-1 md:col-span-2 lg:col-span-3",
                colSpan === 4 && "col-span-1 md:col-span-2 lg:col-span-4",
                colSpan === 5 && "col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5",
                colSpan === 6 && "col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-6",
                // Row spanning for larger screens
                rowSpan === 2 && "lg:row-span-2",
                rowSpan === 3 && "lg:row-span-3",
                rowSpan === 4 && "lg:row-span-4"
              )}
              style={{
                // Fallback for browsers that don't support subgrid
                minHeight: `${rowSpan * 120}px`
              }}
            >
              <WidgetRenderer
                widget={widget}
                editMode={editMode}
                onUpdate={onUpdateWidget}
                onRemove={onRemoveWidget}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}