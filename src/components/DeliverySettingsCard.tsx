"use client";

import { useRef, useState } from "react";
import {
  DeliveryKindMark,
  DeliveryMark,
  DeliveryName,
} from "@/components/DeliveryMark";
import { Card, Field, SecondaryButton } from "@/components/ui";
import {
  canAddKind,
  createDelivery,
  patchDelivery,
  removeDelivery,
  withDeliveries,
} from "@/lib/delivery";
import { fileToDataUrl, resizeImageDataUrl } from "@/lib/image";
import type { DeliveryKind, KitchenState } from "@/lib/types";

export function DeliverySettingsCard({
  state,
  onUpdate,
}: {
  state: KitchenState;
  onUpdate: (updater: (prev: KitchenState) => KitchenState) => void;
}) {
  const deliveries = state.deliveries ?? [];
  const [otherName, setOtherName] = useState("");
  const markRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function add(kind: DeliveryKind, name?: string) {
    if (kind !== "other" && !canAddKind(deliveries, kind)) return;
    const created = createDelivery(kind, name);
    if (!created) return;
    onUpdate((prev) =>
      withDeliveries(prev, [...(prev.deliveries ?? []), created]),
    );
    if (kind === "other") setOtherName("");
  }

  return (
    <Card>
      <h2 className="text-base font-bold">宅配</h2>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-neutral-500">
        サービスを追加できます。ホームに出す／隠す／消すを選べます。出すものが0ならホームの宅配欄は出ません。
      </p>

      {deliveries.length === 0 ? (
        <p className="mb-3 text-base text-neutral-500">まだサービスはありません。</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-3">
          {deliveries.map((service) => (
            <li
              key={service.id}
              className="rounded-xl border border-[#e6e8e3] bg-white p-3"
            >
              <p className="text-base font-bold">
                <DeliveryName service={service} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
                    service.showOnHome
                      ? "bg-[#1B6B32] text-white"
                      : "bg-[#EDEDED] text-neutral-600"
                  }`}
                  onClick={() =>
                    onUpdate((prev) =>
                      patchDelivery(prev, service.id, { showOnHome: true }),
                    )
                  }
                >
                  ホームに出す
                </button>
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
                    !service.showOnHome
                      ? "bg-[#1B6B32] text-white"
                      : "bg-[#EDEDED] text-neutral-600"
                  }`}
                  onClick={() =>
                    onUpdate((prev) =>
                      patchDelivery(prev, service.id, { showOnHome: false }),
                    )
                  }
                >
                  隠す
                </button>
                {service.kind === "other" ? (
                  <>
                    <input
                      ref={(node) => {
                        markRefs.current[service.id] = node;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        try {
                          const dataUrl = await resizeImageDataUrl(
                            await fileToDataUrl(file),
                            96,
                          );
                          onUpdate((prev) =>
                            patchDelivery(prev, service.id, {
                              markImageDataUrl: dataUrl,
                            }),
                          );
                        } catch {
                          /* 読めない画像は無視 */
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="min-h-11 rounded-lg px-3 text-base font-semibold text-[#1B6B32]"
                      onClick={() => markRefs.current[service.id]?.click()}
                    >
                      マーク画像
                    </button>
                    {service.markImageDataUrl ? (
                      <button
                        type="button"
                        className="min-h-11 rounded-lg px-3 text-base font-semibold text-neutral-500"
                        onClick={() =>
                          onUpdate((prev) =>
                            patchDelivery(prev, service.id, {
                              markImageDataUrl: null,
                            }),
                          )
                        }
                      >
                        画像をやめる
                      </button>
                    ) : null}
                  </>
                ) : null}
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-3 text-base font-semibold text-rose-600"
                  onClick={() => onUpdate((prev) => removeDelivery(prev, service.id))}
                >
                  消す
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mb-2 text-base font-semibold text-neutral-800">サービスを追加</p>
      <div className="flex flex-wrap gap-2">
        <SecondaryButton
          type="button"
          className="inline-flex items-center gap-1.5"
          disabled={!canAddKind(deliveries, "oisix")}
          onClick={() => add("oisix")}
        >
          <DeliveryKindMark kind="oisix" />
          オイシックス
        </SecondaryButton>
        <SecondaryButton
          type="button"
          className="inline-flex items-center gap-1.5"
          disabled={!canAddKind(deliveries, "fcoop")}
          onClick={() => add("fcoop")}
        >
          <DeliveryKindMark kind="fcoop" />
          エフコープ
        </SecondaryButton>
      </div>
      <div className="mt-2 flex gap-2">
        <Field
          placeholder="その他（手入力）"
          value={otherName}
          onChange={(event) => setOtherName(event.target.value)}
        />
        <SecondaryButton
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5"
          disabled={!otherName.trim()}
          onClick={() => add("other", otherName)}
        >
          <DeliveryMark
            service={{
              kind: "other",
              name: otherName.trim() || "他",
              markImageDataUrl: null,
            }}
            size="sm"
          />
          追加
        </SecondaryButton>
      </div>
    </Card>
  );
}
