"use client";

import React, { useMemo, useState } from 'react';
import { Folder, FolderOpen, Edit, Move, Download, Copy, Trash, Search, FileText, FileDown, FolderPlus, ChevronRight, ChevronDown, GripVertical, Star, Pin, PinOff } from 'lucide-react';
import type { Note } from './types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../ui/context-menu';
import { Badge } from '../../ui/badge';
import { SearchInput } from '../../extended';
import { Input } from '../../ui/input';
import { cn } from '../../ui/utils';
import type { NoteFolder } from './types';



import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';

const compareNotesByPinned = (a: Note, b: Note) => {
  const pinnedDiff = Number(!!b.isPinned) - Number(!!a.isPinned);
  if (pinnedDiff !== 0) return pinnedDiff;
  return (a.order ?? 0) - (b.order ?? 0);
};

const ACTIVE_LEFT_PANE_ROW =
  'bg-[var(--primary)] text-white shadow-[inset_0_0_0_1px_hsla(0,0%,100%,0.18)]';
const HOVER_LEFT_PANE_ROW = 'hover:bg-[var(--primary-tint-10)]';

export type FolderAction = 'rename' | 'move' | 'new-note' | 'new-subfolder' | 'export-pdf' | 'export-word' | 'export-text' | 'delete';

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

  // Organize folders into tree structure
  const organizedFolders = useMemo(() => {
    const rootFolders = folders.filter(f => !f.parentId);
    const childFolders = folders.filter(f => f.parentId);
    
    const buildTree = (parentId?: string): any[] => {
      const children = childFolders.filter(f => f.parentId === parentId);
      return children.map(folder => ({
        ...folder,
        children: buildTree(folder.id)
      }));
    };

    return rootFolders.map(folder => ({
      ...folder,
      children: buildTree(folder.id)
    }));
  }, [folders]);

  // Get root notes (notes with folderId === null)
  const rootNotes = useMemo(() => {
    return notes.filter(note => note.folderId === null);
  }, [notes]);
  return (
    <div className={`flex h-full flex-col bg-[var(--bg-surface)] ${className || ''}`}>
      <div className="flex-1 overflow-y-auto p-4">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="min-h-full">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)]" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 w-full pl-9 pr-3 bg-[var(--bg-surface)] border border-[var(--border-default)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
                />
              </div>
              <div className="space-y-1">
          {/* Root notes */}
          {rootNotes.sort(compareNotesByPinned).map((note, idx) => (
            <ContextMenu key={note.id}>
              <ContextMenuTrigger asChild>
                <div
                  draggable={editingNoteId !== note.id}
                  onDragStart={(e) => {
                    if (editingNoteId === note.id) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', `note:${note.id}`);
                    try { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'note', id: note.id })); } catch {}
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const height = rect.height;
                    setRootNoteDrop({ noteId: note.id, position: y < height * 0.5 ? 'above' : 'below' });
                  }}
                  onDragLeave={(e) => { e.stopPropagation(); setRootNoteDrop(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = e.dataTransfer.getData('text/plain');
                    const [dragType, dragId] = data.includes(':') ? data.split(':') : ['folder', data];
                    if (dragType === 'note') {
                      const notesInRoot = rootNotes.sort(compareNotesByPinned);
                      const i = notesInRoot.findIndex(n => n.id === note.id);
                      const insertIndex = rootNoteDrop?.position === 'above' ? i : i + 1;
                      onMoveNote?.(dragId, null, insertIndex);
                    }
                    setRootNoteDrop(null);
                  }}
                  onClick={() => {
                    if (editingNoteId !== note.id) onSelectNote(note.id);
                  }}
                  onContextMenu={() => onSelectNote(note.id)}
                  className={cn(
                    'relative flex items-center justify-between rounded-lg border border-transparent p-2 cursor-pointer transition-colors',
                    selectedNoteId === note.id ? ACTIVE_LEFT_PANE_ROW : HOVER_LEFT_PANE_ROW
                  )}
                >
                  {/* Drop indicator for root notes */}
                  {rootNoteDrop?.noteId === note.id && rootNoteDrop.position === 'above' && (
                    <div className="absolute left-0 right-0 -top-0.5 h-0.5 bg-blue-500 rounded-full" />
                  )}
                  {rootNoteDrop?.noteId === note.id && rootNoteDrop.position === 'below' && (
                    <div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-blue-500 rounded-full" />
                  )}
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    {editingNoteId === note.id ? (
                      <Input
                        ref={el => {
                          if (editingNoteId === note.id && el) {
                            setTimeout(() => {
                              el.focus();
                              el.select();
                            }, 0);
                          }
                        }}
                        value={editingNoteValue}
                        onChange={event => setEditingNoteValue(event.target.value)}
                        onBlur={() => commitNoteRename(note.id)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            commitNoteRename(note.id);
                          } else if (event.key === 'Escape') {
                            event.preventDefault();
                            cancelNoteRename();
                          }
                        }}
                        className="h-7 w-full px-2 py-1 text-sm bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      />
                    ) : (
                      <span className="text-sm">{note.title}</span>
                    )}
                    {note.isStarred && <Star size={12} className="text-yellow-500" fill="currentColor" />}
                    {note.isPinned && (
                      <Pin
                        size={12}
                        className={cn('text-[color:var(--primary)]', selectedNoteId === note.id && 'text-white')}
                      />
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  onSelect={() => {
                    beginNoteRename(note.id);
                    onNoteAction?.(note.id, 'rename');
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'move')}>
                  <Move className="mr-2 h-4 w-4" />
                  Move To
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'duplicate')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onNoteAction?.(note.id, note.isPinned ? 'unpin' : 'pin')}>
                  {note.isPinned ? (
                    <PinOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Pin className="mr-2 h-4 w-4" />
                  )}
                  {note.isPinned ? 'Unpin from top' : 'Pin to top'}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => console.log('Export note as PDF from left pane:', note.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as PDF
                </ContextMenuItem>
                <ContextMenuItem onClick={() => console.log('Export note as Word from left pane:', note.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as Word
                </ContextMenuItem>
                <ContextMenuItem onClick={() => console.log('Export note as Text from left pane:', note.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Export as Text
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onDeleteNote?.(note.id)} className="text-destructive focus:text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
          
          {/* Folders */}
          {organizedFolders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              allNotes={notes}
              allFolders={folders}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onDeleteNote={onDeleteNote}
              onNoteAction={onNoteAction}
              onDoubleClick={handleFolderDoubleClick}
              onToggleExpand={toggleFolder}
              onFolderAction={handleFolderAction}
              onRenameNote={onRenameNote}
              onRenameFolder={onRenameFolder}
              onMoveNote={onMoveNote}
              onMoveFolder={onMoveFolder}
              draggedFolder={draggedFolder}
              setDraggedFolder={setDraggedFolder}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              depth={0}
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
          ))}
             </div>
           </div>
         </ContextMenuTrigger>
         <ContextMenuContent className="w-52">
           <ContextMenuItem onClick={() => onCreateNoteAt?.(null)}>
             <FileText className="mr-2 h-4 w-4" />
             New note
           </ContextMenuItem>
           <ContextMenuItem onClick={() => onCreateFolderAt?.(null)}>
             <FolderPlus className="mr-2 h-4 w-4" />
             New folder
           </ContextMenuItem>
         </ContextMenuContent>
       </ContextMenu>
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

// Recursive folder tree item component
interface FolderTreeItemProps {
  folder: any;
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  allNotes: Note[];
  allFolders: NoteFolder[];
  expandedFolders: Set<string>;
  onSelectFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onNoteAction?: (noteId: string, action: 'rename' | 'move' | 'duplicate' | 'pin' | 'unpin') => void;
  onDoubleClick: (folderId: string) => void;
  onMoveNote?: (noteId: string, newFolderId: string | null, newIndex: number) => void;
  onToggleExpand: (folderId: string) => void;
  onFolderAction: (folderId: string, action: FolderAction) => void;
  onRenameNote?: (noteId: string, newTitle: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null, newIndex: number) => void;
  draggedFolder: string | null;
  setDraggedFolder: (folderId: string | null) => void;
  dropTarget: { folderId: string; position: 'above' | 'below' | 'inside' } | null;
  setDropTarget: (target: { folderId: string; position: 'above' | 'below' | 'inside' } | null) => void;
  depth: number;
  editingNoteId: string | null;
  editingNoteValue: string;
  editingFolderId: string | null;
  editingFolderValue: string;
  onStartNoteRename: (noteId: string) => void;
  onNoteRenameChange: (value: string) => void;
  onCommitNoteRename: (noteId: string) => void;
  onCancelNoteRename: () => void;
  onStartFolderRename: (folderId: string) => void;
  onFolderRenameChange: (value: string) => void;
  onCommitFolderRename: (folderId: string) => void;
  onCancelFolderRename: () => void;
}

function FolderTreeItem({
  folder,
  selectedFolderId,
  selectedNoteId,
  allNotes,
  allFolders,
  expandedFolders,
  onSelectFolder,
  onSelectNote,
  onDeleteNote,
  onNoteAction,
  onDoubleClick,
  onToggleExpand,
  onFolderAction,
  onRenameNote,
  onRenameFolder,
  onMoveNote,
  onMoveFolder,
  draggedFolder,
  setDraggedFolder,
  dropTarget,
  setDropTarget,
  depth,
  editingNoteId,
  editingNoteValue,
  editingFolderId,
  editingFolderValue,
  onStartNoteRename,
  onNoteRenameChange,
  onCommitNoteRename,
  onCancelNoteRename,
  onStartFolderRename,
  onFolderRenameChange,
  onCommitFolderRename,
  onCancelFolderRename
}: FolderTreeItemProps) {
  const [noteDrop, setNoteDrop] = React.useState<{ noteId: string; position: 'above' | 'below' } | null>(null);
  const hasChildren = (folder.children && folder.children.length > 0) || (Array.isArray(allNotes) && allNotes.some(n => n.folderId === folder.id));
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const indentLevel = depth * 16; // 16px per level
  const isDragging = draggedFolder === folder.id;
  const isDropTarget = dropTarget?.folderId === folder.id;
  const isFolderEditing = editingFolderId === folder.id;

  const handleDragStart = (e: React.DragEvent) => {
    if (isFolderEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `folder:${folder.id}`);
    setDraggedFolder(folder.id);
  };

  const handleDragEnd = () => {
    setDraggedFolder(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position: 'above' | 'below' | 'inside';
    if (y < height * 0.25) {
      position = 'above';
    } else if (y > height * 0.75) {
      position = 'below';
    } else {
      position = 'inside';
    }
    
    setDropTarget({ folderId: folder.id, position });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    const [dragType, dragId] = data.includes(':') ? data.split(':') : ['folder', data];
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const derivedPosition: 'above' | 'below' | 'inside' = y < height * 0.25 ? 'above' : y > height * 0.75 ? 'below' : 'inside';
    const position = dropTarget && dropTarget.folderId === folder.id ? dropTarget.position : derivedPosition;

    if (dragType === 'note') {
      const targetFolderId = position === 'inside' ? folder.id : (folder.parentId ?? null);
      const normalizedTarget = targetFolderId ?? null;

      const scopeNotes = allNotes
        .filter(n => (n.folderId ?? null) === normalizedTarget && n.id !== dragId)
        .sort(compareNotesByPinned);

      let insertIndex = 0;

      if (position === 'inside') {
        insertIndex = scopeNotes.length;
      } else {
        const scopeId = folder.parentId ?? null;
        const siblingNotes = allNotes
          .filter(n => (n.folderId ?? null) === scopeId && n.id !== dragId)
          .sort(compareNotesByPinned);
        const siblingFolders = allFolders
          .filter(f => (f.parentId ?? null) === scopeId)
          .map(f => ({ id: f.id, order: f.order ?? 0 }));

        const combined = [
          ...siblingNotes.map(n => ({ type: 'note' as const, id: n.id, order: n.order ?? 0 })),
          ...siblingFolders.map(f => ({ type: 'folder' as const, id: f.id, order: f.order })),
        ].sort((a, b) => {
          const orderDiff = a.order - b.order;
          if (orderDiff !== 0) return orderDiff;
          if (a.type === b.type) return a.id.localeCompare(b.id);
          return a.type === 'folder' ? 1 : -1;
        });

        const filtered = combined.filter(item => !(item.type === 'note' && item.id === dragId));
        const anchorIndex = filtered.findIndex(item => item.type === 'folder' && item.id === folder.id);

        if (anchorIndex === -1) {
          insertIndex = position === 'above' ? 0 : siblingNotes.length;
        } else {
          const insertPos = position === 'above' ? anchorIndex : anchorIndex + 1;
          filtered.splice(insertPos, 0, { type: 'note' as const, id: dragId, order: 0 });
          insertIndex = filtered
            .slice(0, insertPos)
            .filter(item => item.type === 'note')
            .length;
        }
      }

      onMoveNote?.(dragId, normalizedTarget, insertIndex);
      setDropTarget(null);
      setDraggedFolder(null);
      return;
    }

    if (dragType === 'folder') {
      if (!onMoveFolder || dragId === folder.id) return;
      const siblings = allFolders.filter(f => (f.parentId || null) === (position === 'inside' ? folder.id : (folder.parentId || null)) && f.id !== dragId)
                                 .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
      // Insert relative to the hovered folder for above/below
      const idx = siblings.findIndex(f => f.id === folder.id);
      const insertIndex = position === 'above' ? idx : (position === 'below' ? idx + 1 : 0);
      const newParent = position === 'inside' ? folder.id : (folder.parentId || null);
      onMoveFolder(dragId, newParent, Math.max(0, insertIndex));
    }

    setDropTarget(null);
    setDraggedFolder(null);
  };

  return (
    <div>
      {/* Drop indicators */}
      {isDropTarget && dropTarget?.position === 'above' && (
        <div className="h-0.5 bg-blue-500 rounded-full mx-2 mb-1" style={{ marginLeft: `${indentLevel}px` }} />
      )}
      
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            draggable={!isFolderEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => onSelectFolder(folder.id)}
            onDoubleClick={() => onDoubleClick(folder.id)}
            onContextMenu={() => onSelectFolder(folder.id)}
            className={cn(
              'group relative flex items-center justify-between rounded-lg border border-transparent p-2 cursor-pointer transition-colors',
              isSelected ? ACTIVE_LEFT_PANE_ROW : HOVER_LEFT_PANE_ROW,
              isDragging && 'opacity-50',
              isDropTarget && dropTarget?.position === 'inside' && 'bg-blue-100 border-blue-300'
            )}
            style={{ marginLeft: `${indentLevel}px` }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(folder.id);
                }}
                className="p-0.5 hover:bg-black/10 rounded"
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
              {isFolderEditing ? (
                <Input
                  ref={el => {
                    if (isFolderEditing && el) {
                      setTimeout(() => {
                        el.focus();
                        el.select();
                      }, 0);
                    }
                  }}
                  value={editingFolderValue}
                  onChange={event => onFolderRenameChange(event.target.value)}
                  onBlur={() => onCommitFolderRename(folder.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      onCommitFolderRename(folder.id);
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      onCancelFolderRename();
                    }
                  }}
                  className="h-7 w-full px-2 py-1 text-sm bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                />
              ) : (
                <span className="text-sm">{folder.name}</span>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onSelect={() => {
              onFolderAction(folder.id, 'rename');
              onStartFolderRename(folder.id);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'move')}>
            <Move className="mr-2 h-4 w-4" />
            Move to
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'new-note')}>
            <FileText className="mr-2 h-4 w-4" />
            New note
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'new-subfolder')}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'delete')} className="text-destructive focus:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Bottom drop indicator */}
      {isDropTarget && dropTarget?.position === 'below' && (
        <div className="h-0.5 bg-blue-500 rounded-full mx-2 mt-1" style={{ marginLeft: `${indentLevel}px` }} />
      )}
      
      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {/* Notes inside this folder */}
          {allNotes.filter(n => n.folderId === folder.id).sort(compareNotesByPinned).map(note => {
            const isActive = note.id === selectedNoteId;
            const isEditing = editingNoteId === note.id;
            return (
              <ContextMenu key={note.id}>
                {/* Ensure right-click selects the note as well */}
                <ContextMenuTrigger asChild>
                  <div
                    draggable={!isEditing}
                    onDragStart={(e) => {
                      if (isEditing) {
                        e.preventDefault();
                        return;
                      }
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', `note:${note.id}`);
                      try { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'note', id: note.id })); } catch {}
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const height = rect.height;
                      setNoteDrop({ noteId: note.id, position: y < height * 0.5 ? 'above' : 'below' });
                    }}
                    onDragLeave={(e) => { e.stopPropagation(); setNoteDrop(null); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const data = e.dataTransfer.getData('text/plain');
                      const [dragType, dragId] = data.includes(':') ? data.split(':') : ['folder', data];
                      if (dragType === 'note') {
                        const notesInFolder = allNotes.filter(n => n.folderId === folder.id).sort(compareNotesByPinned);
                        const idx = notesInFolder.findIndex(n => n.id === note.id);
                        const insertIndex = noteDrop?.position === 'above' ? idx : idx + 1;
                        onMoveNote?.(dragId, folder.id, insertIndex);
                      }
                      setNoteDrop(null);
                    }}
                    onClick={() => {
                      if (!isEditing) onSelectNote(note.id);
                    }}
                    onContextMenu={() => onSelectNote(note.id)}
                    className={cn(
                      'ml-6 flex items-center justify-between rounded-lg border border-transparent p-2 cursor-pointer transition-colors',
                      isActive ? ACTIVE_LEFT_PANE_ROW : HOVER_LEFT_PANE_ROW
                    )}
                    style={{ marginLeft: `${(depth + 1) * 16}px` }}
                  >
                    {/* Drop indicator for notes */}
                    {noteDrop?.noteId === note.id && noteDrop.position === 'above' && (
                      <div className="absolute left-0 right-0 -top-0.5 h-0.5 bg-blue-500 rounded-full" />
                    )}
                    {noteDrop?.noteId === note.id && noteDrop.position === 'below' && (
                      <div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-blue-500 rounded-full" />
                    )}
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      {isEditing ? (
                        <Input
                          ref={el => {
                            if (isEditing && el) {
                              setTimeout(() => {
                                el.focus();
                                el.select();
                              }, 0);
                            }
                          }}
                          value={editingNoteValue}
                          onChange={event => onNoteRenameChange(event.target.value)}
                          onBlur={() => onCommitNoteRename(note.id)}
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              onCommitNoteRename(note.id);
                            } else if (event.key === 'Escape') {
                              event.preventDefault();
                              onCancelNoteRename();
                            }
                          }}
                          className="h-7 w-full px-2 py-1 text-sm bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      ) : (
                        <span className="text-sm">{note.title}</span>
                      )}
                      {note.isPinned && (
                        <Pin
                          size={12}
                          className={cn('text-[color:var(--primary)]', isActive && 'text-white')}
                        />
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onSelect={() => {
                      onNoteAction?.(note.id, 'rename');
                      onStartNoteRename(note.id);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'move')}>
                    <Move className="mr-2 h-4 w-4" />
                    Move To
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'duplicate')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onNoteAction?.(note.id, note.isPinned ? 'unpin' : 'pin')}>
                    {note.isPinned ? (
                      <PinOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Pin className="mr-2 h-4 w-4" />
                    )}
                    {note.isPinned ? 'Unpin from top' : 'Pin to top'}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => console.log('Export note as PDF from left pane:', note.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as PDF
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => console.log('Export note as Word from left pane:', note.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as Word
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => console.log('Export note as Text from left pane:', note.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Export as Text
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => onDeleteNote?.(note.id)} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {folder.children.map((childFolder: any) => (
            <FolderTreeItem
              key={childFolder.id}
              folder={childFolder}
              selectedFolderId={selectedFolderId}
              selectedNoteId={selectedNoteId}
              allNotes={allNotes}
              allFolders={allFolders}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onDeleteNote={onDeleteNote}
              onNoteAction={onNoteAction}
              onDoubleClick={onDoubleClick}
              onToggleExpand={onToggleExpand}
              onFolderAction={onFolderAction}
              onRenameNote={onRenameNote}
              onRenameFolder={onRenameFolder}
              onMoveFolder={onMoveFolder}
              draggedFolder={draggedFolder}
              setDraggedFolder={setDraggedFolder}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              depth={depth + 1}
              editingNoteId={editingNoteId}
              editingNoteValue={editingNoteValue}
              editingFolderId={editingFolderId}
              editingFolderValue={editingFolderValue}
              onStartNoteRename={onStartNoteRename}
              onNoteRenameChange={onNoteRenameChange}
              onCommitNoteRename={onCommitNoteRename}
              onCancelNoteRename={onCancelNoteRename}
              onStartFolderRename={onStartFolderRename}
              onFolderRenameChange={onFolderRenameChange}
              onCommitFolderRename={onCommitFolderRename}
              onCancelFolderRename={onCancelFolderRename}
              onMoveNote={onMoveNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
