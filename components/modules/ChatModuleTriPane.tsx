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
import { sanitizeLLMText, sanitizeTitle, stripMarkdown } from "../assistant/services/llmSanitizer";

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
  
  // Build model options dynamically from enabled models across all providers
  const MODEL_OPTIONS = React.useMemo(() => {
    const options: Array<{ value: string; label: string; provider: string }> = [];
    
    // Add enabled Mistral models
    providers.mistral.enabledModels.forEach(modelId => {
      options.push({
        value: modelId,
        label: modelId.replace('mistral-', 'Mistral ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        provider: "mistral",
      });
    });
    
    // Add GLM models if configured
    if (providers.glm.apiKey.trim() && providers.glm.defaultModel) {
      options.push({
        value: providers.glm.defaultModel,
        label: 'GLM-4.6',
        provider: 'glm',
      });
    }
    
    // Add OpenAI models if configured
    if (providers.openai.apiKey.trim()) {
      providers.openai.enabledModels.forEach(modelId => {
        options.push({
          value: modelId,
          label: modelId,
          provider: 'openai',
        });
      });
    }
    
    // Add DeepSeek models if configured
    if (providers.deepseek.apiKey.trim()) {
      providers.deepseek.enabledModels.forEach(modelId => {
        options.push({
          value: modelId,
          label: modelId,
          provider: 'deepseek',
        });
      });
    }
    
    // Add OpenRouter models if configured
    if (providers.openrouter.apiKey.trim()) {
      // Always add OpenRouter Auto (smart routing)
      options.push({
        value: 'openrouter/auto',
        label: 'OpenRouter Auto',
        provider: 'openrouter',
      });
      
      // Add any additional enabled models
      providers.openrouter.enabledModels
        .filter(modelId => modelId !== 'openrouter/auto')
        .forEach(modelId => {
          options.push({
            value: modelId,
            label: modelId.replace('openrouter/', '').replace(/-/g, ' ').replace(/\//g, ' / '),
            provider: 'openrouter',
          });
        });
    }
    
    return options;
  }, [providers]);
  
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
    // Try to find the first available model from any provider
    if (providers.mistral.enabledModels[0]) return providers.mistral.enabledModels[0];
    if (providers.glm.apiKey.trim() && providers.glm.defaultModel) return providers.glm.defaultModel;
    if (providers.openrouter.apiKey.trim()) return 'openrouter/auto';
    if (providers.openai.enabledModels[0]) return providers.openai.enabledModels[0];
    if (providers.deepseek.enabledModels[0]) return providers.deepseek.enabledModels[0];
    return '';
  });
  const selectedModelLabel = React.useMemo(() => {
    const match = MODEL_OPTIONS.find(option => option.value === selectedModel);
    return match ? match.label : selectedModel;
  }, [selectedModel]);
  const modelAnnouncement = React.useMemo(
    () => `Model set to ${selectedModelLabel}`,
    [selectedModelLabel]
  );
  // LocalStorage helpers
  const loadConversationsFromStorage = (): Conversation[] => {
    try {
      const stored = localStorage.getItem('chat-conversations');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn('Failed to load conversations from localStorage:', err);
      return [];
    }
  };

  const loadMessagesFromStorage = (): ChatMessage[] => {
    try {
      const stored = localStorage.getItem('chat-messages');
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn('Failed to load messages from localStorage:', err);
      return [];
    }
  };

  const [conversations, setConversations] = React.useState<Conversation[]>(() => loadConversationsFromStorage());
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => loadMessagesFromStorage());

  // Auto-save to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('chat-conversations', JSON.stringify(conversations));
    } catch (err) {
      console.warn('Failed to save conversations to localStorage:', err);
    }
  }, [conversations]);

  React.useEffect(() => {
    try {
      localStorage.setItem('chat-messages', JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save messages to localStorage:', err);
    }
  }, [messages]);

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
    
    // Detect which provider this model belongs to
    const selectedOption = MODEL_OPTIONS.find(opt => opt.value === selectedModel);
    const providerType = selectedOption?.provider || 'mistral';
    
    // Handle streaming based on provider type
    if (providerType === 'mistral' && isMistralModel(selectedModel)) {
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
            // Sanitize and strip markdown for display
            const sanitizedText = stripMarkdown(sanitizeLLMText(accumulatedText));
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, text: sanitizedText }
                  : msg
              )
            );
          } else if (payload.event === 'done') {
            console.debug('Mistral stream completed');
            unlisten();
            
            // Generate title after first exchange (if title is still "Untitled conversation")
            const currentConv = conversations.find(c => c.id === activeConversationId);
            if (currentConv && currentConv.title === 'Untitled conversation') {
              const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);
              // Include only messages up to and including the user's message
              // Mistral API requires last message to be from user, not assistant
              const allMessages = [...conversationMessages, userMessage];
              
              if (allMessages.length >= 1) {
                // Generate title in background
                invoke('generate_conversation_title', {
                  apiKey: mistralConfig.apiKey.trim(),
                  baseUrl: mistralConfig.baseUrl.trim() || null,
                  model: selectedModel,
                  messages: allMessages.map(m => ({
                    role: m.author === 'user' ? 'user' : 'assistant',
                    content: m.text,
                  })),
                }).then((title) => {
                  // Sanitize the generated title
                  const sanitized = sanitizeTitle(title as string);
                  setConversations(prev =>
                    prev.map(conv =>
                      conv.id === activeConversationId
                        ? { ...conv, title: sanitized }
                        : conv
                    )
                  );
                }).catch((error) => {
                  console.error('Failed to generate title:', error);
                });
              }
            }
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
    } else if (['glm', 'openai', 'deepseek', 'openrouter'].includes(providerType)) {
      // Handle OpenAI-compatible providers (GLM, OpenAI, DeepSeek, OpenRouter)
      const providerConfig = providers[providerType as 'glm' | 'openai' | 'deepseek' | 'openrouter'];
      
      if (!providerConfig.apiKey.trim()) {
        toast.error(`Please configure your ${providerType.toUpperCase()} API key in Settings`);
        return;
      }
      
      console.log(`[${providerType.toUpperCase()}] Config:`, {
        apiKey: `${providerConfig.apiKey.substring(0, 10)}...`,
        baseUrl: providerConfig.baseUrl,
        model: selectedModel
      });
      
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
        
        const eventName = `openai-stream-${assistantMessageId}`;
        let accumulatedText = '';
        
        // Set up event listener
        const unlisten = await listen<StreamEvent>(eventName, (event) => {
          const payload = event.payload;
          
          if (payload.event === 'delta' && payload.content) {
            accumulatedText += payload.content;
            // Sanitize and strip markdown for display
            const sanitizedText = stripMarkdown(sanitizeLLMText(accumulatedText));
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, text: sanitizedText }
                  : msg
              )
            );
          } else if (payload.event === 'done') {
            unlisten();
            
            // Generate title if this is the first exchange
            const currentConv = conversations.find(c => c.id === activeConversationId);
            if (currentConv && currentConv.title === 'Untitled conversation') {
              const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);
              const allMessages = [...conversationMessages, userMessage];
              
              if (allMessages.length >= 1) {
                // Generate title using the selected provider
                // For OpenRouter and other OpenAI-compatible providers
                invoke('generate_conversation_title', {
                  apiKey: providerConfig.apiKey.trim(),
                  baseUrl: providerConfig.baseUrl?.trim() || null,
                  model: selectedModel || providerConfig.defaultModel,
                    messages: allMessages.map(m => ({
                      role: m.author === 'user' ? 'user' : 'assistant',
                      content: m.text,
                    })),
                  }).then((title) => {
                    const sanitized = sanitizeTitle(title as string);
                    setConversations(prev =>
                      prev.map(conv =>
                        conv.id === activeConversationId
                          ? { ...conv, title: sanitized }
                          : conv
                      )
                    );
                }).catch((error) => {
                  console.error('Failed to generate title:', error);
                });
              }
            }
          } else if (payload.event === 'error') {
            console.error(`[${providerType.toUpperCase()}] Stream error:`, payload.error);
            toast.error(payload.error || `Stream error from ${providerType.toUpperCase()}`);
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
            unlisten();
          }
        });
        
        // Build API messages
        const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);
        const apiMessages = [...conversationMessages, userMessage].map(m => ({
          role: m.author === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        
        // Prepare baseUrl (ensure non-empty string or null)
        const baseUrl = providerConfig.baseUrl && providerConfig.baseUrl.trim() ? providerConfig.baseUrl.trim() : null;
        console.log(`[${providerType.toUpperCase()}] Calling openai_chat_stream with baseUrl:`, baseUrl);
        
        // Invoke streaming
        await invoke('openai_chat_stream', {
          windowLabel: 'main',
          eventName: eventName,
          apiKey: providerConfig.apiKey.trim(),
          baseUrl: baseUrl,
          model: selectedModel,
          messages: apiMessages,
        });
      } catch (error) {
        console.error(`[${providerType.toUpperCase()}] Failed to start stream:`, error);
        toast.error(`Failed to connect to ${providerType.toUpperCase()}: ${error}`);
        
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    } else {
      toast.error('Selected model is not supported for streaming yet');
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
