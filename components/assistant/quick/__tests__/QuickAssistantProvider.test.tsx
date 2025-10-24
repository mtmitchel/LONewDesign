import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, renderHook, act, waitFor, screen } from "@testing-library/react";

import { QuickAssistantProvider } from "../QuickAssistantProvider";
import { useQuickAssistant } from "../state/QuickAssistantContext";
import { openQuickAssistant, QUICK_ASSISTANT_EVENTS } from "../telemetry";

const addTaskMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../extended/QuickTaskModal", () => ({
  QuickTaskModal: () => null,
}));

vi.mock("../../extended/QuickNoteModal", () => ({
  QuickNoteModal: () => null,
}));

vi.mock("../../extended/QuickEventModal", () => ({
  QuickEventModal: () => null,
}));

vi.mock("../../modules/tasks/taskStore", () => ({
  useTaskStore: (selector?: (state: { addTask: typeof addTaskMock }) => unknown) => {
    const state = { addTask: addTaskMock };
    return selector ? selector(state) : state;
  },
}));

vi.mock("../../modules/settings/state/providerSettings", () => ({
  useProviderSettings: () => ({
    provider: "mock",
  }),
}));

vi.mock("../services/openaiProvider", () => ({
  createProviderFromSettings: () => ({
    classifyText: vi.fn(),
  }),
}));

vi.mock("../selection", () => ({
  useSelectionHandling: () => ({
    applyWritingResult: vi.fn(() => true),
  }),
}));

vi.mock("../intent", () => ({
  useIntentClassification: () => ({
    classifyAndRouteIntent: vi.fn(),
  }),
}));

vi.mock("../hotkeys", () => ({
  useQuickAssistantHotkeys: () => {
    // no-op in tests
  },
}));

beforeEach(() => {
  addTaskMock.mockClear();
});

describe("openQuickAssistant", () => {
  it("dispatches the open event with payload", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    const payload = { mode: "task" as const };
    openQuickAssistant(payload);

    expect(spy).toHaveBeenCalledTimes(1);
    const event = spy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(QUICK_ASSISTANT_EVENTS.open);
    expect(event.detail).toEqual(payload);
    spy.mockRestore();
  });
});

describe("useQuickAssistant", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useQuickAssistant())).toThrowError(
      /must be used within a QuickAssistantProvider/
    );
  });

  it("provides context when wrapped with provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QuickAssistantProvider>{children}</QuickAssistantProvider>
    );

    const { result } = renderHook(() => useQuickAssistant(), { wrapper });
    expect(typeof result.current.openAssistant).toBe("function");
    expect(typeof result.current.openQuickCreate).toBe("function");
  });
});

describe("QuickAssistantProvider integration", () => {
  it("opens capture dialog when openQuickAssistant is invoked", async () => {
    render(
      <QuickAssistantProvider>
        <div data-testid="child" />
      </QuickAssistantProvider>
    );

    act(() => {
      openQuickAssistant({ initialValue: "Hello" });
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /assistant/i })).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/capture a thought/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Hello");
  });
});
