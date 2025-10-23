"use client";

import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../../ui/context-menu';
import { FileText, FolderPlus } from 'lucide-react';
import { compareNotesByPinned } from '../NotesLeftPane';
import { FolderTreeItem } from './FolderTreeItem';
import { cn } from '../../../ui/utils';
import type { Note, NoteFolder } from '../types';
import type { FolderAction } from '../NotesLeftPane';

interface NotebookListProps {
  folders: NoteFolder[];
  notes: Note[];
  selectedFolderId: string | null;
  selectedNoteId: string | null;
  expandedFolders: Set<string>;
  onSelectFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  onDeleteNote?: (noteId: string) => void;
  onNoteAction?: (noteId: string, action: 'rename' | 'move' | 'duplicate' | 'pin' | 'unpin') => void;
  onFolderAction: (folderId: string, action: FolderAction) => void;
  onRenameNote?: (noteId: string, newTitle: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMoveNote?: (noteId: string, newFolderId: string | null, newIndex: number) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null, newIndex: number) => void;
  onDoubleClick: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onCreateNoteAt?: (folderId: string | null) => void;
  onCreateFolderAt?: (parentId: string | null) => void;
  draggedFolder: string | null;
  setDraggedFolder: (folderId: string | null) => void;
  dropTarget: { folderId: string; position: 'above' | 'below' | 'inside' } | null;
  setDropTarget: (target: { folderId: string; position: 'above' | 'below' | 'inside' } | null) => void;
  rootNoteDrop: { noteId: string; position: 'above' | 'below' } | null;
  setRootNoteDrop: (target: { noteId: string; position: 'above' | 'below' } | null) => void;
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

export function NotebookList({
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
  expandedFolders,
  onSelectFolder,
  onSelectNote,
  onDeleteNote,
  onNoteAction,
  onFolderAction,
  onRenameNote,
  onRenameFolder,
  onMoveNote,
  onMoveFolder,
  onDoubleClick,
  onToggleExpand,
  onCreateNoteAt,
  onCreateFolderAt,
  draggedFolder,
  setDraggedFolder,
  dropTarget,
  setDropTarget,
  rootNoteDrop,
  setRootNoteDrop,
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
}: NotebookListProps) {
  // Organize folders into tree structure
  const organizedFolders = React.useMemo(() => {
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
  const rootNotes = React.useMemo(() => {
    return notes.filter(note => note.folderId === null);
  }, [notes]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="min-h-full">
          <div className="space-y-1">
            {/* Root notes */}
            {rootNotes.sort(compareNotesByPinned).map((note) => (
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
                    className="relative flex items-center justify-between rounded-lg border border-transparent p-2 cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]"
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
                      <span className="text-sm">{note.title}</span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onSelect={() => {
                      onStartNoteRename(note.id);
                      onNoteAction?.(note.id, 'rename');
                    }}
                  >
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'move')}>
                    Move To
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => onNoteAction?.(note.id, 'duplicate')}>
                    Duplicate
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => onDeleteNote?.(note.id)} className="text-destructive focus:text-destructive">
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
                onDoubleClick={onDoubleClick}
                onToggleExpand={onToggleExpand}
                onFolderAction={onFolderAction}
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
                onStartNoteRename={onStartNoteRename}
                onNoteRenameChange={onNoteRenameChange}
                onCommitNoteRename={onCommitNoteRename}
                onCancelNoteRename={onCancelNoteRename}
                onStartFolderRename={onStartFolderRename}
                onFolderRenameChange={onFolderRenameChange}
                onCommitFolderRename={onCommitFolderRename}
                onCancelFolderRename={onCancelFolderRename}
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
  );
}