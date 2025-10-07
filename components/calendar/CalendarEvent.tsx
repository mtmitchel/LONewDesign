import { cn } from "../ui/utils";

type EventColor = "blue" | "green" | "teal" | "orange";
interface CalendarEventProps {
  title: string;
  time?: string;
  color?: EventColor;              // maps to low-ink tints
  density?: "default" | "compact"; // week/day may use compact
  className?: string;
  style?: React.CSSProperties;     // for positioned events
  onClick?: () => void;
}

export function CalendarEvent({
  title,
  time,
  color = "blue",
  density = "default",
  className,
  style,
  onClick,
}: CalendarEventProps) {
  const colorMap = {
    blue: {
      bg: "bg-[var(--event-blue-bg)]",
      text: "text-[var(--event-blue-text)]",
      hover: "hover:bg-[var(--event-blue-hover)]",
    },
    green: {
      bg: "bg-[var(--event-green-bg)]",
      text: "text-[var(--event-green-text)]",
      hover: "hover:bg-[var(--event-green-hover)]",
    },
    teal: {
      bg: "bg-[var(--event-teal-bg)]",
      text: "text-[var(--event-teal-text)]",
      hover: "hover:bg-[var(--event-teal-hover)]",
    },
    orange: {
      bg: "bg-[var(--event-orange-bg)]",
      text: "text-[var(--event-orange-text)]",
      hover: "hover:bg-[var(--event-orange-hover)]",
    },
  };
  
  const map = colorMap[color] || colorMap.blue; // Fallback to blue if color not found

  return (
    <button
      type="button"
      role="button"
      onClick={onClick}
      title={time ? `${time} · ${title}` : title}
      style={style}
      className={cn(
        "w-full rounded-[var(--calendar-event-radius)]",
        "border border-[var(--calendar-cell-border)]", // very subtle envelope
        map.bg,
        map.text,
        map.hover,
        density === "compact" 
          ? "text-[var(--text-xs)] px-[var(--space-2)] py-[calc(var(--space-1)/2)]" // Very compact for month view
          : "text-[var(--text-sm)] px-[var(--calendar-event-pad-x)] py-[var(--calendar-event-pad-y)]", // Normal for day/week
        "motion-safe:transition-colors",
        // accessibility & focus
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--calendar-event-focus)] focus-visible:ring-offset-0",
        // NO ACCENT COLORS - NO LEFT BORDERS - NOTHING
        className
      )}
      aria-label={time ? `${title}, ${time}` : title}
    >
      {density === "compact" ? (
        <span className="truncate">{title}</span>
      ) : (
        <>
          {time && <span className="mr-2 opacity-80">{time}</span>}
          <span className="truncate">{title}</span>
        </>
      )}
    </button>
  );
}
