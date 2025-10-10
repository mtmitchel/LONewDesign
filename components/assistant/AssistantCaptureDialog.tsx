import * as React from "react";
import { Calendar, CheckSquare, Loader2, Sparkles, StickyNote, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { cn } from "../ui/utils";
import { useProviderSettings } from "../modules/settings/state/providerSettings";
import { createMistralProvider } from "./services/mistralProvider";

export type AssistantCommand = "capture" | "task" | "note" | "event" | "summarize";

export type AssistantSubmitPayload = {
  text: string;
  command: AssistantCommand;
};

type CommandDefinition = {
  id: Exclude<AssistantCommand, "capture">;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

const COMMANDS: CommandDefinition[] = [
  { id: "task", label: "/task", desc: "Create a task", icon: <CheckSquare className="size-4" aria-hidden /> },
  { id: "note", label: "/note", desc: "Save as note", icon: <StickyNote className="size-4" aria-hidden /> },
  { id: "event", label: "/event", desc: "Create an event", icon: <Calendar className="size-4" aria-hidden /> },
  { id: "summarize", label: "/summarize", desc: "Summarize selection", icon: <Sparkles className="size-4" aria-hidden /> },
];

function deriveCommand(value: string): AssistantCommand {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return "capture";
  const commandToken = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  const match = COMMANDS.find((cmd) => cmd.label.slice(1) === commandToken);
  return match?.id ?? "capture";
}

function shouldShowCommandRail(value: string) {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return false;
  return !trimmed.includes(" ");
}

function filterCommands(value: string): CommandDefinition[] {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith("/")) return COMMANDS;
  const search = trimmed.slice(1).split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!search) return COMMANDS;
  return COMMANDS.filter((cmd) => cmd.label.slice(1).startsWith(search));
}

export interface AssistantCaptureDialogProps {
  open: boolean;
  initialValue?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AssistantSubmitPayload) => Promise<void>;
  onCommandSelect?: (command: AssistantCommand) => void;
  onError?: (message: string) => void;
}

