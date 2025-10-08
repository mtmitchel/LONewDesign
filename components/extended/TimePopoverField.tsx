import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Clock } from "lucide-react";
import { cn } from "../ui/utils";
import { fieldCls } from "./fieldCls";

type Props = {
  value?: string;               // "09:00"
  onChange: (v: string) => void;
  ariaLabel?: string;
  placeholder?: string;
};

export function TimePopoverField({
  value,
  onChange,
  ariaLabel = "Time",
  placeholder = "Select time",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const times = React.useMemo(() => {
    const list: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hours12 = ((h + 11) % 12) + 1;
        const suffix = h < 12 ? "AM" : "PM";
        list.push(`${hours12}:${m.toString().padStart(2, "0")} ${suffix}`);
      }
    }
    return list;
  }, []);

  const formatted = value
    ? (() => {
        const [h, m] = value.split(":").map(Number);
        const hours12 = ((h + 11) % 12) + 1;
        const suffix = h < 12 ? "AM" : "PM";
        return `${hours12}:${m.toString().padStart(2, "0")} ${suffix}`;
      })()
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            fieldCls,
            "flex items-center gap-[var(--space-3)] pr-[var(--space-5)]",
            "whitespace-nowrap tabular-nums"
          )}
        >
          <span
            className={cn(
              "flex-1 min-w-0 text-left whitespace-nowrap overflow-hidden text-ellipsis",
              !value && "text-[color:var(--text-tertiary)]"
            )}
          >
            {formatted || placeholder}
          </span>
          <Clock
            aria-hidden="true"
            className="w-5 h-5 opacity-50 shrink-0"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto min-w-[164px] p-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--popover-elevation)]"
      >
        <div
          className="max-h-[240px] overflow-y-auto overscroll-contain py-[var(--space-1)]"
          onWheel={(event) => event.stopPropagation()}
        >
          <ul className="flex flex-col text-[length:var(--text-base)]">
            {times.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  className="w-full text-left px-[var(--space-3)] py-[var(--space-1)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-elevated)] whitespace-nowrap tabular-nums"
                  onClick={() => {
                    const [hhmm, suffix] = t.split(" ");
                    let [h, m] = hhmm.split(":").map(Number);
                    if (suffix === "PM" && h !== 12) h += 12;
                    if (suffix === "AM" && h === 12) h = 0;
                    onChange(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
                    setOpen(false);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
