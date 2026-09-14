import { linkedLineUserId, selfMember } from "@/lib/kitchen-state";
import {
  isLineConfigured,
  replyLineMessages,
  verifyLineSignature,
} from "@/lib/line";
import { readKitchenStore, writeKitchenStore } from "@/lib/server-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LineSource = { userId?: string };
type LineEvent = {
  type: string;
  replyToken?: string;
  source?: LineSource;
};

export async function GET() {
  return Response.json({ ok: true, configured: isLineConfigured() });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!isLineConfigured() || !verifyLineSignature(body, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(body) as { events?: LineEvent[] }).events ?? [];
  } catch {
    return new Response("ok", { status: 200 });
  }

  const state = await readKitchenStore();
  let next = state;

  for (const event of events) {
    const userId = event.source?.userId;
    if (!userId) continue;

    if (event.type === "unfollow") {
      next = {
        ...next,
        members: next.members.map((member) =>
          member.lineUserId === userId
            ? { ...member, lineUserId: null, lineLinked: false }
            : member,
        ),
      };
      continue;
    }

    if (event.type === "follow" || event.type === "message") {
      const linked = linkedLineUserId(next);

      // すでに別の人と連携済みなら上書きしない
      if (linked && linked !== userId) {
        if (event.replyToken) {
          await replyLineMessages(event.replyToken, [
            {
              type: "text",
              text: "この家庭はすでに連携済みです。送り先を変えるときは、いまの送り先でブロックを解除してから、もう一度友だち追加してください。",
            },
          ]);
        }
        continue;
      }

      if (!linked) {
        const targetId = selfMember(next)?.id ?? "member-self";
        next = {
          ...next,
          members: next.members.map((member) =>
            member.id === targetId
              ? { ...member, lineUserId: userId, lineLinked: true }
              : member,
          ),
        };
      }

      if (event.replyToken && (event.type === "follow" || !linked)) {
        await replyLineMessages(event.replyToken, [
          {
            type: "text",
            text: "AIキッチン秘書と連携しました。定番の前日20時と、使い切りの当日7時にお知らせします。",
          },
        ]);
      }
    }
  }

  if (next !== state) {
    try {
      await writeKitchenStore(next);
    } catch (error) {
      console.error("[line-webhook] 連携の保存に失敗しました", error);
    }
  }

  return new Response("ok", { status: 200 });
}

