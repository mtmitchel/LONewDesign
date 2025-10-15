import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { openQuickAssistant, type QuickAssistantScope } from './assistant';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const computed = getComputedStyle(root);
    const expandedWidth = computed.getPropertyValue('--sidebar-width').trim() || '256px';
    const collapsedWidth = computed.getPropertyValue('--sidebar-collapsed-width').trim() || '72px';

    root.style.setProperty(
      '--sidebar-current-width',
      sidebarCollapsed ? collapsedWidth : expandedWidth,
    );
  }, [sidebarCollapsed]);

  const handleAssistantOpen = useCallback(() => {
    const scope: QuickAssistantScope = { source: activeModule };
    switch (activeModule) {
      case 'tasks':
        openQuickAssistant({ mode: 'task', scope });
        return;
      case 'notes':
        openQuickAssistant({ mode: 'note', scope });
        return;
      case 'calendar':
        openQuickAssistant({ mode: 'event', scope });
        return;
      case 'projects':
        openQuickAssistant({ mode: 'capture', scope });
        return;
      default:
        openQuickAssistant({ scope });
    }
  }, [activeModule]);

  return (
    <div className="h-screen flex bg-[var(--bg-canvas)]">
      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={onModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAssistantOpen={handleAssistantOpen}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}