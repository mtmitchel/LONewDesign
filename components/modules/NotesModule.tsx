"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import { TriPane } from '../TriPane';
import { PaneHeader } from '../layout/PaneHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  NotesLeftPane,
  NotesCenterPane,
  NotesEditor,
  type Note,
  type NoteFolder,
  type NotesSettings,
  DEFAULT_NOTES_SETTINGS,
  mockFolders,
  mockNotes,
} from './notes';
import { NotesRightPane } from './notes/NotesRightPane';

export function NotesModule() {
  // State management for folders, notes, selections, search, and settings
  const [folders] = React.useState<NoteFolder[]>(() => mockFolders);
  const [notes, setNotes] = React.useState<Note[]>(() => mockNotes);
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(mockFolders[0]?.id ?? null);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(mockNotes[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [settings, setSettings] = React.useState<NotesSettings>(DEFAULT_NOTES_SETTINGS);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSavedLabel, setLastSavedLabel] = React.useState<string | undefined>(undefined);
  const [rightPaneVisible, setRightPaneVisible] = React.useState(true);
  const [leftPaneVisible, setLeftPaneVisible] = React.useState(true);

  const selectedNote = React.useMemo(() => notes.find(n => n.id === selectedNoteId) ?? null, [notes, selectedNoteId]);

  const applySort = React.useCallback((arr: Note[]): Note[] => {
    const sorted = [...arr];
    const { sortBy, sortOrder } = settings;
    const dir = sortOrder === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      if (sortBy === 'modified') {
        const ad = a.updatedAt || a.createdAt || '';
        const bd = b.updatedAt || b.createdAt || '';
        return (new Date(ad).getTime() - new Date(bd).getTime()) * dir;
      }
      if (sortBy === 'created') {
        const ad = a.createdAt || '';
        const bd = b.createdAt || '';
        return (new Date(ad).getTime() - new Date(bd).getTime()) * dir;
      }
      // title or alphabetical
      return a.title.localeCompare(b.title) * dir;
    });
    return sorted;
  }, [settings]);

  const filteredNotes = React.useMemo(() => {
    const base = notes.filter(n =>
      (selectedFolderId ? n.folderId === selectedFolderId : true) &&
      (
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
    return applySort(base);
  }, [notes, selectedFolderId, searchQuery, applySort]);

  const currentFolderName = React.useMemo(
    () => folders.find(f => f.id === selectedFolderId)?.name ?? 'Notes',
    [folders, selectedFolderId]
  );

  // Handlers
  const handleSelectNote = (noteId: string) => setSelectedNoteId(noteId);
  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, isStarred: !n.isStarred } : n)));
  };
  const withSavingTick = () => {
    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setLastSavedLabel('just now');
    }, 400);
  };

  const parseVar = (value: string, fallback: number) => {
    const numeric = parseFloat(value.trim().replace('px', ''));
    return Number.isFinite(numeric) ? numeric : fallback;
  };

  // Keyboard shortcuts: [ ] for left pane, \\ to toggle right pane (matches Mail module)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === '[') {
        e.preventDefault();
        setLeftPaneVisible(false);
      } else if (e.key === ']') {
        e.preventDefault();
        setLeftPaneVisible(true);
      } else if (e.key === '\\') {
        e.preventDefault();
        setRightPaneVisible(!rightPaneVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rightPaneVisible, setLeftPaneVisible, setRightPaneVisible]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const enforceMinimumCenterWidth = () => {
      const leftWidth = leftPaneVisible
        ? parseVar(getComputedStyle(root).getPropertyValue('--tripane-left-width'), 280)
        : 0;
      const rightWidth = rightPaneVisible
        ? parseVar(getComputedStyle(root).getPropertyValue('--quick-panel-width'), 320)
        : 0;
      const centerMin = parseVar(getComputedStyle(root).getPropertyValue('--tripane-center-min'), 400);
      const requiredWidth = leftWidth + rightWidth + centerMin;

      if (window.innerWidth < requiredWidth) {
        if (rightPaneVisible) {
          setRightPaneVisible(false);
          return;
        }

        if (leftPaneVisible) {
          setLeftPaneVisible(false);
        }
      }
    };

    enforceMinimumCenterWidth();
    window.addEventListener('resize', enforceMinimumCenterWidth);
    return () => window.removeEventListener('resize', enforceMinimumCenterWidth);
  }, [leftPaneVisible, rightPaneVisible, setLeftPaneVisible, setRightPaneVisible]);

  const leftPaneComputedWidth = React.useMemo(() => {
    if (typeof window === 'undefined') return 'var(--tripane-left-width)';
    const root = document.documentElement;
    return leftPaneVisible
      ? getComputedStyle(root).getPropertyValue('--tripane-left-width')
      : '8px'; // collapsed thin bar width
  }, [leftPaneVisible]);

  const rightPaneComputedWidth = React.useMemo(() => {
    if (typeof window === 'undefined') return 'var(--quick-panel-width)';
    const root = document.documentElement;
    return rightPaneVisible
      ? getComputedStyle(root).getPropertyValue('--quick-panel-width')
      : '8px'; // collapsed thin bar width
  }, [rightPaneVisible]);

  const handleContentChange = (value: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, content: value, updatedAt: new Date().toISOString() } : n)));
    withSavingTick();
  };

  const handleTitleChange = (value: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, title: value, updatedAt: new Date().toISOString() } : n)));
    withSavingTick();
  };
  const handleCreateNote = () => {
    const id = String(Date.now());
    const now = new Date().toISOString();
    const folder = selectedFolderId ?? folders[0]?.id ?? 'inbox';
    const newNote: Note = {
      id,
      title: 'Untitled note',
      content: '',
      folderId: folder,
      tags: [],
      isStarred: false,
      lastModified: 'just now',
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(id);
  };
  const handleDuplicate = () => {
    if (!selectedNote) return;
    const id = String(Date.now());
    const now = new Date().toISOString();
    const copy: Note = { ...selectedNote, id, createdAt: now, updatedAt: now, title: `${selectedNote.title} (Copy)` };
    setNotes(prev => [copy, ...prev]);
    setSelectedNoteId(id);
  };
  const handleDelete = () => {
    if (!selectedNote) return;
    setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
    setSelectedNoteId(null);
  };
  const handleTagAdd = (tag: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, tags: n.tags.includes(tag) ? n.tags : [...n.tags, tag] } : n)));
  };
  const handleTagRemove = (tag: string) => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => (n.id === selectedNoteId ? { ...n, tags: n.tags.filter(t => t !== tag) } : n)));
  };

  return (
    <div id="notes-viewport" className="h-full">
      <TriPane
        leftWidth={leftPaneComputedWidth}
        rightWidth={rightPaneComputedWidth}
        left={
          leftPaneVisible ? (
            <NotesLeftPane
              folders={folders}
              selectedFolderId={selectedFolderId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectFolder={setSelectedFolderId}
              onHidePane={() => setLeftPaneVisible(false)}
              className="w-[var(--tripane-left-width)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setLeftPaneVisible(true)}
              aria-label="Show notes sidebar"
              title="Show notes sidebar (])"
              aria-keyshortcuts="]"
              className="group h-full w-2 min-w-[8px] max-w-[8px] bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:bg-[var(--primary-tint-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
            >
              <span
                aria-hidden="true"
                className="text-[var(--caret-rest)] text-base leading-none transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] motion-safe:transition-all group-hover:text-[var(--caret-hover)] group-hover:scale-110"
              >
                ›
              </span>
            </button>
          )
        }
        leftHeader={
          leftPaneVisible ? (
            <PaneHeader className="px-[var(--space-4)]">
              <div className="flex w-full items-center justify-between">
                <h2 className="text-[var(--text-lg)] font-semibold">Notes</h2>
                <Button size="sm" onClick={handleCreateNote} aria-label="Create new note">
                  <Plus size={14} />
                </Button>
              </div>
            </PaneHeader>
          ) : undefined
        }
        center={
          selectedNote ? (
            <NotesEditor
              content={selectedNote.content}
              onContentChange={handleContentChange}
              onToolbarAction={() => {}}
              isSaving={isSaving}
              lastSavedLabel={lastSavedLabel}
              autoSaveEnabled={settings.autoSave}
            />
          ) : (
            <NotesCenterPane
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              settings={{
                showPreview: settings.showPreview,
                showWordCount: settings.showWordCount,
                compactView: settings.compactView,
              }}
              onSelectNote={handleSelectNote}
              onToggleStar={handleToggleStar}
              onCreateNote={handleCreateNote}
            />
          )
        }
        centerHeader={
          <PaneHeader className="px-[var(--space-4)]">
            <div className="flex w-full items-center justify-between">
              {selectedNote ? (
                <Input
                  value={selectedNote.title}
                  onChange={event => handleTitleChange(event.target.value)}
                  placeholder="Untitled note"
                  className="h-auto border-none bg-transparent p-0 text-lg font-semibold text-[var(--text-primary)] focus-visible:ring-0"
                />
              ) : (
                <h3 className="font-semibold truncate">{currentFolderName}</h3>
              )}
            </div>
          </PaneHeader>
        }
        right={
          rightPaneVisible ? (
            <NotesRightPane
              onHidePane={() => setRightPaneVisible(false)}
              className="w-[var(--quick-panel-width)]"
              settings={settings}
              onSettingsChange={updates => setSettings(prev => ({ ...prev, ...updates }))}
            />
          ) : (
            <button
              type="button"
              onClick={() => setRightPaneVisible(true)}
              aria-label="Show context"
              title="Show context (\\)"
              aria-keyshortcuts="\\"
              className="group h-full w-2 min-w-[8px] max-w-[8px] bg-[var(--bg-surface-elevated)] shadow-[-1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer motion-safe:transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] hover:bg-[var(--primary-tint-5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(51,65,85,0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
            >
              <span
                aria-hidden="true"
                className="text-[var(--caret-rest)] text-base leading-none transition-all duration-[var(--duration-base)] ease-[var(--easing-standard)] motion-safe:transition-all group-hover:text-[var(--caret-hover)] group-hover:scale-110"
              >
                ‹
              </span>
            </button>
          )
        }
      />
    </div>
  );
}