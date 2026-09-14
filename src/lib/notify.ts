import { addDaysToKey, tokyoDateKey, tokyoParts } from "./dates";
import { activeInventory } from "./inventory";
import { linkedLineUserId } from "./kitchen-state";
import { pushLineMessages, type LineTextMessage } from "./line";
import { dishesOn, findPass, formatPassLine, summarizeSlot } from "./meals";
import { buildRecipeSearchUrl } from "./recipe-search";
import { readKitchenStore, writeKitchenStore } from "./server-store";
import type { KitchenState } from "./types";

function tomorrowSummary(state: KitchenState): string {
  const tomorrowKey = addDaysToKey(tokyoDateKey(), 1);
  const morning = dishesOn(state, tomorrowKey, "morning");
  const evening = dishesOn(state, tomorrowKey, "evening");
  const morningPass = findPass(state, tomorrowKey, "morning");
  const eveningPass = findPass(state, tomorrowKey, "evening");
  const morningText = morningPass
    ? formatPassLine(morningPass.reason)
    : summarizeSlot(morning);
  const eveningText =
    eveningPass && evening.filter((dish) => dish.role !== "dessert").length === 0
      ? formatPassLine(eveningPass.reason)
      : summarizeSlot(evening);
  if (!morningText && !eveningText) return "";
  return [
    morningText ? `朝は${morningText}` : "",
    eveningText ? `夕は${eveningText}` : "",
  ]
    .filter(Boolean)
    .join("、");
}

export function buildRhythmMessages(state: KitchenState): LineTextMessage[] {
  const summary = tomorrowSummary(state);
  if (!summary) return [];
  return [
    {
      type: "text",
      text: `明日は${summary}です。前日準備は？`,
    },
  ];
}

export function buildUseByMessages(state: KitchenState): LineTextMessage[] {
  const todayKey = tokyoDateKey();
  const due = activeInventory(state.inventory).filter(
    (item) => item.useByDate && item.useByDate <= todayKey,
  );
  return due.slice(0, 5).map((item) => ({
    type: "text",
    text: `冷蔵庫の「${item.name}」を使い切りたい日です。レシピを探しますか？\n${buildRecipeSearchUrl(state.settings.recipeSite, item.name)}`,
  }));
}

export function buildMissingUseByMessages(state: KitchenState): LineTextMessage[] {
  const missing = activeInventory(state.inventory).filter(
    (item) => !item.useByDate,
  );
  if (missing.length === 0) return [];
  const names = missing
    .slice(0, 5)
    .map((item) => item.name)
    .join("、");
  return [
    {
      type: "text",
      text: `使用期限が未設定です: ${names}。「今ある」で日付を入れてください。`,
    },
  ];
}

export type NotifyKind = "rhythm" | "useby" | "missing";

export type NotifyResult = {
  ok: boolean;
  skipped?: "not_linked" | "already_sent" | "no_rhythm" | "no_inventory" | "no_missing";
  kind?: NotifyKind;
  messages?: number;
  status?: number;
  body?: string;
};

/** 送信済みの記録。ここで失敗しても送信自体は成功なので、投げずにログへ */
async function recordSent(
  state: KitchenState,
  patch: Partial<KitchenState["notifyLog"]>,
): Promise<void> {
  try {
    await writeKitchenStore({
      ...state,
      notifyLog: { ...state.notifyLog, ...patch },
    });
  } catch (error) {
    console.error("[notify] 送信記録の保存に失敗しました", error);
  }
}

export async function sendNotify(
  kind: NotifyKind,
  options?: { force?: boolean },
): Promise<NotifyResult> {
  const state = await readKitchenStore();
  const to = linkedLineUserId(state);
  if (!to) {
    return { ok: false, skipped: "not_linked" };
  }

  const todayKey = tokyoDateKey();
  const tomorrowKey = addDaysToKey(todayKey, 1);
  const force = Boolean(options?.force);

  if (kind === "rhythm") {
    if (!force && state.notifyLog.rhythmForDate === tomorrowKey) {
      return { ok: true, skipped: "already_sent", kind };
    }
    const messages = buildRhythmMessages(state);
    if (messages.length === 0) {
      return { ok: true, skipped: "no_rhythm", kind };
    }
    const result = await pushLineMessages(to, messages);
    if (result.ok) {
      await recordSent(state, { rhythmForDate: tomorrowKey });
    }
    return { ...result, kind, messages: messages.length };
  }

  if (kind === "missing") {
    if (!force && state.notifyLog.missingUseByForDate === todayKey) {
      return { ok: true, skipped: "already_sent", kind };
    }
    const messages = buildMissingUseByMessages(state);
    if (messages.length === 0) {
      return { ok: true, skipped: "no_missing", kind };
    }
    const result = await pushLineMessages(to, messages);
    if (result.ok) {
      await recordSent(state, { missingUseByForDate: todayKey });
    }
    return { ...result, kind, messages: messages.length };
  }

  if (!force && state.notifyLog.useByForDate === todayKey) {
    return { ok: true, skipped: "already_sent", kind };
  }
  const messages = buildUseByMessages(state);
  if (messages.length === 0) {
    return { ok: true, skipped: "no_inventory", kind };
  }
  const result = await pushLineMessages(to, messages);
  if (result.ok) {
    await recordSent(state, { useByForDate: todayKey });
  }
  return { ...result, kind, messages: messages.length };
}

export async function runDueNotifications() {
  const state = await readKitchenStore();
  const hour = tokyoParts().hour;
  const sent: unknown[] = [];

  if (hour === state.settings.notifyRhythmHour) {
    sent.push(await sendNotify("rhythm"));
  }
  if (hour === state.settings.notifyUseByHour) {
    sent.push(await sendNotify("useby"));
    sent.push(await sendNotify("missing"));
  }

  return {
    hour,
    linked: Boolean(linkedLineUserId(state)),
    sent,
  };
}
