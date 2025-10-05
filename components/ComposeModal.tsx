import React, { useState } from 'react';
import { X, Paperclip, Send, Smile, Image, Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (draft: ComposeDraft) => void;
  onSaveDraft?: (draft: ComposeDraft) => void;
  initialDraft?: Partial<ComposeDraft>;
  mode?: 'compose' | 'reply' | 'forward';
  replyToEmail?: {
    subject: string;
    sender: { name: string; email: string };
    content?: string;
  };
}

export interface ComposeDraft {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  attachments: File[];
}

export function ComposeModal({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  initialDraft = {},
  mode = 'compose',
  replyToEmail
}: ComposeModalProps) {
  const [draft, setDraft] = useState<ComposeDraft>({
    to: initialDraft.to || [],
    cc: initialDraft.cc || [],
    bcc: initialDraft.bcc || [],
    subject: initialDraft.subject || (mode === 'reply' && replyToEmail ? `Re: ${replyToEmail.subject}` : ''),
    content: initialDraft.content || '',
    attachments: initialDraft.attachments || []
  });

  const [showCc, setShowCc] = useState(draft.cc.length > 0);
  const [showBcc, setShowBcc] = useState(draft.bcc.length > 0);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    onSend?.(draft);
    onClose();
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(draft);
  };

  const addRecipient = (email: string, field: 'to' | 'cc' | 'bcc') => {
    if (email.trim() && !draft[field].includes(email.trim())) {
      setDraft(prev => ({
        ...prev,
        [field]: [...prev[field], email.trim()]
      }));
    }
  };

  const removeRecipient = (email: string, field: 'to' | 'cc' | 'bcc') => {
    setDraft(prev => ({
      ...prev,
      [field]: prev[field].filter(e => e !== email)
    }));
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'reply':
        return 'Reply';
      case 'forward':
        return 'Forward';
      default:
        return 'New Message';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Compose Modal - Centered, no horizontal scroll */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div 
          className="w-[var(--compose-modal-width)] max-w-[90vw] min-h-[var(--compose-modal-height)] max-h-[90vh] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header - 48px height */}
          <div className="h-[var(--compose-toolbar-height)] bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-4 flex items-center justify-between flex-shrink-0 rounded-t-[var(--radius-md)]">
            <h3 className="font-[var(--font-weight-medium)] text-[var(--text-primary)]">
              {getModalTitle()}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSaveDraft}>
                Save Draft
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Compose Fields */}
          <div className="px-4 py-3 space-y-3 border-b border-[var(--border-default)]">
            
            {/* To Field */}
            <div className="flex items-center gap-3">
              <label className="w-12 text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                To:
              </label>
              <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[32px]">
                {draft.to.map((email, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-[var(--primary-tint-10)] text-[var(--primary)]"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email, 'to')}
                      className="ml-1 hover:text-[var(--accent-coral)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                      e.preventDefault();
                      addRecipient(toInput, 'to');
                      setToInput('');
                    }
                  }}
                  placeholder={draft.to.length === 0 ? "Enter recipients..." : ""}
                  className="border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 flex-1 min-w-[120px]"
                />
              </div>
              <div className="flex gap-1">
                {!showCc && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowCc(true)}
                    className="text-[var(--text-sm)] p-1 h-6"
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowBcc(true)}
                    className="text-[var(--text-sm)] p-1 h-6"
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>

            {/* CC Field */}
            {showCc && (
              <div className="flex items-center gap-3">
                <label className="w-12 text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                  Cc:
                </label>
                <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[32px]">
                  {draft.cc.map((email, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-[var(--primary-tint-10)] text-[var(--primary)]"
                    >
                      {email}
                      <button
                        onClick={() => removeRecipient(email, 'cc')}
                        className="ml-1 hover:text-[var(--accent-coral)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                        e.preventDefault();
                        addRecipient(ccInput, 'cc');
                        setCcInput('');
                      }
                    }}
                    placeholder="Enter CC recipients..."
                    className="border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            )}

            {/* BCC Field */}
            {showBcc && (
              <div className="flex items-center gap-3">
                <label className="w-12 text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                  Bcc:
                </label>
                <div className="flex-1 flex flex-wrap items-center gap-2 min-h-[32px]">
                  {draft.bcc.map((email, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1 bg-[var(--primary-tint-10)] text-[var(--primary)]"
                    >
                      {email}
                      <button
                        onClick={() => removeRecipient(email, 'bcc')}
                        className="ml-1 hover:text-[var(--accent-coral)]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                        e.preventDefault();
                        addRecipient(bccInput, 'bcc');
                        setBccInput('');
                      }
                    }}
                    placeholder="Enter BCC recipients..."
                    className="border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0 flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            )}

            {/* Subject Field */}
            <div className="flex items-center gap-3">
              <label className="w-12 text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-secondary)]">
                Subject:
              </label>
              <Input
                value={draft.subject}
                onChange={(e) => setDraft(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject..."
                className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Rich Text Toolbar - 40px height */}
          <div className="h-10 px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)]">
            <div className="flex items-center gap-1">
              {/* Formatting Tools */}
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Bold className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Italic className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Underline className="w-3 h-3" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Link className="w-3 h-3" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <AlignRight className="w-3 h-3" />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <List className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <ListOrdered className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Message Body - Flexible height with minimum */}
          <div className="flex-1 p-4 min-h-0">
            <Textarea
              value={draft.content}
              onChange={(e) => setDraft(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your message..."
              className="w-full h-full min-h-[var(--compose-editor-min-height)] resize-none border-none shadow-none bg-transparent focus-visible:ring-0"
            />
          </div>

          {/* Attachments */}
          {draft.attachments.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--bg-surface-elevated)]">
              <div className="flex flex-wrap gap-2">
                {draft.attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)]">
                    <Paperclip className="w-3 h-3 text-[var(--text-secondary)]" />
                    <span className="text-[var(--text-sm)] text-[var(--text-primary)]">
                      {file.name}
                    </span>
                    <button
                      onClick={() => {
                        setDraft(prev => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-[var(--text-secondary)] hover:text-[var(--accent-coral)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer - 48px height */}
          <div className="h-[var(--compose-toolbar-height)] bg-[var(--bg-surface)] border-t border-[var(--border-default)] px-4 flex items-center justify-between flex-shrink-0 rounded-b-[var(--radius-md)]">
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSend}
                className="bg-[var(--accent-coral)] hover:bg-[var(--accent-coral-hover)] text-white h-8 px-4"
                disabled={draft.to.length === 0 || !draft.subject.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              
              <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Discard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}