import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { DashboardModule } from './components/modules/DashboardModule';
// import { MailModule } from './components/modules/MailModule';
import { ChatModule } from './components/modules/ChatModule';
import { CalendarModule } from './components/modules/CalendarModule';
import { TasksModuleEnhanced as TasksModule } from './components/modules/TasksModuleEnhanced';
import { NotesModuleEnhanced as NotesModule } from './components/modules/NotesModuleEnhanced';
import { CanvasModule } from './components/modules/CanvasModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { MailModuleTriPane } from './components/modules/MailModuleTriPane';
// import { MailModuleTriPaneWithEdgeHandles } from './components/modules/MailModuleTriPaneWithEdgeHandles';
import { PaneCaretSpec } from './components/PaneCaretSpec';
import { AsanaDesignSystemDemo } from './components/AsanaDesignSystemDemo';
import { DesignSystemDemo } from './components/DesignSystemDemo';
import { MasterComponentsGuide } from './components/MasterComponentsGuide';
import { ComponentUsageGuide } from './components/ComponentUsageGuide';
import { MigrationChecklist } from './components/MigrationChecklist';

export default function App() {
  const [activeModule, setActiveModule] = useState('design-demo');
  


  const renderActiveModule = () => {
    switch (activeModule) {
      case 'design-demo':
        return <AsanaDesignSystemDemo />;
      case 'design-system':
        return <DesignSystemDemo />;
      case 'master-components':
        return <MasterComponentsGuide />;
      case 'pane-caret-spec':
        return <PaneCaretSpec />;
      case 'mail-tripane':
        return <MailModuleTriPane />;
      case 'mail-edge-handles':
        return <MailModuleTriPane />;
      case 'usage-guide':
        return <ComponentUsageGuide />;
      case 'migration-checklist':
        return <MigrationChecklist />;
      case 'dashboard':
        return <DashboardModule />;
      case 'canvas':
        return <CanvasModule />;
      case 'mail':
        return <MailModuleTriPane />;
      case 'chat':
        return <ChatModule />;
      case 'notes':
        return <NotesModule />;
      case 'tasks':
        return <TasksModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DesignSystemDemo />;
    }
  };

  return (
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
      {renderActiveModule()}
    </AppShell>
  );
}