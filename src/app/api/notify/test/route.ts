import { sendNotify, type NotifyKind } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { kind?: string };
  const kind: NotifyKind =
    body.kind === "useby" ? "useby" : body.kind === "missing" ? "missing" : "rhythm";
  const result = await sendNotify(kind, { force: true });
  const success = result.ok && !result.skipped;
  return Response.json(result, { status: success ? 200 : 400 });
}
