import { runDueNotifications } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CRON_SECRET 未設定なら誰も通さない（fail closed） */
function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[cron-notify] CRON_SECRET が未設定のため実行しません");
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorize(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runDueNotifications();
  return Response.json(result);
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
