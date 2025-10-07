import { Check } from "lucide-react";
import { cn } from "../ui/utils";

export type Priority = "high" | "medium" | "low" | "none";

export interface TaskRowProps {
  id: string;
  title: string;
  dueLabel?: string;           // e.g., "Aug 17", "Oct 2 – 3"
  priority?: Priority;         // low-ink chips
  labels?: string[];           // optional low-ink tags
  completed?: boolean;
  onToggle?: (id: string) => void;
  onOpen?: (id: string) => void;
}

const priorityChip = (p?: Priority) => {
  switch (p) {
    case "high":
      return "bg-[var(--chip-high-bg)] text-[var(--chip-high-text)]";
    case "medium":
      return "bg-[var(--chip-medium-bg)] text-[var(--chip-medium-text)]";
    case "low":
      return "bg-[var(--chip-low-bg)] text-[var(--chip-low-text)]";
    default:
      return "bg-[var(--chip-neutral-bg)] text-[var(--chip-neutral-text)]";
  }
};

export function TaskRow({
  id, title, dueLabel, priority = "none", labels = [], completed,
  onToggle, onOpen
}: TaskRowProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen?.(id)}
      className={cn(
        // container
        "w-full text-left group border border-[var(--border-subtle)] bg-[var(--bg-surface)]",
        "rounded-[var(--radius-lg)] shadow-[var(--tasks-rail-shadow)]",
        "px-[var(--space-4)] py-[var(--task-row-pad-y)]",
        "hover:bg-[var(--task-row-hover)] transition",
        "flex items-start gap-[var(--task-row-gap)] min-h-[var(--task-row-h-1)]"
      )}
      aria-pressed={!!completed}
    >
      {/* checkbox */}
      <span
        role="checkbox"
        aria-checked={!!completed}
        onClick={(e) => { e.stopPropagation(); onToggle?.(id); }}
        className={cn(
          "mt-1 inline-flex h-[var(--control-sm)] w-[var(--control-sm)] items-center justify-center",
          "rounded-[var(--radius-sm)] border border-[var(--border-subtle)]",
          completed && "bg-[var(--primary)] text-white"
        )}
        title="Mark complete"
        aria-keyshortcuts="Control+Enter"
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : null}
      </span>

      {/* content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "truncate text-[var(--text-primary)]",
            completed && "line-through opacity-60"
          )}
        >
          {title}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-[var(--chip-gap)]">
          {dueLabel && (
            <span className="inline-flex items-center text-[var(--text-secondary)] text-xs">
              {/* calendar glyph handled globally; keeping text only here per low-ink */}
              {dueLabel}
            </span>
          )}
          {/* priority chip */}
          <span
            className={cn(
              "inline-flex h-[var(--chip-height)] items-center rounded-[var(--chip-radius)]",
              "px-[var(--chip-pad-x)] text-xs",
              priorityChip(priority)
            )}
          >
            {priority === "none" ? "No priority" : priority[0].toUpperCase() + priority.slice(1)}
          </span>

          {/* label chips (low-ink) */}
          {labels.map((l) => (
            <span
              key={l}
              className="inline-flex h-[var(--chip-height)] items-center rounded-[var(--chip-radius)] px-[var(--chip-pad-x)] text-xs bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]"
              title={l}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
