// ============================================================================
// SELECTION HANDLING
// ============================================================================

import { useCallback } from "react";
import { toast } from "sonner";
import type { SelectionSnapshot } from "./state/useQuickAssistantState";

export function useSelectionHandling(selectionSnapshotRef: React.MutableRefObject<SelectionSnapshot | null>) {
  const applyWritingResult = useCallback(
    (resultText: string, mode: "replace" | "insert") => {
      if (!resultText) {
        toast.error("Nothing to insert — try again.");
        return false;
      }

      const snapshot = selectionSnapshotRef.current;
      if (!snapshot) {
        try {
          void navigator.clipboard.writeText(resultText);
          toast.info("Copied result — no selection to update.");
        } catch {
          toast.info("Result ready — select text to replace next time.");
        }
        return false;
      }

      const applyToInput = (element: HTMLInputElement | HTMLTextAreaElement, start: number, end: number) => {
        const value = element.value ?? "";
        const insertAt = mode === "replace" ? start : end;
        const replaceTo = mode === "replace" ? end : end;
        const nextValue =
          value.slice(0, start) + resultText + value.slice(replaceTo);
        const cursor = insertAt + resultText.length;
        element.value = nextValue;
        element.focus({ preventScroll: true });
        element.selectionStart = cursor;
        element.selectionEnd = cursor;
        const inputEvent = typeof InputEvent !== "undefined"
          ? new InputEvent("input", { bubbles: true })
          : new Event("input", { bubbles: true });
        element.dispatchEvent(inputEvent);
        return true;
      };

      const applyToRange = (rangeSnapshot: { range: Range; focusElement: HTMLElement | null }) => {
        const selection = window.getSelection();
        if (!selection) {
          return false;
        }
        const workingRange = rangeSnapshot.range.cloneRange();
        selection.removeAllRanges();
        selection.addRange(workingRange);

        if (mode === "replace") {
          workingRange.deleteContents();
        } else {
          workingRange.collapse(false);
        }

        const textNode = document.createTextNode(resultText);
        workingRange.insertNode(textNode);

        // Move caret to end of inserted text
        const afterRange = document.createRange();
        afterRange.setStartAfter(textNode);
        afterRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(afterRange);

        if (rangeSnapshot.focusElement) {
          rangeSnapshot.focusElement.focus({ preventScroll: true });
        }

        const editable =
          rangeSnapshot.focusElement?.closest('[contenteditable="true"]') ??
          textNode.parentElement?.closest('[contenteditable="true"]');
        if (editable instanceof HTMLElement) {
          editable.dispatchEvent(
            typeof InputEvent !== "undefined"
              ? new InputEvent("input", { bubbles: true })
              : new Event("input", { bubbles: true })
          );
        }
        return true;
      };

      let applied = false;
      if (snapshot.kind === "input") {
        applied = applyToInput(snapshot.element, snapshot.start, snapshot.end);
      } else {
        applied = applyToRange(snapshot);
      }

      if (applied) {
        selectionSnapshotRef.current = null;
      }
      return applied;
    },
    []
  );

  return { applyWritingResult };
}