import { isKitchenDemoEmpty, seedDemoKitchenState } from "./demo-state";
import { normalizeKitchenState } from "./kitchen-state";
import { DEFAULT_STATE, type KitchenState } from "./types";

export const STORAGE_KEY = "ai-kitchen-secretary:submit-a";

export function hasStoredKitchenState(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(STORAGE_KEY));
}

export function loadKitchenState(): KitchenState {
  if (typeof window === "undefined") {
    return seedDemoKitchenState(structuredClone(DEFAULT_STATE));
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDemoKitchenState(structuredClone(DEFAULT_STATE));
    const parsed = normalizeKitchenState(
      JSON.parse(raw) as Partial<KitchenState>,
    );
    return isKitchenDemoEmpty(parsed) ? seedDemoKitchenState(parsed) : parsed;
  } catch {
    return seedDemoKitchenState(structuredClone(DEFAULT_STATE));
  }
}

export function saveKitchenState(state: KitchenState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
