"use client";

import {
  deliveryMarkLetter,
  localMarkSrc,
} from "@/lib/delivery-mark";
import type { DeliveryKind, DeliveryService } from "@/lib/types";

const SIZE = {
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
} as const;

export function DeliveryMark({
  service,
  size = "md",
}: {
  service: Pick<DeliveryService, "kind" | "name" | "markImageDataUrl">;
  size?: "sm" | "md";
}) {
  const src = localMarkSrc(service);
  const box =
    service.kind === "oisix"
      ? "bg-[#1B6B32] text-white"
      : service.kind === "fcoop"
        ? "bg-[#C62828] text-white"
        : "bg-[#6B7280] text-white";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${SIZE[size]} shrink-0 rounded-lg object-cover ring-1 ring-black/15`}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold ring-1 ring-black/15 ${SIZE[size]} ${box}`}
      aria-hidden
    >
      {deliveryMarkLetter(service.name, service.kind)}
    </span>
  );
}

export function DeliveryName({
  service,
  size = "md",
  className = "",
}: {
  service: Pick<DeliveryService, "kind" | "name" | "markImageDataUrl">;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <DeliveryMark service={service} size={size} />
      <span>{service.name}</span>
    </span>
  );
}

export function DeliveryKindMark({
  kind,
  size = "sm",
}: {
  kind: Exclude<DeliveryKind, "other">;
  size?: "sm" | "md";
}) {
  return (
    <DeliveryMark
      service={{
        kind,
        name: kind === "oisix" ? "オイシックス" : "エフコープ",
        markImageDataUrl: null,
      }}
      size={size}
    />
  );
}
