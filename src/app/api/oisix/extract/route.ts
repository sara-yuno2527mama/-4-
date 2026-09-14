import {
  missingKeyResponse,
  visionJson,
} from "@/lib/vision";
import { reasonFromVisionError } from "@/lib/extract-reason";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    imageDataUrl?: string;
    serviceName?: string;
  } | null;
  const imageDataUrl = body?.imageDataUrl?.trim();
  const serviceName = body?.serviceName?.trim() || "宅配";
  if (!imageDataUrl?.startsWith("data:image/")) {
    return Response.json(
      { error: "画像がありません", reason: "unreadable" },
      { status: 400 },
    );
  }
  try {
    const parsed = await visionJson<{
      deliveryDate?: string | null;
      changeDeadlineAt?: string | null;
      amount?: string;
      menuItems?: string[];
      ingredients?: string[];
    }>(
      [
        `${serviceName}の注文・お届け・変更期限の画面スクショです。`,
        "お届け日、変更期限（日付と時刻があれば）、金額、メニュー名、食材名を JSON で返してください。",
        '形式: {"deliveryDate":"YYYY-MM-DD"|null,"changeDeadlineAt":"YYYY-MM-DDTHH:MM"|null,"amount":"","menuItems":[],"ingredients":[]}',
      ].join(""),
      imageDataUrl,
    );
    return Response.json({
      deliveryDate: parsed.deliveryDate || null,
      changeDeadlineAt: parsed.changeDeadlineAt || null,
      amount: String(parsed.amount ?? ""),
      menuItems: parsed.menuItems ?? [],
      ingredients: parsed.ingredients ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const reason = reasonFromVisionError(message);
    if (reason === "missing_key") return missingKeyResponse();
    return Response.json(
      {
        error:
          reason === "network"
            ? "通信できませんでした。手入力して確定できます。"
            : "画面を読めませんでした。手入力して確定できます。",
        reason,
      },
      { status: 502 },
    );
  }
}
