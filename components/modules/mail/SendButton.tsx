import * as React from "react";
import { Button } from "../../ui/button";
import { Send } from "lucide-react";

type Props = {
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
};

export function SendButton({ disabled, onClick, title = "Send" }: Props) {
  return (
    <Button
      variant="solid"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts="Control+Enter Meta+Enter"
      title={`${title} (⌘/Ctrl+Enter)`}
      className="min-w-[88px] justify-center focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
    >
      <Send className="mr-2 h-4 w-4" />
      {title}
    </Button>
  );
}
