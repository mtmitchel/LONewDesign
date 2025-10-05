import * as React from "react";
import { X, Minus, ExternalLink, Paperclip, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";

type Chip = { id: string; label: string; email: string };
type ComposeMode = "new" | "reply" | "reply-all" | "forward";

interface ComposeModalProps {
  mode?: ComposeMode;              // default "new"
  subject?: string;
  to?: Chip[];
  cc?: Chip[];
  bcc?: Chip[];
  isOpen: boolean;
  onClose: () => void;
  onPopOut?: () => void;
  onMinimize?: () => void;
  onSend: (payload: {
    mode: ComposeMode;
    to: string[]; cc: string[]; bcc: string[];
    subject: string; body: string;
    attachments: File[];
  }) => void;
}

export default function ComposeModal({
  mode = "new",
  subject: initialSubject = "",
  to = [],
  cc = [],
  bcc = [],
  isOpen,
  onClose,
  onPopOut,
  onMinimize,
  onSend,
}: ComposeModalProps) {
  const [subject, setSubject] = React.useState(initialSubject);
  const [body, setBody] = React.useState("");
  const [toChips, setToChips] = React.useState<Chip[]>(to);
  const [ccChips, setCcChips] = React.useState<Chip[]>(cc);
  const [bccChips, setBccChips] = React.useState<Chip[]>(bcc);
  const [showCc, setShowCc] = React.useState(cc.length > 0);
  const [showBcc, setShowBcc] = React.useState(bcc.length > 0);
  const [attachments, setAttachments] = React.useState<File[]>([]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        doSend();
      }
      if (e.key === "Escape") {
        if (!subject && !body && toChips.length === 0 && attachments.length === 0) onClose();
        // else show confirm (hook up your confirm modal)
      }
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, subject, body, toChips, attachments, onClose]);

  const canSend = body.trim().length > 0 || attachments.length > 0 || subject.trim().length > 0;

  function doSend() {
    if (!canSend) return;
    onSend({
      mode,
      to: toChips.map(c => c.email),
      cc: ccChips.map(c => c.email),
      bcc: bccChips.map(c => c.email),
      subject,
      body,
      attachments,
    });
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-title"
      className="fixed inset-0 pointer-events-none"
    >
      {/* Docked container */}
      <div
        className="pointer-events-auto absolute right-[var(--overlay-gutter)] bottom-[var(--overlay-gutter)]
                   w-[min(var(--compose-max-w),calc(100vw-2*var(--overlay-gutter)))]
                   min-w-[var(--compose-min-w)] max-w-[var(--compose-max-w)]
                   bg-[var(--bg-surface)] border border-[var(--border-subtle)]
                   rounded-[var(--radius-lg)] shadow-[var(--elevation-xl)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-12 px-[var(--modal-inner-x)] border-b border-[var(--border-subtle)]
                        bg-[var(--bg-surface-elevated)] flex items-center justify-between">
          <h2 id="compose-title" className="text-sm font-medium text-[var(--text-secondary)] truncate">
            {subject.trim() ? subject : "New message"}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Minimize" onClick={onMinimize}><Minus className="w-4 h-4"/></Button>
            <Button variant="ghost" size="icon" title="Open in full" onClick={onPopOut}><ExternalLink className="w-4 h-4"/></Button>
            <Button variant="ghost" size="icon" title="Close" onClick={onClose}><X className="w-4 h-4"/></Button>
          </div>
        </div>

        {/* Fields */}
        <div className="flex-1 px-[var(--modal-inner-x)] py-[var(--modal-inner-y)] space-y-[var(--field-gap-y)]">
          {/* Recipients row (simple input stub; wire to chips/autocomplete) */}
          <div className="flex items-start gap-3">
            <div className="text-[var(--text-tertiary)] pt-2 text-sm w-20 shrink-0">Recipients</div>
            <div className="flex-1 min-w-0">
              {/* Replace with your ChipInput */}
              <input className="w-full bg-transparent border-b border-[var(--border-subtle)] focus:outline-none py-2"
                     placeholder="Add recipients" />
              <div className="mt-1 flex items-center gap-3 text-xs">
                <button onClick={() => setShowCc(s => !s)} className="text-[var(--text-secondary)] hover:underline">Cc</button>
                <button onClick={() => setShowBcc(s => !s)} className="text-[var(--text-secondary)] hover:underline">Bcc</button>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-start gap-3">
            <div className="text-[var(--text-tertiary)] pt-2 text-sm w-20 shrink-0">Subject</div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-transparent border-b border-[var(--border-subtle)] focus:outline-none py-2"
            />
          </div>

          {/* Body */}
          <div className="mx-auto w-full max-w-[var(--content-measure)]">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              className="w-full min-h-[var(--compose-min-h)] resize-y bg-[var(--bg-surface)]
                         border border-[var(--border-subtle)] rounded-[var(--radius-sm)]
                         px-[var(--space-3)] py-[var(--space-2)] focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-[var(--toolbar-h)] px-[var(--modal-inner-x)] border-t border-[var(--border-subtle)]
                        bg-[var(--bg-surface-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="solid" size="sm" disabled={!canSend} onClick={doSend} aria-keyshortcuts="Control+Enter Meta+Enter">
              Send
            </Button>
            <Button variant="ghost" size="sm" title="Attach file"><Paperclip className="w-4 h-4"/></Button>
            {/* add B/I/U/link/list as needed */}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" title="More"><MoreHorizontal className="w-4 h-4"/></Button>
            <Button variant="ghost" size="sm" title="Delete draft"><Trash2 className="w-4 h-4"/></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
