import { type MiraiShidaiKind, type MiraiTaskStatus } from "@/lib/mirai-schema";

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
