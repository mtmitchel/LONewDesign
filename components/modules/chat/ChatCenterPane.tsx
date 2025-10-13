import * as React from 'react';
import { ArrowDown, Braces, Check, Copy, Paperclip, Pencil, RefreshCw, Send } from 'lucide-react';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../ui/utils';
import type { ChatMessage } from './types';
import { ThinkingIndicator, StreamingIndicator } from './ThinkingIndicator';

interface ChatCenterPaneProps {
  conversationId: string | null;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onStartNewConversation: () => void;
  onAttachFiles?: (files: FileList) => void;
  onRegenerateMessage?: (message: ChatMessage) => void;
  onEditMessage?: (message: ChatMessage) => void;
  isStreaming?: boolean;
  modelName?: string;
}

export function ChatCenterPane({
  conversationId,
  messages,
  onSend,
  onStartNewConversation,
  onAttachFiles,
  onRegenerateMessage,
  onEditMessage,
  isStreaming = false,
  modelName = 'Assistant',
}: ChatCenterPaneProps) {
  const [text, setText] = React.useState('');
  const [showScrollToLatest, setShowScrollToLatest] = React.useState(false);
  const [copiedMessageIds, setCopiedMessageIds] = React.useState<Set<string>>(new Set());
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);
  const composerRef = React.useRef<HTMLDivElement | null>(null);
  const [composerHeight, setComposerHeight] = React.useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = React.useState('');

  const filteredMessages = React.useMemo(
    () => messages.filter(message => message.conversationId === conversationId),
    [messages, conversationId]
  );

  const scrollToLatest = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
  }, []);

  const resetTextareaHeight = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const computed = window.getComputedStyle(document.documentElement);
    const maxRows = Number(computed.getPropertyValue('--chat-composer-max-rows')) || 8;
    const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight || '20');
    const maxHeight = lineHeight * maxRows;
    const nextHeight = Math.min(maxHeight, textarea.scrollHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  React.useEffect(() => {
    resetTextareaHeight();
  }, [text, resetTextareaHeight]);

  // Auto-focus textarea when conversation changes or on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversationId]);

  React.useEffect(() => {
    if (!conversationId) return;
    scrollToLatest('auto');
  }, [conversationId, filteredMessages.length, scrollToLatest]);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const handleScroll = () => {
      const threshold = 120;
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      setShowScrollToLatest(distance > threshold);
    };
    node.addEventListener('scroll', handleScroll);
    return () => node.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSend = React.useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    resetTextareaHeight();
    window.requestAnimationFrame(() => scrollToLatest('smooth'));
  }, [onSend, resetTextareaHeight, scrollToLatest, text]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd+Enter: insert line break (default behavior)
        return;
      }
      // Plain Enter: send message
      event.preventDefault();
      handleSend();
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length && onAttachFiles) {
      onAttachFiles(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopyMessage = React.useCallback(async (message: ChatMessage) => {
    const content = message.text;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setLiveAnnouncement('Message copied to clipboard');
      
      // Show checkmark briefly
      setCopiedMessageIds(prev => new Set(prev).add(message.id));
      setTimeout(() => {
        setCopiedMessageIds(prev => {
          const next = new Set(prev);
          next.delete(message.id);
          return next;
        });
      }, 2000);
    } catch (error) {
      console.error('chat:message:copy:error', error);
      setLiveAnnouncement('Copy failed');
    }
  }, []);

  const handleRegenerate = React.useCallback(
    (message: ChatMessage) => {
      onRegenerateMessage?.(message);
      setLiveAnnouncement('Regenerating response');
    },
    [onRegenerateMessage]
  );

  const handleEdit = React.useCallback(
    (message: ChatMessage) => {
      if (onEditMessage) {
        onEditMessage(message);
      } else {
        console.debug('chat:message:edit', { id: message.id });
      }
      setLiveAnnouncement('Editing message');
    },
    [onEditMessage]
  );

  React.useEffect(() => {
    setLiveAnnouncement(filteredMessages.length ? 'Message list updated' : '');
  }, [filteredMessages.length]);

  React.useEffect(() => {
    if (!composerRef.current) return;
    const updateHeight = () => setComposerHeight(composerRef.current?.offsetHeight ?? 0);
    updateHeight();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setComposerHeight(entry.contentRect.height);
      }
    });
    observer.observe(composerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const renderEmptyState = () => (
    <div className="mx-auto max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--chat-empty-bg)] px-[var(--space-6)] py-[var(--space-6)] text-center">
      <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">No conversation selected</h3>
      <Button
        className="mt-[var(--space-4)]"
        size="lg"
        onClick={onStartNewConversation}
      >
        New chat
      </Button>
    </div>
  );

  const renderMessageBubble = (message: ChatMessage) => {
    const isUser = message.author === 'user';
    const alignment = isUser ? 'items-end' : 'items-start';
    const bubbleClasses = cn(
      'max-w-[var(--chat-bubble-max-w)] rounded-[var(--radius-lg)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] shadow-none',
      isUser
        ? 'bg-[color-mix(in_oklab,var(--primary) 14%, transparent)] text-[color:var(--text-primary)]'
        : 'bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)]'
    );

    const timestamp = new Date(message.timestamp);
    const formattedTime = Number.isNaN(timestamp.getTime())
      ? message.timestamp
      : new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(timestamp);

    const actionAlignment = isUser ? 'justify-end' : 'justify-start';

    return (
      <div key={message.id} className={cn('group flex flex-col gap-[var(--space-1)]', alignment)}>
        <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
          <div className={cn(bubbleClasses, 'whitespace-pre-wrap')}>{message.text}</div>
        </div>
        <div
          className={cn(
            'mt-[var(--space-1)] flex items-center gap-[var(--space-1)] text-[color:var(--text-tertiary)] transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
            actionAlignment,
            isUser
              ? 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
              : 'opacity-100'
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 px-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            onClick={() => handleCopyMessage(message)}
            aria-label="Copy message"
          >
            {copiedMessageIds.has(message.id) ? (
              <Check className="h-3.5 w-3.5 text-[color:var(--success)]" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
          {isUser ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 px-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              onClick={() => handleEdit(message)}
              aria-label="Edit message"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          {!isUser ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 px-0 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              onClick={() => handleRegenerate(message)}
              aria-label="Regenerate response"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col" onDrop={handleDrop} onDragOver={handleDragOver}>
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto px-[var(--space-6)] pt-[var(--space-5)] pb-0"
        style={{ paddingBottom: `calc(var(--space-5) + ${composerHeight}px)` }}
      >
        {!conversationId ? (
          <div className="flex h-full items-center justify-center">{renderEmptyState()}</div>
        ) : filteredMessages.length ? (
          <div className="flex flex-col space-y-[var(--chat-bubble-gap-y)]">
            {filteredMessages.map(renderMessageBubble)}
            {isStreaming && (
              <div className="flex items-start gap-[var(--space-2)] px-[var(--space-2)]">
                <StreamingIndicator modelName={modelName} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[color:var(--text-secondary)]">
            Start the conversation by sending a message.
          </div>
        )}

        {showScrollToLatest ? (
          <Button
            variant="ghost"
            size="sm"
            className="pointer-events-auto absolute bottom-[var(--space-4)] right-[var(--space-4)] gap-[var(--space-1)] rounded-full bg-[var(--bg-surface)]/90 shadow-[var(--elevation-sm)] backdrop-blur"
            onClick={() => scrollToLatest('smooth')}
          >
            <ArrowDown className="h-4 w-4" />
            Jump to present
          </Button>
        ) : null}
      </div>

      <div ref={composerRef} className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-3)]">
        <div className="flex items-end gap-[var(--space-2)]">
          <div className="flex items-center gap-[var(--space-1)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[color:var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--primary)]"
                  onClick={handleAttachmentClick}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach files</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-9 w-9 text-[color:var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--primary)] lg:flex"
                  aria-label="Insert code block"
                >
                  <Braces className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Insert code block</TooltipContent>
            </Tooltip>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={event => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            onInput={resetTextareaHeight}
            placeholder="Type a message"
            rows={1}
            className="flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="solid"
                size="icon"
                onClick={handleSend}
                disabled={!text.trim()}
                className={cn(
                  'h-9 w-9 bg-[var(--primary)] text-white transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--primary-hover)]',
                  'disabled:bg-[var(--primary)] disabled:text-white disabled:opacity-60 disabled:hover:bg-[var(--primary)]'
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Send (Enter) • New line (Ctrl+Enter)</TooltipContent>
          </Tooltip>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={event => {
            if (event.target.files && onAttachFiles) {
              onAttachFiles(event.target.files);
            }
            event.target.value = '';
          }}
        />
      </div>

      <div ref={liveRegionRef} aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>
    </div>
  );
}
