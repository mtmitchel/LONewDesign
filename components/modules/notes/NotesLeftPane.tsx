"use client";

// #region Imports
import React, { useMemo, useState } from 'react';
import type { Note, NoteFolder } from './types';

// Import modular components from left-pane
import { NotebookList, Filters, FolderTreeItem, useFolderTree } from './left-pane';



import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';

// #region Constants & Utilities
export const compareNotesByPinned = (a: Note, b: Note) => {
  const pinnedDiff = Number(!!b.isPinned) - Number(!!a.isPinned);
  if (pinnedDiff !== 0) return pinnedDiff;
  return (a.order ?? 0) - (b.order ?? 0);
};



export type FolderAction = 'rename' | 'move' | 'new-note' | 'new-subfolder' | 'export-pdf' | 'export-word' | 'export-text' | 'delete';

// #region Types & Interfaces
interface NotesLeftPaneProps {
  folders: NoteFolder[];
  notes: Note[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onHidePane: () => void;
  onFolderAction?: (folderId: string, action: FolderAction) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null, newIndex: number) => void;
  onCreateNoteAt?: (folderId: string | null) => void;
  onCreateFolderAt?: (parentId: string | null) => void;
  expandFolderRequest?: string | null;
  onDeleteNote?: (noteId: string) => void;
  onNoteAction?: (noteId: string, action: 'rename' | 'move' | 'duplicate' | 'pin' | 'unpin') => void;
  onRenameNote?: (noteId: string, newTitle: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMoveNote?: (noteId: string, newFolderId: string | null, newIndex: number) => void;
  className?: string;
}

// #region Main Component
// NotesLeftPane - Main navigation component for notes module
// Handles folder tree, note listing, search, drag-drop, and context menus
export function NotesLeftPane({ folders, notes, selectedFolderId, selectedNoteId, searchQuery, onSearchChange, onSelectFolder, onSelectNote, onHidePane, onFolderAction, onMoveFolder, onCreateNoteAt, onCreateFolderAt, expandFolderRequest, onDeleteNote, onNoteAction, onRenameNote, onRenameFolder, onMoveNote, className }: NotesLeftPaneProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['work'])); // Start with 'work' expanded
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ folderId: string; position: 'above' | 'below' | 'inside' } | null>(null);
  const [rootNoteDrop, setRootNoteDrop] = useState<{ noteId: string; position: 'above' | 'below' } | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderValue, setEditingFolderValue] = useState('');

  const handleFolderAction = (folderId: string, action: FolderAction) => {
    if (onFolderAction) {
      onFolderAction(folderId, action);
    } else {
      console.log(`Folder action: ${action} on folder ${folderId}`);
    }
  };

  const beginNoteRename = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    setEditingFolderId(null);
    setEditingNoteId(noteId);
    setEditingNoteValue(note.title ?? '');
    onSelectNote(noteId);
  };

  const commitNoteRename = (noteId: string) => {
    if (editingNoteId !== noteId) return;
    const trimmed = editingNoteValue.trim();
    if (trimmed && onRenameNote) {
      onRenameNote(noteId, trimmed);
    }
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const cancelNoteRename = () => {
    setEditingNoteId(null);
    setEditingNoteValue('');
  };

  const beginFolderRename = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    setEditingNoteId(null);
    setEditingFolderId(folderId);
    setEditingFolderValue(folder.name ?? '');
    onSelectFolder(folderId);
  };

  const commitFolderRename = (folderId: string) => {
    if (editingFolderId !== folderId) return;
    const trimmed = editingFolderValue.trim();
    if (trimmed && onRenameFolder) {
      onRenameFolder(folderId, trimmed);
    }
    setEditingFolderId(null);
    setEditingFolderValue('');
  };

  const cancelFolderRename = () => {
    setEditingFolderId(null);
    setEditingFolderValue('');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderDoubleClick = (folderId: string) => {
    toggleFolder(folderId);
  };

  // Expand a specific folder when requested by parent
  React.useEffect(() => {
    if (!expandFolderRequest) return;
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.add(expandFolderRequest);
      return next;
    });
  }, [expandFolderRequest]);

  // Organize folders into tree structure using modular hook
  const organizedFolders = useFolderTree(folders);

  // Get root notes (notes with folderId === null)
  const rootNotes = useMemo(() => {
    return notes.filter(note => note.folderId === null);
  }, [notes]);
  return (
    <div className={`flex h-full flex-col bg-[var(--bg-surface)] ${className || ''}`}>
      <div className="flex-1 overflow-y-auto p-4">
        <Filters 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <NotebookList
          folders={folders}
          notes={notes}
          selectedFolderId={selectedFolderId}
          selectedNoteId={selectedNoteId}
          expandedFolders={expandedFolders}
          onSelectFolder={onSelectFolder}
          onSelectNote={onSelectNote}
          onDeleteNote={onDeleteNote}
          onNoteAction={onNoteAction}
          onFolderAction={handleFolderAction}
          onRenameNote={onRenameNote}
          onRenameFolder={onRenameFolder}
          onMoveNote={onMoveNote}
          onMoveFolder={onMoveFolder}
          onDoubleClick={handleFolderDoubleClick}
          onToggleExpand={toggleFolder}
          onCreateNoteAt={onCreateNoteAt}
          onCreateFolderAt={onCreateFolderAt}
          draggedFolder={draggedFolder}
          setDraggedFolder={setDraggedFolder}
          dropTarget={dropTarget}
          setDropTarget={setDropTarget}
          rootNoteDrop={rootNoteDrop}
          setRootNoteDrop={setRootNoteDrop}
          editingNoteId={editingNoteId}
          editingNoteValue={editingNoteValue}
          editingFolderId={editingFolderId}
          editingFolderValue={editingFolderValue}
          onStartNoteRename={beginNoteRename}
          onNoteRenameChange={setEditingNoteValue}
          onCommitNoteRename={commitNoteRename}
          onCancelNoteRename={cancelNoteRename}
          onStartFolderRename={beginFolderRename}
          onFolderRenameChange={setEditingFolderValue}
          onCommitFolderRename={commitFolderRename}
          onCancelFolderRename={cancelFolderRename}
        />
      </div>
      <PaneFooter>
        <PaneCaret
          direction="left"
          onClick={onHidePane}
          tooltipText="Hide sidebar"
          shortcut="["
        />
      </PaneFooter>
    </div>
  );
}
// #endregion Main Component


