"use client";

import React from 'react';
import { Hash, Quote, ToggleLeft, ListOrdered, List, CheckSquare, Code, Image, Video, Music, File, Smile } from 'lucide-react';
import { FormattingToolbar } from '../mail/FormattingToolbar';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Card } from '../../ui/card';
import type { ToolbarAction } from './types';

interface NotesEditorProps {
  content: string;
  onContentChange: (value: string) => void;
  onToolbarAction: (action: ToolbarAction) => void;
  isSaving: boolean;
  lastSavedLabel?: string;
  autoSaveEnabled: boolean;
}

interface SlashMenuItem {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string;
  action: ToolbarAction;
  group: string;
}

const slashMenuItems: SlashMenuItem[] = [
  { icon: Hash, label: 'Heading 1', action: 'h1', group: 'Headings' },
  { icon: Hash, label: 'Heading 2', action: 'h2', group: 'Headings' },
  { icon: Hash, label: 'Heading 3', action: 'h3', group: 'Headings' },
  { icon: Quote, label: 'Quote', action: 'quote', group: 'Blocks' },
  { icon: ToggleLeft, label: 'Toggle list', action: 'toggle', group: 'Blocks' },
  { icon: List, label: 'Bulleted list', action: 'ul', group: 'Blocks' },
  { icon: ListOrdered, label: 'Numbered list', action: 'ol', group: 'Blocks' },
  { icon: CheckSquare, label: 'Checklist', action: 'checklist', group: 'Blocks' },
  { icon: Code, label: 'Code block', action: 'code-block', group: 'Blocks' },
  { icon: Image, label: 'Image', action: 'image', group: 'Media' },
  { icon: Video, label: 'Video', action: 'video', group: 'Media' },
  { icon: Music, label: 'Audio', action: 'audio', group: 'Media' },
  { icon: File, label: 'File', action: 'file', group: 'Media' },
  { icon: Smile, label: 'Emoji', action: 'emoji', group: 'Other' }
];

export function NotesEditor({
  content,
  onContentChange,
  onToolbarAction,
  isSaving,
  lastSavedLabel,
  autoSaveEnabled
}: NotesEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [slashPosition, setSlashPosition] = React.useState({ x: 0, y: 0 });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when component mounts
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    onContentChange(value);

    const cursor = event.target.selectionStart;
    const textBefore = value.slice(0, cursor);
    const lastSlash = textBefore.lastIndexOf('/');

    if (lastSlash !== -1 && cursor - lastSlash <= 20) {
      const bounds = event.target.getBoundingClientRect();
      setSlashPosition({ x: bounds.left + 48, y: bounds.top + 96 });
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSlashAction = (action: ToolbarAction) => {
    setShowSlashMenu(false);
    onToolbarAction(action);
  };

  return (
    <div className="flex h-full flex-col">


      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <FormattingToolbar
          onCommand={(cmd) => onToolbarAction(cmd as any)}
          density="compact"
          tone="ghost"
          className="border-b border-[var(--border-subtle)]"
        />
      </div>

      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          className="h-full w-full resize-none border-none bg-transparent px-[var(--space-5)] py-[var(--space-5)] text-[length:var(--text-base)] leading-relaxed focus-visible:ring-0 outline-none"
        />

        {showSlashMenu && (
          <Card
            className="pointer-events-auto absolute z-50 w-80 overflow-hidden border border-[var(--border-subtle)] shadow-lg"
            style={{ left: slashPosition.x, top: slashPosition.y }}
          >
            <div className="max-h-80 overflow-y-auto">
              {Array.from(new Set(slashMenuItems.map(item => item.group))).map(group => (
                <div key={group} className="border-b border-[var(--border-subtle)] last:border-none">
                  <div className="px-[var(--space-3)] py-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-[color:var(--text-tertiary)]">
                    {group}
                  </div>
                  <div className="space-y-[var(--space-1)] px-[var(--space-2)] pb-[var(--space-2)]">
                    {slashMenuItems
                      .filter(item => item.group === group)
                      .map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleSlashAction(item.action)}
                          className="flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] text-left text-sm text-[color:var(--text-primary)] hover:bg-[color-mix(in_oklab,_var(--primary)_12%,_transparent)]"
                        >
                          <item.icon size={16} className="text-[color:var(--text-secondary)]" />
                          {item.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
