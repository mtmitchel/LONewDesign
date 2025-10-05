import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Separator } from '../../ui/separator';
import { ComposeChips, createEmailChip, EmailChip } from '../compose';
import { SendButton } from './SendButton';
import { FormattingToolbar } from './FormattingToolbar';

type ReplyMode = 'reply' | 'reply-all';

interface Person {
  name?: string;
  email: string;
}

export interface InlineReplyProps {
  to: Person[];
  cc?: Person[];
  bcc?: Person[];
  mode?: ReplyMode;
  onChangeMode?: (mode: ReplyMode) => void;
  onSend: (payload: {
    mode: ReplyMode;
    text: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
  }) => void;
  onDiscard: () => void;
  onOpenCompose?: () => void;
  onForward?: () => void;
}

export function InlineReply({
  to,
  cc = [],
  bcc = [],
  mode = 'reply',
  onChangeMode,
  onSend,
  onDiscard,
  onOpenCompose,
  onForward,
}: InlineReplyProps) {
  const [replyMode, setReplyMode] = useState<ReplyMode>(mode);
  const [text, setText] = useState('');
  const chipFromPerson = (person: Person) =>
    createEmailChip(person.name ? `${person.name} <${person.email}>` : person.email);
  const toSignature = useMemo(() => to.map((person) => `${person.name ?? ''}|${person.email}`).join(','), [to]);
  const ccSignature = useMemo(() => cc.map((person) => `${person.name ?? ''}|${person.email}`).join(','), [cc]);
  const bccSignature = useMemo(() => bcc.map((person) => `${person.name ?? ''}|${person.email}`).join(','), [bcc]);
  const [toChips, setToChips] = useState<EmailChip[]>(() => to.map(chipFromPerson));
  const [ccChips, setCcChips] = useState<EmailChip[]>(() => cc.map(chipFromPerson));
  const [bccChips, setBccChips] = useState<EmailChip[]>(() => bcc.map(chipFromPerson));
  const [showCc, setShowCc] = useState(Boolean(cc.length));
  const [showBcc, setShowBcc] = useState(Boolean(bcc.length));
  const [focusField, setFocusField] = useState<'to' | 'cc' | 'bcc' | null>('to');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);

  const stubAction = (label: string) => {
    console.log(`Inline reply toolbar action: ${label}`);
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    setReplyMode(mode);
  }, [mode]);

  useEffect(() => {
    onChangeMode?.(replyMode);
  }, [replyMode, onChangeMode]);

  useEffect(() => {
    setToChips(to.map(chipFromPerson));
  }, [toSignature]);

  useEffect(() => {
    const chips = cc.map(chipFromPerson);
    setCcChips(chips);
    if (chips.length > 0) setShowCc(true);
  }, [ccSignature]);

  useEffect(() => {
    const chips = bcc.map(chipFromPerson);
    setBccChips(chips);
    if (chips.length > 0) setShowBcc(true);
  }, [bccSignature]);

  useEffect(() => {
    if (!focusField) return;
    const timer = setTimeout(() => setFocusField(null), 120);
    return () => clearTimeout(timer);
  }, [focusField]);

  useEffect(() => {
    if (showCc && ccChips.length === 0) {
      setFocusField('cc');
    }
  }, [showCc, ccChips.length]);

  useEffect(() => {
    if (showBcc && bccChips.length === 0) {
      setFocusField('bcc');
    }
  }, [showBcc, bccChips.length]);

  // Handle clicking outside to hide Cc/Bcc fields
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        envelopeRef.current &&
        !envelopeRef.current.contains(event.target as Node) &&
        (showCc || showBcc)
      ) {
        // Hide both Cc and Bcc fields when clicking outside
        if (showCc) setShowCc(false);
        if (showBcc) setShowBcc(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCc, showBcc]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === 'c') {
        event.preventDefault();
        setShowCc(true);
        setFocusField('cc');
      }
      if (key === 'b') {
        event.preventDefault();
        setShowBcc(true);
        setFocusField('bcc');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const hasValidRecipient = toChips.some((chip) => chip.valid);
  const canSend = hasValidRecipient && text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend({
      mode: replyMode,
      text,
      to: toChips.map((chip) => chip.email),
      cc: showCc && ccChips.length ? ccChips.map((chip) => chip.email) : undefined,
      bcc: showBcc && bccChips.length ? bccChips.map((chip) => chip.email) : undefined,
    });
    setText('');
  };

  const handleTextAreaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
      event.preventDefault();
      handleSend();
    }
    if (event.key === 'Escape' && !text.trim()) {
      event.preventDefault();
      onDiscard();
    }
  };

  const revealCc = () => {
    setShowCc(true);
    setFocusField('cc');
  };

  const revealBcc = () => {
    setShowBcc(true);
    setFocusField('bcc');
  };

  return (
    <section 
      className="group px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)] border-t border-[var(--reply-divider)] bg-transparent"
      aria-label="Reply composer"
    >
      {/* address row */}
      <div className="flex items-center justify-between mb-[var(--space-1)]">
        <div ref={envelopeRef} className="flex-1 min-w-0 space-y-2 text-sm">
          <div className="flex items-start gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="compact"
                className="h-7 px-2 mt-[2px]"
                title="Change reply mode"
                aria-haspopup="menu"
              >
                {replyMode === 'reply-all' ? 'Reply all' : 'Reply'}
                <ChevronDown className="ml-1 h-3 w-3" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[160px] p-1">
              <DropdownMenuItem onSelect={() => setReplyMode('reply')}>Reply</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setReplyMode('reply-all')}>Reply all</DropdownMenuItem>
              {onForward && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onForward();
                  }}
                >
                  Forward
                </DropdownMenuItem>
              )}
              {onOpenCompose && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    onOpenCompose();
                  }}
                >
                  Open in compose
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0">
            <ComposeChips
              field="to"
              chips={toChips}
              onChange={setToChips}
              placeholder="Add recipients"
              className="py-1"
              autoFocus={focusField === 'to'}
            />
          </div>

          {/* Cc Bcc Links - Only show when neither is active */}
          {!showCc && !showBcc && (
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <button
                type="button"
                className="underline hover:text-[var(--text-primary)]"
                onClick={revealCc}
              >
                Cc
              </button>
              <button
                type="button"
                className="underline hover:text-[var(--text-primary)]"
                onClick={revealBcc}
              >
                Bcc
              </button>
            </div>
          )}
        </div>

        {showCc && (
          <div className="flex items-start gap-2">
            <span className="w-[36px] pt-[6px] text-xs text-[var(--text-secondary)]">Cc</span>
            <div className="flex-1 min-w-0">
              <ComposeChips
                field="cc"
                chips={ccChips}
                onChange={setCcChips}
                placeholder=""
                className="py-1"
                autoFocus={focusField === 'cc'}
              />
            </div>
            {/* Only show Bcc link when Bcc field isn't active */}
            {!showBcc && (
              <div className="flex items-center pt-[6px]">
                <button
                  type="button"
                  className="text-xs text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                  onClick={revealBcc}
                >
                  Bcc
                </button>
              </div>
            )}
          </div>
        )}

        {showBcc && (
          <div className="flex items-start gap-2">
            <span className="w-[36px] pt-[6px] text-xs text-[var(--text-secondary)]">Bcc</span>
            <div className="flex-1 min-w-0">
              <ComposeChips
                field="bcc"
                chips={bccChips}
                onChange={setBccChips}
                placeholder=""
                className="py-1"
                autoFocus={focusField === 'bcc'}
              />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* editor */}
      <div className="relative rounded-[var(--radius-md)] focus-within:ring-2 focus-within:ring-[var(--primary)]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder=""
          className="w-full resize-none bg-transparent min-h-[var(--editor-min-h)]
                     px-[var(--editor-pad-x)] py-[var(--editor-pad-y)]
                     pr-[calc(var(--editor-pad-x)+44px)] border-0 focus-visible:outline-none"
          onKeyDown={handleTextAreaKeyDown}
        />

        {/* toolbar INSIDE editor, ghost + compact */}
        <FormattingToolbar 
          onCommand={stubAction} 
          density="compact" 
          tone="ghost"
          className="absolute inset-x-[var(--editor-pad-x)] bottom-[var(--editor-pad-y)]
                     h-[var(--toolbar-h)] opacity-[.6] group-focus-within:opacity-100
                     motion-safe:transition-opacity"
        />
      </div>

      {/* send row */}
      <div className="mt-[var(--space-2)] flex items-center justify-between">
        <SendButton 
          className="h-8"
          size="sm"
          variant="solid" 
          disabled={!canSend}
          onClick={handleSend}
        />
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDiscard}
            title="Discard draft"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {onOpenCompose && (
            <button className="text-xs text-[var(--text-secondary)] hover:underline" onClick={onOpenCompose}>
              Open in compose
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
