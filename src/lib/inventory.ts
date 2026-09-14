import type { InventoryItem } from "./types";

/** 「使い切った」を押していないものだけ。削除とは別で、データは残す */
export function activeInventory(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => !item.usedUpAt);
}

export function markInventoryUsedUp(
  items: InventoryItem[],
  id: string,
): InventoryItem[] {
  const now = new Date().toISOString();
  return items.map((item) =>
    item.id === id ? { ...item, usedUpAt: now } : item,
  );
}
