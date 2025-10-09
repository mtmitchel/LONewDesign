import * as React from "react";
import { ChevronDown, ChevronUp, Copy, RotateCcw } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";

type SnippetCardProps = {
  snippet: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  hasEdits: boolean;
  onViewDiff?: () => void;
  onRevert?: () => void;
  metadata: {
    wordCount: number;
    timestamp: Date;
  };
  isLarge?: boolean;
};

export function SnippetCard({
  snippet,
  isExpanded,
  onToggleExpanded,
  hasEdits,
  onViewDiff,
  onRevert,
  metadata,
  isLarge,
}: SnippetCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 120) return "1 hour ago";
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return "Earlier today";
  };

  const getPreviewText = () => {
    if (isExpanded) return snippet;
    const lines = snippet.split("\n");
    if (lines.length <= 2) return snippet;
    return lines.slice(0, 2).join("\n") + "...";
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
        "bg-[color:var(--bg-surface-subtle)] p-[var(--space-4)]",
        "transition-all duration-[var(--duration-base)]"
      )}
    >
      <div className="flex items-start justify-between gap-[var(--space-3)] mb-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-2)] min-w-0">
          <span className="text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]">
            📋 Captured snippet
          </span>
          {hasEdits && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5",
                "rounded-[var(--radius-sm)] bg-[color:var(--accent-primary)] text-white",
                "text-xs font-medium cursor-pointer hover:opacity-90"
              )}
              onClick={onViewDiff}
              role="button"
              tabIndex={0}
            >
              🔄 Edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasEdits && onRevert && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onRevert}
              title="Revert to original"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleCopy}
            title="Copy original"
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleExpanded}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {isLarge && !isExpanded && (
        <div className="mb-2 px-2 py-1 rounded bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
          ⚠️ Showing first 500 words. Expand to review full selection.
        </div>
      )}

      <div
        className={cn(
          "text-[length:var(--text-sm)] text-[color:var(--text-primary)]",
          "whitespace-pre-wrap break-words",
          !isExpanded && "line-clamp-2"
        )}
      >
        {getPreviewText()}
      </div>

      <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-3)] text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
        <span>{metadata.wordCount} words</span>
        <span>·</span>
        <span>{formatTimestamp(metadata.timestamp)}</span>
      </div>
    </div>
  );
}
