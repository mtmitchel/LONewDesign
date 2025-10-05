import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import {
  X,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash,
  Star,
  Paperclip,
  Bold,
  Italic,
  Link,
  List,
  ChevronDown,
} from 'lucide-react';
import { Button } from './ui/button';
import { InlineReply } from './InlineReply';

export interface EmailOverlayProps {
  email: {
    id: string;
    subject: string;
    label?: string;
    from: { name: string; email: string };
    to: string[];
    timestamp: string;
    content: string;
    attachments?: Array<{ id: string; filename: string; size: string }>;
  };
  onClose: () => void;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
}

export function EmailOverlay({
  email,
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onToggleStar,
}: EmailOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  
  // Inline reply state (simplified)
  const [isComposing, setIsComposing] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'reply-all'>('reply');

  // Lock background scroll while modal is open
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => { 
      document.documentElement.style.overflow = prev; 
    };
  }, []);

  // Handle focus trap and keyboard shortcuts
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            if (!isComposing) {
              handleOpenReply('reply');
            }
            break;
          case 'a':
            e.preventDefault();
            if (!isComposing) {
              handleOpenReply('reply-all');
            }
            break;
          case 'f':
            e.preventDefault();
            onForward?.();
            break;
        }
      }
      // cycle focus within modal
      if (e.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables && focusables.length > 0) {
          const first = focusables[0] as HTMLElement;
          const last = focusables[focusables.length - 1] as HTMLElement;
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [onClose, onReply, onReplyAll, onForward]);

  // Purify HTML content
  const sanitizedHtml = DOMPurify.sanitize(email.content, { USE_PROFILES: { html: true } });

  // Clean handlers for inline reply
  function handleOpenReply(defaultMode: 'reply' | 'reply-all' = 'reply') {
    setReplyMode(defaultMode);
    setIsComposing(true);
  }
  
  function handleSendInline(payload: { mode: 'reply' | 'reply-all'; text: string }) {
    console.log('Sending inline reply:', payload);
    // TODO: wire to your real send flow + toast "Message sent"
    setIsComposing(false);
    onClose(); // Close the email overlay after sending
  }
  
  function handleDiscardInline() {
    // Safe discard: if empty it's immediate; if non-empty, confirm before closing
    setIsComposing(false);
  }



  const target = document.getElementById('mail-viewport-root') ?? document.body;

  return createPortal(
    <div
      className="absolute inset-0 z-[var(--z-overlay)]
                 grid place-items-center
                 p-[var(--overlay-gutter)] bg-[var(--overlay-scrim)]
                 backdrop-blur-[var(--overlay-blur)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-subject"
    >
      <article
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[var(--modal-max-w)] max-h-[var(--modal-max-h)]
                   bg-[var(--bg-surface)] border border-[var(--border-subtle)]
                   rounded-[var(--modal-radius)] shadow-[var(--modal-elevation)]
                   flex flex-col overflow-hidden 
                   motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in
                   motion-reduce:animate-none
                   duration-[var(--duration-base)] ease-[var(--easing-standard)]"
      >
        {/* Header */}
        <header className="flex items-center justify-between h-[var(--toolbar-h)] px-[var(--space-5)] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          {/* Left: subject + label chip (balanced, single row) */}
          <div className="min-w-0 flex items-center gap-2 flex-1">
            <h1 id="email-subject" className="text-lg font-semibold text-[var(--text-primary)] truncate">
              {email.subject}
            </h1>

            {/* Chip stays visible but never wraps; hides on really tight viewports */}
            {email.label && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5
                               rounded-full text-xs font-medium h-[var(--chip-height)]
                               bg-[var(--primary-tint-10)] text-[var(--primary)]
                               border border-[var(--primary-tint-20)]
                               max-[560px]:hidden">
                {email.label}
              </span>
            )}
          </div>

          {/* Right: actions cluster */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-[var(--hover-bg)]"
              onClick={onToggleStar}
              aria-label="Toggle star"
              title="Star email"
            >
              <Star className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-[var(--hover-bg)]"
              onClick={onArchive}
              aria-label="Archive email"
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-[var(--hover-bg)] text-[var(--danger)]"
              onClick={onDelete}
              aria-label="Delete email"
            >
              <Trash className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-[var(--hover-bg)]"
              onClick={onClose}
              aria-label="Close email"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Sender metadata */}
        <section className="flex items-start gap-3 px-[var(--space-5)] py-[10px] border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-[var(--modal-radius)] flex items-center justify-center text-white text-sm font-medium shrink-0">
            {email.from.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-[var(--text-primary)] truncate">
                {email.from.name}
              </span>
              <span className="text-[var(--text-tertiary)] truncate">&lt;{email.from.email}&gt;</span>
            </div>
            <div className="text-xs text-[var(--text-tertiary)] truncate">
              To: {email.to.join(', ')}
            </div>
          </div>
          <span className="text-sm text-[var(--text-secondary)] shrink-0 whitespace-nowrap">
            {email.timestamp}
          </span>
        </section>

        {/* Body */}
        <section className="flex-1 overflow-auto px-[var(--space-5)] py-[var(--space-4)]">
          <div className="mx-auto max-w-[var(--content-measure)]">
            <div
              className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed
                         [--tw-prose-bullets:var(--text-secondary)]
                         prose-p:my-3 prose-ul:my-2 prose-li:my-1"
              style={{ fontSize: 'var(--text-base)', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        </section>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <section className="px-[var(--space-5)] py-[var(--space-3)] border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Attachments ({email.attachments.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)]
                           rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)]
                           text-sm hover:bg-[var(--hover-bg)]
                           hover:shadow-[var(--elevation-sm)] transition-all"
                  title={`Download ${attachment.filename} (${attachment.size})`}
                >
                  <Paperclip className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                  <span className="font-medium text-[var(--text-primary)] max-w-[240px] truncate">
                    {attachment.filename}
                  </span>
                  <span className="text-[var(--text-tertiary)] shrink-0">({attachment.size})</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Inline Reply - New Clean Implementation */}
        {isComposing && (
          <InlineReply
            to={[email.from]}
            mode={replyMode}
            onChangeMode={setReplyMode}
            onSend={handleSendInline}
            onDiscard={handleDiscardInline}
            onOpenCompose={() => {
              // TODO: open ComposeModal with current draft
              console.log('Opening full compose modal');
            }}
          />
        )}

        {/* Footer - Conditional based on reply state */}
        <footer className="flex items-center justify-between h-[var(--toolbar-h)] px-[var(--space-5)] border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
          {isComposing ? (
            // When reply editor is open, only show Print/Export (no competing primaries)
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm">Print</Button>
              <Button variant="ghost" size="sm">Export</Button>
            </div>
          ) : (
            // Normal footer with all reply actions
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={() => handleOpenReply('reply')}
                  className="font-medium"
                  title="Reply (R)"
                  aria-keyshortcuts="R"
                >
                  <Reply className="w-4 h-4 mr-2" /> Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReply('reply-all')}
                  className="font-medium"
                  title="Reply all (A)"
                  aria-keyshortcuts="A"
                >
                  <ReplyAll className="w-4 h-4 mr-2" /> Reply all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onForward}
                  className="font-medium"
                  title="Forward (F)"
                  aria-keyshortcuts="F"
                >
                  <Forward className="w-4 h-4 mr-2" /> Forward
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Print</Button>
                <Button variant="ghost" size="sm">Export</Button>
              </div>
            </>
          )}
        </footer>
      </article>
    </div>,
    target
  );
}
