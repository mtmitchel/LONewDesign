"use client";

import React, { useMemo } from 'react';
import { Folder, FolderOpen, Edit, Move, Download, Copy, Trash, Search } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../ui/context-menu';
import { Badge } from '../../ui/badge';
import { SearchInput } from '../../extended';
import { Input } from '../../ui/input';
import type { NoteFolder } from './types';



import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';

interface NotesLeftPaneProps {
  folders: NoteFolder[];
  selectedFolderId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectFolder: (folderId: string) => void;
  onHidePane: () => void;
  className?: string;
}

export function NotesLeftPane({ folders, selectedFolderId, searchQuery, onSearchChange, onSelectFolder, onHidePane, className }: NotesLeftPaneProps) {
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
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`flex items-center justify-between rounded-lg p-2 cursor-pointer transition-colors hover:bg-[var(--bg-surface-hover)] ${
                selectedFolderId === folder.id ? 'bg-[var(--bg-surface-active)] text-[var(--text-primary)]' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder size={16} />
                <span className="text-sm">{folder.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {folder.noteCount}
              </Badge>
            </div>
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
