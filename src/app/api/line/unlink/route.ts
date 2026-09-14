import { linkedLineUserId } from "@/lib/kitchen-state";
import { readKitchenStore, writeKitchenStore } from "@/lib/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const state = await readKitchenStore();
  const userId = linkedLineUserId(state);
  if (!userId) {
    return Response.json({ linked: false });
  }
  await writeKitchenStore({
    ...state,
    members: state.members.map((member) =>
      member.lineUserId
        ? { ...member, lineUserId: null, lineLinked: false }
        : member,
    ),
  });
  return Response.json({ linked: false });
}
