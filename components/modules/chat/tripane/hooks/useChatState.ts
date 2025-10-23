import React from 'react';
import type { ModelOption } from '../types';
import type { Conversation, ChatMessage, ConversationAction } from '../../types';

export interface UseChatStateProps {
  selectedModel: string;
  selectedOption: ModelOption | null;
  MODEL_OPTIONS: ModelOption[];
}

export interface UseChatStateReturn {
  conversations: Conversation[];
  messages: ChatMessage[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  isStreaming: boolean;
  onOpenConversation: (id: string) => void;
  onSend: (message: string, files?: File[]) => void;
  onStartNewConversation: () => void;
  onConversationAction: (action: ConversationAction, conversation: Conversation) => void;
}

export function useChatState({
  selectedModel,
  selectedOption,
  MODEL_OPTIONS,
}: UseChatStateProps): UseChatStateReturn {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);

  const activeConversation = React.useMemo(
    () => conversations.find(c => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const onOpenConversation = React.useCallback((id: string) => {
    setActiveConversationId(id);
    // TODO: Load messages for this conversation
    console.debug('chat:conversation:open', { id });
  }, []);

  const onSend = React.useCallback((message: string, files?: File[]) => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      author: 'user',
      text: message,
      timestamp: new Date().toISOString(),
      conversationId: activeConversationId || 'default',
    };

    setMessages(prev => [...prev, newMessage]);
    setIsStreaming(true);

    console.debug('chat:message:send', { 
      message, 
      files: files?.length || 0,
      conversationId: activeConversationId,
      model: selectedModel 
    });
  }, [activeConversationId, selectedModel]);

  const onStartNewConversation = React.useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      lastMessageSnippet: '',
      updatedAt: new Date().toISOString(),
      model: selectedModel,
      provider: selectedOption?.provider || 'local',
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setMessages([]);

    console.debug('chat:conversation:new', { 
      id: newConversation.id,
      model: selectedModel,
      provider: selectedOption?.provider 
    });
  }, [selectedModel, selectedOption]);

  const onConversationAction = React.useCallback((action: ConversationAction, conversation: Conversation) => {
    switch (action) {
      case 'delete':
        setConversations(prev => prev.filter(c => c.id !== conversation.id));
        if (activeConversationId === conversation.id) {
          setActiveConversationId(null);
          setMessages([]);
        }
        console.debug('chat:conversation:delete', { id: conversation.id });
        break;
      case 'rename':
        // TODO: Implement rename functionality
        console.debug('chat:conversation:rename', { id: conversation.id });
        break;
      case 'pin':
      case 'unpin':
      case 'export-text':
      case 'export-markdown':
      case 'export-json':
      case 'export-pdf':
        // TODO: Implement these actions
        console.debug('chat:conversation:action', { id: conversation.id, action });
        break;
      default:
        console.warn('chat:conversation:unknown-action', { action, id: conversation.id });
    }
  }, [activeConversationId]);

  // Initialize with a default conversation if none exists
  React.useEffect(() => {
    if (conversations.length === 0 && MODEL_OPTIONS.length > 0) {
      onStartNewConversation();
    }
  }, [conversations.length, MODEL_OPTIONS.length, onStartNewConversation]);

  return {
    conversations,
    messages,
    activeConversationId,
    activeConversation,
    isStreaming,
    onOpenConversation,
    onSend,
    onStartNewConversation,
    onConversationAction,
  };
}