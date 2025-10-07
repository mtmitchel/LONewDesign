import * as React from "react";
import { cn } from "../../ui/utils";
import { KanbanSquare, List as ListIcon } from "lucide-react";

type ViewMode = "board" | "list";

type Props = {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
  className?: string;
};

const OPTIONS: Array<{ value: ViewMode; label: string; Icon: React.ComponentType<any> }> = [
  { value: "board", label: "Board", Icon: KanbanSquare },
  { value: "list", label: "List", Icon: ListIcon },
];

export function SegmentedViewToggle({ value, onChange, className }: Props) {
  const groupRef = React.useRef<HTMLDivElement>(null);

  // keyboard: arrow keys/Home/End cycle options
  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = OPTIONS.findIndex(o => o.value === value);
    const last = OPTIONS.length - 1;
    let next = idx;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = idx === last ? 0 : idx + 1; break;
      case "ArrowLeft":
      case "ArrowUp":
        next = idx === 0 ? last : idx - 1; break;
      case "Home":
        next = 0; break;
      case "End":
        next = last; break;
      case "Enter":
      case " ":
        // no-op; selection already changes via arrows
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(OPTIONS[next].value);
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="View"
      className={cn(
        "inline-flex items-center",
        "bg-[var(--seg-bg)] border border-[var(--seg-border)]",
        "rounded-[var(--seg-radius)] shadow-[var(--seg-elevation)]",
        "p-[var(--seg-pad-y)] pr-[var(--seg-pad-x)] pl-[var(--seg-pad-x)]",
        "gap-[var(--seg-gap)]",
        className
      )}
      onKeyDown={onKeyDown}
    >
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex items-center select-none",
              "rounded-[var(--seg-item-radius)]",
              "px-[var(--seg-item-pad-x)] py-[var(--seg-item-pad-y)]",
              "gap-[var(--seg-item-gap)]",
              "text-sm font-medium",
              "transition-colors motion-safe:duration-[var(--seg-duration)]",
              active
                ? "bg-[var(--seg-item-bg-active)] text-[var(--seg-item-fg-active)] border border-[var(--seg-item-border-active)]"
                : "text-[var(--seg-item-fg)] hover:bg-[var(--seg-item-bg-hover)] border border-transparent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--seg-focus-ring)] focus-visible:ring-offset-2"
            )}
            title={label}
            aria-keyshortcuts={v === "board" ? "Alt+B" : "Alt+L"}
          >
            <Icon style={{ width: "var(--seg-item-icon)", height: "var(--seg-item-icon)" }} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
