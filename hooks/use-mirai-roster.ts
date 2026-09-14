"use client";

/**
 * すぐ入力・当月メモ・締め日の状態フック（Phase 1）。
 *
 * 読み書きは async な repository 抽象（lib/mirai/repository）越しに行うが、UI から見える
 * 読み取りは従来どおり同期のまま：メモリ内スナップショットを `useSyncExternalStore` で購読し、
 * SSR/hydration は既定値（getServerSnapshot）で安全に整合させる。localStorage は開発・デモ
 * 専用アダプタで、将来は同 interface の DB アダプタに差し替える（docs/mirai-storage-design.md §10）。
 */

import { useSyncExternalStore } from "react";

import {
  type MiraiColumnId,
  type MiraiCommitteeMeetingKind,
  type MiraiDelegateStatus,
  type MiraiHolidayKind,
} from "@/lib/mirai-schema";
import { MIRAI_DEFAULT_VISIBLE_COLUMNS } from "@/lib/mirai/columns";
import {
  addDelegatedItem,
  removeDelegatedItem,
  updateDelegatedItemStatus,
  type AddDelegatedInput,
} from "@/lib/mirai/delegated";
import { LocalStorageRosterRepository } from "@/lib/mirai/repository/local-storage";
import { type MiraiRosterRepository } from "@/lib/mirai/repository/types";
import {
  MIRAI_ROSTER_DEFAULT,
  emptyMonthlyRoster,
  type MiraiRosterState,
} from "@/lib/mirai/roster-state";

type Listener = () => void;

/**
 * 永続層の差し替え点：開発・デモは localStorage。将来 DB へ移すときはこの 1 行を
 * DB アダプタ（同 MiraiRosterRepository 実装）に差し替えるだけでよい（storage §10.2/§10.3）。
 */
const repository: MiraiRosterRepository = new LocalStorageRosterRepository();

let cache: MiraiRosterState | null = null;
const listeners = new Set<Listener>();
/** load() 済み・mutation 済み・他タブ更新受領済みのいずれか（古い load 結果での上書き防止） */
let hydrated = false;
let hydrationStarted = false;
let repositorySubscribed = false;

function emit(): void {
  listeners.forEach((l) => l());
}

/** repository.load() でメモリ cache を一度だけ hydrate する（fire-and-forget） */
function ensureHydrated(): void {
  if (hydrationStarted) return;
  hydrationStarted = true;
  void repository
    .load()
    .then((state) => {
      if (hydrated) return;
      hydrated = true;
      cache = state;
      emit();
    })
    .catch(() => {
      // load 失敗時は既定値のまま（getSnapshot が MIRAI_ROSTER_DEFAULT を返す）
    });
}

function getSnapshot(): MiraiRosterState {
  return cache ?? MIRAI_ROSTER_DEFAULT;
}

function getServerSnapshot(): MiraiRosterState {
  return MIRAI_ROSTER_DEFAULT;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  ensureHydrated();
  if (!repositorySubscribed && repository.subscribe) {
    repository.subscribe((state) => {
      hydrated = true;
      cache = state;
      emit();
    });
    repositorySubscribed = true;
  }
  return () => {
    listeners.delete(listener);
  };
}

/** mutation：メモリ cache を即更新し、repository.save() へ write-through（失敗しても cache は保持） */
function commit(next: MiraiRosterState): void {
  cache = next;
  hydrated = true;
  void repository.save(next).catch(() => {
    // 保存失敗（localStorage 不可・DB 一時障害等）でもメモリ上の cache は保持する
  });
  emit();
}

function update(updater: (prev: MiraiRosterState) => MiraiRosterState): void {
  commit(updater(getSnapshot()));
}

// クライアントでは import 時点で先読みし、初回レンダー・クライアント遷移を
// 既定値でちらつかせない（従来の同期読みと同等の体感を保つ）。SSR では走らない。
if (typeof window !== "undefined") {
  ensureHydrated();
}

function yearMonthOf(date: string): string {
  return date.slice(0, 7);
}

