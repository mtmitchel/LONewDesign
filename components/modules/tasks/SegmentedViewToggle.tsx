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
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [thumbStyle, setThumbStyle] = React.useState<React.CSSProperties | null>(null);

  const updateThumb = React.useCallback(() => {
    const activeIndex = OPTIONS.findIndex(option => option.value === value);
    const activeEl = optionRefs.current[activeIndex];
    const groupEl = groupRef.current;

    if (!activeEl || !groupEl) {
      return;
    }

    const nextStyle: React.CSSProperties = {
      width: `${activeEl.offsetWidth}px`,
      height: `${activeEl.offsetHeight}px`,
      left: `${activeEl.offsetLeft}px`,
      top: `${activeEl.offsetTop}px`,
    };

    setThumbStyle(nextStyle);
  }, [value]);

  React.useLayoutEffect(() => {
    updateThumb();
  }, [updateThumb]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => updateThumb();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateThumb]);

  React.useEffect(() => {
    const groupEl = groupRef.current;
    if (!groupEl || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => updateThumb());
    observer.observe(groupEl);
    return () => observer.disconnect();
  }, [updateThumb]);

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
        "relative inline-flex items-center",
        "bg-[var(--seg-bg)] border border-[var(--seg-border)]",
        "rounded-[var(--seg-radius)] shadow-[var(--seg-elevation)]",
        "p-[var(--seg-pad-y)] pr-[var(--seg-pad-x)] pl-[var(--seg-pad-x)]",
        "gap-[var(--seg-gap)]",
        className
      )}
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-[var(--seg-item-radius)]",
          "bg-[var(--seg-thumb-bg)] border border-[var(--seg-thumb-border)]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
          "transition-all motion-safe:duration-[var(--seg-duration)]"
        )}
        style={{
          ...thumbStyle,
          opacity: thumbStyle ? 1 : 0,
        }}
      />
      {OPTIONS.map(({ value: v, label, Icon }, idx) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            ref={el => { optionRefs.current[idx] = el; }}
            className={cn(
              "relative z-10 inline-flex items-center select-none",
              "rounded-[var(--seg-item-radius)] border border-transparent",
              "px-[var(--seg-item-pad-x)] py-[var(--seg-item-pad-y)]",
              "gap-[var(--seg-item-gap)]",
              "text-sm font-medium",
              "transition-colors motion-safe:duration-[var(--seg-duration)]",
              active
                ? "text-[var(--seg-fg-active)]"
                : "text-[var(--seg-fg)] opacity-80 hover:text-[var(--seg-fg-active)]",
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
