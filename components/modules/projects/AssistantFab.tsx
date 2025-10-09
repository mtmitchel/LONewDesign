import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "../../ui/utils";

type AssistantFabProps = {
  isContextOpen: boolean;
  onOpen: () => void;
};

export function AssistantFab({ isContextOpen, onOpen }: AssistantFabProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Add (⌘/Ctrl+K)"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "absolute bottom-[var(--overlay-gutter)] right-[var(--overlay-gutter)] grid h-12 w-12 place-items-center",
        "rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--elevation-lg)]",
        "transition-[right,transform] motion-safe:duration-200",
        isContextOpen && "translate-x-[-72px]",
      )}
      style={{ zIndex: "calc(var(--z-overlay) + 1)" }}
    >
      <Plus className="h-5 w-5" aria-hidden />
      <span className="sr-only">Open assistant</span>
    </button>
  );
}
