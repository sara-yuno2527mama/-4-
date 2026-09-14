/**
 * みらいプロジェクト事務局ダッシュボード用 Zod スキーマ。
 * 採用管理ドメインの `lib/schema.ts` とは独立（別ルート `/mirai`）。
 */

import { z } from "zod";

export const miraiTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  openCount: z.number(),
});
export type MiraiTrack = z.infer<typeof miraiTrackSchema>;

export const miraiSchedulePhaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** フェーズ開始日（YYYY-MM-DD） */
  start: z.string(),
  /** フェーズ終了日（YYYY-MM-DD、含む） */
  end: z.string(),
});
export type MiraiSchedulePhase = z.infer<typeof miraiSchedulePhaseSchema>;

export const miraiDomainSchema = z.object({
  id: z.string(),
  name: z.string(),
  tracks: z.array(miraiTrackSchema),
  schedulePhases: z.array(miraiSchedulePhaseSchema).optional(),
});
export type MiraiDomain = z.infer<typeof miraiDomainSchema>;

export const miraiTaskStatusSchema = z.enum([
  "todo",
  "doing",
  "done",
  "blocked",
]);
export type MiraiTaskStatus = z.infer<typeof miraiTaskStatusSchema>;

export const miraiChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
});
export type MiraiChecklistItem = z.infer<typeof miraiChecklistItemSchema>;

export const miraiTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  trackId: z.string(),
  status: miraiTaskStatusSchema,
  dueDate: z.string(),
  owner: z.string(),
  summary: z.string(),
  /** 総務の月次締め：`schedulePhases` の id（例 soumu-mid / soumu-eom） */
  closingTimingId: z.string().optional(),
  checklists: z.array(miraiChecklistItemSchema).optional(),
});
export type MiraiTask = z.infer<typeof miraiTaskSchema>;

export const miraiWorkspaceMetaSchema = z.object({
  name: z.string(),
  icon: z.string(),
});
export type MiraiWorkspaceMeta = z.infer<typeof miraiWorkspaceMetaSchema>;

/** みらいプロジェクト年間スケジュールの月（YYYY-MM） */
export const miraiAnnualMonthSchema = z.object({
  id: z.string(),
  label: z.string(),
  year: z.number(),
  month: z.number(),
});
export type MiraiAnnualMonth = z.infer<typeof miraiAnnualMonthSchema>;

export const miraiShidaiKindSchema = z.enum([
  "pre",
  "main",
  "followup",
  "other",
]);
export type MiraiShidaiKind = z.infer<typeof miraiShidaiKindSchema>;

/** 実行委員会の次第（過去分アーカイブ） */
export const miraiShidaiRecordSchema = z.object({
  id: z.string(),
  /** 開催月（YYYY-MM） */
  yearMonth: z.string(),
  heldOn: z.string(),
  title: z.string(),
  kind: miraiShidaiKindSchema,
  summary: z.string(),
  agenda: z.array(z.string()),
  decisions: z.array(z.string()).optional(),
  homework: z.array(z.string()).optional(),
});
export type MiraiShidaiRecord = z.infer<typeof miraiShidaiRecordSchema>;

/** 選択月向けの次第案（今年・今月） */
export const miraiShidaiDraftSchema = z.object({
  targetMonthId: z.string(),
  title: z.string(),
  plannedHeldOn: z.string().optional(),
  kind: miraiShidaiKindSchema,
  summary: z.string(),
  agenda: z.array(z.string()),
  preparationNotes: z.array(z.string()).optional(),
  homework: z.array(z.string()).optional(),
});
export type MiraiShidaiDraft = z.infer<typeof miraiShidaiDraftSchema>;

/* ─────────────────────────────────────────────────────────────────────────
 * 横断スケジュール・番組表（docs/mirai-crosscut-schedule-design.md）
 * Phase 0: schema 草案。既存の domain / task / shidai は壊さず、すべて追加のみ。
 * 日次入力・当月設定・タイマー実績は localStorage 暫定 → 将来 DB。
 * ───────────────────────────────────────────────────────────────────────── */

/** 番組表の業務列 ID（§3.2）。総務6 + みらいPJ6 + その他2 = 14 列。 */
export const miraiColumnIdSchema = z.enum([
  "soumu-uniform",
  "soumu-etc",
  "soumu-travel",
  "soumu-attendance",
  "soumu-general",
  "soumu-kaizen",
  "mirai-join",
  "mirai-sponsor",
  "mirai-committee",
  "mirai-showcase",
  "mirai-report",
  "mirai-kaizen",
  "private",
  "other",
]);
export type MiraiColumnId = z.infer<typeof miraiColumnIdSchema>;

/** 列ピッカーの大枠（見出し。§3.1） */
export const miraiColumnGroupSchema = z.enum(["soumu", "mirai", "other"]);
export type MiraiColumnGroup = z.infer<typeof miraiColumnGroupSchema>;

