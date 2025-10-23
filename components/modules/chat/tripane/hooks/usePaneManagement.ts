import React from 'react';
import type { PaneVisibilityState } from '../types';

export function usePaneVisibilityPersistence(key: string, initial: PaneVisibilityState) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as PaneVisibilityState;
    } catch {}
    return initial;
  });
  
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  
  return [state, setState] as const;
}

export function usePaneManagement() {
  const [{ left: leftPaneVisible, right: rightPaneVisible }, setVisibility] = usePaneVisibilityPersistence(
    'chat:prefs:v1',
    { left: true, right: false }
  );

  const setLeftPaneVisible = (v: boolean) => setVisibility(prev => ({ ...prev, left: v }));
  const setRightPaneVisible = (v: boolean | ((x: boolean) => boolean)) =>
    setVisibility(prev => ({ ...prev, right: typeof v === 'function' ? (v as any)(prev.right) : v }));

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverlayRight, setIsOverlayRight] = React.useState(false);
  const overlayPanelRef = React.useRef<HTMLDivElement | null>(null);
  const leftPaneRef = React.useRef<any | null>(null);

  const CENTER_MIN_VAR = '--tripane-center-min';

  // Responsive guard: enforce minimum center width by hiding panes (right first, then left)
  React.useEffect(() => {
    const el = containerRef.current ?? document.documentElement;
    const getPx = (v: string) => parseFloat(getComputedStyle(el).getPropertyValue(v)) || 0;

    const handleResize = () => {
      const centerMin = getPx(CENTER_MIN_VAR) || 640;
      const total = el.clientWidth || window.innerWidth;
      // When very narrow, show right pane as overlay instead of inline
      setIsOverlayRight(total < centerMin);
      // Estimate center width by subtracting pane widths when visible
      const leftW = leftPaneVisible ? getPx('--tripane-left-width') : 20;
      const rightW = rightPaneVisible && !isOverlayRight ? getPx('--quick-panel-width') : 20;
      const center = total - leftW - rightW;
      if (center < centerMin) {
        if (rightPaneVisible && !isOverlayRight) {
          setRightPaneVisible(false);
          console.debug('chat:pane:right:toggle', { visible: false, source: 'auto-collapse' });
          return;
        }
        if (leftPaneVisible) {
          setLeftPaneVisible(false);
          console.debug('chat:pane:left:toggle', { visible: false, source: 'auto-collapse' });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOverlayRight, leftPaneVisible, rightPaneVisible]);

  // Focus trap for overlay right pane
  React.useEffect(() => {
    if (!isOverlayRight || !rightPaneVisible) return;
    
    const lastFocusRef = React.useRef<Element | null>(null);
    lastFocusRef.current = document.activeElement;
    const panel = overlayPanelRef.current;
    panel?.focus();
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = panel?.querySelectorAll<HTMLElement>(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const last = lastFocusRef.current as HTMLElement | null;
      last?.focus();
    };
  }, [isOverlayRight, rightPaneVisible]);

  return {
    containerRef,
    leftPaneVisible,
    rightPaneVisible,
    isOverlayRight,
    overlayPanelRef,
    leftPaneRef,
    setLeftPaneVisible,
    setRightPaneVisible,
  };
}