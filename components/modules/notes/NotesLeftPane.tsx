"use client";

import React, { useMemo, useState } from 'react';
import { Folder, FolderOpen, Edit, Move, Download, Copy, Trash, Search, FileText, FileDown, FolderPlus, ChevronRight, ChevronDown, GripVertical, Star } from 'lucide-react';
import type { Note } from './types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../ui/context-menu';
import { Badge } from '../../ui/badge';
import { SearchInput } from '../../extended';
import { Input } from '../../ui/input';
import type { NoteFolder } from './types';



import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';

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
  className?: string;
}

export function NotesLeftPane({ folders, notes, selectedFolderId, selectedNoteId, searchQuery, onSearchChange, onSelectFolder, onSelectNote, onHidePane, onFolderAction, onMoveFolder, className }: NotesLeftPaneProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['work'])); // Start with 'work' expanded
  const [draggedFolder, setDraggedFolder] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ folderId: string; position: 'above' | 'below' | 'inside' } | null>(null);

  const handleFolderAction = (folderId: string, action: FolderAction) => {
    if (onFolderAction) {
      onFolderAction(folderId, action);
    } else {
      console.log(`Folder action: ${action} on folder ${folderId}`);
    }
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
    <div className={`flex h-full flex-col bg-[var(--bg-surface-elevated)] ${className || ''}`}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full pl-9 pr-3"
          />
        </div>
        <div className="space-y-1">
          {/* Root notes */}
          {rootNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors ${
                selectedNoteId === note.id 
                  ? 'bg-[var(--primary)] text-white border-2 border-[var(--primary)]' 
                  : 'border-2 border-transparent hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                <span className="text-sm">{note.title}</span>
                {note.isStarred && <Star size={12} className="text-yellow-500" fill="currentColor" />}
              </div>
            </div>
          ))}
          
          {/* Folders */}
          {organizedFolders.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onDoubleClick={handleFolderDoubleClick}
              onToggleExpand={toggleFolder}
              onFolderAction={handleFolderAction}
              onMoveFolder={onMoveFolder}
              draggedFolder={draggedFolder}
              setDraggedFolder={setDraggedFolder}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              depth={0}
            />
          ))}
        </div>
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
  expandedFolders: Set<string>;
  onSelectFolder: (folderId: string) => void;
  onDoubleClick: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onFolderAction: (folderId: string, action: FolderAction) => void;
  onMoveFolder?: (folderId: string, newParentId: string | null, newIndex: number) => void;
  draggedFolder: string | null;
  setDraggedFolder: (folderId: string | null) => void;
  dropTarget: { folderId: string; position: 'above' | 'below' | 'inside' } | null;
  setDropTarget: (target: { folderId: string; position: 'above' | 'below' | 'inside' } | null) => void;
  depth: number;
}

function FolderTreeItem({
  folder,
  selectedFolderId,
  expandedFolders,
  onSelectFolder,
  onDoubleClick,
  onToggleExpand,
  onFolderAction,
  onMoveFolder,
  draggedFolder,
  setDraggedFolder,
  dropTarget,
  setDropTarget,
  depth
}: FolderTreeItemProps) {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const indentLevel = depth * 16; // 16px per level
  const isDragging = draggedFolder === folder.id;
  const isDropTarget = dropTarget?.folderId === folder.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', folder.id);
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
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId === folder.id || !onMoveFolder || !dropTarget) return;
    
    if (dropTarget.position === 'inside') {
      onMoveFolder(draggedId, folder.id, 0);
    } else {
      // Handle sibling reordering
      onMoveFolder(draggedId, folder.parentId || null, 0);
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
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => onSelectFolder(folder.id)}
            onDoubleClick={() => hasChildren && onDoubleClick(folder.id)}
            onContextMenu={() => onSelectFolder(folder.id)}
            className={`group flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors relative ${
              isSelected 
                ? 'bg-[var(--primary)] text-white border-2 border-[var(--primary)]' 
                : 'border-2 border-transparent hover:bg-[var(--bg-surface-hover)]'
            } ${
              isDragging ? 'opacity-50' : ''
            } ${
              isDropTarget && dropTarget?.position === 'inside' ? 'bg-blue-100 border-blue-300' : ''
            }`}
            style={{ marginLeft: `${indentLevel}px` }}
          >
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(folder.id);
                  }}
                  className="p-0.5 hover:bg-black/10 rounded"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              {isExpanded && hasChildren ? <FolderOpen size={16} /> : <Folder size={16} />}
              <span className="text-sm">{folder.name}</span>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'rename')}>
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
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'export-pdf')}>
            <FileDown className="mr-2 h-4 w-4" />
            Export as PDF
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'export-word')}>
            <FileDown className="mr-2 h-4 w-4" />
            Export as Word
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onFolderAction(folder.id, 'export-text')}>
            <FileText className="mr-2 h-4 w-4" />
            Export as Text
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
          {folder.children.map((childFolder: any) => (
            <FolderTreeItem
              key={childFolder.id}
              folder={childFolder}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onSelectFolder={onSelectFolder}
              onDoubleClick={onDoubleClick}
              onToggleExpand={onToggleExpand}
              onFolderAction={onFolderAction}
              onMoveFolder={onMoveFolder}
              draggedFolder={draggedFolder}
              setDraggedFolder={setDraggedFolder}
              dropTarget={dropTarget}
              setDropTarget={setDropTarget}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
