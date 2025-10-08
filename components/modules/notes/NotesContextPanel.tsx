"use client";

import React from 'react';
import { Star, CalendarClock, Copy, Trash, Tag as TagIcon, Sparkles } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import type { Note, NotesSettings } from './types';

interface NotesContextPanelProps {
  note: Note | null;
  folderName?: string;
  settings: NotesSettings;
  isSaving: boolean;
  lastSavedLabel?: string;
  onSettingsChange: (updates: Partial<NotesSettings>) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onToggleStar: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReminder?: () => void;
  showSections?: {
    details?: boolean;
    tags?: boolean;
    view?: boolean; // view settings
    sort?: boolean; // sort controls
    actions?: boolean;
    footer?: boolean;
  };
}

export function NotesContextPanel({
  note,
  folderName,
  settings,
  isSaving,
  lastSavedLabel,
  onSettingsChange,
  onTagAdd,
  onTagRemove,
  onToggleStar,
  onDuplicate,
  onDelete,
  onReminder,
  showSections
}: NotesContextPanelProps) {
  const [tagValue, setTagValue] = React.useState('');

  const handleTagSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = tagValue.trim();
    if (!value) return;
    onTagAdd(value);
    setTagValue('');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-4)] space-y-[var(--space-6)]">
        {(showSections?.details ?? true) && (
          <section className="space-y-[var(--space-2)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Details</h3>
            {note && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-[var(--space-2)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                onClick={onToggleStar}
              >
                <Star size={16} className={note.isStarred ? 'text-[color:var(--warning)]' : ''} fill={note.isStarred ? 'currentColor' : 'none'} />
                {note.isStarred ? 'Starred' : 'Star note'}
              </Button>
            )}
          </div>
          {note ? (
            <div className="space-y-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span>Folder</span>
                <span className="text-[color:var(--text-primary)]">{folderName || 'Inbox'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Word count</span>
                <span className="text-[color:var(--text-primary)]">{note.wordCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last modified</span>
                <span className="text-[color:var(--text-primary)]">{note.lastModified}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="text-[color:var(--text-primary)]">
                  {isSaving ? 'Saving…' : lastSavedLabel ? `Saved ${lastSavedLabel}` : 'Up to date'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-secondary)]">
              Select a note to see its details, tags, and actions.
            </p>
          )}
        </section>
        )}

        {(showSections?.tags ?? true) && (
        <section className="space-y-[var(--space-3)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Tags</h3>
            <TagIcon size={16} className="text-[color:var(--text-tertiary)]" />
          </div>
          {note && note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {note.tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-[var(--space-1)] bg-[color-mix(in_oklab,_var(--chip-label-bg)_55%,_transparent)] text-[color:var(--text-secondary)]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => onTagRemove(tag)}
                    className="text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--text-tertiary)]">No tags yet.</p>
          )}
          <form className="flex items-center gap-[var(--space-2)]" onSubmit={handleTagSubmit}>
            <Input
              value={tagValue}
              onChange={event => setTagValue(event.target.value)}
              placeholder="Add tag"
              className="h-9"
            />
            <Button type="submit" size="sm" variant="outline">
              Add
            </Button>
          </form>
        </section>
        )}

        {(showSections?.view ?? true) && (
        <section className="space-y-[var(--space-3)]">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">View settings</h3>
          <div className="space-y-[var(--space-3)]">
            <SettingRow
              label="Compact list view"
              description="Tightens list spacing for denser navigation."
              checked={settings.compactView}
              onCheckedChange={value => onSettingsChange({ compactView: value })}
            />
            <SettingRow
              label="Show previews"
              description="Display the first few lines of each note."
              checked={settings.showPreview}
              onCheckedChange={value => onSettingsChange({ showPreview: value })}
            />
            <SettingRow
              label="Show word count"
              description="Reveal word counts in the note list."
              checked={settings.showWordCount}
              onCheckedChange={value => onSettingsChange({ showWordCount: value })}
            />
            <SettingRow
              label="Auto-save changes"
              description="Sync edits in the background." 
              checked={settings.autoSave}
              onCheckedChange={value => onSettingsChange({ autoSave: value })}
            />
          </div>
        </section>
        )}

        {(showSections?.sort ?? true) && (
        <section className="space-y-[var(--space-3)]">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Sort notes</h3>
          <div className="grid grid-cols-1 gap-[var(--space-2)]">
            <div className="space-y-[var(--space-1)]">
              <Label className="text-xs text-[color:var(--text-secondary)]">Order by</Label>
              <Select
                value={settings.sortBy}
                onValueChange={value => onSettingsChange({ sortBy: value as NotesSettings['sortBy'] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modified">Last modified</SelectItem>
                  <SelectItem value="created">Created date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-[var(--space-1)]">
              <Label className="text-xs text-[color:var(--text-secondary)]">Direction</Label>
              <Select
                value={settings.sortOrder}
                onValueChange={value => onSettingsChange({ sortOrder: value as NotesSettings['sortOrder'] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
        )}

        {(showSections?.actions ?? true) && (
        <section className="space-y-[var(--space-3)]">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Actions</h3>
          <div className="space-y-[var(--space-2)]">
            <Button
              variant="outline"
              className="w-full justify-start gap-[var(--space-2)]"
              onClick={onDuplicate}
              disabled={!note}
            >
              <Copy size={16} />
              Duplicate note
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-[var(--space-2)]"
              onClick={onReminder}
              disabled={!note}
            >
              <CalendarClock size={16} />
              Set reminder
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-[var(--space-2)]"
              onClick={onDelete}
              disabled={!note}
            >
              <Trash size={16} />
              Delete note
            </Button>
          </div>
        </section>
        )}
      </div>

      {(showSections?.footer ?? true) && (
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-[var(--space-4)] py-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-3)] text-xs text-[color:var(--text-secondary)]">
          <Sparkles size={16} className="text-[color:var(--text-tertiary)]" />
          <span>Focus on writing—LibreOllama keeps everything synced and organized.</span>
        </div>
      </div>
      )}
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function SettingRow({ label, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[color-mix(in_oklab,_var(--bg-surface)_92%,_transparent)] px-[var(--space-3)] py-[var(--space-3)]">
      <div>
  <div className="text-sm font-medium text-[color:var(--text-primary)]">{label}</div>
  <p className="text-xs text-[color:var(--text-secondary)]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}