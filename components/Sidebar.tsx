import React from 'react';
import {
  Calendar,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PenTool,
  Settings
} from 'lucide-react';
import { PaneCaret, PaneFooter } from './dev/PaneCaret';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'canvas', label: 'Canvas', icon: PenTool },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <div className={`${collapsed ? 'w-16' : 'w-72'} bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className="h-[var(--pane-header-h)] px-4 border-b border-[var(--border-subtle)] flex items-center flex-shrink-0">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">LibreOllama</h1>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-[var(--space-4)]">
        <ul className="space-y-[var(--space-2)]">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;

            const button = (
              <button
                onClick={() => onModuleChange(module.id)}
                className={cn(
                  'group relative w-full flex items-center rounded-[var(--radius-sm)] transition-colors motion-safe:duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-20)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] border-l-[3px] border-transparent',
                  collapsed
                    ? 'justify-center px-0 h-10 hover:bg-[var(--bg-surface-elevated)]'
                    : `gap-[var(--space-3)] px-3 py-2 hover:bg-[var(--bg-surface-elevated)]`,
                  isActive
                    ? 'bg-[var(--bg-surface-elevated)] text-[var(--primary)] font-medium border-l-[3px] border-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
                data-active={isActive ? 'true' : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 motion-safe:transition-colors duration-[var(--duration-fast)]',
                    isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--primary)]'
                  )}
                  strokeWidth={1.5}
                />
                {!collapsed && (
                  <span className="text-sm">{module.label}</span>
                )}
              </button>
            );

            return (
              <li key={module.id}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {button}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={8}
                      className="shadow-[var(--elevation-lg)]"
                    >
                      <span className="text-sm font-[var(--font-weight-medium)] text-[var(--text-primary)]">
                        {module.label}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  button
                )}
              </li>
            );
          })}
        </ul>
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