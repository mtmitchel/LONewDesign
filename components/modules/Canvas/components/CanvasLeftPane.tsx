import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../ui/input';
import { PaneCaret, PaneFooter } from '../../../dev/PaneCaret';
import { cn } from '../../../ui/utils';
import { useUnifiedCanvasStore } from '../runtime/features/stores/unifiedCanvasStore';
import type { HistoryEntry } from '../runtime/features/stores/modules/historyModule';

const ACTIVE_ROW_CLASS =
  'bg-[var(--primary)] text-white shadow-[inset_0_0_0_1px_hsla(0,0%,100%,0.18)]';
const HOVER_ROW_CLASS = 'hover:bg-[var(--primary-tint-10)]';

function resolveLabel(entry: HistoryEntry | undefined, index: number): string {
  if (!entry) return `Untitled canvas ${index + 1}`;
  if (entry.label && entry.label.trim().length > 0) {
    return entry.label;
  }
  if (entry.mergeKey && entry.mergeKey.trim().length > 0) {
    return entry.mergeKey;
  }
  return `Untitled canvas ${index + 1}`;
}

function jumpToHistoryIndex(targetIndex: number) {
  const store = useUnifiedCanvasStore.getState();
  const undo = store.undo;
  const redo = store.redo;

  if (!undo || !redo) return;

  let currentIndex = store.index ?? -1;
  if (targetIndex === currentIndex) return;

  const step = targetIndex < currentIndex ? -1 : 1;

  while (currentIndex !== targetIndex) {
    if (step === -1) {
      if (!store.canUndo?.()) break;
      undo();
    } else {
      if (!store.canRedo?.()) break;
      redo();
    }
    currentIndex = useUnifiedCanvasStore.getState().index ?? -1;
  }
}

interface CanvasSnapshotRow {
  id: string;
  index: number;
  label: string;
}

export type CanvasLeftPaneHandle = {
  focusSearch: () => void;
};

interface CanvasLeftPaneProps {
  onHidePane?: () => void;
  className?: string;
}

export const CanvasLeftPane = React.forwardRef<CanvasLeftPaneHandle, CanvasLeftPaneProps>(
  function CanvasLeftPane({ onHidePane, className }, ref) {
    const entries = useUnifiedCanvasStore(state => state.entries ?? []);
    const activeHistoryIndex = useUnifiedCanvasStore(state => state.index ?? -1);

    const [query, setQuery] = useState('');
    const [activeListIndex, setActiveListIndex] = useState(0);

    const searchRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

    const snapshots = useMemo<CanvasSnapshotRow[]>(
      () =>
        entries.map((entry, index) => ({
          id: entry?.id ?? `${index}`,
          index,
          label: resolveLabel(entry, index),
        })),
      [entries]
    );

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return snapshots;
      return snapshots.filter(snapshot => snapshot.label.toLowerCase().includes(q));
    }, [snapshots, query]);

    useEffect(() => {
      const nextIndex = filtered.findIndex(snapshot => snapshot.index === activeHistoryIndex);
      setActiveListIndex(nextIndex >= 0 ? nextIndex : 0);
    }, [activeHistoryIndex, filtered]);

    useEffect(() => {
      const node = itemRefs.current[activeListIndex];
      if (node && node !== document.activeElement) {
        node.focus();
      }
    }, [activeListIndex, filtered.length]);

    useImperativeHandle(ref, () => ({
      focusSearch: () => {
        searchRef.current?.focus();
        searchRef.current?.select();
      },
    }));

    const focusRow = useCallback(
      (nextIndex: number) => {
        if (!filtered.length) return;
        const clamped = Math.max(0, Math.min(nextIndex, filtered.length - 1));
        setActiveListIndex(clamped);
      },
      [filtered.length]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!filtered.length) return;

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusRow(activeListIndex + 1);
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          focusRow(activeListIndex - 1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          focusRow(0);
        } else if (event.key === 'End') {
          event.preventDefault();
          focusRow(filtered.length - 1);
        } else if (event.key === 'Enter') {
          const snapshot = filtered[activeListIndex];
          if (snapshot) {
            jumpToHistoryIndex(snapshot.index);
          }
        }
      },
      [activeListIndex, filtered, focusRow]
    );

    const renderEmptyState = () => (
      <div className="px-[var(--space-4)] py-[var(--space-5)] text-sm text-[color:var(--text-tertiary)]">
        No history yet. Start drawing to create snapshots.
      </div>
    );

    return (
      <div
        id="canvas-history-pane"
        className={cn('flex h-full flex-col bg-[var(--bg-surface)]', className)}
      >
        <div className="px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-[var(--space-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-tertiary)]" />
            <Input
              ref={searchRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search canvases"
              className="h-[var(--field-height)] bg-[var(--bg-surface)] border border-[var(--border-default)] pl-10 placeholder:text-[color:var(--text-tertiary)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
            />
          </div>
        </div>
        <div
          ref={listRef}
          role="listbox"
          aria-label="Canvas history snapshots"
          aria-activedescendant={
            filtered[activeListIndex] ? `canvas-history-${filtered[activeListIndex].id}` : undefined
          }
          className="flex-1 overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
          {!filtered.length ? (
            renderEmptyState()
          ) : (
            <div className="space-y-[var(--space-1)] px-[var(--space-4)] pb-[var(--space-4)]">
              {filtered.map((snapshot, index) => {
                const isActive = snapshot.index === activeHistoryIndex;
                const isFocused = index === activeListIndex;

                return (
                  <div
                    key={snapshot.id}
                    id={`canvas-history-${snapshot.id}`}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={isFocused ? 0 : -1}
                    ref={node => {
                      itemRefs.current[index] = node;
                    }}
                    onFocus={() => focusRow(index)}
                    onClick={() => {
                      focusRow(index);
                      jumpToHistoryIndex(snapshot.index);
                    }}
                    className={cn(
                      'group relative flex min-h-[var(--list-row-min-h)] items-center rounded-[var(--radius-md)] border border-transparent px-[var(--list-row-pad-x)] py-[var(--space-2-5,10px)] cursor-pointer motion-safe:transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                      isActive ? ACTIVE_ROW_CLASS : HOVER_ROW_CLASS
                    )}
                  >
                    <div
                      className={cn(
                        'truncate text-[length:var(--list-row-font)] font-medium text-[color:var(--text-primary)]',
                        isActive && 'text-white'
                      )}
                    >
                      {snapshot.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {onHidePane ? (
          <PaneFooter>
            <PaneCaret
              side="left"
              label="Hide canvas list"
              ariaKeyshortcuts="/"
              onClick={onHidePane}
              variant="button"
            />
          </PaneFooter>
        ) : null}
      </div>
    );
  }
);

CanvasLeftPane.displayName = 'CanvasLeftPane';

export default CanvasLeftPane;
