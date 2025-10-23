
import * as React from 'react';
import { Button } from '../../../../ui/button';
import { X } from 'lucide-react';

interface TitleEditorProps {
  isCompleted: boolean;
  onSave: (isCompleted: boolean) => void;
  onClose: () => void;
  title: string;
  onTitleChange: (title: string) => void;
  onTitleCommit: (title: string) => void;
  titleRef: React.RefObject<HTMLInputElement>;
  savedHint: string | null;
}

export function TitleEditor({ isCompleted, onSave, onClose, title, onTitleChange, onTitleCommit, titleRef, savedHint }: TitleEditorProps) {
  return (
    <header className="sticky top-0 z-[var(--z-overlay)] bg-[color:var(--bg-surface)] px-[var(--space-4)] py-[var(--space-4)] border-b border-[color:var(--border-divider)]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <Button
          variant={isCompleted ? 'outline' : 'default'}
          className="h-[var(--btn-sm-height,36px)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
          onClick={() => onSave(!isCompleted)}
        >
          {isCompleted ? 'Reopen' : 'Mark complete'}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-[var(--btn-sm-height,36px)] w-[var(--btn-sm-height,36px)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
          onClick={onClose}
        >
          <X className="size-[var(--icon-sm)]" />
        </Button>
      </div>
      <section className="px-[var(--space-4)] pt-[var(--space-4)] pb-[var(--space-4)]">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          onBlur={(event) => onTitleCommit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onTitleCommit((event.target as HTMLInputElement).value);
            }
          }}
          placeholder="Task title"
          className="w-full max-w-full border-none bg-transparent p-0 text-[length:var(--text-2xl)] font-semibold leading-tight text-[color:var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[var(--bg-surface)]"
        />
        <div aria-live="polite" className="sr-only">{savedHint ?? ''}</div>
      </section>
    </header>
  );
}
