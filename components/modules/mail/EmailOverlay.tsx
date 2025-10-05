import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { Archive, Paperclip, Star, Trash, X, Reply, ReplyAll, Forward } from 'lucide-react';
import { Button } from '../../ui/button';
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
  onOpenCompose?: () => void;
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
  onOpenCompose,
}: EmailOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [replyMode, setReplyMode] = useState<'reply' | 'reply-all'>('reply');

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const mailViewport = document.getElementById('mail-viewport-root');
    const previousMailViewportOverflow = mailViewport?.style.overflow;
    
    // Lock scrolling on all container elements
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (mailViewport) {
      mailViewport.style.overflow = 'hidden';
    }
    
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
      if (mailViewport && previousMailViewportOverflow !== undefined) {
        mailViewport.style.overflow = previousMailViewportOverflow;
      }
    };
  }, []);

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 'r' && !isComposing) {
          event.preventDefault();
          handleOpenReply('reply');
          onReply?.();
        } else if (key === 'a' && !isComposing) {
          event.preventDefault();
          handleOpenReply('reply-all');
          onReplyAll?.();
        } else if (key === 'f') {
          event.preventDefault();
          onForward?.();
        }
      }

      if (event.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isComposing, onClose, onForward, onReply, onReplyAll]);

  const sanitizedHtml = DOMPurify.sanitize(email.content, { USE_PROFILES: { html: true } });
  const attachments = email.attachments ?? [];
  const hasAttachments = attachments.length > 0;
  const showMidZone = hasAttachments || isComposing;

  const handleOpenReply = (mode: 'reply' | 'reply-all') => {
    setReplyMode(mode);
    setIsComposing(true);
  };

  const handleDiscardInline = () => {
    setIsComposing(false);
  };

  const handleSendInline = (payload: { mode: 'reply' | 'reply-all'; text: string; to: string[]; cc?: string[]; bcc?: string[] }) => {
    console.log('Sending inline reply:', payload);
    setIsComposing(false);
    onClose();
  };

  const target = document.getElementById('mail-viewport-root') ?? document.body;

  return createPortal(
    <div
      className="absolute inset-0 z-[var(--z-overlay)] grid place-items-center p-[var(--overlay-gutter)]
        bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-subject"
      onClick={onClose}
    >
      <article
        ref={modalRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-[var(--modal-max-w-mail)] max-h-[var(--modal-max-h)] flex-col
          overflow-hidden rounded-[var(--modal-radius)]
          bg-[var(--bg-surface)] shadow-[var(--elevation-xl)]
          duration-[var(--duration-base)]
          ease-[var(--easing-standard)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in
          motion-reduce:animate-none
          !border-0 !outline-none !ring-0"
      >
        <header
          className="flex h-[var(--email-header-height)] items-center justify-between
            border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]
            px-[var(--modal-inner-x)]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 id="email-subject" className="truncate text-lg font-semibold text-[var(--text-primary)]">
              {email.subject}
            </h1>
            {email.label && (
              <span
                className="max-[560px]:hidden inline-flex shrink-0 items-center rounded-full border
                  border-[var(--primary-tint-20)] bg-[var(--primary-tint-10)] px-2 py-0.5 text-xs font-medium
                  text-[var(--primary)]"
              >
                {email.label}
              </span>
            )}
          </div>
          <div className="ml-4 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleStar}
              aria-label="Star email"
            >
              <Star className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onArchive}
              aria-label="Archive email"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--danger)]"
              onClick={onDelete}
              aria-label="Delete email"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
              aria-label="Close email"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <section
          className="flex items-start gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]
            px-[var(--modal-inner-x)] py-[var(--modal-inner-y)]"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="truncate font-medium text-[var(--text-primary)]">{email.from.name}</span>
              <span className="truncate text-[var(--text-tertiary)]">&lt;{email.from.email}&gt;</span>
            </div>
            <div className="truncate text-xs text-[var(--text-tertiary)]">To: {email.to.join(', ')}</div>
          </div>
          <span className="shrink-0 text-sm text-[var(--text-secondary)] whitespace-nowrap">{email.timestamp}</span>
        </section>

        <div className="flex-1 overflow-y-auto">
          <section className="px-[var(--modal-inner-x)] py-[var(--modal-inner-y)]">
            <div className="max-w-[var(--content-measure)]">
              <div
                className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed prose-p:my-3 prose-li:my-1"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            </div>
          </section>

          {showMidZone && (
            <section
              className="mx-[var(--modal-inner-x)] mt-[var(--space-2)]"
            >
              {hasAttachments && (
                <div className="px-[var(--space-3)] py-[var(--space-2)]">
                  <div className="flex w-full flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <button
                        key={attachment.id}
                        type="button"
                        className="group inline-flex max-w-[28ch] items-center gap-[var(--pill-gap)] truncate rounded-[var(--pill-radius)]
                          border border-[var(--border-subtle)] bg-transparent px-[var(--pill-pad-x)] py-[var(--pill-pad-y)]
                          text-left text-sm text-[var(--text-primary)] transition-shadow hover:bg-[var(--bg-surface)]"
                        title={`Download ${attachment.filename} (${attachment.size})`}
                      >
                        <Paperclip className="h-4 w-4 text-[var(--text-tertiary)]" />
                        <span className="truncate font-medium">{attachment.filename}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{attachment.size}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isComposing && (
                <InlineReply
                  to={[email.from]}
                  subject={email.subject}
                  mode={replyMode}
                  onChangeMode={setReplyMode}
                  onSend={handleSendInline}
                  onDiscard={handleDiscardInline}
                  onOpenCompose={onOpenCompose}
                  onForward={onForward}
                />
              )}
            </section>
          )}
        </div>

        <footer
          className={`flex items-center justify-between border-t border-[var(--border-subtle)]
            bg-[var(--bg-surface)] px-[var(--modal-inner-x)] ${
              isComposing
                ? 'pt-0 pb-[var(--modal-inner-x)]'
                : 'pt-[var(--space-2)] pb-[var(--modal-inner-x)]'
            }`}
        >
          {isComposing ? (
            <span aria-hidden="true" className="h-[1px] w-full" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={() => handleOpenReply('reply')}
                  title="Reply (R)"
                  aria-keyshortcuts="R"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReply('reply-all')}
                  title="Reply all (A)"
                  aria-keyshortcuts="A"
                >
                  <ReplyAll className="h-4 w-4 mr-2" />
                  Reply all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onForward}
                  title="Forward (F)"
                  aria-keyshortcuts="F"
                >
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </Button>
              </div>
              <span className="ml-auto" />
            </>
          )}
        </footer>
      </article>
    </div>,
    target,
  );
}
