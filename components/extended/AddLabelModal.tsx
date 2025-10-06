import * as React from "react";
import { QuickModal } from "./QuickModal";
import { fieldCls } from "./fieldCls";
import { QuickModalFooter } from "./QuickModalFooter";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  portalContainer?: HTMLElement | null;
  onAdd: (name: string) => void;
};

export function AddLabelModal({ open, onOpenChange, onAdd, portalContainer }: Props) {
  const [name, setName] = React.useState("");
  const canAdd = name.trim().length > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (canAdd) {
      onAdd(name.trim());
      onOpenChange(false);
    }
  };

  return (
    <QuickModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add label"
      portalContainer={portalContainer}
      footer={
        <QuickModalFooter
          onCancel={() => onOpenChange(false)}
          primary={{
            label: "Add",
            disabled: !canAdd,
            onClick: handleSubmit
          }}
        />
      }
    >
      <form onSubmit={handleSubmit}>
        <input
        className={fieldCls}
        placeholder="Label name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Label name"
        />
      </form>
    </QuickModal>
  );
}
