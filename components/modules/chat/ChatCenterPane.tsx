import * as React from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '../../ui/button';

export function ChatCenterPane({ conversationId, onSend }: { conversationId: string | null; onSend: (text: string) => void; }) {
  const [text, setText] = React.useState('');

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim()) {
        onSend(text);
        setText('');
      }
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-[var(--space-4)]">
        {!conversationId ? (
          <div className="text-[color:var(--text-secondary)]">Select a conversation to start chatting.</div>
        ) : (
          <div className="space-y-[var(--space-3)]">
            {/* Placeholder messages */}
            <div className="p-[var(--space-3)] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] w-fit">Hello!</div>
            <div className="p-[var(--space-3)] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] w-fit ml-auto">Hi there.</div>
          </div>
        )}
      </div>
      <div className="border-t border-[var(--border-subtle)] p-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[color:var(--text-secondary)] hover:text-[color:var(--primary)] hover:bg-[var(--hover-bg)]"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message"
            className="flex-1 h-[calc(var(--field-height)*1.5)] resize-none rounded-[var(--radius-md)] border border-[var(--border-default)] p-[var(--space-2)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          />
          <Button
            variant="solid"
            size="icon"
            onClick={handleSend}
            disabled={!text.trim()}
            className="h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
