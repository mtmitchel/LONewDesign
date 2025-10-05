import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { X, Reply, ReplyAll, Forward, Archive, Trash, Star } from 'lucide-react';
import { Button } from './ui/button';

interface EmailOverlayProps {
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
  onToggleStar 
}: EmailOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus trap and keyboard shortcuts
  useEffect(() => {
    // Store previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    
    // Focus the modal container
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Handle keyboard shortcuts (only when no modifiers are pressed)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            onReply?.();
            break;
          case 'a':
            e.preventDefault();
            onReplyAll?.();
            break;
          case 'f':
            e.preventDefault();
            onForward?.();
            break;
        }
      }

      // Focus trap: cycle through focusable elements within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      previouslyFocusedElementRef.current?.focus();
    };
  }, [onClose, onReply, onReplyAll, onForward]);

  const sanitizedHtml = DOMPurify.sanitize(email.content, { USE_PROFILES: { html: true } });

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-[70] px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Email viewer"
    >
      <article
        ref={modalRef}
        className="w-[min(920px,calc(100%-48px))] max-h-[min(88dvh,920px)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[var(--radius-xl)] shadow-[var(--elevation-xl)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-[var(--duration-base)] ease-[var(--easing-standard)]"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header - 56px height */}
        <header className="flex items-center justify-between h-[56px] px-[var(--space-5)] border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">{email.subject}</h1>
            {email.label && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary-tint-10)] text-[var(--primary)] border border-[var(--primary-tint-20)]">
                  {email.label}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-[var(--hover-bg)]" 
              onClick={onToggleStar} 
              aria-label="Toggle star"
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
              aria-label="Close email (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Metadata - Compact section */}
        <section className="px-[var(--space-5)] py-[var(--space-3)] border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
              {email.from.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--text-primary)] truncate">
                  {email.from.name}
                </span>
                <span className="text-[var(--text-tertiary)]">&lt;{email.from.email}&gt;</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                To: {email.to.join(', ')}
              </div>
            </div>
            
            <span className="text-sm text-[var(--text-secondary)] shrink-0">
              {email.timestamp}
            </span>
          </div>
        </section>

        {/* Body - Scrollable content */}
        <section className="flex-1 overflow-auto px-[var(--space-5)] py-[var(--space-4)] min-h-0">
          <div
            className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{
              fontSize: 'var(--text-base)',
              lineHeight: '1.6'
            }}
          />
        </section>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <section className="px-[var(--space-5)] py-[var(--space-3)] border-t border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)]">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Attachments ({email.attachments.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)]">📎</span>
                  <span className="font-medium text-[var(--text-primary)]">{attachment.filename}</span>
                  <span className="text-[var(--text-tertiary)]">({attachment.size})</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer - 56px height with action buttons */}
        <footer className="flex items-center justify-between h-[56px] px-[var(--space-5)] border-t border-[var(--border-hairline)] bg-[var(--bg-surface-elevated)]">
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={onReply}
              className="font-medium"
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply (R)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReplyAll}
              className="font-medium"
            >
              <ReplyAll className="w-4 h-4 mr-2" />
              Reply All (A)
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onForward}
              className="font-medium"
            >
              <Forward className="w-4 h-4 mr-2" />
              Forward (F)
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Print</Button>
            <Button variant="ghost" size="sm">Export</Button>
          </div>
        </footer>
      </article>
    </div>
  );
}
