import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Minus, ExternalLink, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ComposeEnvelope } from './ComposeEnvelope';
import { ComposeEditor } from './ComposeEditor';
import { ComposeToolbar } from './ComposeToolbar';
import { ComposeState, ComposeDraft, EmailChip, RecipientField } from './types';
import { hasComposeContent, canSendCompose, createEmailChip } from './utils';

interface ComposeDockedProps {
  open: boolean;
  minimized?: boolean;
  onClose: () => void;
  onSend: (draft: ComposeDraft) => void;
  onPopout?: () => void;
  onMinimize?: () => void;
  onRestore?: () => void;
  draftId?: string;
  initialDraft?: Partial<ComposeDraft>;
}

export function ComposeDocked({
  open,
  minimized = false,
  onClose,
  onSend,
  onPopout,
  onMinimize,
  onRestore,
  draftId,
  initialDraft
}: ComposeDockedProps) {
  const hydrateChips = useCallback((values?: (EmailChip | string)[]): EmailChip[] =>
    (values ?? []).map((value) =>
      typeof value === 'string' ? createEmailChip(value) : value,
    ),
  []);

  const [state, setState] = useState<ComposeState>({
    to: hydrateChips(initialDraft?.to as (EmailChip | string)[] | undefined),
    cc: hydrateChips(initialDraft?.cc as (EmailChip | string)[] | undefined),
    bcc: hydrateChips(initialDraft?.bcc as (EmailChip | string)[] | undefined),
    subject: initialDraft?.subject || '',
    html: initialDraft?.html || '',
    showCc: (initialDraft?.cc ?? []).length > 0,
    showBcc: (initialDraft?.bcc ?? []).length > 0,
  });

  const envelopeRef = useRef<HTMLDivElement | null>(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(() =>
    state.to.length === 0 &&
    state.cc.length === 0 &&
    state.bcc.length === 0 &&
    !state.showCc &&
    !state.showBcc,
  );
  const [focusField, setFocusField] = useState<'to' | 'cc' | 'bcc' | null>(null);

  const collapseEligible =
    state.to.length === 0 &&
    state.cc.length === 0 &&
    state.bcc.length === 0 &&
    !state.showCc &&
    !state.showBcc;

  useEffect(() => {
    if (!collapseEligible) {
      setHeaderCollapsed(false);
    }
  }, [collapseEligible]);

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
        html: state.html,
      });
      onClose();
    }
  }, [state, onSend, onClose]);

  const updateRecipients = useCallback((field: RecipientField, chips: EmailChip[]) => {
    setState((prev) => ({
      ...prev,
      [field]: chips,
      showCc: field === 'cc' ? (prev.showCc || chips.length > 0) : prev.showCc,
      showBcc: field === 'bcc' ? (prev.showBcc || chips.length > 0) : prev.showBcc,
    }));
    if (chips.length > 0) {
      setHeaderCollapsed(false);
    }
  }, []);

  const updateSubject = useCallback((subject: string) => {
    setState(prev => ({ ...prev, subject }));
  }, []);

  const updateHtml = useCallback((html: string) => {
    setState(prev => ({ ...prev, html }));
  }, []);

  const showCcBcc = useCallback((field: 'cc' | 'bcc') => {
    setState((prev) => ({
      ...prev,
      [`show${field.charAt(0).toUpperCase()}${field.slice(1)}`]: true,
    }));
    setHeaderCollapsed(false);
    setFocusField(field);
  }, []);

  const hideCcBcc = useCallback((field: 'cc' | 'bcc') => {
    setState((prev) => ({
      ...prev,
      [field]: [],
      [`show${field.charAt(0).toUpperCase()}${field.slice(1)}`]: false,
    }));
    if (collapseEligible) {
      setHeaderCollapsed(true);
    }
  }, [collapseEligible]);

  useEffect(() => {
    const resetFocus = window.setTimeout(() => setFocusField(null), 120);
    return () => window.clearTimeout(resetFocus);
  }, [focusField]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: Event) => {
      if (!envelopeRef.current) return;
      if (envelopeRef.current.contains(event.target as Node)) return;
      if (collapseEligible) {
        setHeaderCollapsed(true);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
    };
  }, [open, collapseEligible]);

  useEffect(() => {
    if (!open) return;
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === 'c') {
        event.preventDefault();
        showCcBcc('cc');
      }
      if (key === 'b') {
        event.preventDefault();
        showCcBcc('bcc');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [open, showCcBcc]);

  if (!open) return null;

  // Minimized bar
  if (minimized) {
    const recipientSummary = state.to.length > 0 
      ? state.to[0].email 
      : 'New Message';
    const subjectText = state.subject || '(no subject)';

    return (
      <div
        data-compose-minimized
        className="
          absolute bottom-[var(--space-5)] right-[var(--space-5)]
          w-[400px] h-[52px]
          bg-[var(--bg-surface)]
          rounded-[var(--radius-lg)] shadow-[var(--elevation-lg)] border border-[var(--border-subtle)]
          flex items-center justify-between px-[var(--space-4)] z-[60]
          cursor-pointer hover:shadow-[var(--elevation-xl)]
          transition-shadow duration-200
        "
        role="button"
        aria-label="Restore compose window"
        onClick={() => onRestore?.()}
      >
        <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {recipientSummary}
            </div>
            <div className="text-xs text-[var(--text-secondary)] truncate">
              {subjectText}
            </div>
        </div>
        <div className="flex items-center gap-1 ml-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  aria-label="Close"
                >
                  <X className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
        </div>
      </div>
    );
  }

  // Full compose window
  return (
    <div
      data-compose-docked
      className="
        absolute bottom-[var(--space-5)] right-[var(--space-5)]
        w-[var(--compose-docked-width)] min-w-[var(--compose-docked-min-width)]
       h-[calc(var(--compose-docked-height)-2rem)]
        bg-[var(--bg-surface)]
        rounded-[var(--radius-lg)] shadow-[var(--elevation-xl)] border border-[var(--border-subtle)]
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
      <div ref={envelopeRef}>
        <ComposeEnvelope
          to={state.to}
          cc={state.cc}
          bcc={state.bcc}
          subject={state.subject}
          showCc={state.showCc}
          showBcc={state.showBcc}
          collapsed={collapseEligible && headerCollapsed}
          focusField={focusField}
          onCollapsedChange={(next) => {
            if (!collapseEligible) {
              setHeaderCollapsed(false);
              return;
            }
            setHeaderCollapsed(next);
            if (!next) {
              setFocusField('to');
            }
          }}
          onUpdateRecipients={updateRecipients}
          onUpdateSubject={updateSubject}
          onShowCcBcc={showCcBcc}
          onHideCcBcc={hideCcBcc}
          toPlaceholder=""
          ccPlaceholder=""
          bccPlaceholder=""
        />
      </div>

      {/* Editor Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <ComposeEditor
          html={state.html}
          onUpdateHtml={updateHtml}
          placeholder=""
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
