import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  ArrowRight,
  Calendar,
  Palette as PaletteIcon,
  MessageSquare,
  Settings,
  FileText
} from 'lucide-react';

interface MigrationItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface ModuleMigration {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'in-progress' | 'pending';
  items: MigrationItem[];
}

export function MigrationChecklist() {
  const [modules, setModules] = useState<ModuleMigration[]>([
    {
      id: 'chat',
      name: 'Chat Module',
      icon: MessageSquare,
      status: 'pending',
      items: [
        {
          id: 'chat-1',
          title: 'Replace hardcoded colors with design tokens',
          description: 'Update all color values to use CSS custom properties',
          completed: false,
          priority: 'high'
        },
        {
          id: 'chat-2',
          title: 'Implement TriPane layout',
          description: 'Convert to three-pane layout for better productivity',
          completed: false,
          priority: 'medium'
        },
        {
          id: 'chat-3',
          title: 'Update spacing to 8pt grid',
          description: 'Use spacing tokens instead of arbitrary values',
          completed: false,
          priority: 'high'
        },
        {
          id: 'chat-4',
          title: 'Add shadcn/ui components',
          description: 'Replace custom components with design system versions',
          completed: false,
          priority: 'medium'
        }
      ]
    },
    {
      id: 'calendar',
      name: 'Calendar Module',
      icon: Calendar,
      status: 'pending',
      items: [
        {
          id: 'cal-1',
          title: 'Apply new color scheme',
          description: 'Use soft lilac accents for events and highlights',
          completed: false,
          priority: 'high'
        },
        {
          id: 'cal-2',
          title: 'Update typography system',
          description: 'Remove font-size overrides, use design system typography',
          completed: false,
          priority: 'medium'
        },
        {
          id: 'cal-3',
          title: 'Implement responsive behavior',
          description: 'Ensure calendar works well on mobile devices',
          completed: false,
          priority: 'low'
        }
      ]
    },
    {
      id: 'canvas',
      name: 'Canvas Module',
      icon: PaletteIcon,
      status: 'pending',
      items: [
        {
          id: 'canvas-1',
          title: 'Integrate design system toolbar',
          description: 'Use Button and other UI components for canvas tools',
          completed: false,
          priority: 'high'
        },
        {
          id: 'canvas-2',
          title: 'Update panel backgrounds',
          description: 'Use elevation hierarchy for tool panels',
          completed: false,
          priority: 'medium'
        }
      ]
    },
    {
      id: 'settings',
      name: 'Settings Module',
      icon: Settings,
      status: 'pending',
      items: [
        {
          id: 'settings-1',
          title: 'Restructure with Cards',
          description: 'Use Card components for settings sections',
          completed: false,
          priority: 'high'
        },
        {
          id: 'settings-2',
          title: 'Add form validation',
          description: 'Implement proper form handling with shadcn/ui',
          completed: false,
          priority: 'medium'
        }
      ]
    }
  ]);

  const toggleItem = (moduleId: string, itemId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        const updatedItems = module.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const completedCount = updatedItems.filter(item => item.completed).length;
        const totalCount = updatedItems.length;
        const newStatus = completedCount === totalCount ? 'completed' : 
                         completedCount > 0 ? 'in-progress' : 'pending';
        
        return {
          ...module,
          items: updatedItems,
          status: newStatus
        };
      }
      return module;
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-[var(--success)] text-white">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-[var(--warning)] text-white">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-[var(--danger)]';
      case 'medium':
        return 'text-[var(--warning)]';
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  const overallProgress = () => {
    const totalItems = modules.reduce((acc, module) => acc + module.items.length, 0);
    const completedItems = modules.reduce((acc, module) => 
      acc + module.items.filter(item => item.completed).length, 0);
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  return (
    <div className="p-[var(--space-6)] space-y-[var(--space-6)] bg-[var(--bg-canvas)] min-h-screen">
      {/* Header */}
      <div className="space-y-[var(--space-3)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-3)]">
            <FileText className="w-6 h-6 text-[var(--primary)]" />
            <h1 className="text-[var(--text-primary)]">Module Migration Checklist</h1>
            <Badge className="bg-[var(--primary-tint-10)] text-[var(--primary)] border-none">
              Design System v2.0
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-secondary)]">Overall Progress</p>
            <div className="flex items-center gap-[var(--space-2)] mt-1">
              <Progress value={overallProgress()} className="w-24 h-2" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {Math.round(overallProgress())}%
              </span>
            </div>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] max-w-3xl">
          Track the migration of existing modules to the new Asana + Sunsama design system. 
          Complete these tasks to ensure consistency across all components.
        </p>
      </div>

      {/* Migration Cards */}
      <div className="grid gap-[var(--space-6)]">
        {modules.map((module) => {
          const Icon = module.icon;
          const completedCount = module.items.filter(item => item.completed).length;
          const totalCount = module.items.length;
          const moduleProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <Icon className="w-5 h-5 text-[var(--primary)]" />
                    <CardTitle className="text-[var(--text-primary)]">{module.name}</CardTitle>
                    {getStatusBadge(module.status)}
                  </div>
                  <div className="flex items-center gap-[var(--space-2)]">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {completedCount}/{totalCount} completed
                    </span>
                    <Progress value={moduleProgress} className="w-20 h-2" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-[var(--space-4)]">
                <div className="space-y-[var(--space-3)]">
                  {module.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-[var(--space-3)] p-[var(--space-3)] rounded-[var(--radius-card)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(module.id, item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-[var(--space-2)]">
                          <h4 className={`text-sm font-medium ${item.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                            {item.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(item.priority)}`}
                          >
                            {item.priority}
                          </Badge>
                        </div>
                        <p className={`text-sm ${item.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>
                          {item.description}
                        </p>
                      </div>
                      {item.completed && (
                        <CheckCircle className="w-4 h-4 text-[var(--success)] mt-1" />
                      )}
                    </div>
                  ))}
                </div>
                
                {module.status === 'pending' && (
                  <div className="mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--border-subtle)]">
                    <Button variant="outline" size="sm" className="gap-[var(--space-2)]">
                      Start Migration
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-[var(--bg-surface-elevated)]">
        <CardContent className="p-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-3)]">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
              <h4 className="text-[var(--text-primary)]">Migration Benefits</h4>
            </div>
          </div>
          <ul className="mt-[var(--space-3)] space-y-1 text-sm text-[var(--text-secondary)]">
            <li>• Consistent visual language across all modules</li>
            <li>• Improved accessibility with WCAG AA compliance</li>
            <li>• Better maintainability with centralized design tokens</li>
            <li>• Enhanced user experience with cohesive interactions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}