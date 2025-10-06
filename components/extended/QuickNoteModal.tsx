import * as React from "react";
import { QuickModal } from "./QuickModal";
import { fieldCls } from "./fieldCls";
import { QuickModalFooter } from "./QuickModalFooter";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  portalContainer?: HTMLElement | null;
  onCreate: (payload: { title?: string; body: string }) => void;
};

export function QuickNoteModal({ open, onOpenChange, onCreate, portalContainer }: Props) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const canCreate = body.trim().length > 0 || title.trim().length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (canCreate) {
      onCreate({ title: title.trim() || undefined, body: body.trim() });
      onOpenChange(false);
    }
  };

  return (
    <QuickModal
      open={open}
      onOpenChange={onOpenChange}
      title="Quick note"
      portalContainer={portalContainer}
      footer={
        <QuickModalFooter
          leftLink={{ label: "Go to notes", onClick: () => onOpenChange(false) }}
          onCancel={() => onOpenChange(false)}
          primary={{
            label: "Create",
            disabled: !canCreate,
            onClick: handleSubmit,
          }}
        />
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-[var(--field-gap-y)]">
        <input
          className={fieldCls}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
        />
        <textarea
          className="min-h-[140px] resize-y bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--field-pad-y)] text-[var(--text-base)] placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          placeholder="Write a quick note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label="Note"
        />
      </form>
    </QuickModal>
  );
}
