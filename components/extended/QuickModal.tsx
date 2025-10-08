import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogClose
} from "../ui/dialog";
import { cn } from "../ui/utils";
import { X } from "lucide-react";

type QuickModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  portalContainer?: HTMLElement | null;
};

export function QuickModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  portalContainer
}: QuickModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal container={portalContainer ?? undefined}>
        <DialogOverlay
          className={cn(
            "fixed inset-0 grid place-items-center p-[var(--overlay-gutter)]",
            "bg-[var(--overlay-scrim)] backdrop-blur-[var(--overlay-blur)] z-[var(--z-overlay)]"
          )}
        />
        <DialogContent
          className={cn(
            "w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
            "rounded-[var(--modal-radius)] shadow-[var(--modal-elevation)] overflow-hidden",
            "max-w-[var(--quick-modal-max-w)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
          )}
          aria-modal
          role="dialog"
        >
          <DialogHeader className="px-[var(--modal-inner-x)] pt-[var(--modal-inner-y)] pb-0">
            <DialogTitle className="text-[length:var(--text-xl)] text-[color:var(--text-primary)]">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] mt-1">
                {description}
              </DialogDescription>
            ) : null}
            <DialogClose
              className="absolute right-3 top-3 p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-elevated)]"
              aria-label="Close"
              title="Close"
            >
              <X className="size-4" />
            </DialogClose>
          </DialogHeader>

          <div className="px-[var(--modal-inner-x)] py-[var(--modal-inner-y)]">
            {children}
          </div>

          {footer && (
            <div className="border-t border-[var(--border-subtle)] h-[var(--modal-footer-h)] px-[var(--modal-inner-x)] flex items-center justify-between">
              {footer}
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
