import {
  type MiraiCommitteeMeetingKind,
  type MiraiHolidayKind,
  type MiraiShidaiKind,
  type MiraiTaskStatus,
} from "@/lib/mirai-schema";

export const MIRAI_TASK_STATUS_LABELS: Record<MiraiTaskStatus, string> = {
  todo: "未着手",
  doing: "進行中",
  done: "完了",
  blocked: "保留",
};

export const MIRAI_SHIDAI_KIND_LABELS: Record<MiraiShidaiKind, string> = {
  pre: "事前打ち合わせ",
  main: "実行委員会本会",
  followup: "フォロー",
  other: "その他",
};

/** 実行委員会・事前打ち合わせの種別ラベル（§16.1） */
export const MIRAI_COMMITTEE_MEETING_KIND_LABELS: Record<
  MiraiCommitteeMeetingKind,
  string
> = {
  "pre-meeting": "事前打合せ",
  committee: "実行委員会",
};

/** 休みの種別ラベル（§6.1） */
export const MIRAI_HOLIDAY_KIND_LABELS: Record<MiraiHolidayKind, string> = {
  am: "AM休",
  pm: "PM休",
  full: "有休",
  holiday: "休日",
};
