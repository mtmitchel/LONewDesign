"use client";

import React from 'react';
import { Plus, FileText, FolderPlus } from 'lucide-react';
import { TriPane } from '../TriPane';
import { PaneHeader } from '../layout/PaneHeader';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
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
  const [folders, setFolders] = React.useState<NoteFolder[]>(() => mockFolders);
  const [notes, setNotes] = React.useState<Note[]>(() => mockNotes);
  const [selectedItem, setSelectedItem] = React.useState<{id: string, type: 'folder' | 'note'} | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [settings, setSettings] = React.useState<NotesSettings>(DEFAULT_NOTES_SETTINGS);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSavedLabel, setLastSavedLabel] = React.useState<string | undefined>(undefined);
  const [rightPaneVisible, setRightPaneVisible] = React.useState(true);
  const [leftPaneVisible, setLeftPaneVisible] = React.useState(true);
  const [expandFolderRequest, setExpandFolderRequest] = React.useState<string | null>(null);

  // Derived state from new selection model
  const selectedFolderId = selectedItem?.type === 'folder' ? selectedItem.id : null;
  const selectedNoteId = selectedItem?.type === 'note' ? selectedItem.id : null;
  const selectedNote = React.useMemo(() => notes.find(n => n.id === selectedNoteId) ?? null, [notes, selectedNoteId]);

  const applySort = React.useCallback((arr: Note[]): Note[] => {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      const pinnedDiff = Number(!!b.isPinned) - Number(!!a.isPinned);
      if (pinnedDiff !== 0) return pinnedDiff;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    return sorted;
  }, []);

  const filteredNotes = React.useMemo(() => {
    const base = notes.filter(n => {
      // Show notes based on folder selection: if folder selected, show only its notes; if no folder selected, show root notes
      const folderMatch = selectedFolderId ? n.folderId === selectedFolderId : n.folderId === null;
      const searchMatch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return folderMatch && searchMatch;
    });
    return applySort(base);
  }, [notes, selectedFolderId, searchQuery, applySort]);

  const currentFolderName = React.useMemo(
    () => selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name ?? 'Notes' : 'Notes',
    [folders, selectedFolderId]
  );

  // Helper functions
  const generateId = () => String(Date.now() + Math.random());
  const getFolderName = (folderId: string) => folders.find(f => f.id === folderId)?.name ?? 'Unknown Folder';

  // Create folder function
  const createFolder = (parentFolderId?: string | null) => {
    const id = generateId();
    const siblingOrder = folders
      .filter(f => (f.parentId || null) === (parentFolderId || null))
      .reduce((max, f) => Math.max(max, f.order ?? 0), -1) + 1;
    const newFolder: NoteFolder = {
      id,
      name: 'New Folder',
      parentId: parentFolderId || null,
      order: siblingOrder,
      noteCount: 0,
    };
    setFolders(prev => [...prev, newFolder]);
    setSelectedItem({id: newFolder.id, type: 'folder'});
  };

  // Handle folder moving
  const handleMoveFolder = (folderId: string, newParentId: string | null, newIndex: number) => {
    setFolders(prev => {
      // Don't allow moving a folder into itself or its descendants
      const isDescendant = (parentId: string | null | undefined, targetId: string): boolean => {
        if (!parentId) return false;
        if (parentId === targetId) return true;
        const parent = prev.find(f => f.id === parentId);
        return parent ? isDescendant(parent.parentId, targetId) : false;
      };

      if (newParentId && isDescendant(newParentId, folderId)) {
        console.log('Cannot move folder into its own descendant');
        return prev;
      }

      const siblings = prev
        .filter(f => (f.parentId || null) === (newParentId || null) && f.id !== folderId)
        .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
      const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));
      const ids = siblings.map(f => f.id);
      const idx = clampedIndex;
      ids.splice(idx, 0, folderId);
      const orderMap = new Map<string, number>();
      ids.forEach((id, i) => orderMap.set(id, i));

      return prev.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, parentId: newParentId, order: orderMap.get(folderId) ?? 0 };
        }
        if (orderMap.has(folder.id)) {
          return { ...folder, order: orderMap.get(folder.id)! };
        }
        return folder;
      });
    });
  };

  // Create note function with context awareness
  const createNote = (targetFolderId?: string | null) => {
    const id = generateId();
    const now = new Date().toISOString();
    const folderId = targetFolderId !== undefined ? targetFolderId : null; // Always create in root when using + button
    const siblingOrder = notes
      .filter(n => (n.folderId || null) === (folderId || null))
      .reduce((max, n) => Math.max(max, n.order ?? 0), -1) + 1;
    const newNote: Note = {
      id,
      title: 'Untitled Note',
      content: '',
      folderId,
      order: siblingOrder,
      tags: [],
      isStarred: false,
      isPinned: false,
      lastModified: 'just now',
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedItem({id: newNote.id, type: 'note'});
  };

  // Handlers
  const handleSelectNote = (noteId: string) => setSelectedItem({id: noteId, type: 'note'});
  const handleSelectFolder = (folderId: string) => setSelectedItem({id: folderId, type: 'folder'});
  const handleToggleStar = (noteId: string) => {
    setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, isStarred: !n.isStarred } : n)));
  };
  const handleTogglePin = (noteId: string, force?: boolean) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const nextPinned = typeof force === 'boolean' ? force : !n.isPinned;
      return { ...n, isPinned: nextPinned };
    }));
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
    createNote(selectedFolderId);
    if (selectedFolderId) setExpandFolderRequest(selectedFolderId);
  };
  const handleDuplicate = () => {
    if (!selectedNote) return;
    const id = generateId();
    const now = new Date().toISOString();
    const copy: Note = { ...selectedNote, id, createdAt: now, updatedAt: now, title: `${selectedNote.title} (Copy)` };
    setNotes(prev => [copy, ...prev]);
    setSelectedItem({id: copy.id, type: 'note'});
  };
  const handleDelete = () => {
    if (!selectedNote) return;
    setNotes(prev => prev.filter(n => n.id !== selectedNote.id));
    setSelectedItem(null);
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
              notes={notes}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectFolder={handleSelectFolder}
              onSelectNote={handleSelectNote}
              onHidePane={() => setLeftPaneVisible(false)}
              onMoveFolder={handleMoveFolder}
              onCreateNoteAt={(folderId) => createNote(folderId)}
              onCreateFolderAt={(parentId) => createFolder(parentId)}
              expandFolderRequest={expandFolderRequest ?? selectedFolderId}
              onDeleteNote={(noteId) => {
                setNotes(prev => prev.filter(n => n.id !== noteId));
                if (selectedItem?.type === 'note' && selectedItem.id === noteId) setSelectedItem(null);
              }}
              onMoveNote={(noteId, newFolderId, newIndex) => {
                setNotes(prev => {
                  const moving = prev.find(n => n.id === noteId);
                  if (!moving) return prev;
                  const targetId = newFolderId || null;
                  // Build target siblings excluding the moving note, sorted by order
                  const siblings = prev
                    .filter(n => (n.folderId || null) === targetId && n.id !== noteId)
                    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
                  const clampedIndex = Math.max(0, Math.min(newIndex ?? 0, siblings.length));
                  const ids = siblings.map(n => n.id);
                  ids.splice(clampedIndex, 0, noteId);
                  const orderMap = new Map<string, number>();
                  ids.forEach((id, idx) => orderMap.set(id, idx));
                  return prev.map(n => {
                    if (n.id === noteId) {
                      return { ...n, folderId: targetId, order: orderMap.get(noteId) ?? 0 };
                    }
                    if (orderMap.has(n.id)) {
                      return { ...n, order: orderMap.get(n.id)! };
                    }
                    return n;
                  });
                });
                if (newFolderId) {
                  setExpandFolderRequest(newFolderId);
                }
              }}
              onNoteAction={(noteId, action) => {
                switch (action) {
                  case 'rename':
                    console.log('Rename note (left pane):', noteId);
                    break;
                  case 'move':
                    console.log('Move note (left pane):', noteId);
                    break;
                  case 'duplicate': {
                    const original = notes.find(n => n.id === noteId);
                    if (!original) return;
                    const id = generateId();
                    const now = new Date().toISOString();
                    const copy: Note = { ...original, id, createdAt: now, updatedAt: now, title: `${original.title} (Copy)` };
                    setNotes(prev => [copy, ...prev]);
                    setSelectedItem({ id: copy.id, type: 'note' });
                    break;
                  }
                  case 'pin':
                    handleTogglePin(noteId, true);
                    break;
                  case 'unpin':
                    handleTogglePin(noteId, false);
                    break;
                }
              }}
              onRenameNote={(noteId, newTitle) => {
                setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n)));
              }}
              onRenameFolder={(folderId, newName) => {
                setFolders(prev => prev.map(f => (f.id === folderId ? { ...f, name: newName } : f)));
              }}
              onFolderAction={(folderId, action) => {
                switch (action) {
                  case 'rename':
                    console.log('Rename folder:', folderId);
                    break;
                  case 'move':
                    console.log('Move folder:', folderId);
                    break;
                  case 'new-note':
                    createNote(folderId);
                    setExpandFolderRequest(folderId);
                    break;
                  case 'new-subfolder':
                    createFolder(folderId);
                    break;
                  case 'export-pdf':
                    console.log('Export folder as PDF:', folderId);
                    break;
                  case 'export-word':
                    console.log('Export folder as Word:', folderId);
                    break;
                  case 'export-text':
                    console.log('Export folder as Text:', folderId);
                    break;
                  case 'delete': {
                    // Delete folder and all its descendants, plus their notes
                    const collectDescendants = (id: string, acc: Set<string>) => {
                      const children = folders.filter(f => f.parentId === id);
                      for (const child of children) {
                        acc.add(child.id);
                        collectDescendants(child.id, acc);
                      }
                    };
                    const toDelete = new Set<string>([folderId]);
                    collectDescendants(folderId, toDelete);

                    // Clear selection if it points to a deleted folder or a note inside a deleted folder
                    if (selectedItem) {
                      if (selectedItem.type === 'folder' && toDelete.has(selectedItem.id)) {
                        setSelectedItem(null);
                      } else if (selectedItem.type === 'note') {
                        const selNote = notes.find(n => n.id === selectedItem.id);
                        if (selNote && selNote.folderId && toDelete.has(selNote.folderId)) {
                          setSelectedItem(null);
                        }
                      }
                    }

                    setFolders(prev => prev.filter(f => !toDelete.has(f.id)));
                    setNotes(prev => prev.filter(n => !(n.folderId && toDelete.has(n.folderId))));
                    break;
                  }
                  default:
                    console.log('Unknown folder action:', action, folderId);
                }
              }}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" aria-label="Create new content">
                      <Plus size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => createNote(null)}>
                      <FileText className="w-4 h-4 mr-2" />
                      New note
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => createFolder()}>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      New folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              onNoteAction={(noteId, action) => {
                switch (action) {
                  case 'rename':
                    console.log('Rename note:', noteId);
                    break;
                  case 'move':
                    console.log('Move note:', noteId);
                    break;
                  case 'duplicate':
                    handleDuplicate();
                    break;
                case 'pin':
                  handleTogglePin(noteId, true);
                  break;
                case 'unpin':
                  handleTogglePin(noteId, false);
                  break;
                  case 'export-pdf':
                    console.log('Export note as PDF:', noteId);
                    break;
                  case 'export-word':
                    console.log('Export note as Word:', noteId);
                    break;
                  case 'export-text':
                    console.log('Export note as Text:', noteId);
                    break;
                  case 'delete':
                    if (noteId === selectedNoteId) {
                      handleDelete();
                    } else {
                      setNotes(prev => prev.filter(n => n.id !== noteId));
                    }
                    break;
                  default:
                    console.log('Unknown note action:', action, noteId);
                }
              }}
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