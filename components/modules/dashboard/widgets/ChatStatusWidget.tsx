"use client";

import React from 'react';
import { MessageSquare, User, Circle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { ScrollArea } from '../../../ui/scroll-area';
import { Badge } from '../../../ui/badge';
import type { WidgetProps } from '../types';

const mockConversations = [
  {
    id: '1',
    title: 'Project Planning Assistant',
    lastMessage: 'I can help you organize your tasks for the week.',
    lastActivity: '5 minutes ago',
    status: 'active',
    unreadCount: 2,
    type: 'ai'
  },
  {
    id: '2',
    title: 'Sarah Chen',
    lastMessage: 'The mockups look great! When can we review them?',
    lastActivity: '1 hour ago',
    status: 'online',
    unreadCount: 1,
    type: 'user'
  },
  {
    id: '3',
    title: 'Design Team',
    lastMessage: 'Marcus: Updated the color palette as discussed',
    lastActivity: '2 hours ago',
    status: 'active',
    unreadCount: 3,
    type: 'group'
  },
  {
    id: '4',
    title: 'Emily Rodriguez',
    lastMessage: 'Thanks for the warm welcome! Looking forward to working together.',
    lastActivity: '1 day ago',
    status: 'away',
    unreadCount: 0,
    type: 'user'
  }
];

export function ChatStatusWidget({ widget }: WidgetProps) {
  const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const activeChats = mockConversations.filter(conv => conv.status === 'active' || conv.status === 'online').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-[var(--success)]';
      case 'active': return 'text-[var(--primary)]';
      case 'away': return 'text-[var(--warning)]';
      default: return 'text-[var(--text-secondary)]';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[var(--success)]';
      case 'active': return 'bg-[var(--primary)]';
      case 'away': return 'bg-[var(--warning)]';
      default: return 'bg-[var(--text-secondary)]';
    }
  };

  const getConversationIcon = (type: string, title: string) => {
    if (type === 'ai') {
      return (
        <div className="w-8 h-8 bg-[var(--info)] rounded-full flex items-center justify-center">
          <MessageSquare size={14} className="text-white" />
        </div>
      );
    }
    
    return (
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs bg-[var(--primary-tint-15)] text-[var(--primary)]">
          {title.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="text-center p-2 bg-[var(--elevated)] rounded-lg">
          <div className="text-lg font-semibold text-[var(--primary)]">
            {totalUnread}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Unread</div>
        </div>
        <div className="text-center p-2 bg-[var(--elevated)] rounded-lg">
          <div className="text-lg font-semibold text-[var(--success)]">
            {activeChats}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">Active</div>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 min-h-0">
        <div className="text-sm font-medium text-[var(--text-primary)] mb-3">
          Recent Conversations
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {mockConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--elevated)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    {getConversationIcon(conversation.type, conversation.title)}
                    <div 
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(conversation.status)}`}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {conversation.title}
                        </span>
                        {conversation.type === 'ai' && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 bg-[var(--info)]/10 text-[var(--info)]">
                            AI
                          </Badge>
                        )}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="text-xs bg-[var(--primary)] text-white">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-[var(--text-secondary)] truncate mb-1">
                      {conversation.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-[var(--text-secondary)]" />
                      <span className="text-xs text-[var(--text-secondary)]">
                        {conversation.lastActivity}
                      </span>
                      <Circle size={4} className={`fill-current ${getStatusColor(conversation.status)}`} />
                      <span className={`text-xs capitalize ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}