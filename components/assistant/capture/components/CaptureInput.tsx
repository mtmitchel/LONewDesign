import * as React from "react";
import { Textarea } from "../../../ui/textarea";
import { cn } from "../../../ui/utils";
import { COMMANDS, filterCommands } from "../utils/commandUtils";
import { CommandDefinition } from "../types";

interface CaptureInputProps {
  text: string;
  showCommands: boolean;
  highlightIndex: number;
  error: string | null;
  onTextChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onApplyCommand: (definition: CommandDefinition) => void;
  contentIsEmpty: boolean;
}

export function CaptureInput({
  text,
  showCommands,
  highlightIndex,
  error,
  onTextChange,
  onKeyDown,
  onApplyCommand,
  contentIsEmpty,
}: CaptureInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const filteredCommands = React.useMemo(() => {
    if (!showCommands) return COMMANDS;
    const results = filterCommands(text);
    return results.length > 0 ? results : COMMANDS;
  }, [showCommands, text]);

  const autoResize = React.useCallback(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "auto";
    const rootStyles = getComputedStyle(document.documentElement);
    const rawVar = rootStyles.getPropertyValue("--assistant-field-max-h").trim();
    const maxHeight = Number.isNaN(Number.parseFloat(rawVar))
      ? 240
      : Number.parseFloat(rawVar);
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
  }, []);

  React.useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  const suggestionRailVisible = contentIsEmpty && !showCommands;
  const describedBy = error ? "assistant-hint assistant-error" : "assistant-hint";

  return (
    <>
      <div className="px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-2)]">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            rows={3}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Capture a thought… Type `/` for commands"
            aria-describedby={describedBy}
            autoFocus
            className={cn(
              "w-full resize-none bg-transparent text-[length:var(--text-base)] text-[color:var(--text-primary)]",
              "rounded-[var(--radius-md)] border border-[var(--border-subtle)]",
              "px-[var(--space-4)] py-[var(--space-3)] shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
            )}
            style={{ maxHeight: "var(--assistant-field-max-h)" }}
          />

          {showCommands && (
            <div
              role="listbox"
              aria-label="Assistant commands"
              className="mt-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-2)]"
            >
              {filteredCommands.map((cmd, index) => {
                const isActive = index === highlightIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onApplyCommand(cmd);
                    }}
                    className={cn(
                      "flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] text-left",
                      isActive
                        ? "bg-[var(--bg-surface)] text-[color:var(--text-primary)]"
                        : "text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                    )}
                  >
                    <span className="mt-[2px] text-[color:var(--text-secondary)]">{cmd.icon}</span>
                    <span>
                      <span className="block text-sm text-[color:var(--text-primary)]">{cmd.label}</span>
                      <span className="block text-xs text-[color:var(--text-secondary)]">{cmd.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <p id="assistant-hint" className="sr-only">
            Press Enter to submit. Press Shift+Enter for a new line.
          </p>
          {error ? (
            <p id="assistant-error" className="mt-[var(--space-2)] text-sm text-[color:var(--danger)]" role="alert" aria-live="polite">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {suggestionRailVisible && (
        <div className="px-[var(--space-6)] pb-[var(--space-2)]">
          <div className="flex flex-wrap items-center gap-[var(--space-2)] text-sm text-[color:var(--text-secondary)]">
            <span className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Suggestions:</span>
            {COMMANDS.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-1)] text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
                onClick={() => {
                  onApplyCommand(cmd);
                }}
                title={cmd.desc}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}