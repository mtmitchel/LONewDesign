import React from 'react';

export interface UseKeyboardShortcutsProps {
  leftPaneVisible: boolean;
  setLeftPaneVisible: (visible: boolean) => void;
  setRightPaneVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  onStartNewConversation: () => void;
  leftPaneRef: React.RefObject<any | null>;
}

export function useKeyboardShortcuts({
  leftPaneVisible,
  setLeftPaneVisible,
  setRightPaneVisible,
  onStartNewConversation,
  leftPaneRef,
}: UseKeyboardShortcutsProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
      const isModifier = metaKey || ctrlKey;

      // Skip if user is typing in an input or textarea
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (key) {
        case ']':
          if (!isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            setLeftPaneVisible(!leftPaneVisible);
            console.debug('chat:keyboard:left-pane-toggle', { visible: !leftPaneVisible });
          }
          break;

        case '\\':
          if (!isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            setRightPaneVisible(prev => !prev);
            console.debug('chat:keyboard:right-pane-toggle', { visible: true });
          }
          break;

        case 'n':
        case 'N':
          if (isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            onStartNewConversation();
            console.debug('chat:keyboard:new-conversation');
          }
          break;

        case 'k':
        case 'K':
          if (isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            // TODO: Open quick assistant
            console.debug('chat:keyboard:quick-assistant');
          }
          break;

        case 'Escape':
          if (!isModifier && !shiftKey && !altKey) {
            // Close right pane if open
            setRightPaneVisible(false);
            console.debug('chat:keyboard:escape');
          }
          break;

        case 'ArrowLeft':
          if (isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            // Navigate to previous conversation
            leftPaneRef.current?.navigatePrevious?.();
            console.debug('chat:keyboard:navigate-previous');
          }
          break;

        case 'ArrowRight':
          if (isModifier && !shiftKey && !altKey) {
            event.preventDefault();
            // Navigate to next conversation
            leftPaneRef.current?.navigateNext?.();
            console.debug('chat:keyboard:navigate-next');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    leftPaneVisible,
    setLeftPaneVisible,
    setRightPaneVisible,
    onStartNewConversation,
    leftPaneRef,
  ]);
}