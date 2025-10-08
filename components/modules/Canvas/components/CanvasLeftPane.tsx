import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Braces,
  FileDown,
  FileText,
  FileType,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
} from 'lucide-react';
import { Input } from '../../../ui/input';
import { PaneCaret, PaneFooter } from '../../../dev/PaneCaret';
import { cn } from '../../../ui/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../ui/context-menu';
import { useCanvasProjectsStore } from '../state/canvasProjectsStore';
import type { CanvasProject } from '../state/canvasProjectsStore';
import type { CanvasSnapshot } from '../state/canvasSnapshots';
import type { CanvasElement } from '../types';

const ACTIVE_ROW_CLASS =
  'bg-[var(--primary)] text-white shadow-[inset_0_0_0_1px_hsla(0,0%,100%,0.18)]';
const HOVER_ROW_CLASS = 'hover:bg-[var(--primary-tint-10)]';

export type CanvasLeftPaneHandle = {
  focusSearch: () => void;
};

interface CanvasLeftPaneProps {
  onHidePane?: () => void;
  className?: string;
}

interface CanvasProjectRow {
  id: string;
  title: string;
  updatedAt: string;
  pinned: boolean;
}

type CanvasExportFormat = 'text' | 'markdown' | 'json' | 'pdf';

export const CanvasLeftPane = React.forwardRef<CanvasLeftPaneHandle, CanvasLeftPaneProps>(
  function CanvasLeftPane({ onHidePane, className }, ref) {
    const projects = useCanvasProjectsStore((state) => state.projects);
    const activeId = useCanvasProjectsStore((state) => state.activeId);
    const selectProject = useCanvasProjectsStore((state) => state.selectProject);
    const renameProject = useCanvasProjectsStore((state) => state.renameProject);
    const togglePinned = useCanvasProjectsStore((state) => state.togglePinned);
    const deleteProject = useCanvasProjectsStore((state) => state.deleteProject);
    const touchActiveSnapshot = useCanvasProjectsStore((state) => state.touchActiveSnapshot);

    const [query, setQuery] = useState('');
    const [activeListIndex, setActiveListIndex] = useState(0);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [draftTitle, setDraftTitle] = useState('');

    const searchRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
    const editInputRef = useRef<HTMLInputElement | null>(null);
  const skipCommitRef = useRef(false);

    const rows = useMemo<CanvasProjectRow[]>(
      () =>
        projects.map((project: CanvasProject) => ({
          id: project.id,
          title: project.title,
          updatedAt: project.updatedAt,
          pinned: Boolean(project.pinned),
        })),
      [projects]
    );

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return rows;
      return rows.filter((project) => project.title.toLowerCase().includes(q));
    }, [rows, query]);

    useEffect(() => {
      if (!editingProjectId) return;
      const stillVisible = filtered.some((project) => project.id === editingProjectId);
      if (!stillVisible) {
        setEditingProjectId(null);
        setDraftTitle('');
      }
    }, [editingProjectId, filtered]);

    useEffect(() => {
      const nextIndex = filtered.findIndex((project) => project.id === activeId);
      setActiveListIndex(nextIndex >= 0 ? nextIndex : 0);
    }, [activeId, filtered]);

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

    useEffect(() => {
      if (!editingProjectId) return;
      const node = editInputRef.current;
      if (!node) return;
      node.focus();
      node.select();
    }, [editingProjectId]);

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
        if (editingProjectId) return;
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
          const project = filtered[activeListIndex];
          if (project) {
            selectProject(project.id);
          }
        }
      },
      [activeListIndex, editingProjectId, filtered, focusRow, selectProject]
    );

    const commitEditing = useCallback(
      (projectId?: string) => {
        if (skipCommitRef.current) {
          skipCommitRef.current = false;
          return;
        }

        const targetId = projectId ?? editingProjectId;
        if (!targetId) {
          return;
        }

        const trimmed = draftTitle.trim();
        const nextTitle = trimmed || 'Untitled canvas';

        const latestState = useCanvasProjectsStore.getState();
        const project = latestState.projects.find((item) => item.id === targetId);

        if (project && project.title !== nextTitle) {
          renameProject(targetId, nextTitle);
        }

        setEditingProjectId(null);
        setDraftTitle('');
        editInputRef.current = null;
      },
      [draftTitle, editingProjectId, renameProject]
    );

    const cancelEditing = useCallback(() => {
      skipCommitRef.current = true;
      setEditingProjectId(null);
      setDraftTitle('');
      editInputRef.current = null;
    }, []);

    const handleTogglePin = useCallback(
      (projectId: string) => {
        if (editingProjectId === projectId) {
          commitEditing(projectId);
        }
        togglePinned(projectId);
      },
      [commitEditing, editingProjectId, togglePinned]
    );

    const handleRename = useCallback(
      (projectId: string) => {
        if (editingProjectId) {
          if (editingProjectId === projectId) {
            const node = editInputRef.current;
            node?.focus();
            node?.select();
            return;
          }
          commitEditing();
        }

        const latestState = useCanvasProjectsStore.getState();
        const project = latestState.projects.find((item) => item.id === projectId);
        const currentTitle = project?.title ?? 'Untitled canvas';

        setEditingProjectId(projectId);
        setDraftTitle(currentTitle);

        const nextIndex = filtered.findIndex((item) => item.id === projectId);
        if (nextIndex >= 0) {
          focusRow(nextIndex);
        }
      },
      [commitEditing, editingProjectId, filtered, focusRow]
    );

    const handleExport = useCallback(
      (projectId: string, format: CanvasExportFormat) => {
        if (typeof window === 'undefined') return;
        if (editingProjectId === projectId) {
          commitEditing(projectId);
        }
        if (projectId === activeId) {
          touchActiveSnapshot();
        }

        const latestState = useCanvasProjectsStore.getState();
        const project = latestState.projects.find((item) => item.id === projectId);
        if (!project) return;

        const snapshot = project.snapshot;
        if (!snapshot) {
          window.alert?.('No saved snapshot for this canvas yet. Make a change first.');
          return;
        }

        const filenameBase = sanitizeFilename(project.title || 'canvas');

        if (format === 'text') {
          const content = buildTextExport(project, snapshot);
          downloadContent(`${filenameBase}.txt`, content, 'text/plain;charset=utf-8');
          return;
        }

        if (format === 'markdown') {
          const content = buildMarkdownExport(project, snapshot);
          downloadContent(`${filenameBase}.md`, content, 'text/markdown;charset=utf-8');
          return;
        }

        if (format === 'json') {
          const content = buildJsonExport(project, snapshot);
          downloadContent(`${filenameBase}.json`, content, 'application/json;charset=utf-8');
          return;
        }

        if (format === 'pdf') {
          const printable = buildTextExport(project, snapshot);
          openPrintPreview(project.title, printable);
        }
      },
      [activeId, commitEditing, editingProjectId, touchActiveSnapshot]
    );

    const handleDelete = useCallback(
      (projectId: string) => {
        if (typeof window !== 'undefined') {
          const project = useCanvasProjectsStore.getState().projects.find((item) => item.id === projectId);
          const confirmed = window.confirm(
            `Delete “${project?.title ?? 'Untitled canvas'}”? This cannot be undone.`
          );
          if (!confirmed) {
            return;
          }
        }
        if (editingProjectId === projectId) {
          cancelEditing();
        }
        deleteProject(projectId);
      },
      [cancelEditing, deleteProject, editingProjectId]
    );

    const renderEmptyState = () => (
      <div className="px-[var(--space-4)] py-[var(--space-5)] text-sm text-[color:var(--text-tertiary)]">
        No canvases yet. Use “+ New” to create your first canvas.
      </div>
    );

    return (
      <div
        id="canvas-projects-pane"
        className={cn('flex h-full flex-col bg-[var(--bg-surface)]', className)}
      >
        <div className="px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-[var(--space-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-tertiary)]" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search canvases"
              className="h-[var(--field-height)] bg-[var(--bg-surface)] border border-[var(--border-default)] pl-10 placeholder:text-[color:var(--text-tertiary)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
            />
          </div>
        </div>
        <div
          ref={listRef}
          role="listbox"
          aria-label="Canvas list"
          aria-activedescendant={
            filtered[activeListIndex] ? `canvas-project-${filtered[activeListIndex].id}` : undefined
          }
          className="flex-1 overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
          {!filtered.length ? (
            renderEmptyState()
          ) : (
            <div className="space-y-[var(--space-1)] px-[var(--space-4)] pb-[var(--space-4)]">
              {filtered.map((project, index) => {
                const isActive = project.id === activeId;
                const isFocused = index === activeListIndex;
                const isEditing = editingProjectId === project.id;

                return (
                  <ContextMenu key={project.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        id={`canvas-project-${project.id}`}
                        role="option"
                        aria-selected={isActive}
                        tabIndex={isFocused ? 0 : -1}
                        ref={(node) => {
                          itemRefs.current[index] = node;
                        }}
                        onFocus={() => focusRow(index)}
                        onContextMenu={() => focusRow(index)}
                        onClick={() => {
                          if (editingProjectId && editingProjectId !== project.id) {
                            commitEditing();
                          }
                          focusRow(index);
                          selectProject(project.id);
                        }}
                        onDoubleClick={() => handleRename(project.id)}
                        className={cn(
                          'group relative flex min-h-[var(--list-row-min-h)] items-center rounded-[var(--radius-md)] border border-transparent px-[var(--list-row-pad-x)] py-[var(--space-2-5,10px)] cursor-pointer motion-safe:transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                          isActive ? ACTIVE_ROW_CLASS : HOVER_ROW_CLASS
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-[var(--space-2)]">
                          {isEditing ? (
                            <input
                              ref={(node) => {
                                if (isEditing) {
                                  editInputRef.current = node;
                                }
                              }}
                              value={draftTitle}
                              onChange={(event) => setDraftTitle(event.target.value)}
                              onBlur={() => commitEditing(project.id)}
                              onKeyDown={(event) => {
                                event.stopPropagation();
                                if (event.key === 'Enter' || event.key === 'Tab') {
                                  event.preventDefault();
                                  commitEditing(project.id);
                                } else if (event.key === 'Escape') {
                                  event.preventDefault();
                                  cancelEditing();
                                }
                              }}
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => event.stopPropagation()}
                              onFocus={() => focusRow(index)}
                              placeholder="Untitled canvas"
                              aria-label="Edit canvas name"
                              className={cn(
                                'flex-1 min-w-0 rounded-[var(--radius-sm)] border border-transparent bg-transparent px-[var(--space-1)] py-[3px] text-[length:var(--list-row-font)] font-medium leading-tight placeholder:text-[color:var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-0',
                                isActive
                                  ? 'text-white placeholder:text-white/60 focus-visible:ring-white/70'
                                  : 'text-[color:var(--text-primary)]'
                              )}
                              spellCheck={false}
                              autoComplete="off"
                            />
                          ) : (
                            <div
                              className={cn(
                                'flex-1 truncate text-[length:var(--list-row-font)] font-medium text-[color:var(--text-primary)]',
                                isActive && 'text-white'
                              )}
                            >
                              {project.title}
                            </div>
                          )}
                          {project.pinned ? (
                            <Pin
                              className={cn(
                                'h-3.5 w-3.5 text-[color:var(--text-tertiary)] transition-colors group-hover:text-[color:var(--text-primary)]',
                                isActive && 'text-white/90 group-hover:text-white'
                              )}
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                      <ContextMenuItem onSelect={() => handleTogglePin(project.id)}>
                        {project.pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                        {project.pinned ? 'Unpin' : 'Pin'}
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleRename(project.id)}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => handleExport(project.id, 'text')}>
                        <FileText className="mr-2 h-4 w-4" /> Export as Text
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleExport(project.id, 'markdown')}>
                        <FileType className="mr-2 h-4 w-4" /> Export as Markdown
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleExport(project.id, 'json')}>
                        <Braces className="mr-2 h-4 w-4" /> Export as JSON
                      </ContextMenuItem>
                      <ContextMenuItem onSelect={() => handleExport(project.id, 'pdf')}>
                        <FileDown className="mr-2 h-4 w-4" /> Export as PDF
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onSelect={() => handleDelete(project.id)} variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </div>
        {onHidePane ? (
          <PaneFooter>
            <PaneCaret
              side="right"
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

function sanitizeFilename(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)+/g, '')
    .trim() || 'canvas';
}

function downloadContent(filename: string, content: string, mimeType: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildTextExport(project: CanvasProject, snapshot: CanvasSnapshot) {
  const lines = [
    `Canvas: ${project.title}`,
    `Updated: ${formatTimestamp(snapshot.updatedAt)}`,
    `Elements:`,
    ...summarizeElements(snapshot),
  ];
  return lines.join('\n');
}

function buildMarkdownExport(project: CanvasProject, snapshot: CanvasSnapshot) {
  const lines = [
    `# ${project.title}`,
    '',
    `**Updated:** ${formatTimestamp(snapshot.updatedAt)}`,
    '',
    '## Elements',
    ...summarizeElements(snapshot).map((line) => `- ${line}`),
  ];
  return lines.join('\n');
}

function buildJsonExport(project: CanvasProject, snapshot: CanvasSnapshot) {
  const payload = {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    pinned: Boolean(project.pinned),
    snapshot,
  };
  return JSON.stringify(payload, null, 2);
}

function summarizeElements(snapshot: CanvasSnapshot) {
  const order = snapshot.elementOrder ?? [];
  const elementEntries = snapshot.elements ?? [];
  const elementMap = new Map(elementEntries);
  const lines = order.map((id, index) => {
    const element = elementMap.get(id) as CanvasElement | undefined;
    const type = element?.type ?? 'unknown';
    const detail = extractElementDetail(element);
    return `${index + 1}. ${type}${detail ? ` — ${detail}` : ''}`;
  });
  return lines.length ? lines : ['(empty canvas)'];
}

function extractElementDetail(element?: CanvasElement) {
  if (!element) return '';
  if (element.text && element.text.trim()) {
    return truncate(element.text.trim());
  }
  const data = element.data;
  if (data && typeof data === 'object') {
    const maybeTitle = (data as { title?: string }).title;
    if (typeof maybeTitle === 'string' && maybeTitle.trim()) {
      return truncate(maybeTitle.trim());
    }
  }
  return '';
}

function truncate(value: string, maxLength = 80) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function formatTimestamp(iso: string | undefined) {
  if (!iso) return 'Unknown';
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;
  return new Date(timestamp).toLocaleString();
}

function openPrintPreview(title: string, content: string) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return;
  const escapedContent = escapeHtml(content);
  printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} – Canvas Export</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #1f2937; background: #fff; }
    pre { white-space: pre-wrap; word-break: break-word; }
    h1 { margin-top: 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapedContent}</pre>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

CanvasLeftPane.displayName = 'CanvasLeftPane';

export default CanvasLeftPane;
