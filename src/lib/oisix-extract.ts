import type { OisixCycle } from "./types";

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function mergeOisixDraft(
  base: OisixCycle,
  next: Partial<Pick<OisixCycle, "deliveryDate" | "changeDeadlineAt" | "amount" | "menuItems" | "ingredients">>,
): OisixCycle {
  const amount = String(next.amount ?? "").trim();
  return {
    ...base,
    deliveryDate: next.deliveryDate || base.deliveryDate,
    changeDeadlineAt: next.changeDeadlineAt || base.changeDeadlineAt,
    amount: amount || base.amount,
    menuItems: uniqueStrings([
      ...(base.menuItems ?? []),
      ...(next.menuItems ?? []),
    ]),
    ingredients: uniqueStrings([
      ...(base.ingredients ?? []),
      ...(next.ingredients ?? []),
    ]),
    pendingPlus14: false,
  };
}
