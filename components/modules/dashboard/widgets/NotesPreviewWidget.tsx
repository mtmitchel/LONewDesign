"use client";

import React from 'react';
import { FileText, Clock, Tag } from 'lucide-react';
import { ScrollArea } from '../../../ui/scroll-area';
import { Badge } from '../../../ui/badge';
import type { WidgetProps } from '../types';

const mockNotes = [
  {
    id: '1',
    title: 'Project Planning Notes',
    preview: 'Key objectives for Q4 include dashboard redesign, user experience improvements, and performance optimization...',
    lastModified: '2 hours ago',
    tags: ['project', 'planning'],
    wordCount: 245
  },
  {
    id: '2',
    title: 'Meeting with Sarah',
    preview: 'Discussed the new design system implementation and timeline. Action items: review mockups, update documentation...',
    lastModified: '1 day ago',
    tags: ['meeting', 'design'],
    wordCount: 128
  },
  {
    id: '3',
    title: 'Research Ideas',
    preview: 'Exploring new productivity features based on user feedback. Consider adding automation, better search, and...',
    lastModified: '3 days ago',
    tags: ['research', 'ideas'],
    wordCount: 89
  },
  {
    id: '4',
    title: 'Weekly Reflection',
    preview: 'This week we made significant progress on the dashboard. Team collaboration has improved and we\'re on track...',
    lastModified: '1 week ago',
    tags: ['reflection', 'personal'],
    wordCount: 312
  }
];

export function NotesPreviewWidget({ widget }: WidgetProps) {
  const maxNotes = widget.config.maxNotes || 4;
  const showPreview = widget.config.showPreview ?? true;
  
  const displayNotes = mockNotes.slice(0, maxNotes);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          Recent Notes
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {mockNotes.length} total
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {displayNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--elevated)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2 mb-2">
                  <FileText size={16} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {note.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-[var(--text-secondary)]" />
                        <span className="text-xs text-[var(--text-secondary)]">
                          {note.lastModified}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {note.wordCount} words
                      </span>
                    </div>
                  </div>
                </div>

                {showPreview && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
                    {note.preview}
                  </p>
                )}

                {note.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag size={10} className="text-[var(--text-secondary)]" />
                    {note.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs px-1 py-0 bg-[var(--primary-tint-15)] text-[var(--primary)]"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        +{note.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}