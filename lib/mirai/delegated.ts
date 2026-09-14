/**
 * ペアに振った仕事（§9）の純粋ロジック。
 * 永続化は roster-state / repository 経由。UI は派生表示のみ。
 */

import {
  type MiraiColumnId,
  type MiraiDelegateStatus,
  type MiraiDelegatedToPair,
} from "@/lib/mirai-schema";
import { type CrossCutAlert } from "@/lib/mirai/crosscut";
import { parseISODate } from "@/lib/computed/profile";
import { differenceInCalendarDays } from "date-fns";

/** 期限接近アラートの先出し日数（§11 Phase A） */
export const DELEGATED_NEAR_DAYS = 3;

export type AddDelegatedInput = {
  title: string;
  deadline: string;
  /** YYYY-MM-DD（振った日。§9.1） */
  delegatedOn: string;
  columnId?: MiraiColumnId;
  note?: string;
  createdBy: string;
};

export function createDelegatedItem(
  input: AddDelegatedInput,
  id = `deleg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
): MiraiDelegatedToPair {
  return {
    id,
    title: input.title.trim(),
    deadline: input.deadline,
    delegatedOn: input.delegatedOn,
    columnId: input.columnId,
    note: input.note?.trim() || undefined,
    status: "todo",
    createdBy: input.createdBy,
  };
}

export function addDelegatedItem(
  items: readonly MiraiDelegatedToPair[],
  input: AddDelegatedInput,
): MiraiDelegatedToPair[] {
  if (!input.title.trim() || !input.deadline || !input.delegatedOn) return [...items];
  return sortDelegatedByDeadline([
    ...items,
    createDelegatedItem(input),
  ]);
}

export function updateDelegatedItemStatus(
  items: readonly MiraiDelegatedToPair[],
  id: string,
  status: MiraiDelegateStatus,
): MiraiDelegatedToPair[] {
  return items.map((item) => (item.id === id ? { ...item, status } : item));
}

export function removeDelegatedItem(
  items: readonly MiraiDelegatedToPair[],
  id: string,
): MiraiDelegatedToPair[] {
  return items.filter((item) => item.id !== id);
}

/** 期限昇順（同日は title） */
export function sortDelegatedByDeadline(
  items: readonly MiraiDelegatedToPair[],
): MiraiDelegatedToPair[] {
  return [...items].sort((a, b) => {
    const byDate = a.deadline.localeCompare(b.deadline);
    return byDate !== 0 ? byDate : a.title.localeCompare(b.title);
  });
}

function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (!a || !b) return 0;
  return differenceInCalendarDays(b, a);
}

function mdLabel(isoDate: string): string {
  const d = parseISODate(isoDate);
  if (!d) return isoDate;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 横断帯向けペア振り期限アラート（§11 Phase A） */
export function buildDelegatedAlerts(
  items: readonly MiraiDelegatedToPair[],
  asOfDate: string,
): CrossCutAlert[] {
  const alerts: CrossCutAlert[] = [];

  for (const item of items) {
    const daysUntil = daysBetween(asOfDate, item.deadline);
    if (daysUntil > DELEGATED_NEAR_DAYS) continue;

    const overdue = daysUntil < 0;
    const dueToday = daysUntil === 0;
    alerts.push({
      id: `delegated-${item.id}`,
      tone: overdue ? "danger" : dueToday ? "warning" : "info",
      message: overdue
        ? `ペア振り「${item.title}」期限超過（${mdLabel(item.deadline)}）`
        : dueToday
          ? `ペア振り「${item.title}」本日期限`
          : `ペア振り「${item.title}」あと${daysUntil}日（${mdLabel(item.deadline)}）`,
    });
  }

  return alerts.sort((a, b) => a.message.localeCompare(b.message));
}
