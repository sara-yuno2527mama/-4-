/**
 * すぐ入力・当月メモ・締め日の永続化状態（Phase 1）。
 *
 * 保存の置き場は docs/mirai-storage-design.md に従い **localStorage 暫定 → 将来 DB**。
 * 本ファイルは「1 つの localStorage ブロブ」の schema・既定値・キーを定義する。
 * 読み書きは hooks/use-mirai-roster.ts（useSyncExternalStore）で行う。
 */

import { z } from "zod";

import {
  miraiBusinessMonthSchema,
  miraiCommitteeMeetingSchema,
  miraiJoinMilestoneSchema,
  miraiMonthlyRosterSchema,
} from "@/lib/mirai-schema";

export const MIRAI_ROSTER_STORAGE_KEY = "mirai:roster:v1";

export const miraiRosterStateSchema = z.object({
  version: z.literal(1).default(1),
  /** 業務月ごとの請求締め日（§4） */
  businessMonths: z.array(miraiBusinessMonthSchema).default([]),
  /** 月次の当番・お弁当・休み（§6） */
  rosters: z.array(miraiMonthlyRosterSchema).default([]),
  /** 実行委員会・事前打ち合わせの確定日程（§16.1） */
  committeeMeetings: z.array(miraiCommitteeMeetingSchema).default([]),
  /** 参観コンテストの集約マイルストーン（§16.3） */
  joinMilestones: z.array(miraiJoinMilestoneSchema).default([]),
});
export type MiraiRosterState = z.infer<typeof miraiRosterStateSchema>;

/**
 * 既定値（localStorage が空のときの初期表示）。
 * dashboard.json（asOfDate=2026-05-23）と整合する最小限のデモ値を seed し、
 * 初回から横断帯・当月メモが意味を持つようにする。ユーザー編集で上書きされる。
 */
export const MIRAI_ROSTER_DEFAULT: MiraiRosterState = {
  version: 1,
  businessMonths: [
    { id: "2026-04", billingCloseDate: "2026-05-01" },
    { id: "2026-05", billingCloseDate: "2026-06-03" },
  ],
  rosters: [
    {
      yearMonth: "2026-05",
      lunchDutyDates: [{ date: "2026-05-07" }, { date: "2026-05-21" }],
      mailDutyDates: [{ date: "2026-05-03" }, { date: "2026-05-17" }],
      mailWithRegularDates: ["2026-05-17"],
      bentoDates: ["2026-05-15", "2026-05-26"],
      holidays: [],
    },
  ],
  committeeMeetings: [
    { id: "cm-pre-0524", kind: "pre-meeting", heldOn: "2026-05-24" },
    { id: "cm-main-0628", kind: "committee", heldOn: "2026-06-28" },
  ],
  joinMilestones: [],
};

/** 空の月次ロスター（新しい YYYY-MM に初めて追加するとき用） */
export function emptyMonthlyRoster(yearMonth: string): MiraiRosterState["rosters"][number] {
  return {
    yearMonth,
    lunchDutyDates: [],
    mailDutyDates: [],
    mailWithRegularDates: [],
    bentoDates: [],
    holidays: [],
  };
}

/** localStorage 文字列 → 状態。失敗時は既定値。 */
export function parseRosterState(raw: string | null): MiraiRosterState {
  if (!raw) return MIRAI_ROSTER_DEFAULT;
  try {
    const parsed = miraiRosterStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : MIRAI_ROSTER_DEFAULT;
  } catch {
    return MIRAI_ROSTER_DEFAULT;
  }
}
