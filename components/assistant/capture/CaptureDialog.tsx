import * as React from "react";
import { Dialog, DialogContent } from "../../ui/dialog";
import { cn } from "../../ui/utils";
import { useCaptureState } from "./hooks/useCaptureState";
import { CaptureHeader } from "./components/CaptureHeader";
import { CaptureFooter } from "./components/CaptureFooter";
import { CaptureInput } from "./components/CaptureInput";
import { WritingToolsSection } from "./components/WritingToolsSection";
import { AssistantCaptureDialogProps } from "./types";

export function CaptureDialog({
  open,
  initialValue,
  selectedText,
  canEditSelection = true,
  onOpenChange,
  onSubmit,
  onCommandSelect,
  onError,
  onReplace,
  onInsert,
}: AssistantCaptureDialogProps) {
  const [state, actions] = useCaptureState({
    open,
    initialValue,
    selectedText,
    onOpenChange,
    onSubmit,
    onCommandSelect,
    onError,
  });

  const {
    text,
    command,
    showCommands,
    highlightIndex,
    busy,
    error,
    predictedIntent,
    storedSelectedText,
  } = state;

  const {
    handleTextChange,
    applyCommand,
    submit,
    setShowCommands,
    setHighlightIndex,
  } = actions;

  const contentIsEmpty = text.trim().length === 0;

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
        <CaptureHeader onClose={() => onOpenChange(false)} />

        {/* Writing Tools Mode */}
        {storedSelectedText && (
          <WritingToolsSection
            storedSelectedText={storedSelectedText}
            canEditSelection={canEditSelection}
            onReplace={onReplace}
            onInsert={onInsert}
            onOpenChange={onOpenChange}
          />
        )}

        {/* Normal Mode */}
        {!storedSelectedText && (
          <>
            <CaptureInput
              text={text}
              showCommands={showCommands}
              highlightIndex={highlightIndex}
              error={error}
              onTextChange={handleTextChange}
               onKeyDown={(event: React.KeyboardEvent) => {
                 if (event.key === "Escape" && showCommands) {
                   event.preventDefault();
                   event.stopPropagation();
                   setShowCommands(false);
                   return;
                 }

                 if (showCommands) {
                   if (event.key === "ArrowDown") {
                     event.preventDefault();
                     setHighlightIndex(highlightIndex + 1);
                     return;
                   }
                   if (event.key === "ArrowUp") {
                     event.preventDefault();
                     setHighlightIndex(Math.max(0, highlightIndex - 1));
                     return;
                   }
                   if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
                     event.preventDefault();
                     // applyCommand will be handled by CaptureInput
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
               }}
              onApplyCommand={applyCommand}
              contentIsEmpty={contentIsEmpty}
            />

            {/* Footer - only show in normal mode */}
            <CaptureFooter
              busy={busy}
              contentIsEmpty={contentIsEmpty}
              command={command}
              predictedIntent={predictedIntent}
              onCancel={() => onOpenChange(false)}
              onSubmit={submit}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}