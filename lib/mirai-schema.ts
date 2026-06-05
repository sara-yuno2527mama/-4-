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
});
export type MiraiDashboard = z.infer<typeof miraiDashboardSchema>;
