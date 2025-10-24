// features/canvas/renderer/modules/selection/utils/KeyboardHandler.ts

export interface KeyboardHandlerConfig {
  onEscape?: () => void;
  onDelete?: (selectedIds: string[]) => void;
  onSelectAll?: () => void;
  onCopy?: (selectedIds: string[]) => void;
  onPaste?: () => void;
  onDuplicate?: (selectedIds: string[]) => void;
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right', shiftKey: boolean) => void;
}

export class KeyboardHandler {
  private config: KeyboardHandlerConfig;
  private isEnabled = false;
  private selectedIds: string[] = [];

  constructor(config: KeyboardHandlerConfig) {
    this.config = config;
  }

  enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    document.addEventListener('keydown', this.handleKeyDown);
  }

  disable(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  updateSelectedIds(ids: string[]): void {
    this.selectedIds = [...ids];
  }

  updateConfig(config: Partial<KeyboardHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Don't handle keyboard events when focused on input elements
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const { key, shiftKey, ctrlKey, metaKey } = event;
    const isModifier = ctrlKey || metaKey;

    switch (key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.config.onEscape?.();
        break;

      case 'Delete':
      case 'Backspace':
        if (this.selectedIds.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          this.config.onDelete?.(this.selectedIds);
        }
        break;

      case 'a':
      case 'A':
        if (isModifier) {
          event.preventDefault();
          event.stopPropagation();
          this.config.onSelectAll?.();
        }
        break;

      case 'c':
      case 'C':
        if (isModifier && this.selectedIds.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          this.config.onCopy?.(this.selectedIds);
        }
        break;

      case 'v':
      case 'V':
        if (isModifier) {
          event.preventDefault();
          event.stopPropagation();
          this.config.onPaste?.();
        }
        break;

      case 'd':
      case 'D':
        if (isModifier && this.selectedIds.length > 0) {
          if (event.repeat) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          this.config.onDuplicate?.(this.selectedIds);
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (this.selectedIds.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          const direction = key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
          this.config.onArrowKey?.(direction, shiftKey);
        }
        break;
    }
  };

  destroy(): void {
    this.disable();
  }
}

// Factory function for creating keyboard handlers
export function createKeyboardHandler(config: KeyboardHandlerConfig): KeyboardHandler {
  return new KeyboardHandler(config);
}