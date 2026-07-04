/**
 * 番組表の日次モデル（docs/mirai-crosscut-schedule-design.md §6 / §7 / §8）。
 *
 * 純粋関数のみ。roster（当番・お弁当・休み）と workDaySettings と予定ブロックから、
 * その日の「時間軸レイアウト用データ」を組み立てる:
 *   - 当番自動ブロック（9:05 郵便・13:00 昼仕分け・15:45 定期便・昼当番・お弁当。locked）
 *   - 背景バンド（昼休み・退勤準備・終日休み）
 *   - 予定ブロック（dashboard.json seed。編集・タイマーは Phase 3）
 *
 * 描画（MiraiProgramTablePane）はこの結果を absolute 配置するだけ。
 */

import {
  type MiraiColumnId,
  type MiraiDailyBlock,
  type MiraiDutyBlock,
  type MiraiDutyBlockKind,
  type MiraiHoliday,
  type MiraiWorkDaySettings,
} from "@/lib/mirai-schema";
import { MIRAI_DUTY_BLOCK_KIND_LABELS } from "@/lib/mirai-labels";
import { type MiraiRosterState } from "@/lib/mirai/roster-state";

/** HH:mm → 0 時からの分 */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 0 時からの分 → HH:mm */
export function hhmmOf(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 勤務時間の既定（§7.1）。dashboard.workDaySettings 未指定時に使う。 */
export const MIRAI_DEFAULT_WORK_DAY: MiraiWorkDaySettings = {
  workStart: "09:00",
  workEnd: "16:00",
  scheduleEnd: "15:30",
  bufferEnd: "16:00",
};

/** 当番ブロックの固定時間帯（§6.1）。 */
const DUTY_TIMES: Record<MiraiDutyBlockKind, [string, string]> = {
  "lunch-phone": ["12:00", "13:00"],
  "lunch-break": ["12:00", "13:00"],
  "mail-am": ["09:05", "09:35"],
  "mail-noon": ["13:00", "13:30"],
  "regular-pm": ["15:45", "16:15"],
  bento: ["12:00", "13:00"],
};

/** 番組表の担当（主 / ペア。§8.1 の 2 枚） */
export type MiraiAssignee = "主" | "ペア";
export const MIRAI_ASSIGNEES: readonly MiraiAssignee[] = ["主", "ペア"];

/** 未設定・不明な担当は「主」（自分の番組表）に寄せる */
export function normalizeAssignee(a: string | undefined): MiraiAssignee {
  return a === "ペア" ? "ペア" : "主";
}

/** その日のロスター（当番・お弁当・休み）を取り出す */
function rosterOfDate(roster: MiraiRosterState, date: string) {
  const ym = date.slice(0, 7);
  return roster.rosters.find((r) => r.yearMonth === ym);
}

/** その日の半休（AM/PM）。有休・休日・なしは null（半休グリッド用。§8.3） */
export function dayHalfOf(
  roster: MiraiRosterState,
  date: string,
): "am" | "pm" | null {
  const r = rosterOfDate(roster, date);
  const h = r?.holidays.find(
    (x) => coversDate(x, date) && (x.kind === "am" || x.kind === "pm"),
  );
  return h ? (h.kind as "am" | "pm") : null;
}

export type MiraiDayFlags = {
  isLunchDuty: boolean;
  isMailDuty: boolean;
  isRegularMail: boolean;
  isBento: boolean;
  holidays: MiraiHoliday[];
};

/** その日の当番・お弁当・休みフラグ（§6.1） */
export function dayFlags(
  roster: MiraiRosterState,
  date: string,
): MiraiDayFlags {
  const r = rosterOfDate(roster, date);
  return {
    isLunchDuty: r?.lunchDutyDates.some((d) => d.date === date) ?? false,
    isMailDuty: r?.mailDutyDates.some((d) => d.date === date) ?? false,
    isRegularMail: r?.mailWithRegularDates.includes(date) ?? false,
    isBento: r?.bentoDates.includes(date) ?? false,
    holidays: r?.holidays.filter((h) => coversDate(h, date)) ?? [],
  };
}

function coversDate(holiday: MiraiHoliday, date: string): boolean {
  const end = holiday.end ?? holiday.start;
  return holiday.start <= date && date <= end;
}

/**
 * その日の当番自動ブロック（§6.1）。locked=システム固定。
 * 昼休みそのものは背景バンド（dayBands）で表現し、ここには「当番」だけを載せる。
 */
export function dutyBlocksForDate(
  roster: MiraiRosterState,
  date: string,
): MiraiDutyBlock[] {
  const flags = dayFlags(roster, date);
  const r = rosterOfDate(roster, date);
  const mailAssignee = r?.mailDutyDates.find((d) => d.date === date)?.assignee;
  const lunchAssignee = r?.lunchDutyDates.find(
    (d) => d.date === date,
  )?.assignee;

  const blocks: MiraiDutyBlock[] = [];
  const push = (
    kind: MiraiDutyBlockKind,
    columnId: MiraiColumnId,
    assignee?: string,
  ) => {
    const [plannedStart, plannedEnd] = DUTY_TIMES[kind];
    blocks.push({
      kind,
      date,
      plannedStart,
      plannedEnd,
      locked: true,
      columnId,
      assignee,
    });
  };

  if (flags.isMailDuty) {
    push("mail-am", "soumu-general", mailAssignee);
    push("mail-noon", "soumu-general", mailAssignee);
  }
  if (flags.isRegularMail) push("regular-pm", "soumu-general", mailAssignee);
  if (flags.isLunchDuty) push("lunch-phone", "soumu-general", lunchAssignee);
  if (flags.isBento) push("bento", "private");

  return blocks;
}

export type MiraiProgramBandKind = "lunch" | "buffer" | "holiday";

export type MiraiProgramBand = {
  id: string;
  label: string;
  startMin: number;
  endMin: number;
  kind: MiraiProgramBandKind;
};

export type MiraiProgramBlock = {
  key: string;
  columnId: MiraiColumnId;
  startMin: number;
  endMin: number;
  title: string;
  /** "9:05–9:35" 形式 */
  timeLabel: string;
  locked: boolean;
  assignee: MiraiAssignee;
};

export type MiraiProgramDayModel = {
  date: string;
  /** 表示する時間軸の範囲（分） */
  dayStartMin: number;
  dayEndMin: number;
  /** 予定を載せてよい上限（15:30。§7.1） */
  scheduleEndMin: number;
  flags: MiraiDayFlags;
  /** 全列にまたがる背景バンド（昼休み・退勤準備・終日休み） */
  bands: MiraiProgramBand[];
  /** 列に載る予定/当番ブロック */
  blocks: MiraiProgramBlock[];
  /** 終日休み（有休・休日）で番組表全体を伏せるか */
  allDayOff: MiraiHoliday | null;
};

function timeRange(start: string, end: string): string {
  const fmt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return `${h}:${String(m).padStart(2, "0")}`;
  };
  return `${fmt(start)}–${fmt(end)}`;
}

