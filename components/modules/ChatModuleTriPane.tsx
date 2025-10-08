"use client";
import React from "react";
import { TriPane } from "../TriPane";
import { PaneHeader } from "../layout/PaneHeader";
import { PaneCaret } from "../dev/PaneCaret";
import { ChatLeftPane } from "./chat/ChatLeftPane";
import { ChatRightPane } from "./chat/ChatRightPane";
import { ChatCenterPane } from "./chat/ChatCenterPane";
import type { Conversation, ConversationAction } from "./chat/types";

const CENTER_MIN_VAR = '--tripane-center-min';

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
  const [{ left: leftPaneVisible, right: rightPaneVisible }, setVisibility] = usePaneVisibilityPersistence(
    'chat:prefs:v1',
    { left: true, right: true }
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

  // Keyboard shortcuts (scoped to Chat viewport)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      if (e.key === "[")  { 
        e.preventDefault(); 
        setLeftPaneVisible(false); 
        console.debug('chat:pane:left:toggle', { visible: false, source: 'keyboard' });
      }
      if (e.key === "]")  { 
        e.preventDefault(); 
        setLeftPaneVisible(true); 
        console.debug('chat:pane:left:toggle', { visible: true, source: 'keyboard' });
      }
      if (e.key === "\\") { 
        e.preventDefault(); 
        setRightPaneVisible(v => {
          const newState = !v;
          console.debug('chat:pane:right:toggle', { visible: newState, source: 'keyboard' });
          return newState;
        }); 
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

// Sample handlers passed to panes
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<string>('gpt-4');
  const [conversations, setConversations] = React.useState<Conversation[]>([
    { id: 'c1', title: 'Design sync', lastMessageSnippet: 'Let\'s review the new mocks', updatedAt: '2025-01-15T10:30:00Z', unread: true, participants: ['You','Alex'] },
    { id: 'c2', title: 'Changelog', lastMessageSnippet: 'Published 0.9.3', updatedAt: '2025-01-14T08:12:00Z', participants: ['You'] },
    { id: 'c3', title: 'Support chat', lastMessageSnippet: 'Issue resolved ✅', updatedAt: '2025-01-13T13:45:00Z', participants: ['You','Sam'] },
  ]);

  const activeConversation = React.useMemo(
    () => conversations.find(conversation => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const onOpenConversation = (id: string) => {
    setActiveConversationId(id);
    console.debug('chat:conversation:open', { id, via: 'pointer' });
  };

  const onSend = (text: string) => {
    console.debug('chat:message:send', { length: text.length });
  };

  const onModelChange = (model: string) => {
    setSelectedModel(model);
    console.debug('chat:model:change', { model });
  };

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
            <PaneHeader>
              <div className="flex items-center justify-between w-full">
                <div className="font-medium">Conversations</div>
                <button
                  className="px-[var(--space-2)] py-[var(--space-1)] rounded bg-transparent text-[color:var(--text-primary)] hover:bg-[var(--hover-bg)]"
                  onClick={() => console.debug('[chat] new conversation')}
                >
                  + New
                </button>
              </div>
            </PaneHeader>
          ) : undefined
        }
        center={<ChatCenterPane conversationId={activeConversationId} onSend={onSend} />}
        centerHeader={
          <PaneHeader className="px-[var(--space-4)]">
            <div className="flex items-center justify-between w-full">
              <div className="truncate">{activeConversationId ? 'Conversation' : 'Chat'}</div>
              <div className="flex items-center gap-[var(--space-3)]">
                <select 
                  className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-2)] py-[var(--space-1)] text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value)}
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5">GPT-3.5</option>
                  <option value="claude">Claude</option>
                </select>
              </div>
            </div>
          </PaneHeader>
        }
        right={
          rightPaneVisible && !isOverlayRight ? (
            <ChatRightPane
              onHidePane={() => setRightPaneVisible(false)}
              selectedModel={selectedModel}
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
              conversation={activeConversation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatModuleTriPane;
