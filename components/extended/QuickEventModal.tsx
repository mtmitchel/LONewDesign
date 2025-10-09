import * as React from "react";
import { QuickModal } from "./QuickModal";
import { fieldCls } from "./fieldCls";
import { QuickModalFooter } from "./QuickModalFooter";
import { DatePopoverField } from "./DatePopoverField";
import { TimePopoverField } from "./TimePopoverField";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  portalContainer?: HTMLElement | null;
  defaultDate?: string; // yyyy-mm-dd
  defaultStart?: string; // HH:mm
  defaultEnd?: string; // HH:mm
  onCreate: (payload: { title: string; date: string; start?: string; end?: string }) => void;
  initialTitle?: string;
};

export function QuickEventModal({
  open,
  onOpenChange,
  portalContainer,
  defaultDate,
  defaultStart,
  defaultEnd,
  onCreate,
  initialTitle,
}: Props) {
  const [title, setTitle] = React.useState(initialTitle ?? "");
  const [date, setDate] = React.useState<Date | undefined>(
    defaultDate ? new Date(defaultDate) : undefined
  );
  const [start, setStart] = React.useState(defaultStart ?? "");
  const [end, setEnd] = React.useState(defaultEnd ?? "");
  const canCreate = title.trim().length > 0 && !!date;

  React.useEffect(() => {
    if (!open) return;
    setTitle(initialTitle ?? "");
    setDate(defaultDate ? new Date(defaultDate) : undefined);
    setStart(defaultStart ?? "");
    setEnd(defaultEnd ?? "");
  }, [open, initialTitle, defaultDate, defaultStart, defaultEnd]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (canCreate) {
      onCreate({
        title: title.trim(),
        date: (date as Date).toISOString().slice(0, 10),
        start: start || undefined,
        end: end || undefined
      });
      onOpenChange(false);
    }
  };

  return (
    <QuickModal
      open={open}
      onOpenChange={onOpenChange}
      title="Quick event"
      portalContainer={portalContainer}
      footer={
        <QuickModalFooter
          leftLink={{ label: "Go to calendar", onClick: () => onOpenChange(false) }}
          onCancel={() => onOpenChange(false)}
          primary={{
            label: "Create",
            disabled: !canCreate,
            onClick: handleSubmit,
          }}
        />
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-[var(--field-gap-y)]">
        <input
          className={fieldCls}
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Title"
        />
        <div className="grid grid-cols-3 gap-[var(--space-4)] min-w-0">
          <DatePopoverField value={date} onChange={setDate} placeholder="Date" />
          <TimePopoverField
            value={start}
            onChange={setStart}
            placeholder="Start time"
            ariaLabel="Start time"
          />
          <TimePopoverField
            value={end}
            onChange={setEnd}
            placeholder="End time"
            ariaLabel="End time"
          />
        </div>
      </form>
    </QuickModal>
  );
}
