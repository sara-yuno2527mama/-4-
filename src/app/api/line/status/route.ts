import { isLineConfigured, lineAddFriendUrl } from "@/lib/line";
import { linkedLineUserId } from "@/lib/kitchen-state";
import { isServerStorePersistent, readKitchenStore } from "@/lib/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readKitchenStore();
  return Response.json({
    configured: isLineConfigured(),
    linked: Boolean(linkedLineUserId(state)),
    addFriendUrl: lineAddFriendUrl() || null,
    // 送り先を保存できる状態か。false のままだと連携が残らない
    persistent: isServerStorePersistent(),
  });
}
