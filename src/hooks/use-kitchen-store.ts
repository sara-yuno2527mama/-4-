"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isKitchenDemoEmpty, seedDemoKitchenState } from "@/lib/demo-state";
import { preserveLineIds } from "@/lib/kitchen-state";
import {
  hasStoredKitchenState,
  loadKitchenState,
  saveKitchenState,
} from "@/lib/storage";
import { DEFAULT_STATE, type KitchenState } from "@/lib/types";

type Listener = () => void;

let memoryState: KitchenState = seedDemoKitchenState(structuredClone(DEFAULT_STATE));
let hydrated = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): KitchenState {
  return memoryState;
}

function getServerSnapshot(): KitchenState {
  return seedDemoKitchenState(structuredClone(DEFAULT_STATE));
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function syncToServer(state: KitchenState) {
  window.clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => undefined);
  }, 400);
}

function setKitchenState(
  updater: KitchenState | ((prev: KitchenState) => KitchenState),
) {
  memoryState =
    typeof updater === "function" ? updater(memoryState) : updater;
  saveKitchenState(memoryState);
  syncToServer(memoryState);
  emit();
}

export function useKitchenStore() {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!hydrated) {
        const hadLocal = hasStoredKitchenState();
        memoryState = loadKitchenState();
        try {
          const response = await fetch("/api/state");
          if (response.ok) {
            const incoming = (await response.json()) as KitchenState;
            const server = isKitchenDemoEmpty(incoming)
              ? seedDemoKitchenState(incoming)
              : incoming;
            const merged = hadLocal
              ? preserveLineIds(memoryState, server)
              : server;
            memoryState = isKitchenDemoEmpty(merged)
              ? seedDemoKitchenState(merged)
              : merged;
            saveKitchenState(memoryState);
          }
        } catch {
          /* local-only until the API is up */
        }
        hydrated = true;
        emit();
        syncToServer(memoryState);
      }
      if (!cancelled) setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (updater: KitchenState | ((prev: KitchenState) => KitchenState)) => {
      setKitchenState(updater);
    },
    [],
  );

  return { state, ready, update };
}
