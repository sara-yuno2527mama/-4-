"use client";

/**
 * すぐ入力・当月メモ・締め日の状態フック（Phase 1・localStorage 暫定）。
 *
 * SSR/hydration 安全のため `useSyncExternalStore` を使う（サーバーは既定値を返し、
 * クライアントは localStorage を読む）。useEffect 内での初期値 setState は使わない
 * （React 19 ルール準拠）。永続化の置き場は docs/mirai-storage-design.md 参照。
 */

import { useSyncExternalStore } from "react";

import {
  type MiraiCommitteeMeetingKind,
  type MiraiHolidayKind,
} from "@/lib/mirai-schema";
import {
  MIRAI_ROSTER_DEFAULT,
  MIRAI_ROSTER_STORAGE_KEY,
  emptyMonthlyRoster,
  parseRosterState,
  type MiraiRosterState,
} from "@/lib/mirai/roster-state";

type Listener = () => void;

let cache: MiraiRosterState | null = null;
const listeners = new Set<Listener>();
let storageBound = false;

function load(): MiraiRosterState {
  if (typeof window === "undefined") return MIRAI_ROSTER_DEFAULT;
  return parseRosterState(window.localStorage.getItem(MIRAI_ROSTER_STORAGE_KEY));
}

function getSnapshot(): MiraiRosterState {
  if (cache === null) cache = load();
  return cache;
}

function getServerSnapshot(): MiraiRosterState {
  return MIRAI_ROSTER_DEFAULT;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (!storageBound && typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === MIRAI_ROSTER_STORAGE_KEY) {
        cache = load();
        emit();
      }
    });
    storageBound = true;
  }
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: MiraiRosterState): void {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MIRAI_ROSTER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage 不可（プライベートモード等）でもメモリ上は反映する
    }
  }
  emit();
}

function update(updater: (prev: MiraiRosterState) => MiraiRosterState): void {
  commit(updater(getSnapshot()));
}

function yearMonthOf(date: string): string {
  return date.slice(0, 7);
}

function upsertRoster(
  state: MiraiRosterState,
  yearMonth: string,
  fn: (
    roster: MiraiRosterState["rosters"][number],
  ) => MiraiRosterState["rosters"][number],
): MiraiRosterState {
  const exists = state.rosters.some((r) => r.yearMonth === yearMonth);
  const base = exists
    ? state.rosters.find((r) => r.yearMonth === yearMonth)!
    : emptyMonthlyRoster(yearMonth);
  const updated = fn(base);
  return {
    ...state,
    rosters: exists
      ? state.rosters.map((r) => (r.yearMonth === yearMonth ? updated : r))
      : [...state.rosters, updated],
  };
}

function addSortedUnique(list: readonly string[], value: string): string[] {
  if (list.includes(value)) return [...list];
  return [...list, value].sort((a, b) => a.localeCompare(b));
}

/**
 * すぐ入力のアクション群。`setState` は module スコープで安定なので
 * useCallback は不要（毎レンダー同一参照）。
 */
export const miraiRosterActions = {
  /** 業務月の請求締め日を設定（空文字で未入力に戻す） */
  setBillingCloseDate(businessMonthId: string, date: string): void {
    update((state) => {
      const exists = state.businessMonths.some((b) => b.id === businessMonthId);
      const billingCloseDate = date === "" ? undefined : date;
      return {
        ...state,
        businessMonths: exists
          ? state.businessMonths.map((b) =>
              b.id === businessMonthId ? { ...b, billingCloseDate } : b,
            )
          : [...state.businessMonths, { id: businessMonthId, billingCloseDate }],
      };
    });
  },

  addLunchDuty(date: string): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) =>
        r.lunchDutyDates.some((d) => d.date === date)
          ? r
          : {
              ...r,
              lunchDutyDates: [...r.lunchDutyDates, { date }].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            },
      ),
    );
  },
  removeLunchDuty(yearMonth: string, date: string): void {
    update((state) =>
      upsertRoster(state, yearMonth, (r) => ({
        ...r,
        lunchDutyDates: r.lunchDutyDates.filter((d) => d.date !== date),
      })),
    );
  },

  addMailDuty(date: string): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) =>
        r.mailDutyDates.some((d) => d.date === date)
          ? r
          : {
              ...r,
              mailDutyDates: [...r.mailDutyDates, { date }].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            },
      ),
    );
  },
  removeMailDuty(yearMonth: string, date: string): void {
    update((state) =>
      upsertRoster(state, yearMonth, (r) => ({
        ...r,
        mailDutyDates: r.mailDutyDates.filter((d) => d.date !== date),
        // 郵便当番を消したら +定期便 マークも外す
        mailWithRegularDates: r.mailWithRegularDates.filter((d) => d !== date),
      })),
    );
  },

  /** 郵便 + 定期便：郵便当番でもある日として登録し、+定期便 マークを付ける */
  addMailWithRegular(date: string): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) => ({
        ...r,
        mailDutyDates: r.mailDutyDates.some((d) => d.date === date)
          ? r.mailDutyDates
          : [...r.mailDutyDates, { date }].sort((a, b) =>
              a.date.localeCompare(b.date),
            ),
        mailWithRegularDates: addSortedUnique(r.mailWithRegularDates, date),
      })),
    );
  },
  removeMailWithRegular(yearMonth: string, date: string): void {
    update((state) =>
      upsertRoster(state, yearMonth, (r) => ({
        ...r,
        mailWithRegularDates: r.mailWithRegularDates.filter((d) => d !== date),
      })),
    );
  },

  addBento(date: string): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) => ({
        ...r,
        bentoDates: addSortedUnique(r.bentoDates, date),
      })),
    );
  },
  removeBento(yearMonth: string, date: string): void {
    update((state) =>
      upsertRoster(state, yearMonth, (r) => ({
        ...r,
        bentoDates: r.bentoDates.filter((d) => d !== date),
      })),
    );
  },

  addHoliday(date: string, kind: MiraiHolidayKind): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) => ({
        ...r,
        holidays: [...r.holidays, { start: date, kind }].sort((a, b) =>
          a.start.localeCompare(b.start),
        ),
      })),
    );
  },
  removeHoliday(yearMonth: string, index: number): void {
    update((state) =>
      upsertRoster(state, yearMonth, (r) => ({
        ...r,
        holidays: r.holidays.filter((_, i) => i !== index),
      })),
    );
  },

  addCommitteeMeeting(
    kind: MiraiCommitteeMeetingKind,
    heldOn: string,
    time?: string,
  ): void {
    if (!heldOn) return;
    update((state) => ({
      ...state,
      committeeMeetings: [
        ...state.committeeMeetings,
        {
          id: `cm-${kind}-${heldOn}-${Math.random().toString(36).slice(2, 7)}`,
          kind,
          heldOn,
          time: time || undefined,
        },
      ].sort((a, b) => a.heldOn.localeCompare(b.heldOn)),
    }));
  },
  removeCommitteeMeeting(id: string): void {
    update((state) => ({
      ...state,
      committeeMeetings: state.committeeMeetings.filter((m) => m.id !== id),
    }));
  },
};

export type MiraiRosterActions = typeof miraiRosterActions;

/** すぐ入力の永続化状態を購読する（読み取り専用の値を返す） */
export function useMiraiRoster(): MiraiRosterState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
