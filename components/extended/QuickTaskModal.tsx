import * as React from "react";
import { QuickModal } from "./QuickModal";
import { fieldCls } from "./fieldCls";
import { QuickModalFooter } from "./QuickModalFooter";
import { DatePopoverField } from "./DatePopoverField";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: string; // yyyy-mm-dd
  portalContainer?: HTMLElement | null;
  onCreate: (payload: { title: string; date?: string }) => void;
};

export function QuickTaskModal({
  open,
  onOpenChange,
  defaultDate,
  onCreate,
  portalContainer
}: Props) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<Date | undefined>(
    defaultDate ? new Date(defaultDate) : undefined
  );
  const canCreate = title.trim().length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (canCreate) {
      onCreate({
        title: title.trim(),
        date: date ? date.toISOString().slice(0, 10) : undefined
      });
      onOpenChange(false);
    }
  };

  return (
    <QuickModal
      open={open}
      onOpenChange={onOpenChange}
      title="Quick task"
      portalContainer={portalContainer}
      footer={
        <QuickModalFooter
          leftLink={{ label: "Go to tasks", onClick: () => onOpenChange(false) }}
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
        <DatePopoverField value={date} onChange={setDate} placeholder="Due date" />
      </form>
    </QuickModal>
  );
}
