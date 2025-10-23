// ============================================================================
// TELEMETRY & EVENT DISPATCHING
// ============================================================================

import { useEffect } from "react";

export const QUICK_ASSISTANT_EVENTS = {
  open: "quick-assistant:open",
  createNote: "quick-assistant:create-note",
  createEvent: "quick-assistant:create-event",
} as const;

export function dispatchAssistantEvent(eventName: string, detail?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function useEventListeners(openAssistant: (options?: any) => void) {
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const detail = (event as CustomEvent<any>).detail;
      openAssistant(detail);
    };

    window.addEventListener(QUICK_ASSISTANT_EVENTS.open, handleOpenEvent);
    return () => {
      window.removeEventListener(QUICK_ASSISTANT_EVENTS.open, handleOpenEvent);
    };
  }, [openAssistant]);
}