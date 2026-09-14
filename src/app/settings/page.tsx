"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DeliverySettingsCard } from "@/components/DeliverySettingsCard";
import { MorningStapleSettingsCard } from "@/components/MorningStapleSettings";
import { Card, Field, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import { fileToDataUrl, resizeImageDataUrl } from "@/lib/image";
import { morningStapleSettingsOf } from "@/lib/meal-prefs";
import { recipeSiteOptions } from "@/lib/recipe-search";
import { createInviteToken } from "@/lib/session";
import type { RecipeSiteId } from "@/lib/types";

type LineStatus = {
  configured: boolean;
  linked: boolean;
  addFriendUrl: string | null;
  persistent: boolean;
};

export default function SettingsPage() {
  const { state, ready, update, member } = useCurrentMember();
  const [lineStatus, setLineStatus] = useState<LineStatus | null>(null);
  const [lineMessage, setLineMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.inviteToken) {
      setInviteUrl("");
      return;
    }
    setInviteUrl(
      `${window.location.origin}/join?token=${encodeURIComponent(state.inviteToken)}`,
    );
  }, [state.inviteToken]);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const response = await fetch("/api/line/status");
        if (!response.ok) return;
        const next = (await response.json()) as LineStatus;
        if (cancelled) return;
        setLineStatus(next);
        if (next.linked && member && !member.lineLinked) {
          update((prev) => ({
            ...prev,
            members: prev.members.map((item) =>
              item.id === member.id ? { ...item, lineLinked: true } : item,
            ),
          }));
        }
      } catch {
        /* ignore */
      }
    }
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [member, update]);

  if (!ready) {
    return (
      <AppShell title="設定">
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  // 状態はサーバーの保存を正とする（届いていないなら未連携と出す）
  const linked = lineStatus ? lineStatus.linked : Boolean(member?.lineLinked);
  const familySrc = state.familyPhotoDataUrl || "/family-hero.png";

  return (
    <AppShell title="設定">
      <Card>
        <h2 className="text-base font-bold">家族写真</h2>
        <p className="mt-1 mb-3 text-xs text-neutral-500">
          フォトライブラリから選びます。縦写真も正方形で顔が見えるようにします。
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={familySrc}
          alt="家族写真"
          className="size-24 rounded-2xl object-cover object-top"
        />
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const dataUrl = await resizeImageDataUrl(await fileToDataUrl(file), 800);
            update((prev) => ({ ...prev, familyPhotoDataUrl: dataUrl }));
          }}
        />
        <PrimaryButton
          type="button"
          className="mt-3"
          onClick={() => photoRef.current?.click()}
        >
          家族写真を変更
        </PrimaryButton>
      </Card>

      <Card>
        <h2 className="text-base font-bold">家庭</h2>
        <p className="mt-1 mb-2 text-xs text-neutral-500">メンバー · 招待リンク</p>
        <Field
          value={state.householdName}
          onChange={(event) =>
            update((prev) => ({ ...prev, householdName: event.target.value }))
          }
        />
        <ul className="mt-3 flex flex-col gap-2">
          {state.members.map((item) => (
            <li key={item.id} className="text-sm">
              {item.displayName}
              {item.id === member?.id ? "（あなた）" : ""}
              {" · "}
              {item.lineLinked ? "LINE連携済み" : "LINE未連携"}
            </li>
          ))}
        </ul>
        {inviteUrl ? (
          <p className="mt-2 break-all text-xs text-neutral-600">{inviteUrl}</p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            「招待リンクを発行」で家族を招待できます。
          </p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          <SecondaryButton
            type="button"
            disabled={!inviteUrl}
            onClick={async () => {
              if (!inviteUrl) return;
              await navigator.clipboard.writeText(inviteUrl);
              setCopied("コピーしました");
            }}
          >
            リンクをコピー
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={() => {
              update((prev) => ({ ...prev, inviteToken: createInviteToken() }));
              setCopied("招待リンクを発行しました");
            }}
          >
            {state.inviteToken ? "招待リンクを再発行" : "招待リンクを発行"}
          </SecondaryButton>
          {copied ? <p className="text-xs text-[#1B6B32]">{copied}</p> : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold">LINE通知</h2>
        <p className="mt-1 mb-2 text-xs text-neutral-500">
          献立の前日リマインドと、使い切り・期限の当日通知を送れます。
        </p>
        <p className="mb-3 text-base font-semibold">
          状態: {linked ? "連携済み" : "未連携"}
        </p>
        {lineStatus && !lineStatus.persistent ? (
          <p className="mb-3 text-xs leading-relaxed text-amber-800">
            送り先を保存できない設定です。連携しても残らないので、先にサーバー保存（Upstash Redis）を設定してください。
          </p>
        ) : null}
        {lineStatus?.addFriendUrl ? (
          <a
            href={lineStatus.addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-flex w-full items-center justify-center rounded-xl bg-[#1B6B32] px-3 py-2 text-sm font-semibold text-white"
          >
            公式アカウントを友だち追加
          </a>
        ) : (
          <p className="mb-3 text-xs text-neutral-500">
            友だち追加のあと、トークで連携します。通知時刻は先に合わせておけます。
          </p>
        )}
        <label className="mb-1 block text-xs text-neutral-500">献立の前日通知（時）</label>
        <Field
          type="number"
          min={0}
          max={23}
          className="mb-2"
          value={state.settings.notifyRhythmHour}
          onChange={(event) =>
            update((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                notifyRhythmHour: Number(event.target.value) || 0,
              },
            }))
          }
        />
        <label className="mb-1 block text-xs text-neutral-500">
          使い切り・期限未設定の当日通知（時）
        </label>
        <Field
          type="number"
          min={0}
          max={23}
          className="mb-3"
          value={state.settings.notifyUseByHour}
          onChange={(event) =>
            update((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                notifyUseByHour: Number(event.target.value) || 0,
              },
            }))
          }
        />
        <div className="flex flex-col gap-2">
          <SecondaryButton
            type="button"
            disabled={sending || !linked}
            onClick={async () => {
              setSending(true);
              const response = await fetch("/api/notify/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "rhythm" }),
              });
              const result = (await response.json()) as { skipped?: string };
              setLineMessage(
                result.skipped === "no_rhythm"
                  ? "明日の献立がないため送りませんでした。"
                  : response.ok
                    ? "献立のテスト通知を送りました。"
                    : "送信に失敗しました。",
              );
              setSending(false);
            }}
          >
            献立通知を今すぐ送る
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={sending || !linked}
            onClick={async () => {
              setSending(true);
              const response = await fetch("/api/notify/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "useby" }),
              });
              setLineMessage(
                response.ok
                  ? "使い切りのテスト通知を送りました。"
                  : "使い切り対象がないか、送信に失敗しました。",
              );
              setSending(false);
            }}
          >
            使い切り通知を今すぐ送る
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={sending || !linked}
            onClick={async () => {
              setSending(true);
              const response = await fetch("/api/notify/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "missing" }),
              });
              setLineMessage(
                response.ok
                  ? "期限未設定のテスト通知を送りました。"
                  : "未設定の品がないか、送信に失敗しました。",
              );
              setSending(false);
            }}
          >
            期限未設定を今すぐ送る
          </SecondaryButton>
          {lineMessage ? <p className="text-xs text-neutral-600">{lineMessage}</p> : null}
          {!linked ? (
            <p className="text-xs text-neutral-500">連携後にテスト送信が使えます。</p>
          ) : null}
        </div>
      </Card>

      <DeliverySettingsCard state={state} onUpdate={update} />

      <Card>
        <MorningStapleSettingsCard
          value={morningStapleSettingsOf(state)}
          onChange={(morningStaple) =>
            update((prev) => ({
              ...prev,
              settings: { ...prev.settings, morningStaple },
            }))
          }
        />
      </Card>

      <Card>
        <h2 className="text-base font-bold">レシピ検索サイト</h2>
        <select
          className="mt-2 w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
          value={state.settings.recipeSite}
          onChange={(event) =>
            update((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                recipeSite: event.target.value as RecipeSiteId,
              },
            }))
          }
        >
          {recipeSiteOptions().map((site) => (
            <option key={site.id} value={site.id}>
              {site.label}
            </option>
          ))}
        </select>
      </Card>
    </AppShell>
  );
}