/** 業務月（請求締め日ベース。§4） */
export const miraiBusinessMonthSchema = z.object({
  /** YYYY-MM（業務月の呼称。締め日は翌暦月になり得る） */
  id: z.string(),
  /** 請求締め日（YYYY-MM-DD、判明次第入力） */
  billingCloseDate: z.string().optional(),
});
export type MiraiBusinessMonth = z.infer<typeof miraiBusinessMonthSchema>;

/** 当番の日付 + 担当（主 / ペア / 名前）。§13 */
export const miraiDutyDateSchema = z.object({
  /** YYYY-MM-DD */
  date: z.string(),
  assignee: z.string().optional(),
});
export type MiraiDutyDate = z.infer<typeof miraiDutyDateSchema>;

/** 休みの種別（§6.1）。am=AM休 / pm=PM休 / full=有休 / holiday=休日 */
export const miraiHolidayKindSchema = z.enum(["am", "pm", "full", "holiday"]);
export type MiraiHolidayKind = z.infer<typeof miraiHolidayKindSchema>;

export const miraiHolidaySchema = z.object({
  /** YYYY-MM-DD */
  start: z.string(),
  /** 範囲の終端（含む）。単日は省略 */
  end: z.string().optional(),
  kind: miraiHolidayKindSchema,
});
export type MiraiHoliday = z.infer<typeof miraiHolidaySchema>;

/** 月次の当番・お弁当・休み（§13 monthlyRoster） */
export const miraiMonthlyRosterSchema = z.object({
  /** YYYY-MM */
  yearMonth: z.string(),
  lunchDutyDates: z.array(miraiDutyDateSchema).default([]),
  mailDutyDates: z.array(miraiDutyDateSchema).default([]),
  /** 郵便 + 定期便（15:45–16:15・16:15 退勤）の該当日 YYYY-MM-DD */
  mailWithRegularDates: z.array(z.string()).default([]),
  bentoDates: z.array(z.string()).default([]),
  holidays: z.array(miraiHolidaySchema).default([]),
});
export type MiraiMonthlyRoster = z.infer<typeof miraiMonthlyRosterSchema>;

/** 勤務時間・15:30 ルール（§7 / §13 workDaySettings） */
export const miraiWorkDaySettingsSchema = z.object({
  workStart: z.string().default("09:00"),
  workEnd: z.string().default("16:00"),
  /** 予定を載せてよい上限 */
  scheduleEnd: z.string().default("15:30"),
  /** 退勤準備バッファ終端（=退勤） */
  bufferEnd: z.string().default("16:00"),
});
export type MiraiWorkDaySettings = z.infer<typeof miraiWorkDaySettingsSchema>;

/** 予定/実績ブロック（§8.2 dailyBlock） */
export const miraiDailyBlockSchema = z.object({
  id: z.string(),
  /** どの日の番組表か（YYYY-MM-DD） */
  date: z.string(),
  columnId: miraiColumnIdSchema,
  /** HH:mm */
  plannedStart: z.string(),
  plannedEnd: z.string(),
  actualStart: z.string().optional(),
  actualEnd: z.string().optional(),
  /** 明示完了（§18.2。actual があっても未完了のまま残せる） */
  done: z.boolean().optional(),
  /** 繰越から破棄（完了扱いにせずトレイから外す。§18.3） */
  dismissed: z.boolean().optional(),
  title: z.string(),
  taskId: z.string().optional(),
  note: z.string().optional(),
  /** 主 / ペア（番組表 2 枚。§8.1） */
  assignee: z.string().optional(),
});
export type MiraiDailyBlock = z.infer<typeof miraiDailyBlockSchema>;

/** 当番ブロックの種別（§13 dutyBlock） */
export const miraiDutyBlockKindSchema = z.enum([
  "lunch-phone",
  "lunch-break",
  "mail-am",
  "mail-noon",
  "regular-pm",
  "bento",
]);
export type MiraiDutyBlockKind = z.infer<typeof miraiDutyBlockKindSchema>;

/** 当番ブロック（locked=システム固定。§6.1） */
export const miraiDutyBlockSchema = z.object({
  kind: miraiDutyBlockKindSchema,
  /** YYYY-MM-DD */
  date: z.string(),
  plannedStart: z.string(),
  plannedEnd: z.string(),
  locked: z.literal(true),
  /** soumu-general | private */
  columnId: miraiColumnIdSchema,
  assignee: z.string().optional(),
});
export type MiraiDutyBlock = z.infer<typeof miraiDutyBlockSchema>;

/** ペアに振った仕事の進捗（§9） */
export const miraiDelegateStatusSchema = z.enum(["todo", "doing", "done"]);
export type MiraiDelegateStatus = z.infer<typeof miraiDelegateStatusSchema>;

/** ペアに振った仕事（§9 delegatedToPair） */
export const miraiDelegatedToPairSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    /** YYYY-MM-DD */
    deadline: z.string(),
    /** YYYY-MM-DD（振った日。§9.1）旧データは parse 時に deadline で補完 */
    delegatedOn: z.string().optional(),
    columnId: miraiColumnIdSchema.optional(),
    note: z.string().optional(),
    status: miraiDelegateStatusSchema,
    /** 振った側（この人が [完了] で別枠から消える） */
    createdBy: z.string(),
  })
  .transform((data) => ({
    ...data,
    delegatedOn: data.delegatedOn ?? data.deadline,
  }));
