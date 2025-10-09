import React from 'react';
import {
  Calendar,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PenTool,
  Settings
} from 'lucide-react';
import { PaneCaret, PaneFooter } from './dev/PaneCaret';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';
import { SidebarAssistantLauncher } from './ui/chrome/SidebarAssistantLauncher';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAssistantOpen: () => void;
}

const modules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'canvas', label: 'Canvas', icon: PenTool },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse, onAssistantOpen }: SidebarProps) {
  const sidebarWidth = collapsed ? 'var(--sidebar-w-closed)' : 'var(--sidebar-w-open)';
  return (
    <div
      className="flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-200"
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className="flex h-[var(--pane-header-h)] flex-shrink-0 items-center justify-center border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--sidebar-gutter)]">
        {!collapsed && (
          <button
            type="button"
            onClick={() => onModuleChange('dashboard')}
            className="text-2xl font-semibold leading-none text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-20)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] rounded-[var(--radius-sm)] px-1"
            aria-label="Go to Dashboard"
          >
            ∴
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'px-[var(--space-2)] py-[var(--space-4)]' : 'px-[var(--sidebar-gutter)] py-[var(--space-4)]')}>
        <ul className="flex flex-col gap-[var(--space-2)]">
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
                    ? 'bg-[var(--bg-surface-elevated)] text-[color:var(--primary)] font-medium border-l-[3px] border-[var(--primary)]'
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
                )}
                data-active={isActive ? 'true' : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 motion-safe:transition-colors duration-[var(--duration-fast)]',
                    isActive ? 'text-[color:var(--primary)]' : 'text-[color:var(--text-secondary)] group-hover:text-[color:var(--primary)]'
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
                      <span className="text-sm font-[var(--font-weight-medium)] text-[color:var(--text-primary)]">
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

      <div className="mt-auto flex flex-col gap-[var(--space-3)]">
        <SidebarAssistantLauncher
          collapsed={collapsed}
          onOpen={onAssistantOpen}
          className="pb-[var(--sidebar-gutter)]"
        />

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
    </div>
  );
}