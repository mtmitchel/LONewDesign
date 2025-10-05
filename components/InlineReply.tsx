import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Paperclip, Bold, Italic, Link as LinkIcon, List, MoreHorizontal } from "lucide-react";

type ReplyMode = "reply" | "reply-all";

interface Person { name: string; email: string }

interface InlineReplyProps {
  to: Person[];         // prefilled recipients for reply
  cc?: Person[];
  bcc?: Person[];
  mode?: ReplyMode;     // default: 'reply'
  onChangeMode?: (m: ReplyMode) => void;
  onSend: (payload: { mode: ReplyMode; text: string; cc?: string[]; bcc?: string[] }) => void;
  onDiscard: () => void;          // close if empty, confirm if not
  onOpenCompose?: () => void;     // detach to full composer
}

export function InlineReply({
  to,
  cc = [],
  bcc = [],
  mode: initialMode = "reply",
  onChangeMode,
  onSend,
  onDiscard,
  onOpenCompose
}: InlineReplyProps) {
  const [mode, setMode] = useState<ReplyMode>(initialMode);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { taRef.current?.focus(); }, []);
  useEffect(() => { onChangeMode?.(mode); }, [mode, onChangeMode]);

  const canSend = text.trim().length > 0;

  return (
    <section
      role="group"
      aria-label="Inline reply"
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]"
    >
      <div className="mx-auto w-full max-w-[var(--content-measure)] px-[var(--space-5)] py-[var(--space-4)] space-y-3">

        {/* recipients row (quiet) */}
        <div className="flex items-start gap-2 text-sm">
          <div className="text-[var(--text-tertiary)] pt-1">To</div>
          <div className="flex-1 min-w-0 text-[var(--text-secondary)]">
            <div className="flex flex-wrap gap-2">
              {/* collapsed summary: "Sarah Chen +1" */}
              <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--bg-surface-elevated)]
                               px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                {to[0]?.name ?? to[0]?.email}{to.length > 1 ? ` +${to.length - 1}` : ""}
              </span>
              {mode === "reply-all" && (
                <span className="text-xs text-[var(--text-tertiary)]">(replying to all)</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pl-2">
            <button className="text-[var(--text-secondary)] hover:underline text-xs" onClick={() => setShowCc(v => !v)}>Cc</button>
            <button className="text-[var(--text-secondary)] hover:underline text-xs" onClick={() => setShowBcc(v => !v)}>Bcc</button>
          </div>
        </div>

        {(showCc || showBcc) && (
          <div className="flex items-start gap-2 text-sm -mt-2">
            <div className="text-[var(--text-tertiary)] pt-1 w-6">{showCc ? "Cc" : ""}</div>
            <div className="flex-1 min-w-0">
              {/* stub chips; wire to your real chips later */}
              {showCc && cc.length === 0 && (
                <span className="text-xs text-[var(--text-tertiary)]">Add Cc…</span>
              )}
              {showBcc && bcc.length === 0 && (
                <span className="text-xs text-[var(--text-tertiary)] ml-3">Add Bcc…</span>
              )}
            </div>
          </div>
        )}

        {/* editor card */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] overflow-hidden">
          <textarea
            ref={taRef}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your reply…"
            className="w-full resize-none bg-transparent px-[var(--space-3)] py-[var(--space-2)]
                       min-h-[var(--reply-editor-min-h)] max-h-[var(--reply-editor-max-h)]
                       focus-visible:outline-none"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (canSend) {
                  onSend({ mode, text });
                }
              }
              if (e.key === 'Escape' && !text.trim()) {
                onDiscard();
              }
            }}
          />

          {/* toolbar */}
          <div className="flex items-center justify-between h-[var(--reply-toolbar-h)]
                          border-t border-[var(--border-subtle)] px-2">
            {/* left tools (quiet) */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Attach file"><Paperclip className="w-4 h-4"/></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Bold (Cmd/Ctrl+B)"><Bold className="w-4 h-4"/></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Italic (Cmd/Ctrl+I)"><Italic className="w-4 h-4"/></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert link"><LinkIcon className="w-4 h-4"/></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Bulleted list"><List className="w-4 h-4"/></Button>
            </div>

            {/* middle: reply mode segmented (quiet) */}
            <div className="hidden sm:flex items-center bg-[var(--bg-surface-elevated)]
                            rounded-[var(--segmented-radius)] p-0.5">
              <button
                type="button"
                aria-pressed={mode === "reply"}
                onClick={() => setMode("reply")}
                className={`px-2 h-7 text-xs rounded-[var(--segmented-radius)]
                           ${mode === "reply" ? "bg-[var(--bg-surface)] border border-[var(--border-subtle)]" : "text-[var(--text-secondary)]"}`}
              >Reply</button>
              <button
                type="button"
                aria-pressed={mode === "reply-all"}
                onClick={() => setMode("reply-all")}
                className={`px-2 h-7 text-xs rounded-[var(--segmented-radius)]
                           ${mode === "reply-all" ? "bg-[var(--bg-surface)] border border-[var(--border-subtle)]" : "text-[var(--text-secondary)]"}`}
              >Reply all</button>
            </div>

            {/* right: actions */}
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" title="More options"><MoreHorizontal className="w-4 h-4" /></Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onSend({ mode, text })}
                aria-keyshortcuts="Control+Enter Meta+Enter"
                disabled={!canSend}
                className="min-w-[72px]"
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* quoted toggle */}
        <button className="text-xs text-[var(--text-secondary)] hover:underline">
          Show quoted content
        </button>

        {/* discard/compose links (quiet row) */}
        <div className="flex items-center justify-between pt-1">
          <button className="text-xs text-[var(--text-tertiary)] hover:underline" onClick={onDiscard}>
            Discard draft
          </button>
          {onOpenCompose && (
            <button className="text-xs text-[var(--text-secondary)] hover:underline" onClick={onOpenCompose}>
              Open in compose
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