export type MiraiDelegatedToPair = z.infer<typeof miraiDelegatedToPairSchema>;

/* ── §16 みらいPJ 拡張 ── */

/** 実行委員会の種別（§16.1）。pre-meeting=事前打ち合わせ / committee=実行委員会 */
export const miraiCommitteeMeetingKindSchema = z.enum([
  "pre-meeting",
  "committee",
]);
export type MiraiCommitteeMeetingKind = z.infer<
  typeof miraiCommitteeMeetingKindSchema
>;

/** 実行委員会・事前打ち合わせの確定日程（§16.1 committeeMeeting） */
export const miraiCommitteeMeetingSchema = z.object({
  id: z.string(),
  kind: miraiCommitteeMeetingKindSchema,
  /** YYYY-MM-DD（おおよそ1か月前に決まる） */
  heldOn: z.string(),
  /** HH:mm（任意） */
  time: z.string().optional(),
  title: z.string().optional(),
  note: z.string().optional(),
});
export type MiraiCommitteeMeeting = z.infer<typeof miraiCommitteeMeetingSchema>;

/** 発表会（§16.2 showcaseEvent。毎年 11/23 固定） */
export const miraiShowcaseEventSchema = z.object({
  /** MM-DD（勤労感謝の日。年ごとに YYYY-11-23 を生成） */
  annualDate: z.string().default("11-23"),
  /** 祝日移動等で実施日が動く年度の例外（YYYY-MM-DD） */
  exceptionDates: z.array(z.string()).optional(),
});
export type MiraiShowcaseEvent = z.infer<typeof miraiShowcaseEventSchema>;

/** 発表会準備 Excel の取込スナップショット（§16.2 showcasePrepImport） */
export const miraiShowcasePrepImportSchema = z.object({
  source: z.literal("excel"),
  fileName: z.string().optional(),
  /** YYYY-MM-DD */
  importedAt: z.string(),
  sheetName: z.string().optional(),
  tasks: z.array(
    z.object({
      title: z.string(),
      dueDate: z.string().optional(),
      phase: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});
export type MiraiShowcasePrepImport = z.infer<
  typeof miraiShowcasePrepImportSchema
>;

/** 参観列のコンテスト集約マイルストーン（§16.3 joinMilestone） */
export const miraiJoinMilestoneKindSchema = z.enum([
  "essay-contest-aggregate",
  "photo-contest-aggregate",
]);
export type MiraiJoinMilestoneKind = z.infer<
  typeof miraiJoinMilestoneKindSchema
>;

export const miraiJoinMilestoneSchema = z.object({
  id: z.string(),
  kind: miraiJoinMilestoneKindSchema,
  /** 集約タイミング（YYYY-MM-DD、判明次第・手入力） */
  targetDate: z.string().optional(),
  note: z.string().optional(),
});
export type MiraiJoinMilestone = z.infer<typeof miraiJoinMilestoneSchema>;

/** 入賞者の発表会出欠（§16.3 contestWinnerAttendance） */
export const miraiContestWinnerAttendanceSchema = z.object({
  id: z.string(),
  contest: z.enum(["essay", "photo"]),
  winnerRef: z.string(),
  showcaseAttendance: z.enum(["pending", "yes", "no"]).optional(),
});
export type MiraiContestWinnerAttendance = z.infer<
  typeof miraiContestWinnerAttendanceSchema
>;

export const miraiDashboardSchema = z.object({
  workspace: miraiWorkspaceMetaSchema,
  /** 「今」の判定に使う基準日（YYYY-MM-DD）。未指定時は実行環境の今日 */
  asOfDate: z.string().optional(),
  /** 年間スケジュールの月一覧（実行委員会の月選択に使用） */
  annualMonths: z.array(miraiAnnualMonthSchema).optional(),
  domains: z.array(miraiDomainSchema),
  tasks: z.array(miraiTaskSchema),
  shidaiRecords: z.array(miraiShidaiRecordSchema).optional(),
  shidaiDrafts: z.array(miraiShidaiDraftSchema).optional(),
  /* ── 横断スケジュール・番組表の seed（すべて任意。日次入力は localStorage 暫定） ── */
  businessMonths: z.array(miraiBusinessMonthSchema).optional(),
  monthlyRosters: z.array(miraiMonthlyRosterSchema).optional(),
  workDaySettings: miraiWorkDaySettingsSchema.optional(),
  /** 番組表の予定/実績ブロック seed（§8.2。編集・タイマーは Phase 3） */
  dailyBlocks: z.array(miraiDailyBlockSchema).optional(),
  committeeMeetings: z.array(miraiCommitteeMeetingSchema).optional(),
  showcaseEvent: miraiShowcaseEventSchema.optional(),
  joinMilestones: z.array(miraiJoinMilestoneSchema).optional(),
  contestWinners: z.array(miraiContestWinnerAttendanceSchema).optional(),
});
export type MiraiDashboard = z.infer<typeof miraiDashboardSchema>;
