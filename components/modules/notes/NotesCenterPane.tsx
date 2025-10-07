"use client";

import React from 'react';
import { Star, MoreHorizontal, Edit, Move, Copy, Download, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '../../ui/context-menu';
import { EmptyState } from '../../extended';
import type { Note, NotesSettings } from './types';

type NoteAction =
  | 'rename'
  | 'move'
  | 'duplicate'
  | 'export-pdf'
  | 'export-word'
  | 'export-text'
  | 'delete';

interface NotesCenterPaneProps {
  notes: Note[];
  loading?: boolean;
  selectedNoteId: string | null;
  settings: Pick<NotesSettings, 'showPreview' | 'showWordCount' | 'compactView'>;
  onSelectNote: (noteId: string) => void;
  onToggleStar: (noteId: string) => void;
  onNoteAction?: (noteId: string, action: NoteAction) => void;
  onCreateNote: () => void;
}

export function NotesCenterPane({
  notes,
  loading = false,
  selectedNoteId,
  settings,
  onSelectNote,
  onToggleStar,
  onNoteAction,
  onCreateNote
}: NotesCenterPaneProps) {
  if (!loading && notes.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No notes found"
        description="Create a note to capture ideas, meeting summaries, and research in one place."
        action={{ label: 'New note', onClick: onCreateNote }}
        className="h-full"
      />
    );
  }

  const densityPy = settings.compactView ? 'py-[var(--space-2)]' : 'py-[var(--space-3)]';
  const densityPx = settings.compactView ? 'px-[var(--space-3)]' : 'px-[var(--space-4)]';
  const metaTextSize = settings.compactView ? 'text-[var(--text-xs)]' : 'text-[var(--text-sm)]';

  const handleAction = (noteId: string, action: NoteAction) => {
    onNoteAction?.(noteId, action);
  };

  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {loading && (
        <div className="px-[var(--space-4)] py-[var(--space-3)] text-sm text-[var(--text-secondary)]">
          Loading notes…
        </div>
      )}
      {notes.map(note => {
        const isActive = note.id === selectedNoteId;
        return (
          <ContextMenu key={note.id}>
            <ContextMenuTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectNote(note.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectNote(note.id);
                  }
                }}
                className={`group relative cursor-pointer ${densityPx} ${densityPy} transition-colors duration-[var(--duration-base)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)] ${
                  isActive
                    ? 'bg-[color-mix(in_oklab,_var(--primary)_14%,_transparent)] border-l-2 border-l-[var(--primary)]'
                    : 'hover:bg-[color-mix(in_oklab,_var(--primary)_10%,_transparent)]'
                }`}
              >
                <div className="flex items-start justify-between gap-[var(--space-2)]">
                  <div className="flex min-w-0 flex-col gap-[var(--space-1-5,8px)]">
                    <div className="flex items-start gap-[var(--space-2)]">
                      <h4 className="line-clamp-1 text-[var(--text-sm)] font-medium leading-tight text-[var(--text-primary)]">
                        {note.title || 'Untitled note'}
                      </h4>
                      {note.isStarred && (
                        <Star size={14} className="text-[var(--warning)]" fill="currentColor" />
                      )}
                    </div>
                    {settings.showPreview && (
                      <p className="line-clamp-2 whitespace-pre-line text-[13px] leading-snug text-[var(--text-secondary)]">
                        {note.content || 'Start writing to see a preview here.'}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-[var(--space-1)] text-[var(--text-tertiary)]">
                      {note.tags.slice(0, 3).map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="border border-[var(--chip-border)] bg-[color-mix(in_oklab,_var(--chip-label-bg)_50%,_transparent)] text-[11px] text-[var(--text-secondary)]"
                        >
                          #{tag}
                        </Badge>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[11px] text-[var(--text-tertiary)]">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-[var(--space-2)]">
                    {settings.showWordCount && (
                      <div className={`whitespace-nowrap text-right ${metaTextSize} text-[var(--text-tertiary)] leading-none`}>
                        <div>{note.wordCount ?? 0} words</div>
                        <div>{note.lastModified}</div>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 rounded-full p-0 opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100"
                          onClick={event => event.stopPropagation()}
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'rename')}>
                          <Edit size={14} className="mr-[var(--space-2)]" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'move')}>
                          <Move size={14} className="mr-[var(--space-2)]" />
                          Move To
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'duplicate')}>
                          <Copy size={14} className="mr-[var(--space-2)]" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'export-pdf')}>
                          <Download size={14} className="mr-[var(--space-2)]" />
                          Export as PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'export-word')}>
                          <Download size={14} className="mr-[var(--space-2)]" />
                          Export as Word
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'export-text')}>
                          <Copy size={14} className="mr-[var(--space-2)]" />
                          Export as Text
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleAction(note.id, 'delete')} className="text-[var(--error)]">
                          <Trash size={14} className="mr-[var(--space-2)]" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuItem onSelect={() => handleAction(note.id, 'rename')}>
                <Edit size={14} className="mr-[var(--space-2)]" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleAction(note.id, 'move')}>
                <Move size={14} className="mr-[var(--space-2)]" />
                Move To
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() => {
                  onToggleStar(note.id);
                }}
              >
                <Star size={14} className="mr-[var(--space-2)]" />
                {note.isStarred ? 'Remove star' : 'Star note'}
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleAction(note.id, 'duplicate')}>
                <Copy size={14} className="mr-[var(--space-2)]" />
                Duplicate
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleAction(note.id, 'export-pdf')}>
                <Download size={14} className="mr-[var(--space-2)]" />
                Export as PDF
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleAction(note.id, 'export-word')}>
                <Download size={14} className="mr-[var(--space-2)]" />
                Export as Word
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => handleAction(note.id, 'export-text')}>
                <Copy size={14} className="mr-[var(--space-2)]" />
                Export as Text
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => handleAction(note.id, 'delete')} className="text-[var(--error)]">
                <Trash size={14} className="mr-[var(--space-2)]" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}

export type { NoteAction };