/** epoch ms → ローカル実時刻の HH:mm（タイマー実績の記録用。§8.2） */
function hhmmFromMs(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** 番組表の予定ブロックを1件だけ更新する（見つからなければそのまま） */
function patchBlock(
  state: MiraiRosterState,
  blockId: string,
  patch: Partial<MiraiRosterState["dailyBlocks"][number]>,
): MiraiRosterState["dailyBlocks"] {
  return state.dailyBlocks.map((b) =>
    b.id === blockId ? { ...b, ...patch } : b,
  );
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
          : [
              ...state.businessMonths,
              { id: businessMonthId, billingCloseDate },
            ],
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

  /**
   * 番組表の半休トグル（§8.3）。その日の AM/PM 休みだけを差し替える
   * （全休・祝日など他の休みには触れない）。half=null で半休なしに戻す。
   */
  setDayHalf(date: string, half: "am" | "pm" | null): void {
    if (!date) return;
    update((state) =>
      upsertRoster(state, yearMonthOf(date), (r) => {
        const withoutHalf = r.holidays.filter(
          (h) => !(h.start === date && (h.kind === "am" || h.kind === "pm")),
        );
        const holidays = half
          ? [...withoutHalf, { start: date, kind: half }].sort((a, b) =>
              a.start.localeCompare(b.start),
            )
          : withoutHalf;
        return { ...r, holidays };
      }),
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

  /* ── 番組表のタイマー・実績・繰越（§8.2 / §8.4） ── */

  /**
   * タイマー開始（§8.2。同時に1本のみ）。
   * 既に別ブロックを計測中なら、その実績を確定してから新規開始する。
   */
  startTimer(blockId: string): void {
    if (!blockId) return;
    update((state) => {
      const now = Date.now();
      let dailyBlocks = state.dailyBlocks;
      const prev = state.timer;
      if (prev && prev.blockId !== blockId) {
        dailyBlocks = patchBlock(state, prev.blockId, {
          actualStart:
            dailyBlocks.find((b) => b.id === prev.blockId)?.actualStart ??
            hhmmFromMs(prev.startedAtMs),
          actualEnd: hhmmFromMs(now),
        });
      }
      return {
        ...state,
        dailyBlocks,
        timer: { blockId, startedAtMs: now },
      };
    });
  },

  /** タイマー停止 → 実績（実時刻の HH:mm）を記録（§8.2）。未計画ブロックは planned も更新。 */
  stopTimer(): void {
    update((state) => {
      const t = state.timer;
      if (!t) return state;
      const now = Date.now();
      const endHhmm = hhmmFromMs(now);
      const startHhmm = hhmmFromMs(t.startedAtMs);
      const existing = state.dailyBlocks.find((b) => b.id === t.blockId);
      return {
        ...state,
        dailyBlocks: patchBlock(state, t.blockId, {
          actualStart: existing?.actualStart ?? startHhmm,
          actualEnd: endHhmm,
          plannedStart: existing?.plannedStart ?? startHhmm,
          plannedEnd: endHhmm,
        }),
        timer: null,
      };
    });
  },

  /** 明示完了を設定（§18.2） */
  setBlockDone(blockId: string, done: boolean): void {
    update((state) => ({
      ...state,
      dailyBlocks: patchBlock(state, blockId, {
        done: done ? true : undefined,
      }),
    }));
  },

  /** 繰越から破棄（完了扱いにせずトレイから外す。§18.3） */
  dismissCarryover(blockId: string): void {
    update((state) => ({
      ...state,
      dailyBlocks: patchBlock(state, blockId, { dismissed: true }),
      timer: state.timer?.blockId === blockId ? null : state.timer,
    }));
  },

  /**
   * 未計画タイマー開始（§18.1）。列だけ選んで計測開始 → 停止で dailyBlocks に新規生成。
   * 走行中の別ブロックがあれば実績を確定してから開始する。
   */
  startUnplannedTimer(columnId: MiraiColumnId, date: string): void {
    if (!columnId || !date) return;
    update((state) => {
      const now = Date.now();
      let dailyBlocks = state.dailyBlocks;
      const prev = state.timer;
      if (prev) {
        const endHhmm = hhmmFromMs(now);
        const startHhmm = hhmmFromMs(prev.startedAtMs);
        const prevBlock = dailyBlocks.find((b) => b.id === prev.blockId);
        dailyBlocks = patchBlock(state, prev.blockId, {
          actualStart: prevBlock?.actualStart ?? startHhmm,
          actualEnd: endHhmm,
          plannedEnd: prevBlock?.plannedEnd ?? endHhmm,
        });
      }
      const startHhmm = hhmmFromMs(now);
      const id = `unplanned-${now}`;
      return {
        ...state,
        dailyBlocks: [
          ...dailyBlocks,
          {
            id,
            date,
            columnId,
            plannedStart: startHhmm,
            plannedEnd: startHhmm,
            title: "未計画",
          },
        ],
        timer: { blockId: id, startedAtMs: now },
      };
    });
  },

  /** 実績を手入力/修正する（空文字は未記録に戻す。§8.2） */
  setBlockActual(blockId: string, actualStart: string, actualEnd: string): void {
    update((state) => ({
      ...state,
      dailyBlocks: patchBlock(state, blockId, {
        actualStart: actualStart || undefined,
        actualEnd: actualEnd || undefined,
      }),
    }));
  },

  /** 実績をクリアして未完了に戻す（計測中なら停止扱いで破棄） */
  clearBlockActual(blockId: string): void {
    update((state) => ({
      ...state,
      dailyBlocks: patchBlock(state, blockId, {
        actualStart: undefined,
        actualEnd: undefined,
      }),
      timer: state.timer?.blockId === blockId ? null : state.timer,
    }));
  },

  /**
   * 繰越の「今日に載せる」（§8.4）。予定ブロックを別日へ移し、
   * 新しい予定時刻に置く（実績はリセット。計測中なら停止）。
   */
  moveBlockToDate(
    blockId: string,
    date: string,
    plannedStart: string,
    plannedEnd: string,
  ): void {
    if (!date || !plannedStart || !plannedEnd) return;
    update((state) => ({
      ...state,
      dailyBlocks: patchBlock(state, blockId, {
        date,
        plannedStart,
        plannedEnd,
        actualStart: undefined,
        actualEnd: undefined,
        done: undefined,
        dismissed: undefined,
      }),
      timer: state.timer?.blockId === blockId ? null : state.timer,
    }));
  },

  /** 番組表の表示列を 1 つ ON/OFF する（列ピッカー。§3.3） */
  toggleColumn(columnId: MiraiColumnId): void {
    update((state) => ({
      ...state,
      visibleColumns: state.visibleColumns.includes(columnId)
        ? state.visibleColumns.filter((c) => c !== columnId)
        : [...state.visibleColumns, columnId],
    }));
  },
  /** 表示列を初回表示（デフォルト ON）に戻す */
  resetColumns(): void {
    update((state) => ({
      ...state,
      visibleColumns: [...MIRAI_DEFAULT_VISIBLE_COLUMNS],
    }));
  },

  /* ── ペアに振った仕事（§9） ── */

  addDelegatedToPair(input: AddDelegatedInput): void {
    if (!input.title.trim() || !input.deadline || !input.delegatedOn) return;
    update((state) => ({
      ...state,
      delegatedToPair: addDelegatedItem(state.delegatedToPair, input),
    }));
  },

  updateDelegatedStatus(id: string, status: MiraiDelegateStatus): void {
    update((state) => ({
      ...state,
      delegatedToPair: updateDelegatedItemStatus(
        state.delegatedToPair,
        id,
        status,
      ),
    }));
  },

  /** 振った側が [完了] → 別枠から削除（§9） */
  completeDelegated(id: string): void {
    update((state) => ({
      ...state,
      delegatedToPair: removeDelegatedItem(state.delegatedToPair, id),
    }));
  },

  /** 取消（振る前に戻す） */
  removeDelegated(id: string): void {
    update((state) => ({
      ...state,
      delegatedToPair: removeDelegatedItem(state.delegatedToPair, id),
    }));
  },
};

export type MiraiRosterActions = typeof miraiRosterActions;

/** すぐ入力の永続化状態を購読する（読み取り専用の値を返す） */
export function useMiraiRoster(): MiraiRosterState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