/**
 * その日の番組表モデルを組み立てる（§6 / §7 / §8）。
 * `dailyBlocks` は dashboard.json の全予定（呼び出し側で日付フィルタ不要）。
 */
export function programDayModel(
  roster: MiraiRosterState,
  settings: MiraiWorkDaySettings,
  date: string,
  dailyBlocks: readonly MiraiDailyBlock[],
): MiraiProgramDayModel {
  const flags = dayFlags(roster, date);
  const dayStartMin = minutesOf(settings.workStart);
  // 定期便日は 16:15 まで延長（§7.2）
  const dayEndMin = flags.isRegularMail
    ? Math.max(minutesOf(settings.workEnd), minutesOf("16:15"))
    : minutesOf(settings.workEnd);

  const allDayOff =
    flags.holidays.find((h) => h.kind === "full" || h.kind === "holiday") ??
    null;

  const bands: MiraiProgramBand[] = [];

  // 昼休み（昼当番の日は 13:00–14:00 にずれる。§6.1）
  const lunch = flags.isLunchDuty
    ? { start: "13:00", end: "14:00" }
    : { start: "12:00", end: "13:00" };
  bands.push({
    id: "lunch",
    label: "昼休み",
    startMin: minutesOf(lunch.start),
    endMin: minutesOf(lunch.end),
    kind: "lunch",
  });

  // 退勤準備バッファ（15:30–16:00 は予定不可。定期便日は 15:45 まで。§7.1/§7.2）
  const bufferEnd = flags.isRegularMail ? "15:45" : settings.bufferEnd;
  if (minutesOf(bufferEnd) > minutesOf(settings.scheduleEnd)) {
    bands.push({
      id: "buffer",
      label: "退勤準備（予定不可）",
      startMin: minutesOf(settings.scheduleEnd),
      endMin: minutesOf(bufferEnd),
      kind: "buffer",
    });
  }

  // 半休（AM/PM）を灰色バンドで示す（§8.3 の簡易版。詳細な半休グリッドは Phase 3）
  for (const h of flags.holidays) {
    if (h.kind === "am") {
      bands.push({
        id: "am-off",
        label: "AM休",
        startMin: dayStartMin,
        endMin: minutesOf("12:00"),
        kind: "holiday",
      });
    } else if (h.kind === "pm") {
      bands.push({
        id: "pm-off",
        label: "PM休",
        startMin: minutesOf("13:00"),
        endMin: minutesOf(settings.scheduleEnd),
        kind: "holiday",
      });
    }
  }

  // 当番自動ブロック（locked）
  const dutyBlocks: MiraiProgramBlock[] = dutyBlocksForDate(roster, date).map(
    (b) => ({
      key: `duty-${b.kind}-${b.columnId}`,
      columnId: b.columnId,
      startMin: minutesOf(b.plannedStart),
      endMin: minutesOf(b.plannedEnd),
      title: MIRAI_DUTY_BLOCK_KIND_LABELS[b.kind],
      timeLabel: timeRange(b.plannedStart, b.plannedEnd),
      locked: true,
      assignee: normalizeAssignee(b.assignee),
    }),
  );

  // 予定ブロック（seed）
  const plannedBlocks: MiraiProgramBlock[] = dailyBlocks
    .filter((b) => b.date === date)
    .map((b) => ({
      key: `plan-${b.id}`,
      columnId: b.columnId,
      startMin: minutesOf(b.plannedStart),
      endMin: minutesOf(b.plannedEnd),
      title: b.title,
      timeLabel: timeRange(b.plannedStart, b.plannedEnd),
      locked: false,
      assignee: normalizeAssignee(b.assignee),
    }));

  return {
    date,
    dayStartMin,
    dayEndMin,
    scheduleEndMin: minutesOf(settings.scheduleEnd),
    flags,
    bands,
    blocks: [...dutyBlocks, ...plannedBlocks],
    allDayOff,
  };
}

