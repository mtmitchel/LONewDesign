import { describe, expect, it, vi } from "vitest";

import { SelectionSubscriptionManager } from "../managers/SelectionSubscriptionManager";
import type { ModuleRendererCtx } from "../../../types";

function createStore<State extends object>(initialState: State) {
  const subscribers: Array<{
    selector: (state: State) => unknown;
    listener: (value: unknown) => void;
    options?: { fireImmediately?: boolean };
  }> = [];
  const unsubscribeSpies: Array<ReturnType<typeof vi.fn>> = [];

  const subscribe = vi.fn(
    <SelectedValue>(
      selector: (state: State) => SelectedValue,
      listener: (value: SelectedValue) => void,
      options?: { fireImmediately?: boolean },
    ) => {
      if (options?.fireImmediately) {
        listener(selector(initialState));
      }

      const unsubscribe = vi.fn();
      unsubscribeSpies.push(unsubscribe);

      const record = {
        selector,
        listener: listener as (value: unknown) => void,
        options,
      };

      subscribers.push(record);

      return () => {
        unsubscribe();
        const index = subscribers.indexOf(record);
        if (index >= 0) {
          subscribers.splice(index, 1);
        }
      };
    },
  );

  const storeFn = Object.assign(
    () => initialState,
    {
      getState: () => initialState,
      subscribe,
      emit(index: number, state: State) {
        const record = subscribers[index];
        if (!record) return;
        const value = record.selector(state);
        record.listener(value);
      },
      getSubscribers: () => subscribers,
      getUnsubscribeSpies: () => unsubscribeSpies,
    },
  );

  return storeFn;
}

describe("SelectionSubscriptionManager", () => {
  it("invokes selection and version callbacks and cleans up subscriptions", () => {
    const state = {
      selectedElementIds: new Set<string>(["initial"]),
      selectionVersion: 1,
    };

    const store = createStore(state);

    const onSelectionChange = vi.fn();
    const onSelectionVersionChange = vi.fn();

    const manager = new SelectionSubscriptionManager(
      ({ store } as unknown) as Pick<ModuleRendererCtx, "store">,
      {
        onSelectionChange,
        onSelectionVersionChange,
      },
    );

    manager.start();

    expect(store.subscribe).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange.mock.calls[0][0]).toEqual(new Set(["initial"]));

    // Simulate selection change
    state.selectedElementIds = new Set(["next"]);
    store.emit(0, state);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange.mock.calls[1][0]).toEqual(new Set(["next"]));

    // Simulate version bump
    state.selectionVersion = 2;
    store.emit(1, state);
    expect(onSelectionVersionChange).toHaveBeenCalledWith(2);

    manager.stop();

    const unsubscribeSpies = store.getUnsubscribeSpies();
    expect(unsubscribeSpies).toHaveLength(2);
    unsubscribeSpies.forEach((spy) => expect(spy).toHaveBeenCalled());
  });

  it("handles absence of version callback", () => {
    const state = {
      selectedElementIds: new Set<string>(),
    };

    const store = createStore(state);
    const onSelectionChange = vi.fn();

    const manager = new SelectionSubscriptionManager(
      ({ store } as unknown) as Pick<ModuleRendererCtx, "store">,
      { onSelectionChange },
    );

    manager.start();

    expect(store.subscribe).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());

    manager.stop();
    expect(store.getSubscribers()).toHaveLength(0);
    expect(store.getUnsubscribeSpies()).toHaveLength(1);
    expect(store.getUnsubscribeSpies()[0]).toHaveBeenCalled();
  });
});
