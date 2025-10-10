import * as React from "react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export interface ResultsPaneProps {
  result: string;
  isStreaming?: boolean;
  onReplace?: () => void;
  onInsert?: () => void;
  onCopy?: () => void;
  onClose?: () => void;
}

export function ResultsPane({
  result,
  isStreaming,
  onReplace,
  onInsert,
  onCopy,
  onClose,
}: ResultsPaneProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  }, [result, onCopy]);

  return (
    <div className="flex flex-col border-t border-[var(--border-subtle)]">
      {/* Header */}
      <div className="flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--border-subtle)]">
        <h3 className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
          {isStreaming ? "Generating..." : "Result"}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Result Content */}
      <div className="flex-1 overflow-y-auto px-[var(--space-4)] py-[var(--space-3)] max-h-[300px]">
        <div className={cn(
          "text-[length:var(--text-sm)] text-[color:var(--text-primary)] whitespace-pre-wrap",
          isStreaming && "animate-pulse"
        )}>
          {result || "Generating..."}
        </div>
      </div>

      {/* Actions */}
      {!isStreaming && result && (
        <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] border-t border-[var(--border-subtle)]">
          {onReplace && (
            <Button
              onClick={onReplace}
              size="sm"
              className="flex-1"
            >
              Replace
            </Button>
          )}
          {onInsert && (
            <Button
              onClick={onInsert}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Insert
            </Button>
          )}
          <Button
            onClick={handleCopy}
            size="sm"
            variant="outline"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
}
