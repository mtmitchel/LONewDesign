import React, { useCallback, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { ComposeChips } from './ComposeChips';
import { EmailChip, RecipientField } from './types';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface ComposeEnvelopeProps {
  to: EmailChip[];
  cc: EmailChip[];
  bcc: EmailChip[];
  subject: string;
  showCc: boolean;
  showBcc: boolean;
  collapsed: boolean;
  focusField?: 'to' | 'cc' | 'bcc' | null;
  onCollapsedChange: (collapsed: boolean) => void;
  onUpdateRecipients: (field: RecipientField, chips: EmailChip[]) => void;
  onUpdateSubject: (subject: string) => void;
  onShowCcBcc: (field: 'cc' | 'bcc') => void;
  onHideCcBcc: (field: 'cc' | 'bcc') => void;
  toPlaceholder?: string;
  ccPlaceholder?: string;
  bccPlaceholder?: string;
}

export function ComposeEnvelope({
  to,
  cc,
  bcc,
  subject,
  showCc,
  showBcc,
  collapsed,
  focusField = null,
  onCollapsedChange,
  onUpdateRecipients,
  onUpdateSubject,
  onShowCcBcc,
  onHideCcBcc,
  toPlaceholder = '',
  ccPlaceholder = '',
  bccPlaceholder = '',
}: ComposeEnvelopeProps) {
  const envelopeRef = useRef<HTMLElement>(null);

  const handleSubjectKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const editor = document.querySelector('[data-compose-editor]') as HTMLElement | null;
      editor?.focus();
    }
  }, []);

  // Handle clicking outside to collapse envelope
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        envelopeRef.current &&
        !envelopeRef.current.contains(event.target as Node) &&
        !collapsed
      ) {
        // Collapse envelope and hide Cc/Bcc fields
        onCollapsedChange(true);
        if (showCc) onHideCcBcc('cc');
        if (showBcc) onHideCcBcc('bcc');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collapsed, showCc, showBcc, onCollapsedChange, onHideCcBcc]);



  const fieldLabelClass = "text-sm text-[var(--text-secondary)] font-normal";
  const labelWidth = "w-[36px] flex-shrink-0";

  if (collapsed) {
    return (
      <section ref={envelopeRef} className="px-4 py-3 space-y-3" role="group" aria-label="Compose envelope">
        <button
          type="button"
          className="flex h-9 w-full items-center text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={() => onCollapsedChange(false)}
        >
          <span className={fieldLabelClass}>Recipients</span>
        </button>
        
        <div className="flex items-center gap-0 min-h-[36px]">
          <span className={`${fieldLabelClass} ${labelWidth}`}>Subject</span>
          <Input
            value={subject}
            onChange={(event) => onUpdateSubject(event.target.value)}
            onFocus={() => onCollapsedChange(false)}
            placeholder=""
            className="flex-1 border-none shadow-none bg-transparent px-0 text-sm focus-visible:ring-0 placeholder:text-[var(--text-tertiary)]"
          />
        </div>
        
        <div className="h-px bg-[var(--border-subtle)]" />
      </section>
    );
  }

  return (
    <section ref={envelopeRef} className="px-4 py-3 space-y-2" role="group" aria-label="Compose envelope">
      {/* From Field */}
      <div className="flex items-center gap-0 min-h-[36px]">
        <span className={`${fieldLabelClass} ${labelWidth}`}>From</span>
        <Button
          variant="ghost"
          className="flex-1 justify-start px-0 h-auto py-1 text-sm font-normal text-[var(--text-primary)] hover:bg-transparent"
          onClick={() => console.log('From dropdown')}
        >
          User Name &lt;user@domain.com&gt;
          <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
        </Button>
      </div>

      {/* To Field */}
      <div className="flex items-center gap-0 min-h-[36px]">
        <span className={`${fieldLabelClass} ${labelWidth}`}>To</span>
        <div className="flex-1 min-w-0">
          <ComposeChips
            field="to"
            chips={to}
            placeholder={toPlaceholder}
            onChange={(chips) => onUpdateRecipients('to', chips)}
            className="py-1"
            autoFocus={focusField === 'to'}
          />
        </div>
        
        {/* Cc Bcc Links - Only show when neither is active */}
        {!showCc && !showBcc && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => onShowCcBcc('cc')}
            >
              Cc
            </button>
            <button
              type="button"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => onShowCcBcc('bcc')}
            >
              Bcc
            </button>
          </div>
        )}
      </div>

      {/* Cc Field */}
      {showCc && (
        <div className="flex items-center gap-0 min-h-[36px]">
          <span className={`${fieldLabelClass} ${labelWidth}`}>Cc</span>
          <div className="flex-1 min-w-0">
            <ComposeChips
              field="cc"
              chips={cc}
              placeholder={ccPlaceholder}
              onChange={(chips) => onUpdateRecipients('cc', chips)}
              className="py-1"
              autoFocus={focusField === 'cc'}
            />
          </div>
          
          {/* Only show Bcc link when Bcc field isn't active */}
          {!showBcc && (
            <button
              type="button"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-auto"
              onClick={() => onShowCcBcc('bcc')}
            >
              Bcc
            </button>
          )}
        </div>
      )}

      {/* Bcc Field */}
      {showBcc && (
        <div className="flex items-center gap-0 min-h-[36px]">
          <span className={`${fieldLabelClass} ${labelWidth}`}>Bcc</span>
          <div className="flex-1 min-w-0">
            <ComposeChips
              field="bcc"
              chips={bcc}
              placeholder={bccPlaceholder}
              onChange={(chips) => onUpdateRecipients('bcc', chips)}
              className="py-1"
              autoFocus={focusField === 'bcc'}
            />
          </div>
        </div>
      )}

      {/* Subject Field */}
      <div className="flex items-center gap-0 min-h-[36px]">
        <span className={`${fieldLabelClass} ${labelWidth}`}>Subject</span>
        <Input
          value={subject}
          onChange={(event) => onUpdateSubject(event.target.value)}
          onKeyDown={handleSubjectKeyDown}
          placeholder=""
          className="flex-1 border-none shadow-none bg-transparent px-0 text-sm focus-visible:ring-0 placeholder:text-[var(--text-tertiary)]"
        />
      </div>
      
      <div className="h-px bg-[var(--border-subtle)]" />
    </section>
  );
}
