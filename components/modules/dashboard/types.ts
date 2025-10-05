export type WidgetType = 
  | 'stats-card'
  | 'recent-activity'
  | 'quick-actions'
  | 'mini-calendar'
  | 'weather'
  | 'chart'
  | 'task-progress'
  | 'notes-preview'
  | 'email-summary'
  | 'chat-status';

export type DashboardLayout = 'grid' | 'masonry';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  isVisible: boolean;
}

export interface WidgetProps {
  widget: Widget;
  editMode?: boolean;
  onUpdate?: (widget: Widget) => void;
  onRemove?: (widgetId: string) => void;
}

// Default dashboard configuration
export const defaultWidgets: Widget[] = [
  {
    id: 'stats-overview',
    type: 'stats-card',
    title: 'Overview Stats',
    position: { x: 0, y: 0 },
    size: { width: 4, height: 2 },
    config: {
      stats: [
        { label: 'Unread Emails', value: 12, change: '+3', color: 'primary' },
        { label: 'Pending Tasks', value: 8, change: '-2', color: 'warning' },
        { label: 'This Week', value: 24, change: '+12%', color: 'success' },
        { label: 'Completion Rate', value: '94%', change: '+5%', color: 'info' }
      ]
    },
    isVisible: true
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    position: { x: 4, y: 0 },
    size: { width: 2, height: 2 },
    config: {
      actions: [
        { label: 'Compose Email', action: 'compose-email', icon: 'Mail' },
        { label: 'New Task', action: 'new-task', icon: 'Plus' },
        { label: 'Schedule Meeting', action: 'schedule-meeting', icon: 'Calendar' },
        { label: 'New Note', action: 'new-note', icon: 'FileText' }
      ]
    },
    isVisible: true
  },
  {
    id: 'recent-activity',
    type: 'recent-activity',
    title: 'Recent Activity',
    position: { x: 0, y: 2 },
    size: { width: 3, height: 3 },
    config: {
      maxItems: 8,
      showAvatars: true
    },
    isVisible: true
  },
  {
    id: 'mini-calendar',
    type: 'mini-calendar',
    title: 'Calendar',
    position: { x: 3, y: 2 },
    size: { width: 2, height: 3 },
    config: {
      showEvents: true,
      highlightToday: true
    },
    isVisible: true
  },
  {
    id: 'task-progress',
    type: 'task-progress',
    title: 'Task Progress',
    position: { x: 5, y: 2 },
    size: { width: 2, height: 2 },
    config: {
      showProgress: true,
      showDueDate: true
    },
    isVisible: true
  },
  {
    id: 'email-summary',
    type: 'email-summary',
    title: 'Email Summary',
    position: { x: 0, y: 5 },
    size: { width: 3, height: 2 },
    config: {
      showUnread: true,
      showImportant: true,
      maxEmails: 5
    },
    isVisible: true
  },
  {
    id: 'notes-preview',
    type: 'notes-preview',
    title: 'Recent Notes',
    position: { x: 3, y: 5 },
    size: { width: 2, height: 2 },
    config: {
      maxNotes: 4,
      showPreview: true
    },
    isVisible: true
  },
  {
    id: 'weather',
    type: 'weather',
    title: 'Weather',
    position: { x: 5, y: 4 },
    size: { width: 2, height: 3 },
    config: {
      location: 'San Francisco, CA',
      showForecast: true,
      units: 'fahrenheit'
    },
    isVisible: true
  }
];

export const widgetDefinitions = {
  'stats-card': {
    name: 'Statistics Card',
    description: 'Display key metrics and statistics',
    icon: 'BarChart3',
    defaultSize: { width: 2, height: 1 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 2 }
  },
  'recent-activity': {
    name: 'Recent Activity',
    description: 'Show recent actions and updates',
    icon: 'Activity',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 }
  },
  'quick-actions': {
    name: 'Quick Actions',
    description: 'Fast access to common tasks',
    icon: 'Zap',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 3, height: 3 }
  },
  'mini-calendar': {
    name: 'Mini Calendar',
    description: 'Compact calendar view',
    icon: 'Calendar',
    defaultSize: { width: 2, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 4 }
  },
  'weather': {
    name: 'Weather',
    description: 'Current weather and forecast',
    icon: 'Cloud',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 }
  },
  'chart': {
    name: 'Chart Widget',
    description: 'Display data in charts',
    icon: 'BarChart',
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 }
  },
  'task-progress': {
    name: 'Task Progress',
    description: 'Track task completion',
    icon: 'CheckSquare',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 1 },
    maxSize: { width: 3, height: 3 }
  },
  'notes-preview': {
    name: 'Notes Preview',
    description: 'Quick access to recent notes',
    icon: 'FileText',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 }
  },
  'email-summary': {
    name: 'Email Summary',
    description: 'Email overview and quick access',
    icon: 'Mail',
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 3 }
  },
  'chat-status': {
    name: 'Chat Status',
    description: 'Active conversations and status',
    icon: 'MessageSquare',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 }
  }
};