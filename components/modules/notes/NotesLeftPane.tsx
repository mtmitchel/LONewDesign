"use client";

import React, { useMemo } from 'react';
import { Folder, FolderOpen, Edit, Move, Download, Copy, Trash } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../ui/context-menu';
import { Badge } from '../../ui/badge';
import { SearchInput } from '../../extended';
import type { NoteFolder } from './types';

type FolderAction = 'rename' | 'move' | 'export-pdf' | 'export-word' | 'export-text' | 'delete';

interface NotesLeftPaneProps {
  folders: NoteFolder[];
  selectedFolderId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectFolder: (folderId: string) => void;
  onFolderAction?: (folderId: string, action: FolderAction) => void;
}

interface FolderNode extends NoteFolder {
  children: FolderNode[];
}

function buildFolderTree(folders: NoteFolder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  folders.forEach(folder => {
    map.set(folder.id, { ...folder, children: [] });
  });

  map.forEach(folder => {
    if (folder.parentId && map.has(folder.parentId)) {
      map.get(folder.parentId)!.children.push(folder);
    } else {
      roots.push(folder);
    }
  });

  const sortTree = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => sortTree(node.children));
  };

  sortTree(roots);
  return roots;
}

export function NotesLeftPane({
  folders,
  selectedFolderId,
  searchQuery,
  onSearchChange,
  onSelectFolder,
  onFolderAction
}: NotesLeftPaneProps) {
  const tree = useMemo(() => buildFolderTree(folders), [folders]);

  const renderFolder = (folder: FolderNode, depth: number) => {
    const paddingLeft = `calc(var(--space-3) + ${depth} * var(--space-3))`;
    const isActive = folder.id === selectedFolderId;

    const handleAction = (action: FolderAction) => {
      onFolderAction?.(folder.id, action);
    };

    return (
      <React.Fragment key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center justify-between rounded-[var(--radius-md)] text-left hover:bg-[color-mix(in_oklab,_var(--primary)_12%,_transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] transition-colors duration-[var(--duration-base)] ${
                isActive ? 'bg-[color-mix(in_oklab,_var(--primary)_16%,_transparent)] text-[var(--primary)]' : 'text-[var(--text-primary)]'
              }`}
              style={{ paddingLeft }}
            >
              <span className="flex items-center gap-[var(--space-2)] py-[var(--space-2)]">
                {isActive ? (
                  <FolderOpen size={16} className="shrink-0" />
                ) : (
                  <Folder size={16} className="shrink-0 text-[var(--text-secondary)]" />
                )}
                <span className="text-sm font-medium leading-tight line-clamp-1">{folder.name}</span>
              </span>
              <Badge
                variant="secondary"
                className="mr-[var(--space-3)] text-[12px] font-normal bg-[color-mix(in_oklab,_var(--chip-label-bg)_60%,_transparent)] text-[var(--text-secondary)]"
              >
                {folder.noteCount}
              </Badge>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem onSelect={() => handleAction('rename')}>
              <Edit size={14} className="mr-[var(--space-2)]" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleAction('move')}>
              <Move size={14} className="mr-[var(--space-2)]" />
              Move To
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleAction('export-pdf')}>
              <Download size={14} className="mr-[var(--space-2)]" />
              Export as PDF
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleAction('export-word')}>
              <Download size={14} className="mr-[var(--space-2)]" />
              Export as Word
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleAction('export-text')}>
              <Copy size={14} className="mr-[var(--space-2)]" />
              Export as Text
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleAction('delete')} className="text-[var(--error)]">
              <Trash size={14} className="mr-[var(--space-2)]" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {folder.children.length > 0 && (
          <div className="space-y-[var(--space-1)]">
            {folder.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-[var(--space-3)] pt-[var(--space-3)]">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search notes"
          className="[&>div:first-child>input]:h-9"
        />
      </div>
      <div className="mt-[var(--space-2)] flex-1 overflow-y-auto px-[var(--space-2)] pb-[var(--space-4)]">
        <div className="space-y-[var(--space-1)]">
          {tree.map(folder => renderFolder(folder, 0))}
        </div>
      </div>
    </div>
  );
}

export type { FolderAction };
