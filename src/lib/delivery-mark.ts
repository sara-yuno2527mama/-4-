import type { DeliveryKind, DeliveryService } from "./types";

/** 許諾ファイルを public/delivery-marks/ に置いたときだけパスを書く。公式ロゴの無断利用・外部URLはしない */
export const LICENSED_DELIVERY_MARK_SRC: Partial<
  Record<Exclude<DeliveryKind, "other">, string>
> = {};

export function deliveryMarkLetter(name: string, kind: DeliveryKind): string {
  if (kind === "oisix") return "オ";
  if (kind === "fcoop") return "エ";
  const trimmed = name.trim();
  return trimmed ? Array.from(trimmed)[0] : "他";
}

/** data URL か同一オリジンのパスだけ。http(s) ホットリンクは捨てる */
export function sanitizeMarkImageDataUrl(
  kind: DeliveryKind,
  raw: unknown,
): string | null {
  if (kind !== "other") return null;
  const markRaw = String(raw ?? "").trim();
  if (markRaw.startsWith("data:image/")) return markRaw;
  if (markRaw.startsWith("/") && !markRaw.startsWith("//")) return markRaw;
  return null;
}

export function localMarkSrc(
  service: Pick<DeliveryService, "kind" | "markImageDataUrl">,
): string | null {
  if (service.kind === "oisix" || service.kind === "fcoop") {
    const licensed = LICENSED_DELIVERY_MARK_SRC[service.kind];
    return licensed?.startsWith("/") && !licensed.startsWith("//")
      ? licensed
      : null;
  }
  return sanitizeMarkImageDataUrl("other", service.markImageDataUrl);
}
