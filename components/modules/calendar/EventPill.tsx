import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

type Tone = "neutral" | "low" | "medium" | "high";
type Accent = { colorTokenVar?: string } | undefined;

const pill = cva(
  [
    "flex items-center",
    "rounded-[var(--event-pill-r)]",
    "text-[var(--event-pill-fs)]",
    "leading-[var(--event-pill-lh)]",
    "px-[var(--event-pill-px)] py-[var(--event-pill-py)]",
    "gap-[var(--event-pill-gap)]",
    "truncate",
    "transition-colors",
    "hover:bg-[var(--event-hover-bg)]",
    "focus-visible:ring-1 focus-visible:ring-[var(--event-focus-ring)] focus:outline-none",
    "aria-selected:ring-1 aria-selected:ring-[var(--event-selected-ring)]",
  ],
  {
    variants: {
      tone: {
        neutral: "bg-[var(--event-neutral-bg)] text-[var(--event-neutral-text)]",
        low: "bg-[var(--event-low-bg)] text-[var(--event-low-text)]",
        medium: "bg-[var(--event-medium-bg)] text-[var(--event-medium-text)]",
        high: "bg-[var(--event-high-bg)] text-[var(--event-high-text)]",
      },
      density: {
        default: "",
        dense:
          "px-[var(--event-dense-px)] py-[var(--event-dense-py)]",
      },
      multiline: {
        // parent can force single or up to 2 lines
        one: "whitespace-nowrap",
        two: "line-clamp-2",
      },
      disabled: {
        true: "opacity-70 pointer-events-none",
        false: "",
      },
      ghost: {
        true: "border border-dashed border-[var(--cal-gridline)] bg-transparent",
        false: "",
      },
    },
    defaultVariants: {
      tone: "low",
      density: "default",
      multiline: "one",
      disabled: false,
      ghost: false,
    },
  }
);

export interface EventPillProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pill> {
  /** Visible label. For Month, pass "9:00 AM Standup"; for Week/Day, either the same or just title. */
  label: string;
  /** Optional small prefix text (e.g., time). If provided, it will render before title in a subtle ink. */
  prefix?: string;
  /** Optional suffix chip/text. Keep short. */
  suffix?: string;
  /** Optional left accent bar using a token var (e.g., "var(--accent-blue)"). */
  accent?: Accent;
  /** Selected state for aria + ring. */
  selected?: boolean;
}

export const EventPill = React.forwardRef<HTMLDivElement, EventPillProps>(
  (
    {
      label,
      prefix,
      suffix,
      tone,
      density,
      multiline,
      disabled,
      ghost,
      accent,
      selected,
      className,
      ...rest
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-selected={selected || undefined}
        aria-label={label}
        aria-keyshortcuts="Enter Space"
        className={[
          pill({ tone, density, multiline, disabled, ghost }),
          accent?.colorTokenVar
            ? "pl-[calc(var(--event-pill-px)+var(--event-accent-w))] relative"
            : "",
          className || "",
        ].join(" ")}
        {...rest}
      >
        {accent?.colorTokenVar && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 -translate-y-1/2"
            style={{
              width: "var(--event-accent-w)",
              height: "60%",
              background: accent.colorTokenVar,
              borderRadius: "9999px",
              display: "inline-block",
            }}
          />
        )}

        {prefix && (
          <span className="shrink-0 text-[var(--event-meta-ink)]">{prefix}</span>
        )}
        <span className="min-w-0 truncate font-medium" style={{ fontWeight: "var(--event-title-weight)" }}>
          {label}
        </span>
        {suffix && (
          <span className="shrink-0 text-[var(--event-meta-ink)]">{suffix}</span>
        )}
      </div>
    );
  }
);
EventPill.displayName = "EventPill";