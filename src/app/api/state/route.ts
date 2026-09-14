import { normalizeKitchenState, preserveLineIds } from "@/lib/kitchen-state";
import { readKitchenStore, writeKitchenStore } from "@/lib/server-store";
import type { KitchenState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readKitchenStore();
  return Response.json(state);
}

export async function PUT(request: Request) {
  const incoming = (await request.json()) as Partial<KitchenState>;
  const existing = await readKitchenStore();
  const next = preserveLineIds(normalizeKitchenState(incoming), existing);
  if (!Array.isArray(incoming.recipes)) {
    next.recipes = existing.recipes ?? [];
  }
  if (!Array.isArray(incoming.recipeShares)) {
    next.recipeShares = existing.recipeShares ?? [];
  } else {
    const byToken = new Map(
      (existing.recipeShares ?? []).map((item) => [item.token, item]),
    );
    for (const item of next.recipeShares) {
      byToken.set(item.token, item);
    }
    next.recipeShares = [...byToken.values()];
  }
  try {
    await writeKitchenStore(next);
  } catch (error) {
    // 端末側の保存は続ける。ただし黙って捨てず、ログには必ず残す
    console.error("[api/state] サーバー保存に失敗しました", error);
  }
  return Response.json(next);
}
