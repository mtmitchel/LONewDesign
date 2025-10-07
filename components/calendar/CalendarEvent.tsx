import * as React from "react";
import { cn } from "../ui/utils";
import { cva, type VariantProps } from "class-variance-authority";

type EventTone = "blue" | "green" | "teal" | "orange";

const tone = {
 blue:  { bg: "bg-[var(--event-blue-bg)] hover:bg-[var(--event-blue-hover)]", text: "text-[var(--event-blue-text)]" },
 green: { bg: "bg-[var(--event-green-bg)] hover:bg-[var(--event-green-hover)]", text: "text-[var(--event-green-text)]" },
 teal:  { bg: "bg-[var(--event-teal-bg)]  hover:bg-[var(--event-teal-hover)]",  text: "text-[var(--event-teal-text)]"  },
 orange:{ bg: "bg-[var(--event-orange-bg)] hover:bg-[var(--event-orange-hover)]", text: "text-[var(--event-orange-text)]" },
} as const;

const eventClasses = cva(
 [
   "w-full inline-flex items-start justify-start",
   "rounded-[var(--calendar-event-radius)]",
   "border border-[var(--calendar-event-border)]",
   "motion-safe:transition-colors",
   "text-left",
   "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--calendar-event-focus)] focus-visible:ring-offset-0",
 ].join(" "),
 {
   variants: {
     density: {
       micro: "py-[var(--calendar-event-pad-y-micro)] [--calendar-event-pad-x:var(--space-1)]",
       ultra: "py-[var(--calendar-event-pad-y-ultra)]",
       compact: "py-[var(--calendar-event-pad-y-compact)]",
       default: "py-[var(--calendar-event-pad-y)]",
     },
     size: {
       xxs: "text-[var(--calendar-event-font-xxs)] leading-[var(--calendar-event-leading-tight)]",
       sm: "text-[var(--calendar-event-font-sm)] leading-[var(--calendar-event-leading-tight)]",
       md: "text-[var(--calendar-event-font-sm)]",
     },
   },
   defaultVariants: { density: "default", size: "sm" },
 }
);

export interface CalendarEventProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
   VariantProps<typeof eventClasses> {
 title: string;
 time?: string;
 tone?: EventTone;
}

export function CalendarEvent({
 title,
 time,
 tone: t = "blue",
 density,
 size,
 className,
 ...rest
}: CalendarEventProps) {
 const tClass = tone[t];
 return (
   <button
     type="button"
     {...rest}
     className={cn(eventClasses({ density, size }), tClass.bg, tClass.text, className)}
     title={time ? `${time} · ${title}` : title}
   >
     <span className="inline-flex w-full min-w-0 items-center gap-[var(--space-2)] px-[var(--calendar-event-pad-x)]">
       {time && (
         <span className="shrink-0 whitespace-nowrap tabular-nums text-[var(--calendar-event-time)]">{time}</span>
       )}
       <span className="min-w-0 truncate">{title}</span>
     </span>
   </button>
 );
}
