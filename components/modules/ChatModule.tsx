import React, { useState } from 'react';
import { 
  Send, Paperclip, MoreHorizontal, Search, PanelRightClose, PanelRightOpen,
  Bot, Clock, FileText, Download, Copy, Settings, Pin, Edit, Trash,
  ChevronDown, Sparkles, Brain, Zap, Globe, Star, Plus, Archive
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '../ui/context-menu';
import { Badge } from '../ui/badge';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  isPinned: boolean;
  model: string;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isUser: boolean;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Project Planning Help',
    lastMessage: 'Can you help me organize my upcoming projects?',
    timestamp: '2 min ago',
    isPinned: true,
    model: 'Claude'
  },
  {
    id: '2',
    title: 'Writing Assistant',
    lastMessage: 'I need help with drafting a proposal',
    timestamp: '1 hour ago',
    isPinned: false,
    model: 'GPT-4'
  },
  {
    id: '3',
    title: 'Code Review',
    lastMessage: 'Please review this React component',
    timestamp: 'Yesterday',
    isPinned: false,
    model: 'Cursor'
  }
];

const availableModels: AIModel[] = [
  { id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: Sparkles },
  { id: 'gpt4', name: 'GPT-4 Turbo', provider: 'OpenAI', icon: Brain },
  { id: 'cursor', name: 'Cursor AI', provider: 'Cursor', icon: Zap },
  { id: 'gemini', name: 'Gemini Pro', provider: 'Google', icon: Globe }
];

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello! I\'m your AI assistant. I can help you with project planning, writing, coding, and many other tasks. What would you like to work on today?',
    timestamp: '10:30 AM',
    isUser: false
  },
  {
    id: '2',
    content: 'Hi! I have several projects coming up with different deadlines. Can you help me prioritize them and create a timeline?',
    timestamp: '10:32 AM',
    isUser: true
  },
  {
    id: '3',
    content: 'Absolutely! I\'d be happy to help you prioritize your projects. Could you please share the details of your upcoming projects, including their deadlines and estimated time requirements?',
    timestamp: '10:32 AM',
    isUser: false
  }
];

