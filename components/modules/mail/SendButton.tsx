import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "../../ui/button";
import { cn } from "../../ui/utils";

type SendButtonProps = Omit<React.ComponentProps<typeof Button>, "children"> & {
  label?: string;
};

export function SendButton({
  label = "Send",
  className,
  variant = "solid",
  size = "sm",
  "aria-keyshortcuts": ariaKeyShortcuts,
  title,
  ...buttonProps
}: SendButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-keyshortcuts={ariaKeyShortcuts ?? "Control+Enter Meta+Enter"}
      title={title ?? `${label} (⌘/Ctrl+Enter)`}
      className={cn(
        "min-w-[88px] justify-center focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)]",
        className
      )}
      {...buttonProps}
    >
      <Send className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
