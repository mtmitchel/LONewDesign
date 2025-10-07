type PillTone = "low" | "medium" | "high" | "neutral"; // map to chip tokens

export function EventPill({
  title, meta, tone = "neutral", className,
}: {
  title: string;
  meta?: string;               // time or context
  tone?: PillTone;
  className?: string;
}) {
  const toneBg = {
    low: "bg-[var(--chip-low-bg)] text-[var(--chip-low-fg)]",
    medium: "bg-[var(--chip-medium-bg)] text-[var(--chip-medium-fg)]",
    high: "bg-[var(--chip-high-bg)] text-[var(--chip-high-fg)]",
    neutral: "bg-[var(--chip-neutral-bg)] text-[var(--chip-neutral-text)]",
  }[tone];

  return (
    <div
      className={[
        "truncate inline-flex items-center gap-[var(--space-2)]",
        "rounded-[var(--event-pill-r)] px-[var(--event-pill-px)] py-[var(--event-pill-py)]",
        "text-[var(--text-xs)] leading-none hover:bg-[var(--cal-hover)]",
        toneBg, className,
      ].join(" ")}
      title={meta ? `${meta} ${title}` : title}
    >
      <span className="truncate">{meta ? `${meta} ${title}` : title}</span>
    </div>
  );
}