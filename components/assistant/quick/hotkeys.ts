// ============================================================================
// HOTKEY MANAGEMENT
// ============================================================================

import { useEffect } from "react";
import type { OpenAssistantOptions } from "./state/QuickAssistantContext";

type HotkeyHandlers = {
  openAssistant: (options?: OpenAssistantOptions) => void;
  openQuickCreate: (
    mode: Exclude<"capture" | "task" | "note" | "event", "capture">,
    options?: Omit<OpenAssistantOptions, "mode">
  ) => void;
};

export function useQuickAssistantHotkeys(handlers: HotkeyHandlers) {
  const { openAssistant, openQuickCreate } = handlers;

  useEffect(() => {
    const isInputLike = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const selection = window.getSelection();
      const rawSelection = selection?.toString() ?? "";
      const trimmedSelection = rawSelection.trim();

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;

      if (key === "k" && isMod) {
        event.preventDefault();
        openAssistant({
          initialValue:
            trimmedSelection.length > 0 ? rawSelection : undefined,
        });
        return;
      }

      if (isInputLike(event.target)) return;

      if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) {
        return;
      }

      if (key === "t") {
        openQuickCreate("task");
      } else if (key === "n") {
        openQuickCreate("note");
      } else if (key === "e") {
        openQuickCreate("event");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openAssistant, openQuickCreate]);
}