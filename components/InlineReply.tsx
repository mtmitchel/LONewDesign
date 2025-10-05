import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Paperclip, Bold, Italic, Link as LinkIcon, List, MoreHorizontal, ChevronDown } from "lucide-react";

type ReplyMode = "reply" | "reply-all";

interface Person { name: string; email: string }

interface InlineReplyProps {
  to: Person[];
  cc?: Person[];
  bcc?: Person[];
  mode?: ReplyMode;
  onChangeMode?: (m: ReplyMode) => void;
  onSend: (payload: { mode: ReplyMode; text: string; cc?: string[]; bcc?: string[] }) => void;
  onDiscard: () => void;
  onOpenCompose?: () => void;
  onForward?: () => void;
}

export function InlineReply({
  to,
  cc = [],
  bcc = [],
  mode: initialMode = "reply",
  onChangeMode,
  onSend,
  onDiscard,
  onOpenCompose,
  onForward,
}: InlineReplyProps) {
  const [replyMode, setReplyMode] = useState<ReplyMode>(initialMode);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    taRef.current?.focus();
  }, []);
  
  useEffect(() => {
    onChangeMode?.(replyMode);
  }, [replyMode, onChangeMode]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  const canSend = text.trim().length > 0;
  const modeLabel = replyMode === "reply-all" ? "Reply all" : "Reply";

  const focusMenuItem = (key?: string | "first" | "last") => {
    const container = menuRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-menu-key]"));
    if (items.length === 0) return;
    if (key === "first") {
      items[0]?.focus();
      return;
    }
    if (key === "last") {
      items[items.length - 1]?.focus();
      return;
    }
    if (key) {
      const el = container.querySelector<HTMLElement>(`[data-menu-key="${key}"]`);
      if (el) {
        el.focus();
        return;
      }
    }
    items[0]?.focus();
  };

  const openMenu = (focusTarget?: string | "first" | "last") => {
    setIsMenuOpen(true);
    setTimeout(() => focusMenuItem(focusTarget ?? replyMode), 0);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    triggerRef.current?.focus();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!menuRef.current) return;
    const focusables = Array.from(menuRef.current.querySelectorAll<HTMLButtonElement>("[data-menu-key]"));
    if (focusables.length === 0) return;
    const index = focusables.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = focusables[(index + 1) % focusables.length];
      next?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = focusables[(index - 1 + focusables.length) % focusables.length];
      prev?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      focusables[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      focusables[focusables.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(replyMode);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  };

  const selectReplyMode = (mode: ReplyMode) => {
    setReplyMode(mode);
    setIsMenuOpen(false);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const handleForward = () => {
    setIsMenuOpen(false);
    if (onForward) {
      onForward();
    } else if (onOpenCompose) {
      onOpenCompose();
    }
  };

  return (
    <>
      {/* To row */}
      <div className="flex items-center justify-between text-sm mb-[var(--space-2)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <Button
              ref={triggerRef}
              type="button"
              variant="ghost"
              size="compact"
              className="h-7 px-2"
              onClick={() => (isMenuOpen ? closeMenu() : openMenu(replyMode))}
              onKeyDown={handleTriggerKeyDown}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              title="Change reply mode"
            >
              {modeLabel}
              <ChevronDown className="ml-1 h-3 w-3" aria-hidden />
            </Button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                role="menu"
                aria-label="Reply actions"
                className="absolute z-50 mt-1 w-48 rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface)] py-1 shadow-[var(--elevation-sm)]"
                onKeyDown={handleMenuKeyDown}
              >
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={replyMode === "reply"}
                  data-menu-key="reply"
                  onClick={() => selectReplyMode("reply")}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${
                    replyMode === "reply" ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  } hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:bg-[var(--bg-surface-elevated)]`}
                >
                  <span>Reply</span>
                  <span className={`text-[var(--primary)] text-xs ${replyMode === "reply" ? "opacity-100" : "opacity-0"}`}>✓</span>
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={replyMode === "reply-all"}
                  data-menu-key="reply-all"
                  onClick={() => selectReplyMode("reply-all")}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${
                    replyMode === "reply-all" ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                  } hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:bg-[var(--bg-surface-elevated)]`}
                >
                  <span>Reply all</span>
                  <span className={`text-[var(--primary)] text-xs ${replyMode === "reply-all" ? "opacity-100" : "opacity-0"}`}>✓</span>
                </button>
                <div className="my-1 h-px bg-[var(--border-divider)]" aria-hidden />
                <button
                  type="button"
                  role="menuitem"
                  data-menu-key="forward"
                  onClick={handleForward}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:bg-[var(--bg-surface-elevated)]"
                >
                  <span>Forward</span>
                  <span className="text-[var(--text-tertiary)] text-xs">F</span>
                </button>
                {onOpenCompose && (
                  <button
                    type="button"
                    role="menuitem"
                    data-menu-key="open-compose"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCompose();
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] focus-visible:outline-none focus-visible:bg-[var(--bg-surface-elevated)]"
                  >
                    <span>Open in compose</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="text-[var(--text-tertiary)] shrink-0">To</span>
          <span className="inline-flex items-center rounded-[var(--radius-pill)] 
                         bg-[var(--bg-surface-elevated)] px-2 py-0.5 text-xs 
                         text-[var(--text-secondary)]">
            {to[0]?.name ?? to[0]?.email}
            {to.length > 1 ? ` +${to.length - 1}` : ""}
          </span>
          {replyMode === "reply-all" && (
            <span className="text-xs text-[var(--text-tertiary)]">(replying to all)</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[var(--text-secondary)] hover:underline text-xs" onClick={() => setShowCc((prev) => !prev)}>
            Cc
          </button>
          <button className="text-[var(--text-secondary)] hover:underline text-xs" onClick={() => setShowBcc((prev) => !prev)}>
            Bcc
          </button>
        </div>
      </div>

      {/* Cc/Bcc row (if showing) */}
      {(showCc || showBcc) && (
        <div className="flex items-start gap-2 text-sm -mt-1 mb-2">
          <span className="text-[var(--text-tertiary)] pt-1 w-6">
            {showCc && showBcc ? "Cc/Bcc" : showCc ? "Cc" : "Bcc"}
          </span>
          <div className="flex-1 min-w-0">
            {showCc && cc.length === 0 && (
              <span className="text-xs text-[var(--text-tertiary)]">Add Cc…</span>
            )}
            {showBcc && bcc.length === 0 && (
              <span className="text-xs text-[var(--text-tertiary)]">Add Bcc…</span>
            )}
          </div>
        </div>
      )}

      {/* Textarea - subtle elevated background */}
      <textarea
        ref={taRef}
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your reply..."
        className="w-full resize-none bg-[var(--bg-surface-elevated)]
                   border border-[var(--border-subtle)]
                   rounded-[var(--radius-sm)]
                   px-[var(--space-3)] py-[var(--space-2)]
                   min-h-[140px] max-h-[var(--reply-editor-max-h)]
                   focus-visible:outline-none focus-visible:ring-1 
                   focus-visible:ring-[var(--primary-tint-20)]"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (canSend) {
              onSend({ mode: replyMode, text });
            }
          }
          if (e.key === "Escape" && !text.trim()) {
            onDiscard();
          }
        }}
      />

      {/* Toolbar - inline, compact */}
      <div className="flex items-center justify-between mt-[var(--space-2)]">
        <div className="flex items-center gap-2">
          <Button
            variant="solid"
            size="sm"
            onClick={() => onSend({ mode: replyMode, text })}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            disabled={!canSend}
            className="min-w-[72px]"
          >
            Send
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Attach file">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Bold (Cmd/Ctrl+B)">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Italic (Cmd/Ctrl+I)">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Insert link">
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="Bulleted list">
            <List className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="compact" className="h-7 w-7 p-0" title="More options">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          {onOpenCompose && (
            <button
              type="button"
              className="text-xs text-[var(--text-secondary)] hover:underline"
              onClick={onOpenCompose}
            >
              Open in compose
            </button>
          )}
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex items-center justify-between mt-[var(--space-2)]">
        <button className="text-xs text-[var(--text-secondary)] hover:underline">
          Show quoted content
        </button>
        {text.trim() && (
          <button className="text-xs text-[var(--text-tertiary)] hover:underline" onClick={onDiscard}>
            Discard draft
          </button>
        )}
      </div>
    </>
  );
}
