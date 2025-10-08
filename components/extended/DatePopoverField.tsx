import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../ui/utils";
import { fieldCls } from "./fieldCls";

type Props = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function DatePopoverField({
  value,
  onChange,
  placeholder = "Pick a date",
  ariaLabel = "Date"
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            fieldCls,
            "flex items-center gap-[var(--space-3)] pr-[var(--space-5)]"
          )}
          aria-label={ariaLabel}
        >
          <span
            className={cn(
              "flex-1 min-w-0 text-left whitespace-nowrap overflow-hidden text-ellipsis",
              !value && "text-[color:var(--text-tertiary)]"
            )}
          >
            {value ? format(value, "PP") : placeholder}
          </span>
          <CalendarIcon className="w-5 h-5 opacity-50 shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-[var(--space-3)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--popover-elevation)]"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
