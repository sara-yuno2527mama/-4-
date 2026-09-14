"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DeliveryName } from "@/components/DeliveryMark";
import { Card, Field, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useKitchenStore } from "@/hooks/use-kitchen-store";
import { mergeDeliveryDraft, homeDeliveries, patchDelivery } from "@/lib/delivery";
import { addDaysToKey } from "@/lib/dates";
import { activeInventory } from "@/lib/inventory";
import {
  extractFailMessage,
  reasonFromExtractResponse,
  type ExtractFailReason,
} from "@/lib/extract-reason";
import { fileToDataUrl, resizeImageDataUrl } from "@/lib/image";
import {
  INVENTORY_KIND_LABELS,
  type DeliveryService,
  type InventoryItem,
  type InventoryKind,
} from "@/lib/types";

const KINDS = Object.entries(INVENTORY_KIND_LABELS) as [InventoryKind, string][];

type AddSource = "shopping" | "fridge";

type SpeechRec = {
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
};

export default function BoughtPage() {
  const { state, ready, update } = useKitchenStore();
  const photoRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const deliveryRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<AddSource>("shopping");
  const [kind, setKind] = useState<InventoryKind>("sideDish");
  const [name, setName] = useState("");
  const [useByDate, setUseByDate] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [itemMessage, setItemMessage] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const shownDeliveries = homeDeliveries(state);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const selectedDelivery =
    shownDeliveries.find((item) => item.id === selectedDeliveryId) ??
    shownDeliveries[0] ??
    null;
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryService | null>(
    selectedDelivery,
  );

  useEffect(() => {
    setDeliveryDraft(selectedDelivery);
  }, [selectedDelivery?.id]);

  if (!ready) {
    return (
      <AppShell title="追加">
        <p className="text-base text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  function switchSource(next: AddSource) {
    setSource(next);
    setItemMessage("");
    setKind(next === "fridge" ? "prepared" : "sideDish");
  }

  function confirmItem() {
    const trimmed = name.trim();
    if (!trimmed) {
      setItemMessage("名前を入れてから「確認して確定」を押してください。");
      nameRef.current?.focus();
      return;
    }
    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      kind,
      quantity: "",
      useByDate: useByDate || null,
      memo: source === "fridge" ? "冷蔵庫から" : "",
      photoDataUrl,
      createdAt: new Date().toISOString(),
    };
    update((prev) => ({ ...prev, inventory: [item, ...prev.inventory] }));
    setName("");
    setUseByDate("");
    setPhotoDataUrl(null);
    setItemMessage(`「${item.name}」を今ある一覧に入れました。`);
  }

  function listenVoice() {
    const Speech =
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRec;
          SpeechRecognition?: new () => SpeechRec;
        }
      ).webkitSpeechRecognition ||
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRec;
        }
      ).SpeechRecognition;
    if (!Speech) {
      setItemMessage("音声が使えないときは、名前を手入力して「確認して確定」してください。");
      nameRef.current?.focus();
      return;
    }
    const rec = new Speech();
    rec.lang = "ja-JP";
    rec.onresult = (event) => {
      setName(event.results[0][0].transcript.replace(/\s/g, ""));
      setItemMessage("名前を入れました。内容を確認して「確認して確定」を押してください。");
    };
    rec.onerror = () => setItemMessage("音声を聞き取れませんでした。名前を手入力できます。");
    rec.start();
  }

  return (
    <AppShell title="追加">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`min-h-11 rounded-xl py-2.5 text-base font-semibold ${
            source === "shopping"
              ? "bg-[#1B6B32] text-white"
              : "border border-[#e6e8e3] bg-white text-neutral-800"
          }`}
          onClick={() => switchSource("shopping")}
        >
          買い物で追加
        </button>
        <button
          type="button"
          className={`min-h-11 rounded-xl py-2.5 text-base font-semibold ${
            source === "fridge"
              ? "bg-[#1B6B32] text-white"
              : "border border-[#e6e8e3] bg-white text-neutral-800"
          }`}
          onClick={() => switchSource("fridge")}
        >
          冷蔵庫から追加
        </button>
      </div>

      <Card>
        <p className="text-lg font-bold">
          {source === "shopping" ? "買い物で追加" : "冷蔵庫から追加"}
        </p>
        <p className="mt-1 mb-3 text-xs text-neutral-500">
          {source === "shopping"
            ? "買ってきたものを下書きし、確認してから「今ある」へ入れます。"
            : "すでに冷蔵庫にあるもの（作り置きなど）を下書きし、「今ある」へ入れます。"}
        </p>
        <label className="mb-1 block text-xs text-neutral-500">種別</label>
        <select
          className="mb-3 min-h-11 w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-base"
          value={kind}
          onChange={(event) => setKind(event.target.value as InventoryKind)}
        >
          {KINDS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mb-2 text-xs font-semibold text-neutral-500">入口</p>
        <div className="grid grid-cols-3 gap-2">
          <SecondaryButton type="button" onClick={() => photoRef.current?.click()}>
            写真から
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              setItemMessage("名前を入力して「確認して確定」を押してください。");
              nameRef.current?.focus();
            }}
          >
            名前から
          </SecondaryButton>
          <SecondaryButton type="button" onClick={listenVoice}>
            音声から
          </SecondaryButton>
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setItemMessage("写真を読み取っています…");
            try {
              const photo = await resizeImageDataUrl(await fileToDataUrl(file));
              setPhotoDataUrl(photo);
              const response = await fetch("/api/bought/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageDataUrl: photo, kind }),
              });
              const result = (await response.json()) as {
                name?: string;
                useByDate?: string | null;
              };
              if (response.ok) {
                if (result.name?.trim()) setName(result.name.trim());
                if (result.useByDate) setUseByDate(result.useByDate);
                setItemMessage(
                  "下書きです。名前と期限を確認して「確認して確定」を押してください。",
                );
              } else {
                if (!name.trim()) {
                  setName(source === "fridge" ? "冷蔵庫の品" : "買い物した品");
                }
                setItemMessage(
                  "写真を付けました。名前を直して「確認して確定」を押してください。",
                );
              }
            } catch {
              setItemMessage("写真を開けませんでした。名前を手入力して確定できます。");
            } finally {
              setBusy(false);
            }
          }}
        />
        <label className="mt-3 mb-1 block text-xs text-neutral-500">名前</label>
        <Field
          ref={nameRef}
          placeholder={
            source === "fridge" ? "例: ひじきの煮物、余ったカレー" : "例: 唐揚げ、牛乳"
          }
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label className="mt-2 mb-1 block text-xs text-neutral-500">
          使用期限（後からでも可）
        </label>
        <Field
          type="date"
          value={useByDate}
          onChange={(event) => setUseByDate(event.target.value)}
        />
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt="追加する写真"
            className="mt-2 h-24 w-full rounded-xl object-cover"
          />
        ) : null}
        <PrimaryButton
          type="button"
          className="mt-3"
          disabled={busy}
          onClick={confirmItem}
        >
          確認して確定
        </PrimaryButton>
        {busy ? <p className="mt-2 text-xs text-neutral-600">読み取り中…</p> : null}
        {itemMessage ? (
          <p className="mt-2 text-xs text-neutral-600">{itemMessage}</p>
        ) : null}
      </Card>

      {shownDeliveries.length === 0 ? (
        <Card>
          <p className="text-lg font-bold">宅配の取込</p>
          <p className="mt-1 text-xs text-neutral-500">
            設定の宅配で「ホームに出す」にしたサービスがあると、ここでスクショ／手入力できます。
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-lg font-bold">宅配の取込</p>
          <p className="mt-1 mb-3 text-xs text-neutral-500">
            出しているサービスを選んでから、スクショまたは手入力します。確認してから日付・食材を「今ある」へ反映します。
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {shownDeliveries.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`inline-flex min-h-11 items-center rounded-lg px-2.5 py-1 text-base font-semibold ${
                  selectedDelivery?.id === service.id
                    ? "bg-white text-neutral-900 ring-2 ring-[#1B6B32]"
                    : "bg-[#EDEDED] text-neutral-600"
                }`}
                onClick={() => setSelectedDeliveryId(service.id)}
              >
                <DeliveryName service={service} size="sm" />
              </button>
            ))}
          </div>
          {deliveryDraft ? (
            <>
              <input
                ref={deliveryRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  const files = [...(event.target.files ?? [])];
                  event.target.value = "";
                  if (files.length === 0 || !deliveryDraft) return;
                  setBusy(true);
                  let draft = { ...deliveryDraft, pendingPlus14: false };
                  let readCount = 0;
                  let lastFail: ExtractFailReason | null = null;
                  try {
                    for (let index = 0; index < files.length; index += 1) {
                      setDeliveryMessage(
                        `${index + 1}/${files.length}枚を読んでいます…`,
                      );
                      let photo: string;
                      try {
                        photo = await resizeImageDataUrl(
                          await fileToDataUrl(files[index]),
                        );
                      } catch {
                        lastFail = "unreadable";
                        continue;
                      }
                      let response: Response;
                      try {
                        response = await fetch("/api/oisix/extract", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            imageDataUrl: photo,
                            serviceName: draft.name,
                          }),
                        });
                      } catch {
                        lastFail = "network";
                        continue;
                      }
                      const result = (await response.json().catch(() => ({}))) as {
                        deliveryDate?: string | null;
                        changeDeadlineAt?: string | null;
                        amount?: string;
                        menuItems?: string[];
                        ingredients?: string[];
                        reason?: string;
                      };
                      if (!response.ok) {
                        lastFail = reasonFromExtractResponse(
                          response.status,
                          result.reason,
                        );
                        if (lastFail === "missing_key") break;
                        continue;
                      }
                      readCount += 1;
                      draft = mergeDeliveryDraft(draft, result);
                      setDeliveryDraft(draft);
                    }
                    if (readCount > 0) {
                      setDeliveryMessage(
                        files.length > 1
                          ? `${files.length}枚中${readCount}枚を読みました。下書きです。確認して「確認して確定」を押してください。`
                          : "下書きです。内容を確認して、下の「確認して確定」を押してください。",
                      );
                    } else {
                      setDeliveryMessage(
                        extractFailMessage(lastFail ?? "unreadable"),
                      );
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <SecondaryButton
                type="button"
                onClick={() => deliveryRef.current?.click()}
              >
                スクショから読む
              </SecondaryButton>
              <label className="mt-3 mb-1 block text-xs text-neutral-500">
                お届け日
              </label>
              <Field
                type="date"
                value={deliveryDraft.deliveryDate ?? ""}
                onChange={(event) =>
                  setDeliveryDraft((prev) =>
                    prev
                      ? { ...prev, deliveryDate: event.target.value || null }
                      : prev,
                  )
                }
              />
              <label className="mt-2 mb-1 block text-xs text-neutral-500">
                変更期限（日付と時刻）
              </label>
              <Field
                type="datetime-local"
                value={deliveryDraft.changeDeadlineAt ?? ""}
                onChange={(event) =>
                  setDeliveryDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          changeDeadlineAt: event.target.value || null,
                        }
                      : prev,
                  )
                }
              />
              <label className="mt-2 mb-1 block text-xs text-neutral-500">
                金額（任意）
              </label>
              <Field
                placeholder="写っていれば"
                value={deliveryDraft.amount}
                onChange={(event) =>
                  setDeliveryDraft((prev) =>
                    prev ? { ...prev, amount: event.target.value } : prev,
                  )
                }
              />
              <PrimaryButton
                type="button"
                className="mt-3"
                onClick={() => {
                  if (!deliveryDraft) return;
                  const draft = { ...deliveryDraft, pendingPlus14: false };
                  update((prev) => {
                    const existingNames = new Set(
                      activeInventory(prev.inventory).map((item) => item.name),
                    );
                    const added = (draft.ingredients ?? [])
                      .filter(
                        (item) => item.trim() && !existingNames.has(item.trim()),
                      )
                      .map((item) => ({
                        id: crypto.randomUUID(),
                        name: item.trim(),
                        kind: "ingredient" as const,
                        quantity: "",
                        useByDate: null,
                        memo: draft.name,
                        photoDataUrl: null,
                        createdAt: new Date().toISOString(),
                      }));
                    const next = patchDelivery(prev, draft.id, draft);
                    return {
                      ...next,
                      inventory: [...added, ...next.inventory],
                    };
                  });
                  setDeliveryDraft(draft);
                  setDeliveryMessage(
                    `${draft.name}を確定しました。食材は「今ある」へ入れました。`,
                  );
                }}
              >
                確認して確定
              </PrimaryButton>
              {deliveryDraft.deliveryDate ? (
                <SecondaryButton
                  type="button"
                  className="mt-2"
                  onClick={() => {
                    const nextDelivery = addDaysToKey(
                      deliveryDraft.deliveryDate as string,
                      14,
                    );
                    const nextDeadline = deliveryDraft.changeDeadlineAt?.slice(
                      0,
                      10,
                    )
                      ? `${addDaysToKey(deliveryDraft.changeDeadlineAt.slice(0, 10), 14)}${
                          deliveryDraft.changeDeadlineAt.includes("T")
                            ? `T${deliveryDraft.changeDeadlineAt.split("T")[1]}`
                            : ""
                        }`
                      : null;
                    update((prev) =>
                      patchDelivery(prev, deliveryDraft.id, {
                        pendingPlus14: true,
                      }),
                    );
                    setDeliveryDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            deliveryDate: nextDelivery,
                            changeDeadlineAt: nextDeadline,
                            pendingPlus14: true,
                          }
                        : prev,
                    );
                    setDeliveryMessage(
                      `次周期の提案: お届け ${nextDelivery}。よければこの欄の「確認して確定」を押してください。`,
                    );
                  }}
                >
                  次周期を+14日で提案
                </SecondaryButton>
              ) : null}
            </>
          ) : null}
          {deliveryMessage ? (
            <p className="mt-2 text-xs text-neutral-600">{deliveryMessage}</p>
          ) : null}
        </Card>
      )}
    </AppShell>
  );
}
