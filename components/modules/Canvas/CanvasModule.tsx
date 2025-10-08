import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TriPane, TriPaneHeader } from '../../TriPane';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { PanelLeftClose, PanelLeftOpen, PlusCircle, RefreshCw } from 'lucide-react';
import CanvasHistory from './components/CanvasHistory';
import CanvasEditor from './components/CanvasEditor';
import { installStoreBridge } from './runtime/bootstrap/storeBridge';
import { StoreActions } from './runtime/features/stores/facade';
import { useUnifiedCanvasStore } from './runtime/features/stores/unifiedCanvasStore';

export function CanvasModule() {
  const [historyVisible, setHistoryVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const undo = useUnifiedCanvasStore((state) => state.undo);
  const redo = useUnifiedCanvasStore((state) => state.redo);
  const canUndo = useUnifiedCanvasStore((state) => state.canUndo?.() ?? false);
  const canRedo = useUnifiedCanvasStore((state) => state.canRedo?.() ?? false);

  useEffect(() => {
    installStoreBridge();
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }
      event.preventDefault();
      setHistoryVisible((prev) => !prev);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleToggleHistory = useCallback(() => {
    setHistoryVisible((prev) => !prev);
  }, []);

  const handleResetView = useCallback(() => {
    const { viewport } = useUnifiedCanvasStore.getState();
    viewport?.reset?.();
    setRefreshKey((key) => key + 1);
  }, []);

  const hotkeyHint = useMemo(
    () => (
      <span className="rounded-md border border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface-alt)] px-[var(--space-2)] py-[var(--space-1)] text-xs text-[color:var(--canvas-text-secondary)]">
        /
      </span>
    ),
    []
  );

  return (
    <div className="flex h-full flex-col gap-[var(--space-4)] bg-[color:var(--canvas-surface)] p-[var(--space-5)]">
      <TriPane
        className="rounded-[var(--canvas-radius-lg)] border border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface-alt)] shadow-canvas-lg"
        leftWidth="20rem"
        left={historyVisible ? <CanvasHistory /> : undefined}
        center={
          <div key={refreshKey} className="flex h-full flex-1 flex-col">
            <CanvasEditor />
          </div>
        }
        leftHeader={null}
        centerHeader={
          <TriPaneHeader className="flex items-center justify-between border-b border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface-alt)]">
            <div className="flex items-center gap-[var(--space-3)]">
              <div>
                <p className="text-sm font-semibold text-[color:var(--canvas-text-primary)]">Canvas</p>
                <p className="text-xs text-[color:var(--canvas-text-secondary)]">
                  Build, brainstorm, and explore ideas in a shared visual space.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 gap-[var(--space-2)] rounded-[var(--canvas-radius-md)] border border-transparent text-[color:var(--canvas-text-secondary)] hover:border-[color:var(--canvas-toolbar-border)] hover:bg-[color:var(--canvas-toolbar-bg)] hover:text-[color:var(--canvas-text-primary)]"
                    onClick={handleResetView}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    <span className="text-xs font-medium">Reset view</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Reset zoom and pan
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 gap-[var(--space-2)] rounded-[var(--canvas-radius-md)] border border-transparent text-[color:var(--canvas-text-secondary)] hover:border-[color:var(--canvas-toolbar-border)] hover:bg-[color:var(--canvas-toolbar-bg)] hover:text-[color:var(--canvas-text-primary)]"
                    onClick={() => StoreActions.setSelectedTool?.('sticky-note')}
                  >
                    <PlusCircle className="h-4 w-4" aria-hidden />
                    <span className="text-xs font-medium">Sticky tool</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Switch to the sticky note tool
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 gap-[var(--space-2)] rounded-[var(--canvas-radius-md)] border border-transparent text-[color:var(--canvas-text-secondary)] hover:border-[color:var(--canvas-toolbar-border)] hover:bg-[color:var(--canvas-toolbar-bg)] hover:text-[color:var(--canvas-text-primary)]"
                    onClick={handleToggleHistory}
                    aria-expanded={historyVisible}
                    aria-controls="canvas-history-pane"
                  >
                    {historyVisible ? (
                      <PanelLeftClose className="h-4 w-4" aria-hidden />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" aria-hidden />
                    )}
                    <span className="text-xs font-medium">History</span>
                    {hotkeyHint}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Toggle history panel (/) 
                </TooltipContent>
              </Tooltip>
            </div>
          </TriPaneHeader>
        }
      />
      <div className="flex items-center gap-[var(--space-3)] text-xs text-[color:var(--canvas-text-secondary)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="font-medium">Undo</span>
          <span className={canUndo ? 'opacity-100' : 'opacity-50'}>Ctrl+Z</span>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="font-medium">Redo</span>
          <span className={canRedo ? 'opacity-100' : 'opacity-50'}>Shift+Ctrl+Z</span>
        </div>
        <div className="ml-auto text-[color:var(--canvas-text-secondary)]">
          Canvas autosaves locally in your browser.
        </div>
      </div>
    </div>
  );
}

export default CanvasModule;
