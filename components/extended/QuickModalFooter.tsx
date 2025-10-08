import * as React from "react";
import { Button } from "../ui/button";

type Props = {
  leftLink?: { label: string; onClick: () => void; title?: string };
  onCancel: () => void;
  primary: { label: string; onClick: () => void; disabled?: boolean; title?: string };
};

export function QuickModalFooter({ leftLink, onCancel, primary }: Props) {
  return (
    <>
      {leftLink ? (
        <button
          className="text-[color:var(--text-secondary)] hover:underline"
          onClick={leftLink.onClick}
          title={leftLink.title ?? leftLink.label}
        >
          {leftLink.label}
        </button>
      ) : (
        <span />
      )}
      <div className="ml-auto flex items-center gap-[var(--space-4)]">
        <Button variant="ghost" onClick={onCancel} title="Cancel">
          Cancel
        </Button>
        <Button
          disabled={!!primary.disabled}
          onClick={primary.onClick}
          title={primary.title ?? primary.label}
          className="disabled:opacity-50 disabled:pointer-events-none"
        >
          {primary.label}
        </Button>
      </div>
    </>
  );
}
