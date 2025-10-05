import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  MoreHorizontal,
  Palette,
  Paperclip,
  Quote,
  Redo,
  Send,
  Smile,
  Type,
  Underline,
  Undo,
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { ComposeChips, createEmailChip, EmailChip } from '../modules/compose';

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

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
];

const FONT_SIZES = [
  { label: 'Small', value: 'small' },
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Huge', value: 'huge' },
];

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

  const fontFamilies = FONT_FAMILIES;
  const fontSizes = FONT_SIZES;

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
    <div className="w-full">
      <div className="space-y-[var(--space-1)] text-sm">
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

          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            {!showCc && (
              <button
                type="button"
                className="underline hover:text-[var(--text-primary)]"
                onClick={revealCc}
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                className="underline hover:text-[var(--text-primary)]"
                onClick={revealBcc}
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {showCc && (
          <div className="flex items-start gap-2">
            <span className="w-10 pt-[6px] text-xs text-[var(--text-secondary)]">Cc</span>
            <div className="flex-1 min-w-0">
              <ComposeChips
                field="cc"
                chips={ccChips}
                onChange={setCcChips}
                placeholder=""
                className="py-1"
                autoFocus={focusField === 'cc'}
                onBlur={() => {
                  if (ccChips.length === 0) setShowCc(false);
                }}
              />
            </div>
          </div>
        )}

        {showBcc && (
          <div className="flex items-start gap-2">
            <span className="w-10 pt-[6px] text-xs text-[var(--text-secondary)]">Bcc</span>
            <div className="flex-1 min-w-0">
              <ComposeChips
                field="bcc"
                chips={bccChips}
                onChange={setBccChips}
                placeholder=""
                className="py-1"
                autoFocus={focusField === 'bcc'}
                onBlur={() => {
                  if (bccChips.length === 0) setShowBcc(false);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-[var(--space-1)]">
        <textarea
          ref={textareaRef}
          rows={6}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write your reply..."
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--section-border)]
            bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-3)]
            min-h-[var(--reply-editor-min-h)] max-h-[var(--reply-editor-max-h)]
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary-tint-20)]"
          onKeyDown={handleTextAreaKeyDown}
        />
        <button
          type="button"
          className="absolute bottom-[var(--space-2)] text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          title="Show quoted content"
          aria-label="Show quoted content"
          style={{ left: 'calc(var(--space-3) + 4px)' }}
          onClick={() => console.log('Show quoted content')}
        >
          ...
        </button>
      </div>

      <div className="mt-[var(--space-1)] flex flex-col gap-[var(--space-3)]">
        <div
          className="flex h-9 w-full items-center gap-1 overflow-x-auto rounded-[var(--radius-full)]
            border border-[var(--section-border)] bg-[var(--bg-surface)] px-[var(--space-2)] hide-scrollbar"
        >
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Undo" onClick={() => stubAction('undo')}>
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Redo" onClick={() => stubAction('redo')}>
            <Redo className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" title="Font family">
                <Type className="h-4 w-4 mr-1" />
                Sans Serif
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {fontFamilies.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onSelect={() => stubAction(`font-${font.value}`)}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" title="Font size">
                Normal
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {fontSizes.map((size) => (
                <DropdownMenuItem key={size.value} onSelect={() => stubAction(`size-${size.value}`)}>
                  {size.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Bold" onClick={() => stubAction('bold')}>
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Italic" onClick={() => stubAction('italic')}>
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Underline" onClick={() => stubAction('underline')}>
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Text color" onClick={() => stubAction('color')}>
            <Palette className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Align left" onClick={() => stubAction('align-left')}>
            <AlignLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Align center" onClick={() => stubAction('align-center')}>
            <AlignCenter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Align right" onClick={() => stubAction('align-right')}>
            <AlignRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Numbered list" onClick={() => stubAction('list-numbered')}>
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Bulleted list" onClick={() => stubAction('list-bullet')}>
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Quote" onClick={() => stubAction('quote')}>
            <Quote className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="h-10 flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-2)]">
            <Button
              type="button"
              onClick={handleSend}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              disabled={!canSend}
              className="flex h-9 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-[var(--space-4)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
            <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Attach file">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Insert link">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Insert image">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Insert emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2" title="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] p-1">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    console.log('Print message');
                  }}
                >
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    console.log('Export message');
                  }}
                >
                  Export
                </DropdownMenuItem>
                {(onForward || onOpenCompose) && <DropdownMenuSeparator />}
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
              </DropdownMenuContent>
            </DropdownMenu>
            {onOpenCompose && (
              <button
                type="button"
                className="text-xs text-[var(--text-secondary)] transition-colors hover:underline"
                onClick={onOpenCompose}
              >
                Open in compose
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-[var(--space-1)] flex items-center justify-end pb-0">
        {text.trim() && (
          <button
            type="button"
            className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            onClick={onDiscard}
          >
            Discard draft
          </button>
        )}
      </div>
    </div>
  );
}
