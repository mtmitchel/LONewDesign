import * as React from "react";
import { cn } from "../ui/utils";

type DiffViewerProps = {
  original: string;
  edited: string;
  onRevert?: () => void;
};

type DiffPart = {
  type: "added" | "removed" | "unchanged";
  value: string;
};

function simpleDiff(original: string, edited: string): DiffPart[] {
  if (original === edited) {
    return [{ type: "unchanged", value: original }];
  }

  const originalWords = original.split(/(\s+)/);
  const editedWords = edited.split(/(\s+)/);
  const result: DiffPart[] = [];

  let i = 0;
  let j = 0;

  while (i < originalWords.length || j < editedWords.length) {
    if (i >= originalWords.length) {
      result.push({ type: "added", value: editedWords[j] });
      j++;
    } else if (j >= editedWords.length) {
      result.push({ type: "removed", value: originalWords[i] });
      i++;
    } else if (originalWords[i] === editedWords[j]) {
      result.push({ type: "unchanged", value: originalWords[i] });
      i++;
      j++;
    } else {
      const nextMatchInEdited = editedWords
        .slice(j)
        .findIndex((w) => w === originalWords[i]);
      const nextMatchInOriginal = originalWords
        .slice(i)
        .findIndex((w) => w === editedWords[j]);

      if (nextMatchInEdited !== -1 && nextMatchInEdited < 5) {
        for (let k = 0; k < nextMatchInEdited; k++) {
          result.push({ type: "added", value: editedWords[j + k] });
        }
        j += nextMatchInEdited;
      } else if (nextMatchInOriginal !== -1 && nextMatchInOriginal < 5) {
        for (let k = 0; k < nextMatchInOriginal; k++) {
          result.push({ type: "removed", value: originalWords[i + k] });
        }
        i += nextMatchInOriginal;
      } else {
        result.push({ type: "removed", value: originalWords[i] });
        result.push({ type: "added", value: editedWords[j] });
        i++;
        j++;
      }
    }
  }

  return result;
}

export function DiffViewer({ original, edited, onRevert }: DiffViewerProps) {
  const [activeTab, setActiveTab] = React.useState<"result" | "original" | "diff">("diff");

  const diff = React.useMemo(() => simpleDiff(original, edited), [original, edited]);

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
        "bg-[color:var(--bg-surface)] overflow-hidden"
      )}
    >
      <div className="flex items-center border-b border-[color:var(--border-subtle)] bg-[color:var(--bg-surface-elevated)]">
        {(["result", "original", "diff"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-[length:var(--text-sm)] font-medium",
              "transition-colors duration-[var(--duration-fast)]",
              "border-b-2",
              activeTab === tab
                ? "border-[color:var(--primary)] text-[color:var(--primary)]"
                : "border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            )}
          >
            {tab === "result" && "Result"}
            {tab === "original" && "Original"}
            {tab === "diff" && "Diff"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "result" && (
          <div className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] whitespace-pre-wrap">
            {edited}
          </div>
        )}

        {activeTab === "original" && (
          <div className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] whitespace-pre-wrap">
            {original}
          </div>
        )}

        {activeTab === "diff" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[length:var(--text-xs)] font-medium text-[color:var(--text-secondary)] uppercase tracking-wide">
                  Original
                </div>
                <div
                  className={cn(
                    "p-3 rounded-[var(--radius-sm)]",
                    "bg-red-50 border border-red-200",
                    "text-[length:var(--text-sm)] text-[color:var(--text-primary)]",
                    "whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
                  )}
                >
                  {original}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[length:var(--text-xs)] font-medium text-[color:var(--text-secondary)] uppercase tracking-wide">
                  Edited
                </div>
                <div
                  className={cn(
                    "p-3 rounded-[var(--radius-sm)]",
                    "bg-green-50 border border-green-200",
                    "text-[length:var(--text-sm)] text-[color:var(--text-primary)]",
                    "whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
                  )}
                >
                  {edited}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[color:var(--border-subtle)]">
              <div className="text-[length:var(--text-xs)] font-medium text-[color:var(--text-secondary)] uppercase tracking-wide mb-2">
                Inline Diff
              </div>
              <div className="text-[length:var(--text-sm)] leading-relaxed">
                {diff.map((part, idx) => {
                  if (part.type === "added") {
                    return (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-800 px-0.5 rounded"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  if (part.type === "removed") {
                    return (
                      <span
                        key={idx}
                        className="bg-red-100 text-red-800 px-0.5 rounded line-through"
                      >
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={idx}>{part.value}</span>;
                })}
              </div>
            </div>

            {onRevert && (
              <div className="pt-3 border-t border-[color:var(--border-subtle)]">
                <button
                  onClick={onRevert}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    "rounded-[var(--radius-md)] border border-[color:var(--border-subtle)]",
                    "bg-[color:var(--bg-surface)] hover:bg-[color:var(--bg-surface-elevated)]",
                    "text-[length:var(--text-sm)] font-medium text-[color:var(--text-primary)]",
                    "transition-colors duration-[var(--duration-fast)]"
                  )}
                >
                  ↩️ Revert to original
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