export function AssistantCaptureDialog({
  open,
  initialValue,
  onOpenChange,
  onSubmit,
  onCommandSelect,
  onError,
}: AssistantCaptureDialogProps) {
  const [text, setText] = React.useState(initialValue ?? "");
  const [command, setCommand] = React.useState<AssistantCommand>("capture");
  const [showCommands, setShowCommands] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [predictedIntent, setPredictedIntent] = React.useState<"task" | "note" | "event" | null>(null);
  const [predicting, setPredicting] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const prevCommandRef = React.useRef<AssistantCommand | null>(null);
  const predictionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const filteredCommands = React.useMemo(() => {
    if (!showCommands) return COMMANDS;
    const results = filterCommands(text);
    return results.length > 0 ? results : COMMANDS;
  }, [showCommands, text]);

  const primaryLabel = React.useMemo(() => {
    // If user typed a slash command, use that
    if (command !== "capture") {
      switch (command) {
        case "task":
          return "Create task";
        case "note":
          return "Save note";
        case "event":
          return "Create event";
        case "summarize":
          return "Summarize";
      }
    }
    
    // Otherwise use predicted intent from natural language
    if (predictedIntent) {
      switch (predictedIntent) {
        case "task":
          return "Create task";
        case "note":
          return "Save note";
        case "event":
          return "Create event";
      }
    }
    
    // Default fallback
    return "Submit";
  }, [command, predictedIntent]);

  const contentIsEmpty = text.trim().length === 0;

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
    if (!open) {
      prevCommandRef.current = null;
      setText("");
      setCommand("capture");
      setShowCommands(false);
      setHighlightIndex(0);
      setBusy(false);
      setError(null);
      return;
    }

    const initial = initialValue ?? "";
    setText(initial);
    const derived = deriveCommand(initial);
    setCommand(derived);
    setShowCommands(shouldShowCommandRail(initial));
    setHighlightIndex(0);
    setBusy(false);
    setError(null);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      autoResize();
    });
  }, [open, initialValue, autoResize]);

  React.useEffect(() => {
    if (!open) return;
    autoResize();
  }, [text, autoResize, open]);

  React.useEffect(() => {
    if (showCommands) {
      setHighlightIndex(0);
    }
  }, [showCommands, text]);

  React.useEffect(() => {
    if (!open) return;
    if (command === prevCommandRef.current) return;
    prevCommandRef.current = command;
    if (command !== "capture") {
      onCommandSelect?.(command);
    }
  }, [command, onCommandSelect, open]);

  // Debounced intent prediction for natural language input
  const providerSettings = useProviderSettings();
  
  React.useEffect(() => {
    // Clear previous timeout
    if (predictionTimeoutRef.current) {
      clearTimeout(predictionTimeoutRef.current);
    }
    
    // Reset predicted intent when empty or has slash command
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith("/") || command !== "capture") {
      setPredictedIntent(null);
      return;
    }
    
    // Only predict if we have at least 5 characters (avoid premature classification)
    if (trimmed.length < 5) {
      setPredictedIntent(null);
      return;
    }
    
    // Debounce prediction by 500ms
    predictionTimeoutRef.current = setTimeout(async () => {
      try {
        setPredicting(true);
        
        // Check if assistant provider is configured
        const assistantProviderId = providerSettings.assistantProvider;
        if (!assistantProviderId) {
          setPredictedIntent(null);
          return;
        }
        
        // For now, only support Mistral (Phase 1)
        if (assistantProviderId !== 'mistral') {
          setPredictedIntent(null);
          return;
        }
        
        // Check if Mistral is configured
        const mistralConfig = providerSettings.providers.mistral;
        if (!mistralConfig?.apiKey) {
          setPredictedIntent(null);
          return;
        }
        
        // Create Mistral provider and classify
        const mistralProvider = createMistralProvider();
        const intent = await mistralProvider.classifyIntent(trimmed);
        
        // Only update if intent is task/note/event (ignore unknown)
        if (intent.type === "task" || intent.type === "note" || intent.type === "event") {
          setPredictedIntent(intent.type);
        } else {
          setPredictedIntent(null);
        }
      } catch (err) {
        console.warn("[AssistantDialog] Intent prediction failed:", err);
        setPredictedIntent(null);
      } finally {
        setPredicting(false);
      }
    }, 500);
    
    // Cleanup on unmount or text change
    return () => {
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, [text, command, open, providerSettings]);

  const applyCommand = React.useCallback(
    (definition: CommandDefinition) => {
      const leadingWhitespace = text.match(/^\s*/)?.[0] ?? "";
      const trimmed = text.trimStart();
      const hasRest = trimmed.includes(" ");
      const rest = hasRest ? trimmed.slice(trimmed.indexOf(" ") + 1) : "";
      const suffix = hasRest ? ` ${rest}` : " ";
      const nextValue = `${leadingWhitespace}${definition.label}${suffix}`;

      setText(nextValue);
      setCommand(definition.id);
      setShowCommands(false);
      setHighlightIndex(0);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        autoResize();
      });
    },
    [autoResize, onCommandSelect, text],
  );

  const handleTextChange = (value: string) => {
    setText(value);
    setError(null);
    const derived = deriveCommand(value);
    setCommand(derived);
    setShowCommands(shouldShowCommandRail(value));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && showCommands) {
      event.preventDefault();
      event.stopPropagation();
      setShowCommands(false);
      return;
    }

    if (showCommands && filteredCommands.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
        event.preventDefault();
        applyCommand(filteredCommands[highlightIndex] ?? COMMANDS[0]);
        return;
      }
    }

    if (event.key === "/" && !showCommands) {
      setShowCommands(true);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !showCommands) {
      event.preventDefault();
      void submit();
    }
  };

  const submit = React.useCallback(async () => {
    const trimmed = text.trim();
    const resolvedCommand = deriveCommand(text);

    try {
      setBusy(true);
      setError(null);
      await onSubmit({ text: trimmed, command: resolvedCommand });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }, [onError, onSubmit, text]);

  const suggestionRailVisible = contentIsEmpty && !showCommands;
  const describedBy = error ? "assistant-hint assistant-error" : "assistant-hint";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        aria-modal="true"
        aria-labelledby="assistant-title"
        className={cn(
          "w-full max-w-[var(--modal-max-w)] border border-[var(--border-subtle)]",
          "rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--elevation-lg)]",
          "p-0 focus-visible:outline-none"
        )}
      >
        <header className="flex items-center justify-between px-[var(--space-6)] pt-[var(--space-6)]">
          <h2 id="assistant-title" className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
            Assistant
          </h2>
          <DialogClose asChild>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-[var(--radius-md)] text-[color:var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DialogClose>
        </header>

        <div className="px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-2)]">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              rows={3}
              value={text}
              onChange={(event) => handleTextChange(event.target.value)}
              onKeyDown={handleKeyDown}
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
                        applyCommand(cmd);
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
              Press Enter to {primaryLabel}. Press Shift+Enter for a new line.
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
                    applyCommand(cmd);
                  }}
                  title={cmd.desc}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="border-t border-[var(--border-subtle)] px-[var(--space-6)] py-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/notes"
              className="text-sm text-[color:var(--text-secondary)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[color:var(--text-primary)]"
            >
              Go to notes
            </a>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={busy || contentIsEmpty}
                className="min-w-[var(--assistant-primary-min-w)]"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span>Saving…</span>
                  </>
                ) : (
                  primaryLabel
                )}
              </Button>
            </div>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
