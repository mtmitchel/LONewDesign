import * as React from "react";
import { Dialog, DialogContent, DialogClose } from "../ui/dialog";
import { cn } from "../ui/utils";
import { X, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { useCaptureSession, CommandType } from "./useCaptureSession";
import { SnippetCard } from "./SnippetCard";
import { CommandInput, CommandSuggestionChips } from "./CommandInput";
import { AdvancedPanel } from "./AdvancedPanel";
import { DiffViewer } from "./DiffViewer";

type CaptureModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSnippet?: string;
  source?: string;
  onCapture: (payload: {
    command: CommandType;
    content: string;
    originalContent: string;
    metadata: any;
  }) => void;
};

export function CaptureModal({
  open,
  onOpenChange,
  initialSnippet = "",
  source,
  onCapture,
}: CaptureModalProps) {
  const {
    state,
    hasEdits,
    isLargeSnippet,
    commandMetadata,
    setWorkingCopy,
    setCommand,
    setCommandMetadata,
    toggleSnippetExpanded,
    toggleAdvancedPanel,
    revertToOriginal,
    reset,
  } = useCaptureSession(initialSnippet, source);

  const [showDiff, setShowDiff] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      reset(initialSnippet, source);
      setShowDiff(false);
    }
  }, [open, initialSnippet, source, reset]);

  const handleSubmit = () => {
    if (!state.workingCopy.trim()) return;

    onCapture({
      command: state.command,
      content: state.workingCopy,
      originalContent: state.originalSnippet,
      metadata: commandMetadata,
    });

    onOpenChange(false);
  };

  const getActionLabel = () => {
    if (!state.command) return "Capture to Notes";
    if (state.command === "task") return "Create task";
    if (state.command === "event") return "Schedule event";
    if (state.command === "summarize") return "Generate summary";
    return "Capture";
  };

  const getSecondaryLinkLabel = () => {
    if (state.command === "task") return "Go to Tasks";
    if (state.command === "event") return "Go to Calendar";
    return "Go to Notes";
  };

  const hasContent = state.originalSnippet.length > 0;
  const canSubmit = state.workingCopy.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={cn(
          "bg-[rgba(15,23,42,0.08)] backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        )}
        hideClose
        className={cn(
          "w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)]",
          "rounded-[var(--modal-radius)] shadow-[var(--modal-elevation)] overflow-hidden",
          "max-w-[var(--quick-modal-max-w)]",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
        )}
        aria-modal
        role="dialog"
      >
          {/* Hero Strip */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[color:var(--border-subtle)]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[length:var(--text-lg)] font-semibold text-[color:var(--text-primary)]">
                Assistant
              </span>
              {source && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-secondary)] text-[length:var(--text-xs)]">
                  <MapPin className="size-3" />
                  <span>{source}</span>
                </div>
              )}
            </div>
            <DialogClose
              className="p-2 rounded-[var(--radius-sm)] hover:bg-[color:var(--bg-surface-elevated)] transition-colors"
              aria-label="Close"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </DialogClose>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Snippet Card */}
            {hasContent && (
              <SnippetCard
                snippet={state.originalSnippet}
                isExpanded={state.isSnippetExpanded}
                onToggleExpanded={toggleSnippetExpanded}
                hasEdits={hasEdits}
                onViewDiff={() => setShowDiff(!showDiff)}
                onRevert={revertToOriginal}
                metadata={state.metadata}
                isLarge={isLargeSnippet}
              />
            )}

            {/* Diff Viewer */}
            {showDiff && hasEdits && (
              <DiffViewer
                original={state.originalSnippet}
                edited={state.workingCopy}
                onRevert={revertToOriginal}
              />
            )}

            {/* Command Input */}
            <CommandInput
              value={state.workingCopy}
              onChange={setWorkingCopy}
              onCommandSelect={setCommand}
              placeholder=""
              autoFocus={!hasContent}
              onSubmit={handleSubmit}
            />

            {/* Command Suggestions */}
            {!state.command && (
              <CommandSuggestionChips
                onSelect={(cmd) => {
                  setCommand(cmd);
                  setWorkingCopy(`/${cmd} ${state.workingCopy}`.trim());
                }}
              />
            )}

            {/* Advanced Panel */}
            <AdvancedPanel
              command={state.command}
              isOpen={state.isAdvancedOpen}
              onToggle={toggleAdvancedPanel}
              metadata={commandMetadata}
              onMetadataChange={setCommandMetadata}
            />

            {/* Empty State */}
            {!hasContent && (
              <div className="py-8 text-center">
                <p className="text-[length:var(--text-base)] text-[color:var(--text-secondary)]">
                  Start typing to capture content.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[color:var(--border-subtle)] h-[var(--modal-footer-h)] px-6 flex items-center justify-between">
            <button
              onClick={() => onOpenChange(false)}
              className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              {getSecondaryLinkLabel()}
            </button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {getActionLabel()}
              </Button>
            </div>
          </div>
        </DialogContent>
    </Dialog>
  );
}
