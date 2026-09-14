import { missingKeyResponse, visionJson } from "@/lib/vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    imageDataUrl?: string;
  } | null;
  const imageDataUrl = body?.imageDataUrl?.trim();
  if (!imageDataUrl?.startsWith("data:image/")) {
    return Response.json({ error: "画像がありません" }, { status: 400 });
  }
  try {
    const parsed = await visionJson<{
      name?: string;
      useByDate?: string | null;
    }>(
      [
        "買い物した食品・総菜・作り置きの写真です。",
        "商品名（または料理名）と、写っていれば使用期限（YYYY-MM-DD）を JSON で返してください。",
        '形式: {"name":"名前","useByDate":"2026-08-30"|null}',
      ].join(""),
      imageDataUrl,
    );
    return Response.json({
      name: String(parsed.name ?? "").trim(),
      useByDate: parsed.useByDate || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "missing_api_key") return missingKeyResponse();
    return Response.json(
      { error: "写真から読み取れませんでした。名前から保存できます。" },
      { status: 502 },
    );
  }
}