export type MiraiWorkloadSummary = {
  assignee: MiraiAssignee;
  /** 予定を載せられる実質可能時間（分。§7.3） */
  availableMin: number;
  /** その担当の予定合計（分） */
  plannedMin: number;
  /** その担当の当番合計（分。可能時間から差し引き済み） */
  dutyMin: number;
  /** 15:30 までに終わらない見込みの超過分（分。0 なら収まる） */
  overMin: number;
};

/** [a,b) と勤務枠 [winStart,winEnd) の重なり（分） */
function overlapMin(
  a: number,
  b: number,
  winStart: number,
  winEnd: number,
): number {
  return Math.max(0, Math.min(b, winEnd) - Math.max(a, winStart));
}

/**
 * その日・その担当の業務時間バー（§7.3）。
 * 勤務枠 [workStart, scheduleEnd) から昼休み・半休・当番を差し引いた「可能時間」と、
 * 予定合計を比べ、15:30 までに終わらない見込み（超過分）を出す。純粋関数。
 */
export function dayWorkloadSummary(
  model: MiraiProgramDayModel,
  assignee: MiraiAssignee,
): MiraiWorkloadSummary {
  const winStart = model.dayStartMin;
  const winEnd = model.scheduleEndMin;
  const windowMin = Math.max(0, winEnd - winStart);

  // 昼休み・半休は誰にとっても不可
  let blockedMin = 0;
  for (const band of model.bands) {
    if (band.kind === "lunch" || band.kind === "holiday") {
      blockedMin += overlapMin(band.startMin, band.endMin, winStart, winEnd);
    }
  }

  // 当番（locked）はその担当の可能時間を消費する
  const duties = model.blocks.filter(
    (b) => b.locked && b.assignee === assignee,
  );
  let dutyMin = 0;
  for (const d of duties) {
    dutyMin += overlapMin(d.startMin, d.endMin, winStart, winEnd);
  }

  const availableMin = Math.max(0, windowMin - blockedMin - dutyMin);

  const planned = model.blocks.filter(
    (b) => !b.locked && b.assignee === assignee,
  );
  let plannedMin = 0;
  for (const p of planned) {
    plannedMin += overlapMin(p.startMin, p.endMin, winStart, winEnd);
  }

  return {
    assignee,
    availableMin,
    plannedMin,
    dutyMin,
    overMin: Math.max(0, plannedMin - availableMin),
  };
}
