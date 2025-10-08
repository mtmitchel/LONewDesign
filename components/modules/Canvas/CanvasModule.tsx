import React, { useEffect, useRef, useState } from 'react';
import { TriPane } from '../../TriPane';
import { PaneCaret } from '../../dev/PaneCaret';
import { PaneHeader } from '../../layout/PaneHeader';
import { Button } from '../../ui/button';
import CanvasLeftPane, { CanvasLeftPaneHandle } from './components/CanvasLeftPane';
import CanvasEditor from './components/CanvasEditor';
import { installStoreBridge } from './runtime/bootstrap/storeBridge';
import { useUnifiedCanvasStore } from './runtime/features/stores/unifiedCanvasStore';
import { useCanvasProjectsStore } from './state/canvasProjectsStore';

export function CanvasModule() {
  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const undo = useUnifiedCanvasStore((state) => state.undo);
  const redo = useUnifiedCanvasStore((state) => state.redo);
  const canUndo = useUnifiedCanvasStore((state) => state.canUndo?.() ?? false);
  const canRedo = useUnifiedCanvasStore((state) => state.canRedo?.() ?? false);

  const createProject = useCanvasProjectsStore((state) => state.createProject);
  const leftPaneRef = useRef<CanvasLeftPaneHandle | null>(null);

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
      setLeftPaneVisible((prev) => !prev);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCreateCanvas = () => {
    createProject();
    requestAnimationFrame(() => {
      leftPaneRef.current?.focusSearch();
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-[color:var(--canvas-surface)]">
      <TriPane
        className="flex-1"
        leftWidth={leftPaneVisible ? 'var(--tripane-left-width)' : '20px'}
        left={
          leftPaneVisible ? (
            <CanvasLeftPane ref={leftPaneRef} onHidePane={() => setLeftPaneVisible(false)} />
          ) : (
            <div className="flex h-full w-5 min-w-[20px] max-w-[20px] cursor-pointer items-center justify-center bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)]">
              <PaneCaret
                side="left"
                label="Show canvas list"
                ariaKeyshortcuts="/"
                onClick={() => setLeftPaneVisible(true)}
              />
            </div>
          )
        }
        center={<CanvasEditor />}
        leftHeader={
          leftPaneVisible ? (
            <PaneHeader className="justify-between">
              <div className="min-w-0 truncate font-medium text-[color:var(--text-primary)]">Canvas</div>
              <Button
                type="button"
                size="sm"
                variant="solid"
                onClick={handleCreateCanvas}
                className="gap-[var(--space-1)] px-[var(--space-3)]"
              >
                + New
              </Button>
            </PaneHeader>
          ) : undefined
        }
        centerHeader={null}
      />
      <div className="flex items-center gap-[var(--space-3)] border-t border-[color:var(--canvas-toolbar-border)] px-[var(--space-5)] py-[var(--space-3)] text-xs text-[color:var(--canvas-text-secondary)]">
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
