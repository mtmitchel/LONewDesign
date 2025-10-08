import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { ChevronDown, Trash2, X, Minus, Paperclip, Link as LinkIcon, Smile, Image as ImageIcon, MoreHorizontal, Send, Reply, ReplyAll, Forward } from 'lucide-react';
import { Separator } from '../../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
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
  subject?: string;
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
  subject,
  mode = 'reply',
  onChangeMode,
  onSend,
  onDiscard,
  onOpenCompose,
  onForward,
}: InlineReplyProps) {
  const [replyMode, setReplyMode] = useState<ReplyMode>(mode);
  const [actionType, setActionType] = useState<'reply' | 'reply-all' | 'forward'>('reply');
  const [text, setText] = useState('');
  const [showSubjectEditor, setShowSubjectEditor] = useState(false);
  const [editableSubject, setEditableSubject] = useState(subject ? `Re: ${subject}` : '');
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
      className="mt-[var(--space-4)] rounded-[var(--radius-lg)]
        bg-[var(--bg-surface)] shadow-[var(--elevation-xl)] border border-[hsl(220,13%,91%)]
        overflow-hidden flex flex-col max-h-[70vh]"
      aria-label="Reply composer"
    >
      {/* Header with subject context - matches ComposeDocked */}
      <header className="h-[40px] flex items-center justify-between bg-[var(--bg-surface-elevated)]
        border-b border-[var(--border-subtle)] px-[var(--space-4)] flex-shrink-0">
  <span className="text-sm font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
          {subject ? `Replying to: ${subject}` : 'Reply'}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={onDiscard}
                aria-label="Minimize"
              >
                <Minus className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Minimize</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0"
                onClick={onDiscard}
                aria-label="Close"
              >
                <X className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close (Esc)</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Envelope section - increased vertical padding */}
      <div ref={envelopeRef} className="px-[var(--space-4)] pt-[var(--space-4)] pb-[var(--space-3)] flex-shrink-0">
        <div className="space-y-3 text-sm">
          {/* Action dropdown + recipient chips inline */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 px-2 gap-1 hover:bg-[var(--bg-subtle)]"
                >
                  {actionType === 'reply' && <Reply className="w-4 h-4" />}
                  {actionType === 'reply-all' && <ReplyAll className="w-4 h-4" />}
                  {actionType === 'forward' && <Forward className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem 
                  onClick={() => {
                    setActionType('reply');
                    setReplyMode('reply');
                  }}
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setActionType('reply-all');
                    setReplyMode('reply-all');
                  }}
                >
                  <ReplyAll className="w-4 h-4 mr-2" />
                  Reply all
                </DropdownMenuItem>
                {onForward && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setActionType('forward');
                      onForward();
                    }}
                  >
                    <Forward className="w-4 h-4 mr-2" />
                    Forward
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSubjectEditor(!showSubjectEditor)}>
                  Edit subject
                </DropdownMenuItem>
                {onOpenCompose && (
                  <DropdownMenuItem onClick={onOpenCompose}>
                    Pop out reply
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Recipient chips inline */}
            <div className="flex-1 min-w-0">
              <ComposeChips
                field="to"
                chips={toChips}
                onChange={setToChips}
                placeholder="Recipients"
                className="py-1"
                autoFocus={focusField === 'to'}
              />
            </div>

            {/* Cc Bcc Links */}
            {!showCc && !showBcc && (
              <div className="flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                <button
                  type="button"
                  className="underline hover:text-[color:var(--text-primary)]"
                  onClick={revealCc}
                >
                  Cc
                </button>
                <button
                  type="button"
                  className="underline hover:text-[color:var(--text-primary)]"
                  onClick={revealBcc}
                >
                  Bcc
                </button>
              </div>
            )}
          </div>

          {/* Subject editor (conditional) */}
          {showSubjectEditor && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 px-3 py-2 text-sm bg-transparent border border-[var(--border-subtle)] 
                  rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 
                  focus-visible:ring-[var(--primary)]"
              />
            </div>
          )}

          {showCc && (
            <div className="flex items-start gap-2">
              <span className="w-[36px] pt-[6px] text-xs text-[color:var(--text-secondary)]">Cc</span>
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
              {!showBcc && (
                <div className="flex items-center pt-[6px]">
                  <button
                    type="button"
                    className="text-xs text-[color:var(--text-secondary)] underline hover:text-[color:var(--text-primary)]"
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
              <span className="w-[36px] pt-[6px] text-xs text-[color:var(--text-secondary)]">Bcc</span>
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

      {/* Editor section - scrollable with controlled height */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: '120px', maxHeight: '350px' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder=""
          className="w-full resize-none bg-transparent min-h-[120px]
            px-[var(--editor-pad-x)] py-[var(--editor-pad-y)]
            focus-visible:outline-none border-none block"
          onKeyDown={handleTextAreaKeyDown}
        />
      </div>

      {/* Formatting toolbar - fixed at bottom */}
      <div className="px-[var(--space-4)] pb-[var(--space-4)] pt-[var(--space-2)] flex-shrink-0 bg-[var(--bg-surface)]">
        <FormattingToolbar
          onCommand={stubAction}
          density="compact"
          tone="surface"
          className="h-9"
        />
      </div>

      {/* Bottom utility row - fixed at bottom */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]
        px-[var(--space-3)] py-[var(--space-3)] flex-shrink-0">
        <div className="h-10 flex items-center justify-between">
          {/* Send + attachment icons group - left side */}
          <div className="flex items-center gap-[var(--space-2)]">
            <Button 
              onClick={handleSend} 
              disabled={!canSend} 
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 rounded-md" 
              aria-label="Send email (Ctrl+Enter)"
            >
              <Send className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Send</span>
            </Button>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Attach file">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert link">
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert link</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert emoji">
                  <Smile className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert emoji</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="Insert image">
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert image</TooltipContent>
            </Tooltip>
          </div>

          {/* Trash + more - right side */}
          <div className="flex items-center gap-[var(--space-2)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-[color:var(--text-secondary)] hover:text-[color:var(--danger)]"
                  onClick={onDiscard}
                  aria-label="Discard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Discard</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0" aria-label="More options">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onOpenCompose && (
                  <DropdownMenuItem onClick={onOpenCompose}>Open in compose</DropdownMenuItem>
                )}
                <DropdownMenuItem>Save draft</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </footer>
    </section>
  );
}