export function ChatModule() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(mockConversations[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel>(availableModels[0]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for sharing that information. Based on your projects and deadlines, I recommend focusing on the marketing campaign first since it has the earliest deadline and depends on the website redesign assets. Would you like me to help you break down these projects into actionable tasks?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: false
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="h-full flex">
      {/* Conversations List Pane */}
      <div className="w-72 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Conversations</h2>
            <Button size="sm" className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Plus size={14} className="mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full pl-9 pr-3 bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] motion-safe:transition-colors duration-[var(--duration-fast)]"
            />
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {/* Pinned Conversations */}
          {mockConversations.filter(c => c.isPinned).length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--elevated)] sticky top-0">
                PINNED
              </div>
              {mockConversations.filter(c => c.isPinned).map((conversation) => (
                <ContextMenu key={conversation.id}>
                  <ContextMenuTrigger>
                    <div
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                        selectedConversation?.id === conversation.id ? 'bg-[var(--primary-tint-10)] border-l-2 border-l-[var(--primary)]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                          {conversation.title}
                        </h4>
                        <span className="text-xs text-[var(--text-secondary)] ml-2">{conversation.timestamp}</span>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>
                      <Pin className="w-4 h-4 mr-2" />
                      Unpin Conversation
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Export as Text
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <FileText className="w-4 h-4 mr-2" />
                      Export as PDF
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </ContextMenuItem>
                    <ContextMenuItem className="text-[var(--error)]">
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}

          {/* Regular Conversations */}
          <div>
            {mockConversations.filter(c => c.isPinned).length > 0 && (
              <div className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--elevated)] sticky top-0">
                ALL CONVERSATIONS
              </div>
            )}
            {mockConversations.filter(c => !c.isPinned).map((conversation) => (
              <ContextMenu key={conversation.id}>
                <ContextMenuTrigger>
                  <div
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${
                      selectedConversation?.id === conversation.id ? 'bg-[var(--primary-tint-10)] border-l-2 border-l-[var(--primary)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                        {conversation.title}
                      </h4>
                      <span className="text-xs text-[var(--text-secondary)] ml-2">{conversation.timestamp}</span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    <Pin className="w-4 h-4 mr-2" />
                    Pin Conversation
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Export as Text
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Markdown
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </ContextMenuItem>
                  <ContextMenuItem className="text-[var(--error)]">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Content Pane */}
      <div className="flex-1 bg-[var(--surface)] flex flex-col">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--elevated)] sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-[var(--text-primary)]">{selectedConversation.title}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <selectedModel.icon size={14} className="text-[var(--primary)] mr-1" />
                    {selectedModel.name}
                    <ChevronDown size={12} className="ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Available Models</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableModels.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={selectedModel.id === model.id ? 'bg-[var(--primary-tint-10)]' : ''}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <model.icon size={16} className="text-[var(--primary)]" />
                        <div className="flex-1">
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-[var(--text-secondary)]">{model.provider}</div>
                        </div>
                        {selectedModel.id === model.id && (
                          <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-4 rounded-lg ${
                    message.isUser
                      ? 'bg-[var(--primary-tint-20)] text-[var(--text-primary)] ml-4'
                      : 'bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-primary)] mr-4'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className={`text-xs text-[var(--text-secondary)] mt-1 ${
                  message.isUser ? 'text-right mr-4' : 'text-left ml-4'
                }`}>
                  {message.timestamp}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'order-1' : 'order-2'}`}>
                {message.isUser ? (
                  <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">You</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-[var(--info)] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">AI</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Message Input */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--elevated)]">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[60px] resize-none bg-[var(--surface)] border-[var(--border-default)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Paperclip size={16} />
              </Button>
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      {contextPanelOpen ? (
        <div className="w-80 bg-[var(--elevated)] border-l border-[var(--border-subtle)] flex flex-col">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Assistant Info</h3>
              <Button variant="ghost" size="sm" onClick={() => setContextPanelOpen(false)}>
                <PanelRightClose size={16} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Assistant Details */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[var(--info)] rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-[var(--text-primary)]">Project Planning Assistant</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Specialized in task organization</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Clock size={14} />
                  <span>Always available</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Star size={14} />
                  <span>Expert knowledge</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <FileText size={14} className="mr-2" />
                  Export conversation
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Download size={14} className="mr-2" />
                  Save as PDF
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Settings size={14} className="mr-2" />
                  Assistant settings
                </Button>
              </div>
            </div>

            {/* Suggested Topics */}
            <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
              <h4 className="font-medium text-[var(--text-primary)] mb-3">Suggested Topics</h4>
              <div className="space-y-2">
                <button className="w-full text-left p-2 text-sm bg-[var(--primary-tint-10)] text-[var(--primary)] rounded hover:bg-[var(--primary-tint-15)] transition-colors">
                  Creating project timelines
                </button>
                <button className="w-full text-left p-2 text-sm bg-[var(--primary-tint-10)] text-[var(--primary)] rounded hover:bg-[var(--primary-tint-15)] transition-colors">
                  Task prioritization methods
                </button>
                <button className="w-full text-left p-2 text-sm bg-[var(--primary-tint-10)] text-[var(--primary)] rounded hover:bg-[var(--primary-tint-15)] transition-colors">
                  Team collaboration tips
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Context Panel - Thin Toggle Bar */
        <div className="w-4 border-l border-[var(--border-subtle)] bg-[var(--elevated)] flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setContextPanelOpen(true)}
            className="h-8 w-full p-0 rounded-none hover:bg-[var(--primary-tint-10)] mt-2"
            title="Show Context Panel"
          >
            <PanelRightOpen size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}