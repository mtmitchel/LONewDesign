import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { TaskStoreProvider } from './components/modules/tasks/taskStore';
import { QuickAssistantProvider } from './components/assistant';
import { Toaster } from './components/ui/sonner';

// Production Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { ChatModule } from './components/modules/ChatModule';
import { CalendarModule } from './components/modules/CalendarModule';
import { TasksModule } from './components/modules/TasksModule';
import { NotesModule } from './components/modules/NotesModule';
import { CanvasModule } from './components/modules/Canvas/CanvasModule';
import { ProjectsModule } from './components/modules/ProjectsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { MailModuleTriPane } from './components/modules/MailModuleTriPane';

// Development/Demo Components
import { PaneCaretSpec } from './components/dev/PaneCaretSpec';
import { AsanaDesignSystemDemo } from './components/dev/AsanaDesignSystemDemo';
import { DesignSystemDemo } from './components/dev/DesignSystemDemo';
import { MasterComponentsGuide } from './components/dev/MasterComponentsGuide';
import { ComponentUsageGuide } from './components/dev/ComponentUsageGuide';
import { MigrationChecklist } from './components/dev/MigrationChecklist';

const MODULE_STORAGE_KEY = 'therefore:last-module';
const DEFAULT_MODULE = 'mail';
const KNOWN_MODULES = new Set([
  'mail',
  'dashboard',
  'chat',
  'notes',
  'tasks',
  'calendar',
  'canvas',
  'projects',
  'settings',
  'design-demo',
  'design-system',
  'master-components',
  'pane-caret-spec',
  'usage-guide',
  'migration-checklist',
  'mail-tripane',
  'mail-edge-handles',
]);

export default function App() {
  const [activeModule, setActiveModule] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_MODULE;
    }

    const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
    return stored && KNOWN_MODULES.has(stored) ? stored : DEFAULT_MODULE;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(MODULE_STORAGE_KEY, activeModule);
  }, [activeModule]);

  const handleModuleChange = useCallback((module: string) => {
    setActiveModule(KNOWN_MODULES.has(module) ? module : DEFAULT_MODULE);
  }, []);


  const renderActiveModule = () => {
    switch (activeModule) {
      // Production Modules
      case 'mail':
        return <MailModuleTriPane />;
      case 'dashboard':
        return <DashboardModule />;
      case 'chat':
        return <ChatModule />;
      case 'notes':
        return <NotesModule />;
      case 'tasks':
        return <TasksModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'canvas':
        return <CanvasModule />;
      case 'projects':
        return <ProjectsModule />;
      case 'settings':
        return <SettingsModule />;
      
      // Development/Demo Routes
      case 'design-demo':
        return <AsanaDesignSystemDemo />;
      case 'design-system':
        return <DesignSystemDemo />;
      case 'master-components':
        return <MasterComponentsGuide />;
      case 'pane-caret-spec':
        return <PaneCaretSpec />;
      case 'usage-guide':
        return <ComponentUsageGuide />;
      case 'migration-checklist':
        return <MigrationChecklist />;
      
      // Legacy aliases (remove these eventually)
      case 'mail-tripane':
      case 'mail-edge-handles':
        return <MailModuleTriPane />;
      
      default:
        return <MailModuleTriPane />;
    }
  };

  return (
    <TaskStoreProvider>
      <QuickAssistantProvider>
        <AppShell activeModule={activeModule} onModuleChange={handleModuleChange}>
          {renderActiveModule()}
        </AppShell>
        <Toaster />
      </QuickAssistantProvider>
    </TaskStoreProvider>
  );
}