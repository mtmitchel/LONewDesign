import React from 'react';

interface CollapsedSidebarPanelProps {
  currentView: string;
}

export function CollapsedSidebarPanel({
  currentView
}: CollapsedSidebarPanelProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[48px]
        bg-[var(--bg-surface)] border-b border-[var(--border-default)]
        shadow-[var(--elevation-sm)]
        transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)]"
    >
      <div className="flex items-center justify-center h-full px-[var(--space-3)] py-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">Mail</span>
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)]">
            {currentView}
          </span>
        </div>
      </div>
    </div>
  );
}
