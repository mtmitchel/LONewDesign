import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export function AppShell({ children, activeModule, onModuleChange }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-[var(--bg-canvas)]">
      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={onModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}