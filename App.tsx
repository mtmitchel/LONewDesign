import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { TaskStoreProvider } from './components/modules/tasks/taskStore';
import { QuickAssistantProvider } from './components/assistant';

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

export default function App() {
  const [activeModule, setActiveModule] = useState('mail');
  


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
        <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
          {renderActiveModule()}
        </AppShell>
      </QuickAssistantProvider>
    </TaskStoreProvider>
  );
}