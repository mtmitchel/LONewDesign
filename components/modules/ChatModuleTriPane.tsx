"use client";
import React from "react";
import { TriPane } from "../TriPane";
import { PaneHeader } from "../layout/PaneHeader";
import { PaneCaret } from "../dev/PaneCaret";
import { ChatLeftPane, ChatLeftPaneHandle } from "./chat/ChatLeftPane";
import { ChatRightPane } from "./chat/ChatRightPane";
import { ChatCenterPane } from "./chat/ChatCenterPane";
import type { ChatMessage, Conversation, ConversationAction } from "./chat/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { openQuickAssistant } from "../assistant";
import { useProviderSettings } from "./settings/state/providerSettings";
import { toast } from "sonner";

const CENTER_MIN_VAR = '--tripane-center-min';

function isMistralModel(model: string): boolean {
  if (!model) return false;
  
  // Check for all Mistral model prefixes
  return model.startsWith('mistral-') || 
         model.startsWith('open-mistral-') || 
         model.startsWith('mixtral-') ||
         model.startsWith('open-mixtral-') ||
         model.startsWith('codestral-') ||
         model.startsWith('devstral-') ||
         model.startsWith('pixtral-') ||
         model.startsWith('voxtral-') ||
         model.startsWith('magistral-') ||
         model.startsWith('ministral-');
}

interface StreamEvent {
  event: 'delta' | 'error' | 'done';
  content?: string;
  finish_reason?: string;
  error?: string;
}

