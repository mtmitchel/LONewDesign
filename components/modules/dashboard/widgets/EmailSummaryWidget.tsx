"use client";

import React from 'react';
import { Mail, Star, AlertCircle, Archive } from 'lucide-react';
import { ScrollArea } from '../../../ui/scroll-area';
import { Badge } from '../../../ui/badge';
import type { WidgetProps } from '../types';

const mockEmails = [
  {
    id: '1',
    sender: 'Sarah Chen',
    subject: 'Q4 Project Review Meeting',
    preview: 'Hi team, I wanted to schedule our quarterly...',
    time: '2:30 PM',
    isUnread: true,
    isImportant: true
  },
  {
    id: '2',
    sender: 'Marcus Johnson',
    subject: 'Updated design mockups',
    preview: 'I\'ve finished the updated mockups for...',
    time: '11:45 AM',
    isUnread: false,
    isImportant: false
  },
  {
    id: '3',
    sender: 'Emily Rodriguez',
    subject: 'Welcome to the team!',
    preview: 'Welcome aboard! We\'re excited to have...',
    time: 'Yesterday',
    isUnread: true,
    isImportant: false
  },
  {
    id: '4',
    sender: 'Alex Kim',
    subject: 'Budget approval needed',
    preview: 'The Q1 budget proposal is ready for...',
    time: 'Yesterday',
    isUnread: false,
    isImportant: true
  },
  {
    id: '5',
    sender: 'System Notification',
    subject: 'Security update completed',
    preview: 'Your account security has been updated...',
    time: '2 days ago',
    isUnread: true,
    isImportant: false
  }
];

export function EmailSummaryWidget({ widget }: WidgetProps) {
  const showUnread = widget.config.showUnread ?? true;
  const showImportant = widget.config.showImportant ?? true;
  const maxEmails = widget.config.maxEmails || 5;
  
  const unreadCount = mockEmails.filter(email => email.isUnread).length;
  const importantCount = mockEmails.filter(email => email.isImportant).length;
  
  const displayEmails = mockEmails.slice(0, maxEmails);

  return (
    <div className="h-full flex flex-col">
      {/* Email Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-[var(--elevated)] rounded-lg">
          <div className="text-lg font-semibold text-[color:var(--text-primary)]">
            {mockEmails.length}
          </div>
          <div className="text-xs text-[color:var(--text-secondary)]">Total</div>
        </div>
        <div className="text-center p-2 bg-[var(--elevated)] rounded-lg">
          <div className="text-lg font-semibold text-[color:var(--primary)]">
            {unreadCount}
          </div>
          <div className="text-xs text-[color:var(--text-secondary)]">Unread</div>
        </div>
        <div className="text-center p-2 bg-[var(--elevated)] rounded-lg">
          <div className="text-lg font-semibold text-[color:var(--warning)]">
            {importantCount}
          </div>
          <div className="text-xs text-[color:var(--text-secondary)]">Important</div>
        </div>
      </div>

      {/* Recent Emails */}
      <div className="flex-1 min-h-0">
  <div className="text-sm font-medium text-[color:var(--text-primary)] mb-3">
          Recent Emails
        </div>
        <ScrollArea className="h-full">
          <div className="space-y-2">
            {displayEmails.map((email) => (
              <div
                key={email.id}
                className="p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--elevated)] transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Mail size={14} className="text-[color:var(--text-secondary)] flex-shrink-0" />
                      {email.isUnread && (
                        <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
                      )}
                    </div>
                    <span 
                      className={`text-sm truncate ${
                        email.isUnread 
                          ? "font-semibold text-[color:var(--text-primary)]" 
                          : "text-[color:var(--text-secondary)]"
                      }`}
                    >
                      {email.sender}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {email.isImportant && (
                      <Star size={12} className="text-[color:var(--warning)] fill-current" />
                    )}
                    <span className="text-xs text-[color:var(--text-secondary)]">
                      {email.time}
                    </span>
                  </div>
                </div>
                
                <div className="mb-1">
                  <span 
                    className={`text-sm truncate block ${
                      email.isUnread 
                        ? "font-medium text-[color:var(--text-primary)]" 
                        : "text-[color:var(--text-primary)]"
                    }`}
                  >
                    {email.subject}
                  </span>
                </div>
                
                <p className="text-xs text-[color:var(--text-secondary)] truncate">
                  {email.preview}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}