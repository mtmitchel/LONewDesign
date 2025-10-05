import React, { useCallback, useRef, useState } from 'react';
import { ComposeChips } from './ComposeChips';
import { EmailChip, RecipientField } from './types';

interface ComposeEnvelopeProps {
  to: EmailChip[];
  cc: EmailChip[];
  bcc: EmailChip[];
  subject: string;
  showCc: boolean;
  showBcc: boolean;
  onUpdateRecipients: (field: RecipientField, chips: EmailChip[]) => void;
  onUpdateSubject: (subject: string) => void;
  onShowCcBcc: (field: 'cc' | 'bcc') => void;
  onHideCcBcc: (field: 'cc' | 'bcc') => void;
}

export function ComposeEnvelope({
  to,
  cc,
  bcc,
  subject,
  showCc,
  showBcc,
  onUpdateRecipients,
  onUpdateSubject,
  onShowCcBcc,
  onHideCcBcc
}: ComposeEnvelopeProps) {
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const [focusIn, setFocusIn] = useState<'to'|'cc'|'bcc'|null>(null);
  
  // Determine if we should show expanded view
  const isExpanded = focusIn === 'to' || to.length > 0 || cc.length > 0 || bcc.length > 0 || showCc || showBcc;

  const handleCcClick = useCallback(() => {
    onShowCcBcc('cc');
  }, [onShowCcBcc]);

  const handleBccClick = useCallback(() => {
    onShowCcBcc('bcc');
  }, [onShowCcBcc]);

  const handleCcBlur = useCallback(() => {
    if (cc.length === 0) {
      onHideCcBcc('cc');
    }
  }, [cc.length, onHideCcBcc]);

  const handleBccBlur = useCallback(() => {
    if (bcc.length === 0) {
      onHideCcBcc('bcc');
    }
  }, [bcc.length, onHideCcBcc]);

  const handleSubjectKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focus editor (will be handled by parent)
      const editorElement = document.querySelector('[data-compose-editor]') as HTMLElement;
      editorElement?.focus();
    }
  }, []);

  const handleEnterRecipients = useCallback(() => {
    setFocusIn('to');
  }, []);

  return (
    <div role="region" aria-label="Message recipients">
      <section className="px-[var(--space-4)] py-[var(--space-2)] space-y-[var(--space-2)]">
        
        {!isExpanded ? (
          /* Collapsed State - Single "Recipients" line */
          <>
            <button 
              onClick={handleEnterRecipients}
              className="flex items-center h-9 w-full text-left"
            >
              <span className="text-[var(--text-secondary)]">Recipients</span>
              <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                <a
                  onClick={(e) => { e.stopPropagation(); onShowCcBcc('cc'); }}
                  className="underline hover:text-[var(--text-primary)]"
                >
                  Cc
                </a>
                <a
                  onClick={(e) => { e.stopPropagation(); onShowCcBcc('bcc'); }}
                  className="underline hover:text-[var(--text-primary)] ml-2"
                >
                  Bcc
                </a>
              </span>
            </button>
            <div className="h-px bg-[var(--border-subtle)]" />
          </>
        ) : (
          /* Expanded State - Detailed To/Cc/Bcc fields */
          <div onBlur={() => {
            const none = to.length === 0 && cc.length === 0 && bcc.length === 0;
            if (none && !showCc && !showBcc) setFocusIn(null);
          }}> 
            {/* To Field */}
            <div className="flex items-start gap-2 py-[6px]">
              <label className="w-16 text-sm text-[var(--text-secondary)] pt-[2px] flex-shrink-0">
                To
              </label>
              <div className="flex-1">
                <ComposeChips
                  field="to"
                  chips={to}
                  placeholder="Recipients"
                  onChange={(chips) => onUpdateRecipients('to', chips)}
                  className="py-1"
                  autoFocus={focusIn === 'to' && to.length === 0}
                />
              </div>
              
              {/* Cc/Bcc Links - only show if not already visible */}
              {(!showCc || !showBcc) && (
                <div className="ml-auto flex items-center gap-[var(--space-2)] text-xs text-[var(--text-secondary)] flex-shrink-0">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={handleCcClick}
                      className="underline hover:text-[var(--text-primary)] transition-colors"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={handleBccClick}
                      className="underline hover:text-[var(--text-primary)] transition-colors"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="h-px bg-[var(--border-default)]" />
            
            {/* Cc Field */}
            {showCc && (
              <>
                <div className="flex items-start gap-2 py-[6px]">
                  <label className="w-16 text-sm text-[var(--text-secondary)] pt-[2px] flex-shrink-0">
                    Cc
                  </label>
                  <div className="flex-1">
                    <ComposeChips
                      field="cc"
                      chips={cc}
                      placeholder="Cc recipients"
                      onChange={(chips) => onUpdateRecipients('cc', chips)}
                      className="py-1"
                    />
                  </div>
                  
                  {/* Bcc Link - only show if Bcc not visible */}
                  {!showBcc && (
                    <div className="ml-auto text-xs text-[var(--text-secondary)] pt-[2px] flex-shrink-0">
                      <button
                        type="button"
                        onClick={handleBccClick}
                        className="underline hover:text-[var(--text-primary)] transition-colors"
                      >
                        Bcc
                      </button>
                    </div>
                  )}
                </div>
                <div className="h-px bg-[var(--border-default)]" />
              </>
            )}
            
            {/* Bcc Field */}
            {showBcc && (
              <>
                <div className="flex items-start gap-2 py-[6px]">
                  <label className="w-16 text-sm text-[var(--text-secondary)] pt-[2px] flex-shrink-0">
                    Bcc
                  </label>
                  <div className="flex-1">
                    <ComposeChips
                      field="bcc"
                      chips={bcc}
                      placeholder="Bcc recipients"
                      onChange={(chips) => onUpdateRecipients('bcc', chips)}
                      className="py-1"
                    />
                  </div>
                </div>
                <div className="h-px bg-[var(--border-default)]" />
              </>
            )}
          </div>
        )}
        
        {/* Subject Field - Always Visible */}
        <div className="flex items-center h-9 gap-[var(--space-2)]">
          <label className="text-sm text-[var(--text-secondary)] w-[56px] flex-shrink-0 sr-only">
            Subject
          </label>
          <input
            ref={subjectInputRef}
            type="text"
            value={subject}
            onChange={(e) => onUpdateSubject(e.target.value)}
            onKeyDown={handleSubjectKeyDown}
            placeholder="Subject"
            className="
              w-full bg-transparent outline-none
              placeholder:text-[var(--text-tertiary)]
              focus:outline-none focus:ring-0
              focus:border-b-2 focus:border-[var(--primary)] focus:pb-0
              border-b-2 border-transparent pb-0 transition-colors
            "
            aria-label="Email subject"
          />
        </div>
        
        {/* Final Divider */}
        <div className="h-px bg-[var(--border-subtle)]" />
      </section>
    </div>
  );
}