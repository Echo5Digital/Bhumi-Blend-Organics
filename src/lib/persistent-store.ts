"use client";

import { useSyncExternalStore } from "react";

// A small localStorage-backed store for client-side state that has to survive
// reloads and stay in step across components and tabs (the wishlist, the cart).
//
// - The server, and the hydration pass in the browser, always see `empty`, so
//   the markup matches; the saved value is swapped in right after hydration.
// - `version` goes up on every change after the first read (not on the read
//   itself), so the UI can react to "something just changed" without reacting
//   to a page load.
// - There is no account or backend yet. When there is, the stores built on
//   this (lib/wishlist.ts, lib/cart.ts) are the only code that has to change.

type StoreState<T> = { value: T; version: number };

export function createPersistentStore<T>({
  key,
  empty,
  parse,
}: {
  key: string;
  empty: T;
  /** Turns whatever JSON is in storage into a valid value (it could be anything). */
  parse: (raw: unknown) => T;
}) {
  // What the server (and the hydration pass) sees.
  const SERVER_STATE: StoreState<T> = { value: empty, version: 0 };

  let state = SERVER_STATE;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return parse(JSON.parse(raw));
    } catch {
      // Storage blocked (private mode) or the JSON is corrupt: start empty.
    }
    return empty;
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  // Read localStorage once, the first time a client component asks.
  function load() {
    if (loaded) return;
    loaded = true;
    state = { value: read(), version: 0 };
  }

  // Another tab changed it.
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== key) return;
    loaded = true;
    state = { value: read(), version: state.version + 1 };
    emit();
  }

  function subscribe(listener: () => void) {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
  }

  const getSnapshot = () => {
    load();
    return state;
  };
  const getServerSnapshot = () => SERVER_STATE;

  return {
    /** The whole state; re-renders on any change. */
    useStore: () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot),

    /** One derived primitive; re-renders only when that value changes. */
    useSelector<S>(select: (value: T) => S): S {
      return useSyncExternalStore(
        subscribe,
        () => {
          load();
          return select(state.value);
        },
        () => select(empty),
      );
    },

    /** Replace the value with `change(current)`. Returning `current` itself means "no change". */
    update(change: (current: T) => T) {
      load();
      const next = change(state.value);
      if (next === state.value) return;
      state = { value: next, version: state.version + 1 };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Not persisted (storage blocked), but it still works for this visit.
      }
      emit();
    },
  };
}

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true once the page is interactive. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
