/**
 * 業務月・請求締め日（docs/mirai-crosscut-schedule-design.md §4）。
 *
 * 業務月 M の集計期間 =（M-1 の請求締め日の翌日）〜（M の請求締め日）両端含む。
 * 締め日が未入力の場合は暦月の初日／末日で暫定表示する（横断帯で入力促し）。
 */

import { addDays, format, subMonths } from "date-fns";

import { type MiraiBusinessMonth } from "@/lib/mirai-schema";
import { formatISODate, parseISODate } from "@/lib/computed/profile";

function parseMonthId(id: string): Date {
  const [y, m] = id.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** 前の業務月 ID（YYYY-MM） */
export function prevBusinessMonthId(id: string): string {
  return format(subMonths(parseMonthId(id), 1), "yyyy-MM");
}

/** "6月度" のような呼称ラベル */
export function businessMonthLabel(id: string): string {
  const [, m] = id.split("-").map(Number);
  return `${m}月度`;
}

export function findBusinessMonth(
  months: readonly MiraiBusinessMonth[] | undefined,
  id: string,
): MiraiBusinessMonth | undefined {
  return months?.find((b) => b.id === id);
}

export type MiraiBusinessMonthPeriod = {
  id: string;
  label: string;
  /** 集計期間の開始（YYYY-MM-DD）。前月締め日+1、なければ暦月初日 */
  start: string;
  /** 集計期間の終了（YYYY-MM-DD）。当月締め日、未入力なら null */
  end: string | null;
  /** 当月の請求締め日（未入力なら null） */
  closeDate: string | null;
  /** 前月の請求締め日（未入力なら null） */
  prevCloseDate: string | null;
  /** 締め日が未入力（入力促しの対象） */
  needsCloseDate: boolean;
};

/** 業務月の集計期間を求める（§4.1） */
export function businessMonthPeriod(
  months: readonly MiraiBusinessMonth[] | undefined,
  id: string,
): MiraiBusinessMonthPeriod {
  const closeDate = findBusinessMonth(months, id)?.billingCloseDate ?? null;
  const prevCloseDate =
    findBusinessMonth(months, prevBusinessMonthId(id))?.billingCloseDate ?? null;

  const prevClose = prevCloseDate ? parseISODate(prevCloseDate) : undefined;
  const start = prevClose
    ? formatISODate(addDays(prevClose, 1))
    : formatISODate(parseMonthId(id));

  return {
    id,
    label: businessMonthLabel(id),
    start,
    end: closeDate,
    closeDate,
    prevCloseDate,
    needsCloseDate: closeDate === null,
  };
}

/**
 * 基準日が属する業務月 ID を求める（§4.1）。
 * 締め日が入力済みで asOf を含む業務月があればそれを、なければ暦月にフォールバック。
 */
export function currentBusinessMonthId(
  months: readonly MiraiBusinessMonth[] | undefined,
  candidateMonthIds: readonly string[],
  asOfDate: string,
): string {
  for (const id of candidateMonthIds) {
    const period = businessMonthPeriod(months, id);
    if (period.end === null) continue; // 締め日未入力の月は確定判定しない
    if (period.start <= asOfDate && asOfDate <= period.end) return id;
  }
  return asOfDate.slice(0, 7);
}
