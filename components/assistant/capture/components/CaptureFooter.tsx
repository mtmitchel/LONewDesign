import { Loader2 } from "lucide-react";
import { Button } from "../../../ui/button";
import { AssistantCommand } from "../types";

interface CaptureFooterProps {
  busy: boolean;
  contentIsEmpty: boolean;
  command: AssistantCommand;
  predictedIntent: "task" | "note" | "event" | null;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CaptureFooter({
  busy,
  contentIsEmpty,
  command,
  predictedIntent,
  onCancel,
  onSubmit,
}: CaptureFooterProps) {
  const primaryLabel = getPrimaryLabel(command, predictedIntent);

  return (
    <footer className="border-t border-[var(--border-subtle)] px-[var(--space-6)] py-[var(--space-4)]">
      <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/notes"
          className="text-sm text-[color:var(--text-secondary)] underline decoration-dotted underline-offset-2 transition-colors hover:text-[color:var(--text-primary)]"
        >
          Go to notes
        </a>
        <div className="flex items-center gap-[var(--space-2)]">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
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
  );
}

function getPrimaryLabel(command: AssistantCommand, predictedIntent: "task" | "note" | "event" | null): string {
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
}