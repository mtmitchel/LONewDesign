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
import { invoke } from '@tauri-apps/api/core';

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
    
    // Add local Ollama models
    if (providers.local.enabledModels.length > 0) {
      providers.local.enabledModels.forEach((modelId) => {
        options.push({
          value: modelId,
          label: `Ollama · ${modelId}`,
          provider: 'local',
        });
      });
    }

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
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [unsavedConversationId, setUnsavedConversationId] = React.useState<string | null>(null);

  // Always create a new blank conversation on mount (but don't save it yet)
  React.useEffect(() => {
    const newConversationId = `conv-${Date.now()}`;
    setUnsavedConversationId(newConversationId);
    setActiveConversationId(newConversationId);
  }, []);

  // Auto-select model when switching conversations
  React.useEffect(() => {
    if (activeConversationId) {
      const conversation = conversations.find(c => c.id === activeConversationId);
      if (conversation?.model && conversation.model !== selectedModel) {
        setSelectedModel(conversation.model);
        console.debug('chat:model:auto-selected', { model: conversation.model });
      }
    }
  }, [activeConversationId, conversations]);
  
  // Title generation with proper state management
  React.useEffect(() => {
    const generateTitleForConversation = async (conversationId: string) => {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation || conversation.title !== 'Untitled conversation') {
        return;
      }

      const convMessages = messages.filter(m => m.conversationId === conversationId);
      if (convMessages.length < 2) {
        return;
      }

      const titleMessages = convMessages.slice(0, 2).map(msg => ({
        role: msg.author === 'user' ? 'user' : 'assistant',
        content: msg.text.substring(0, 400) // Increased for better context
      }));

      try {
        console.log('[Title Generation] Starting for conversation:', conversationId);
        
        // Use appropriate provider configuration
        const isMistralModel = selectedModel.startsWith('mistral-') || 
                              selectedModel.startsWith('codestral-') || 
                              selectedModel.startsWith('ministral-');
        const providerType = MODEL_OPTIONS.find(opt => opt.value === selectedModel)?.provider;

        if (providerType === 'local') {
          const baseUrl = providers.local.baseUrl.trim() || 'http://127.0.0.1:11434';
          try {
            const title = await invoke<string>('ollama_complete', {
              baseUrl,
              model: selectedModel,
              messages: [
                {
                  role: 'system',
                  content:
                    'Generate ONLY a concise 3-5 word title for this conversation. Do not include punctuation or quotes.',
                },
                ...titleMessages,
              ],
              temperature: 0.1,
              maxTokens: 32,
            });

            const sanitized = sanitizeTitle(title);
            setConversations(prev =>
              prev.map(conv =>
                conv.id === conversationId
                  ? { ...conv, title: sanitized }
                  : conv,
              ),
            );
            return;
          } catch (err) {
            console.error('[Title Generation] Ollama title failed:', err);
            // fall through to fallback below
          }
        }

        let apiKey: string;
        let baseUrl: string | null;
        let titleModel: string;
        
        if (isMistralModel) {
          apiKey = providers.mistral.apiKey.trim();
          baseUrl = providers.mistral.baseUrl?.trim() || null;
          titleModel = 'mistral-small-latest'; // Fast model for titles
        } else {
          // For OpenRouter and other providers
          if (providerType === 'openrouter') {
            apiKey = providers.openrouter.apiKey.trim();
            baseUrl = 'https://openrouter.ai/api/v1';
            titleModel = 'meta-llama/llama-3.1-8b-instruct:free'; // Free model for titles
          } else if (providerType === 'glm') {
            apiKey = providers.glm.apiKey.trim();
            baseUrl = providers.glm.baseUrl?.trim() || null;
            titleModel = selectedModel;
          } else if (providerType === 'deepseek') {
            apiKey = providers.deepseek.apiKey.trim();
            baseUrl = providers.deepseek.baseUrl?.trim() || null;
            titleModel = selectedModel;
          } else {
            // Default to openai
            apiKey = providers.openai.apiKey.trim();
            baseUrl = providers.openai.baseUrl?.trim() || null;
            titleModel = 'gpt-3.5-turbo';
          }
        }
        
        const title = await invoke('generate_conversation_title', {
          apiKey: apiKey,
          baseUrl: baseUrl,
          model: titleModel,
          messages: titleMessages,
        });

        console.log('[Title Generation] Received title:', title);
        
        if (title && typeof title === 'string') {
          const sanitized = sanitizeTitle(title);
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, title: sanitized }
                : conv
            )
          );
        }
      } catch (error) {
        console.error('[Title Generation] Failed:', error);
        // Fallback: Use first user message as title
        const firstUserMsg = convMessages.find(m => m.author === 'user');
        if (firstUserMsg) {
          const fallbackTitle = firstUserMsg.text
            .substring(0, 50)
            .replace(/[^\w\s]/g, '')
            .trim();
          if (fallbackTitle.length > 3) {
            setConversations(prev =>
              prev.map(conv =>
                conv.id === conversationId
                  ? { ...conv, title: fallbackTitle.substring(0, 30) + (fallbackTitle.length > 30 ? '...' : '') }
                  : conv
              )
            );
          }
        }
      }
    };

    // Trigger title generation when conversation gets its second message
    if (activeConversationId && !isStreaming) {
      const convMessages = messages.filter(m => m.conversationId === activeConversationId);
      const conversation = conversations.find(c => c.id === activeConversationId);
      
      if (conversation && conversation.title === 'Untitled conversation' && convMessages.length >= 2) {
        // Check if the last message has content (streaming is done)
        const lastMessage = convMessages[convMessages.length - 1];
        if (lastMessage && lastMessage.text && lastMessage.text.length > 0) {
          generateTitleForConversation(activeConversationId);
        }
      }
    }
  }, [messages, conversations, activeConversationId, isStreaming, selectedModel, providers]);

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

  const activeConversation = React.useMemo(() => {
    const found = conversations.find(conversation => conversation.id === activeConversationId);
    if (found) return found;
    
    // If this is an unsaved conversation, create a virtual conversation object
    if (unsavedConversationId === activeConversationId) {
      return {
        id: activeConversationId,
        title: 'Untitled conversation',
        model: selectedModel,
        timestamp: new Date().toISOString(),
        lastMessagePreview: '',
      };
    }
    
    return null;
  }, [conversations, activeConversationId, unsavedConversationId, selectedModel]);

  const onOpenConversation = (id: string) => {
    setActiveConversationId(id);
    console.debug('chat:conversation:open', { id, via: 'pointer' });
  };

  const onSend = async (text: string) => {
    if (!activeConversationId) return;
    
    // If this is an unsaved conversation, save it now
    if (unsavedConversationId === activeConversationId) {
      const newConversation: Conversation = {
        id: activeConversationId,
        title: 'Untitled conversation',
        model: selectedModel,
        timestamp: new Date().toISOString(),
        lastMessagePreview: text,
      };
      setConversations(prev => [newConversation, ...prev]);
      setUnsavedConversationId(null);
    }
    
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
              model: selectedModel, // Update model used
              provider: MODEL_OPTIONS.find(opt => opt.value === selectedModel)?.provider,
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
      setIsStreaming(true);
      
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
            setIsStreaming(false);
            unlisten();
            // Title generation is now handled by the useEffect hook
          } else if (payload.event === 'error') {
            console.error('Mistral stream error:', payload.error);
            toast.error(payload.error ?? 'Streaming failed');
            setIsStreaming(false);
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
        setIsStreaming(false);
        
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      }
    } else if (providerType === 'local') {
      const baseUrl = providers.local.baseUrl.trim() || 'http://127.0.0.1:11434';
      const assistantMessageId = `m-${Date.now() + 1}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        conversationId: activeConversationId,
        author: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);

      try {
        const { invoke, listen } = await Promise.all([
          import('@tauri-apps/api/core').then(m => ({ invoke: m.invoke })),
          import('@tauri-apps/api/event').then(m => ({ listen: m.listen })),
        ]).then(([core, event]) => ({ ...core, ...event }));

        const eventName = `ollama-stream-${assistantMessageId}`;
        let accumulatedText = '';

        const unlisten = await listen<StreamEvent>(eventName, (event) => {
          const payload = event.payload;

          if (payload.event === 'delta' && payload.content) {
            accumulatedText += payload.content;
            const sanitizedText = stripMarkdown(sanitizeLLMText(accumulatedText));
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, text: sanitizedText }
                  : msg
              )
            );
          } else if (payload.event === 'done') {
            setIsStreaming(false);
            unlisten();
          } else if (payload.event === 'error') {
            console.error('[OLLAMA] Stream error:', payload.error);
            toast.error(payload.error ?? 'Streaming failed');
            setIsStreaming(false);
            unlisten();
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          }
        });

        const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);
        const apiMessages = [...conversationMessages, userMessage].map(m => ({
          role: m.author === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

        await invoke('ollama_chat_stream', {
          windowLabel: 'main',
          eventName,
          baseUrl,
          model: selectedModel,
          messages: apiMessages,
        });
      } catch (error) {
        console.error('[OLLAMA] Failed to start stream:', error);
        toast.error(`Failed to connect to Ollama: ${error instanceof Error ? error.message : String(error)}`);
        setIsStreaming(false);
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
      setIsStreaming(true);
      
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
            setIsStreaming(false);
            unlisten();
            // Title generation is now handled by the useEffect hook
          } else if (payload.event === 'error') {
            console.error(`[${providerType.toUpperCase()}] Stream error:`, payload.error);
            toast.error(payload.error || `Stream error from ${providerType.toUpperCase()}`);
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
            setIsStreaming(false);
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
        setIsStreaming(false);
        
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
        model: selectedModel, // Store current model
        provider: MODEL_OPTIONS.find(opt => opt.value === selectedModel)?.provider,
      },
      ...prev,
    ]);
    setActiveConversationId(id);
    console.debug('chat:conversation:new', { id });
  }, [setActiveConversationId, setConversations, selectedModel]);

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
            isStreaming={isStreaming}
            modelName={selectedModelLabel}
          />
        }
        centerHeader={
          <PaneHeader className="px-[var(--space-4)]">
            <div className="flex w-full items-center justify-between gap-[var(--space-3)]">
              <div className="min-w-0 truncate text-[color:var(--text-primary)]">
                {activeConversation?.title ?? 'Chat'}
              </div>
              <div className="flex items-center gap-[var(--space-2)]">
                <div className="flex items-center gap-[var(--space-2)] text-xs font-medium text-[color:var(--text-tertiary)]">
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
