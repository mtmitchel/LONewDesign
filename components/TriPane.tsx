import React, { ReactNode } from 'react';
import { cn } from './ui/utils';

interface TriPaneProps {
  /* Layout configuration */
  leftWidth?: string;
  rightWidth?: string;
  
  /* Content for each pane */
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  
  /* Sticky headers for each pane */
  leftHeader?: ReactNode;
  centerHeader?: ReactNode;
  rightHeader?: ReactNode;
  
  /* Responsive behavior */
  hideRightOnMobile?: boolean;
  className?: string;
}

export function TriPane({
  leftWidth = "18rem",
  rightWidth = "22rem", 
  left,
  center,
  right,
  leftHeader,
  centerHeader,
  rightHeader,
  hideRightOnMobile = true,
  className
}: TriPaneProps) {
  return (
    <div className={cn("flex h-full bg-[var(--bg-canvas)]", className)}>
      {/* Left Pane */}
      {left && (
        <div 
          className="border-r border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col"
          style={{ width: leftWidth }}
        >
          {leftHeader && (
            <div className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
              {leftHeader}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {left}
          </div>
        </div>
      )}
      
      {/* Center Pane */}
      <div id="center-pane" className="relative flex-1 flex flex-col min-w-0 overflow-visible">
        {centerHeader && (
          <div className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            {centerHeader}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {center}
        </div>
      </div>
      
      {/* Right Pane */}
      {right && (
        <div 
          className={cn(
            "border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col",
            hideRightOnMobile && "hidden xl:flex"
          )}
          style={{ width: rightWidth }}
        >
          {rightHeader && (
            <div className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
              {rightHeader}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {right}
          </div>
        </div>
      )}
    </div>
  );
}

/* TriPane Header Components for consistent styling */
export function TriPaneHeader({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "p-4 flex items-center gap-3 h-[60px] bg-[var(--bg-surface)] border-b border-[var(--border-default)]",
      className
    )}>
      {children}
    </div>
  );
}

export function TriPaneContent({ 
  children, 
  className,
  padding = true
}: { 
  children: ReactNode; 
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn(
      padding && "p-4",
      className
    )}>
      {children}
    </div>
  );
}