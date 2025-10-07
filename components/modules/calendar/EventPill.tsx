type PillTone = "neutral" | "low" | "medium" | "high";
const toneBg: Record<PillTone, string> = {
  neutral: "bg-[var(--chip-neutral-bg)] text-[var(--chip-neutral-text)]",
  low:     "bg-[var(--chip-low-bg)] text-[var(--chip-low-fg)]",
  medium:  "bg-[var(--chip-medium-bg)] text-[var(--chip-medium-fg)]",
  high:    "bg-[var(--chip-high-bg)] text-[var(--chip-high-fg)]",
};

export function EventPill({
  label, tone = "neutral", className,
}: { label: string; tone?: PillTone; className?: string }) {
  return (
    <div
      className={[
        "truncate inline-flex items-center",
        "rounded-[var(--event-pill-r)] px-[var(--event-pill-px)] py-[var(--event-pill-py)]",
        "text-[var(--text-xs)] leading-none hover:bg-[var(--cal-hover)]",
        toneBg[tone], className,
      ].join(" ")}
      title={label}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}