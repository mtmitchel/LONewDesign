import React from 'react';
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Palette, 
  Settings,
  LayoutDashboard,
  Eye,
  Sparkles,
  Code,
  List,
  Layers
} from 'lucide-react';
import { Button } from './ui/button';
import { PaneCaret, PaneFooter } from './PaneCaret';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'canvas', label: 'Canvas', icon: Palette },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const designSystemModules = [
  { id: 'design-system', label: 'Design System', icon: Sparkles },
  { id: 'master-components', label: 'Master Components', icon: Layers },
  { id: 'design-demo', label: 'Design Showcase', icon: Eye },
  { id: 'usage-guide', label: 'Usage Guide', icon: Code },
  { id: 'migration-checklist', label: 'Migration Checklist', icon: List },
  { id: 'pane-caret-spec', label: 'Pane Caret Spec', icon: Eye },
  { id: 'mail-tripane', label: 'TriPane Bottom Toggles', icon: Mail },
];

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={`${collapsed ? 'w-16' : 'w-72'} bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-default)] flex items-center">
        {!collapsed && (
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">LibreOllama</h1>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        {/* Design System Section */}
        <div>
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wide text-[var(--text-secondary)] mb-3 px-4">
              Design System
            </h3>
          )}
          <ul className="space-y-1">
            {designSystemModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <li key={module.id}>
                  <button
                    onClick={() => onModuleChange(module.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md transition-colors text-sm ${
                      isActive
                        ? 'bg-[var(--primary-tint-10)] text-[var(--primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--primary-tint-5)] hover:text-[var(--text-primary)]'
                    }`}
                    title={collapsed ? module.label : undefined}
                  >
                    <Icon size={16} />
                    {!collapsed && <span>{module.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Main Modules Section */}
        <div>
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wide text-[var(--text-secondary)] mb-3 px-4">
              Modules
            </h3>
          )}
          <ul className="space-y-1">
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              
              return (
                <li key={module.id}>
                  <button
                    onClick={() => onModuleChange(module.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-[var(--primary-tint-10)] text-[var(--primary)] font-medium'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--primary-tint-5)] hover:text-[var(--text-primary)]'
                    }`}
                    title={collapsed ? module.label : undefined}
                  >
                    <Icon size={18} />
                    {!collapsed && <span>{module.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      
      {/* Standardized Pane Caret - Bottom placement */}
      <PaneFooter>
        <PaneCaret
          direction={collapsed ? 'right' : 'left'}
          onClick={onToggleCollapse}
          tooltipText={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          shortcut="⌘\\"
        />
      </PaneFooter>
    </div>
  );
}