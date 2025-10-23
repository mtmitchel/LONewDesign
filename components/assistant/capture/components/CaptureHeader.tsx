import { X } from "lucide-react";
import { DialogClose } from "../../../ui/dialog";

interface CaptureHeaderProps {
  onClose: () => void;
}

export function CaptureHeader({ onClose }: CaptureHeaderProps) {
  return (
    <header className="flex items-center justify-between px-[var(--space-6)] pt-[var(--space-6)]">
      <h2 id="assistant-title" className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
        Assistant
      </h2>
      <DialogClose asChild>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </DialogClose>
    </header>
  );
}