function usePaneVisibilityPersistence(key: string, initial: { left: boolean; right: boolean }) {
  const [state, setState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as { left: boolean; right: boolean };
    } catch {}
    return initial;
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export function ChatModuleTriPane() {
  const { providers } = useProviderSettings();
  
  // Build model options dynamically from enabled models
  const MODEL_OPTIONS = React.useMemo(() => {
    const options: Array<{ value: string; label: string; provider?: string }> = [];
    
    // Add enabled Mistral models
    providers.mistral.enabledModels.forEach(modelId => {
      options.push({
        value: modelId,
        label: modelId.replace('mistral-', 'Mistral ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        provider: "mistral",
      });
    });
    
    return options;
  }, [providers.mistral.enabledModels]);
  
  const [{ left: leftPaneVisible, right: rightPaneVisible }, setVisibility] = usePaneVisibilityPersistence(
    'chat:prefs:v1',
    { left: true, right: false }
  );

  const setLeftPaneVisible = (v: boolean) => setVisibility(prev => ({ ...prev, left: v }));
  const setRightPaneVisible = (v: boolean | ((x: boolean) => boolean)) =>
    setVisibility(prev => ({ ...prev, right: typeof v === 'function' ? (v as any)(prev.right) : v }));

  const railWidth = '20px';
  const collapsedRail = parseFloat(railWidth) || 20;
  const leftPaneWidth = leftPaneVisible ? 'var(--tripane-left-width)' : railWidth;
  const rightPaneWidth = rightPaneVisible ? 'var(--quick-panel-width)' : railWidth;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverlayRight, setIsOverlayRight] = React.useState(false);
  const overlayPanelRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocusRef = React.useRef<Element | null>(null);
  const leftPaneRef = React.useRef<ChatLeftPaneHandle | null>(null);
  const handleOpenAssistant = React.useCallback(() => {
    openQuickAssistant({ scope: { source: 'chat' } });
  }, []);

  // Responsive guard: enforce minimum center width by hiding panes (right first, then left)
  React.useEffect(() => {
    const el = containerRef.current ?? document.documentElement;
    const getPx = (v: string) => parseFloat(getComputedStyle(el).getPropertyValue(v)) || 0;

    const handleResize = () => {
      const centerMin = getPx(CENTER_MIN_VAR) || 640;
      const total = el.clientWidth || window.innerWidth;
      // When very narrow, show right pane as overlay instead of inline
      setIsOverlayRight(total < centerMin);
      // Estimate center width by subtracting pane widths when visible
      const leftW = leftPaneVisible ? getPx('--tripane-left-width') : collapsedRail;
      const rightW = rightPaneVisible && !isOverlayRight ? getPx('--quick-panel-width') : collapsedRail;
      const center = total - leftW - rightW;
      if (center < centerMin) {
        if (rightPaneVisible && !isOverlayRight) {
          setRightPaneVisible(false);
          console.debug('chat:pane:right:toggle', { visible: false, source: 'auto-collapse' });
          return;
        }
        if (leftPaneVisible) {
          setLeftPaneVisible(false);
          console.debug('chat:pane:left:toggle', { visible: false, source: 'auto-collapse' });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsedRail, isOverlayRight, leftPaneVisible, rightPaneVisible]);

// Sample handlers passed to panes
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>(() => {
    return providers.mistral.enabledModels[0] || '';
  });
  const selectedModelLabel = React.useMemo(() => {
    const match = MODEL_OPTIONS.find(option => option.value === selectedModel);
    return match ? match.label : selectedModel;
  }, [selectedModel]);
  const modelAnnouncement = React.useMemo(
    () => `Model set to ${selectedModelLabel}`,
    [selectedModelLabel]
  );
  const [conversations, setConversations] = React.useState<Conversation[]>([
    {
      id: 'c1',
      title: 'Summarize strategy brief',
      lastMessageSnippet: 'Here’s the executive summary you asked for.',
      updatedAt: '2025-01-15T10:30:00Z',
      unread: true,
      pinned: true,
      participants: ['You', 'LibreOllama'],
    },
    {
      id: 'c2',
      title: 'Draft release notes',
      lastMessageSnippet: 'Release notes for 0.9.3 are ready to review.',
      updatedAt: '2025-01-14T08:12:00Z',
      participants: ['You', 'LibreOllama'],
    },
    {
      id: 'c3',
      title: 'Customer follow-up reply',
      lastMessageSnippet: 'Prepared a calm response about the sync fix.',
      updatedAt: '2025-01-13T13:45:00Z',
      participants: ['You', 'LibreOllama'],
    },
  ]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'm1',
      conversationId: 'c1',
      author: 'user',
      text: 'Summarize the attached strategy brief into a concise executive summary with three key takeaways.',
      timestamp: '2025-01-15T09:34:00Z',
    },
    {
      id: 'm2',
      conversationId: 'c1',
      author: 'assistant',
      text: 'Here’s a concise executive summary:\n• Growth focus shifts to onboarding enterprise teams.\n• Automation program reduces manual triage by ~35%.\n• New privacy commitments unlock regulated vertical pilots.',
      timestamp: '2025-01-15T09:35:00Z',
    },
    {
      id: 'm3',
      conversationId: 'c2',
      author: 'user',
      text: 'Draft release notes for LibreOllama Desktop 0.9.3. Highlight the chat refinements and any notable bug fixes in a friendly tone.',
      timestamp: '2025-01-14T08:10:00Z',
    },
    {
      id: 'm4',
      conversationId: 'c2',
      author: 'assistant',
      text: 'Release notes — LibreOllama Desktop 0.9.3\n1. Chat tri-pane polish with smarter composer and quick actions.\n2. Calmer conversation list that keeps pinned threads in view.\n3. Bug fixes for token namespace drift and attachment previews.',
      timestamp: '2025-01-14T08:12:00Z',
    },
    {
      id: 'm5',
      conversationId: 'c3',
      author: 'user',
      text: 'Help me draft a calm reply letting the customer know the sync bug is fixed and we’re still monitoring.',
      timestamp: '2025-01-13T13:38:00Z',
    },
    {
      id: 'm6',
      conversationId: 'c3',
      author: 'assistant',
      text: 'Here’s a friendly response you can send:\n---\nHi Sam,\nThanks for the detailed report last week. We identified the sync break and shipped a fix this morning. Your workspace is already on the patched build, and early telemetry shows the queues clearing. Please keep me posted if you notice anything else—we’ll continue monitoring through Friday.\n---',
      timestamp: '2025-01-13T13:41:00Z',
    },
  ]);

  const activeConversation = React.useMemo(
    () => conversations.find(conversation => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const onOpenConversation = (id: string) => {
    setActiveConversationId(id);
    console.debug('chat:conversation:open', { id, via: 'pointer' });
  };

  const onSend = async (text: string) => {
    if (!activeConversationId) return;
    const now = new Date().toISOString();
    const userMessageId = `m-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      conversationId: activeConversationId,
      author: 'user',
      text,
      timestamp: now,
    };
    setMessages(prev => [...prev, userMessage]);

    setConversations(prev =>
      prev.map(conversation =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              lastMessageSnippet: text,
              updatedAt: now,
              unread: false,
            }
          : conversation
      )
    );

    console.debug('chat:message:send', { conversation: activeConversationId, length: text.length, model: selectedModel });
    
    // Handle Mistral streaming if a Mistral model is selected
    if (isMistralModel(selectedModel)) {
      const mistralConfig = providers.mistral;
      
      if (!mistralConfig.apiKey.trim()) {
        toast.error('Please configure your Mistral API key in Settings');
        return;
      }
      
      // Create placeholder assistant message
      const assistantMessageId = `m-${Date.now() + 1}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        conversationId: activeConversationId,
        author: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      try {
        const { invoke, listen } = await Promise.all([
          import('@tauri-apps/api/core').then(m => ({ invoke: m.invoke })),
          import('@tauri-apps/api/event').then(m => ({ listen: m.listen })),
        ]).then(([core, event]) => ({ ...core, ...event }));
        
        const eventName = `mistral-stream-${assistantMessageId}`;
        let accumulatedText = '';
        
        // Set up event listener
        const unlisten = await listen<StreamEvent>(eventName, (event) => {
          const payload = event.payload;
          
          if (payload.event === 'delta' && payload.content) {
            accumulatedText += payload.content;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, text: accumulatedText }
                  : msg
              )
            );
          } else if (payload.event === 'done') {
            console.debug('Mistral stream completed');
            unlisten();
          } else if (payload.event === 'error') {
            console.error('Mistral stream error:', payload.error);
            toast.error(payload.error ?? 'Streaming failed');
            unlisten();
          }
        });
        
        // Get conversation history for this conversation
        const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);
        const apiMessages = [...conversationMessages, userMessage].map(m => ({
          role: m.author === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        
        // Invoke streaming
        await invoke('mistral_chat_stream', {
          windowLabel: 'main',
          eventName: eventName,
          apiKey: mistralConfig.apiKey.trim(),
          baseUrl: mistralConfig.baseUrl.trim() || null,
          model: selectedModel,
          messages: apiMessages,
        });
      } catch (error) {
        console.error('[MISTRAL] Failed to start stream:', error);
        toast.error(`Failed to connect to Mistral AI: ${error}`);
        
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    }
  };

  const onAttachFiles = (files: FileList) => {
    console.debug('chat:attachments', { count: files.length });
  };

  const onStartNewConversation = React.useCallback(() => {
    const id = `c-${Date.now()}`;
    const createdAt = new Date().toISOString();
    setConversations(prev => [
      {
        id,
        title: 'Untitled conversation',
        lastMessageSnippet: 'Draft a prompt to get started…',
        updatedAt: createdAt,
        participants: ['You'],
        unread: false,
      },
      ...prev,
    ]);
    setActiveConversationId(id);
    console.debug('chat:conversation:new', { id });
  }, [setActiveConversationId, setConversations]);

  const onModelChange = React.useCallback((model: string) => {
    setSelectedModel(model);
    console.debug('chat:model:change', { model });
  }, [setSelectedModel]);

  const onConversationAction = React.useCallback(
    (id: string, action: ConversationAction) => {
      console.debug('chat:conversation:context-action', { id, action });

      if (action === 'delete') {
        setConversations(prev => prev.filter(conversation => conversation.id !== id));
        setActiveConversationId(prev => (prev === id ? null : prev));
        return;
      }

      if (action === 'pin' || action === 'unpin') {
        setConversations(prev =>
          prev.map(conversation =>
            conversation.id === id ? { ...conversation, pinned: action === 'pin' } : conversation
          )
        );
        return;
      }

      if (action === 'rename') {
        if (typeof window === 'undefined') return;
        const current = conversations.find(conversation => conversation.id === id);
        const nextTitle = window.prompt('Rename conversation', current?.title ?? '');
        if (!nextTitle) return;
        setConversations(prev =>
          prev.map(conversation =>
            conversation.id === id ? { ...conversation, title: nextTitle } : conversation
          )
        );
        return;
      }

      console.debug('chat:conversation:export', { id, format: action });
    },
    [conversations, setActiveConversationId, setConversations]
  );

  // Keyboard shortcuts (scoped to Chat viewport)
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const withinChat = containerRef.current?.contains(activeElement ?? null);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (!withinChat) return;
        event.preventDefault();
        if (!leftPaneVisible) {
          setLeftPaneVisible(true);
        }
        window.requestAnimationFrame(() => leftPaneRef.current?.focusSearch());
        return;
      }

      if (!withinChat) return;

      if (event.metaKey || event.ctrlKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField = target?.isContentEditable || tagName === 'input' || tagName === 'textarea';

      if (event.key === '[') {
        event.preventDefault();
        setLeftPaneVisible(false);
        console.debug('chat:pane:left:toggle', { visible: false, source: 'keyboard' });
        return;
      }

      if (event.key === ']') {
        event.preventDefault();
        setLeftPaneVisible(true);
        console.debug('chat:pane:left:toggle', { visible: true, source: 'keyboard' });
        return;
      }

      if (event.key === '\\') {
        event.preventDefault();
        setRightPaneVisible(v => {
          const newState = !v;
          console.debug('chat:pane:right:toggle', { visible: newState, source: 'keyboard' });
          return newState;
        });
        return;
      }

      if (event.key.toLowerCase() === 'n') {
        if (isTypingField) return;
        event.preventDefault();
        onStartNewConversation();
        console.debug('chat:conversation:new', { via: 'keyboard' });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leftPaneVisible, onStartNewConversation, setLeftPaneVisible, setRightPaneVisible]);

  // Focus trap for overlay right pane
  React.useEffect(() => {
    if (!isOverlayRight || !rightPaneVisible) return;
    lastFocusRef.current = document.activeElement;
    const panel = overlayPanelRef.current;
    panel?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = panel?.querySelectorAll<HTMLElement>(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const last = lastFocusRef.current as HTMLElement | null;
      last?.focus();
    };
  }, [isOverlayRight, rightPaneVisible]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <TriPane
        leftWidth={leftPaneWidth}
        rightWidth={rightPaneWidth}
        left={
          leftPaneVisible ? (
            <ChatLeftPane 
              ref={leftPaneRef}
              conversations={conversations} 
              activeId={activeConversationId} 
              onSelect={onOpenConversation}
              onHidePane={() => setLeftPaneVisible(false)}
              onConversationAction={onConversationAction}
            />
          ) : (
            <div className="h-full w-5 min-w-[20px] max-w-[20px] bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer">
              <PaneCaret
                side="left"
                label="Show conversations"
                ariaKeyshortcuts="]"
                onClick={() => setLeftPaneVisible(true)}
              />
            </div>
          )
        }
        leftHeader={
          leftPaneVisible ? (
            <PaneHeader
              label="Conversations"
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="solid"
                  className="gap-[var(--space-1)] px-[var(--space-3)]"
                  onClick={onStartNewConversation}
                  title="New chat (N)"
                  aria-keyshortcuts="KeyN"
                >
                  + New
                </Button>
              }
            />
          ) : undefined
        }
        center={
          <ChatCenterPane
            conversationId={activeConversationId}
            messages={messages}
            onSend={onSend}
            onStartNewConversation={onStartNewConversation}
            onAttachFiles={onAttachFiles}
          />
        }
        centerHeader={
          <PaneHeader className="px-[var(--space-4)]">
            <div className="flex w-full items-center justify-between gap-[var(--space-3)]">
              <div className="min-w-0 truncate text-[color:var(--text-primary)]">
                {activeConversation?.title ?? 'Chat'}
              </div>
              <div className="flex items-center gap-[var(--space-2)]">
                <div className="flex items-center gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-[color:var(--text-tertiary)]">
                  <span>Model</span>
                  <Select value={selectedModel} onValueChange={onModelChange}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectTrigger
                          size="sm"
                          aria-label="Select model for this conversation"
                          className="max-w-[220px] text-[length:var(--text-sm)]"
                        >
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{selectedModelLabel}</TooltipContent>
                    </Tooltip>
                    <SelectContent>
                      {MODEL_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="h-9 bg-[var(--primary)] text-[var(--primary-foreground)] md:hidden"
                  onClick={handleOpenAssistant}
                  aria-keyshortcuts="Meta+K,Control+K"
                >
                  Add
                </Button>
              </div>
            </div>
            <div aria-live="polite" className="sr-only">
              {modelAnnouncement}
            </div>
          </PaneHeader>
        }
        right={
          rightPaneVisible && !isOverlayRight ? (
            <ChatRightPane
              onHidePane={() => setRightPaneVisible(false)}
              selectedModel={selectedModel}
              selectedModelLabel={selectedModelLabel}
              conversation={activeConversation}
            />
          ) : (
            <div className="h-full w-5 min-w-[20px] max-w-[20px] bg-[var(--bg-surface-elevated)] shadow-[-1px_0_0_var(--border-subtle)] flex items-center justify-center cursor-pointer">
              <PaneCaret
                side="right"
                label="Show assistant info"
                ariaKeyshortcuts="\\"
                onClick={() => setRightPaneVisible(true)}
              />
            </div>
          )
        }
      />
      {/* Overlay right pane on small widths */}
      {isOverlayRight && rightPaneVisible && (
        <div className="fixed inset-0 z-40 flex" aria-modal="true" role="dialog">
          <div
            className="flex-1 bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)]"
            onClick={() => setRightPaneVisible(false)}
            aria-hidden
          />
          <div
            ref={overlayPanelRef}
            className="w-[var(--quick-panel-width)] h-full bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] rounded-l-[var(--radius-lg)] shadow-xl z-50 focus:outline-none"
            tabIndex={-1}
          >
            <ChatRightPane
              onHidePane={() => setRightPaneVisible(false)}
              selectedModel={selectedModel}
              selectedModelLabel={selectedModelLabel}
              conversation={activeConversation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatModuleTriPane;
