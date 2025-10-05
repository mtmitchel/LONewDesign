import React, { useState, useCallback, useEffect } from 'react';
import { Minus, ExternalLink, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ComposeEnvelope } from './ComposeEnvelope';
import { ComposeEditor } from './ComposeEditor';
import { ComposeToolbar } from './ComposeToolbar';
import { ComposeState, ComposeDraft, EmailChip, RecipientField } from './types';
import { hasComposeContent, canSendCompose } from './utils';

interface ComposeDockedProps {
  open: boolean;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void;
  onPopout?: () => void;
  onMinimize?: () => void;
  draftId?: string;
  initialDraft?: Partial<ComposeDraft>;
}

export function ComposeDocked({
  open,
  onClose,
  onSend,
  onPopout,
  onMinimize,
  draftId,
  initialDraft
}: ComposeDockedProps) {
  const [state, setState] = useState<ComposeState>({
    to: initialDraft?.to || [],
    cc: initialDraft?.cc || [],
    bcc: initialDraft?.bcc || [],
    subject: initialDraft?.subject || '',
    html: initialDraft?.html || '',
    showCc: initialDraft?.cc?.length > 0 || false,
    showBcc: initialDraft?.bcc?.length > 0 || false,
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (open) {
      const composeElement = document.querySelector('[data-compose-docked]');
      if (composeElement) {
        const firstFocusable = composeElement.querySelector('input, textarea, button, [tabindex]:not([tabindex="-1"])') as HTMLElement;
        firstFocusable?.focus();
      }
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (hasComposeContent(state)) {
      if (window.confirm('Discard this message?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [state, onClose]);

  const handleSend = useCallback(() => {
    if (canSendCompose(state)) {
      onSend({
        to: state.to,
        cc: state.cc,
        bcc: state.bcc,
        subject: state.subject,
        html: state.html
      });
      onClose();
    }
  }, [state, onSend, onClose]);

  const updateRecipients = useCallback((field: RecipientField, chips: EmailChip[]) => {
    setState(prev => ({
      ...prev,
      [field]: chips
    }));
  }, []);

  const updateSubject = useCallback((subject: string) => {
    setState(prev => ({ ...prev, subject }));
  }, []);

  const updateHtml = useCallback((html: string) => {
    setState(prev => ({ ...prev, html }));
  }, []);

  const showCcBcc = useCallback((field: 'cc' | 'bcc') => {
    setState(prev => ({
      ...prev,
      [`show${field.charAt(0).toUpperCase()}${field.slice(1)}`]: true
    }));
  }, []);

  const hideCcBcc = useCallback((field: 'cc' | 'bcc') => {
    setState(prev => ({
      ...prev,
      [field]: [],
      [`show${field.charAt(0).toUpperCase()}${field.slice(1)}`]: false
    }));
  }, []);

  if (!open) return null;

  return (
    <div
      data-compose-docked
      className="
        absolute bottom-[var(--space-5)] right-[var(--space-5)]
        w-[var(--compose-docked-width)] min-w-[var(--compose-docked-min-width)]
       h-[calc(var(--compose-docked-height)-2rem)]
        bg-[var(--bg-surface)] border border-[var(--border-subtle)]
        rounded-[var(--radius-lg)] shadow-[var(--elevation-lg)]
        overflow-hidden flex flex-col min-w-0 z-[60]
        [transition-timing-function:var(--easing-standard)] [transition-duration:var(--duration-fast)]
        data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-2
      "
      role="dialog"
      aria-label="Compose message"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <header className="
        h-[40px] flex items-center justify-between
        bg-[var(--bg-surface-elevated)]
        border-b border-[var(--border-subtle)]
        px-[var(--space-4)]
      ">
        <span className="text-sm font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
          New Message
        </span>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-6 h-6 p-0"
                  onClick={onMinimize}
                  aria-label="Minimize"
                >
                  <Minus className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Minimize</TooltipContent>
            </Tooltip>
          )}
          
          {onPopout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-6 h-6 p-0"
                  onClick={onPopout}
                  aria-label="Pop out"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pop out</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-6 h-6 p-0"
                onClick={handleClose}
                aria-label="Close"
              >
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Envelope Section */}
      <ComposeEnvelope
        to={state.to}
        cc={state.cc}
        bcc={state.bcc}
        subject={state.subject}
        showCc={state.showCc}
        showBcc={state.showBcc}
        onUpdateRecipients={updateRecipients}
        onUpdateSubject={updateSubject}
        onShowCcBcc={showCcBcc}
        onHideCcBcc={hideCcBcc}
      />

      {/* Editor Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <ComposeEditor
          html={state.html}
          onUpdateHtml={updateHtml}
          placeholder="Write your message…"
        />
        
        {/* Toolbar */}
        <ComposeToolbar
          canSend={canSendCompose(state)}
          onSend={handleSend}
          onDiscard={handleClose}
          editorCommands={{
            toggleBold: () => console.log('Bold'),
            toggleItalic: () => console.log('Italic'),
            toggleUnderline: () => console.log('Underline'),
            applyColor: (color) => console.log('Color', color),
            insertLink: (url, text) => console.log('Link', url, text),
            insertImage: (src, alt) => console.log('Image', src, alt),
            undo: () => console.log('Undo'),
            redo: () => console.log('Redo'),
            setFontFamily: (family) => console.log('Font family', family),
            setFontSize: (size) => console.log('Font size', size),
            alignLeft: () => console.log('Align left'),
            alignCenter: () => console.log('Align center'),
            alignRight: () => console.log('Align right'),
            insertOrderedList: () => console.log('Ordered list'),
            insertUnorderedList: () => console.log('Unordered list'),
            insertQuote: () => console.log('Quote'),
          }}
        />
      </div>
    </div>
  );
}