export interface ChatModuleTriPaneProps {
  // Props can be added here if needed for external configuration
}

export interface ModelOption {
  value: string;
  label: string;
  provider: string;
}

export interface StreamEvent {
  event: 'delta' | 'error' | 'done';
  content?: string;
  finish_reason?: string;
  error?: string;
}

export interface PaneVisibilityState {
  left: boolean;
  right: boolean;
}