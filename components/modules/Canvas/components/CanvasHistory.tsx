import React, { useCallback, useMemo, useRef } from 'react';
import { HistoryEntry } from '../runtime/features/stores/modules/historyModule';
import { useUnifiedCanvasStore } from '../runtime/features/stores/unifiedCanvasStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { Clock, History } from 'lucide-react';
import { cn } from '../../../ui/utils';

const formatter = () =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

function resolveLabel(entry: HistoryEntry | undefined, index: number): string {
  if (!entry) return `Snapshot ${index + 1}`;
  if (entry.label && entry.label.trim().length > 0) {
    return entry.label;
  }
  if (entry.mergeKey && entry.mergeKey.trim().length > 0) {
    return entry.mergeKey;
  }
  return `Snapshot ${index + 1}`;
}

export function CanvasHistory() {
  const entries = useUnifiedCanvasStore((state) => state.entries ?? []);
  const activeIndex = useUnifiedCanvasStore((state) => state.index ?? -1);
  const canUndo = useUnifiedCanvasStore((state) => state.canUndo?.() ?? false);
  const canRedo = useUnifiedCanvasStore((state) => state.canRedo?.() ?? false);
  const timeFormatter = useMemo(() => formatter(), []);
  const listRef = useRef<HTMLDivElement>(null);

  const handleJumpToIndex = useCallback((targetIndex: number) => {
    const store = useUnifiedCanvasStore.getState();
    if (targetIndex === (store.index ?? -1)) return;
    const undo = store.undo;
    const redo = store.redo;

    if (!undo || !redo) return;

    // Decide direction and step until target index is reached
    let currentIndex = store.index ?? -1;
    const step = targetIndex < currentIndex ? -1 : 1;

    while (currentIndex !== targetIndex) {
      if (step === -1) {
        if (!store.canUndo?.() || !undo) break;
        undo();
      } else {
        if (!store.canRedo?.() || !redo) break;
        redo();
      }
      currentIndex = useUnifiedCanvasStore.getState().index ?? -1;
    }
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    const target = event.currentTarget.dataset.historyIndex;
    if (!target) return;
    const current = Number(target);

    if (event.key === 'ArrowDown' || event.key === 'j') {
      event.preventDefault();
      const next = Math.min(entries.length - 1, current + 1);
      const nextButton = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-history-index="${next}"]`
      );
      nextButton?.focus();
    }

    if (event.key === 'ArrowUp' || event.key === 'k') {
      event.preventDefault();
      const prev = Math.max(0, current - 1);
      const prevButton = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-history-index="${prev}"]`
      );
      prevButton?.focus();
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const first = listRef.current?.querySelector<HTMLButtonElement>('button[data-history-index="0"]');
      first?.focus();
    }

    if (event.key === 'End') {
      event.preventDefault();
      const last = listRef.current?.querySelector<HTMLButtonElement>(
        `button[data-history-index="${entries.length - 1}"]`
      );
      last?.focus();
    }
  }, [entries.length]);

  return (
    <Card className="flex h-full flex-col border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface-elevated)] shadow-canvas-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-[var(--space-3)] border-b border-[color:var(--canvas-toolbar-border)] bg-[color:var(--canvas-surface-alt)] py-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <History className="h-5 w-5 text-[color:var(--canvas-text-secondary)]" aria-hidden />
          <CardTitle className="text-sm font-medium text-[color:var(--canvas-text-primary)]">
            History
          </CardTitle>
        </div>
        <div className="flex items-center gap-[var(--space-2)] text-xs text-[color:var(--canvas-text-secondary)]">
          <span className={cn(!canUndo && 'opacity-60')}>Undo</span>
          <Separator orientation="vertical" className="h-4 bg-[color:var(--canvas-toolbar-border)]" />
          <span className={cn(!canRedo && 'opacity-60')}>Redo</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-0 py-0">
        <ScrollArea className="h-full">
          <div
            ref={listRef}
            role="listbox"
            aria-label="Canvas history entries"
            className="flex flex-col"
          >
            {entries.length === 0 && (
              <div className="px-[var(--space-4)] py-[var(--space-5)] text-sm text-[color:var(--canvas-text-secondary)]">
                No history yet. Start drawing or editing elements to record checkpoints.
              </div>
            )}
            {entries.map((entry, index) => {
              const isActive = index === activeIndex;
              const timestamp = entry?.ts ? timeFormatter.format(entry.ts) : undefined;
              const label = resolveLabel(entry, index);

              return (
                <Button
                  key={entry?.id ?? index}
                  variant="ghost"
                  size="sm"
                  data-history-index={index}
                  role="option"
                  aria-pressed={isActive}
                  aria-selected={isActive}
                  onClick={() => handleJumpToIndex(index)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    'group flex w-full items-center justify-between gap-[var(--space-3)] rounded-none border-b border-[color:var(--canvas-toolbar-border)] px-[var(--space-4)] py-[var(--space-3)] font-normal transition-colors',
                    isActive
                      ? 'bg-[color:var(--canvas-accent-indigo)]/10 text-[color:var(--canvas-text-primary)]'
                      : 'text-[color:var(--canvas-text-secondary)] hover:bg-[color:var(--canvas-toolbar-bg)] hover:text-[color:var(--canvas-text-primary)]'
                  )}
                >
                  <span className="truncate text-sm font-medium">{label}</span>
                  {timestamp && (
                    <span className="flex shrink-0 items-center gap-[var(--space-1)] text-xs">
                      <Clock className="h-3.5 w-3.5 text-[color:var(--canvas-text-secondary)]" aria-hidden />
                      {timestamp}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default CanvasHistory;
