import { type MiraiShidaiDraft } from "@/lib/mirai-schema";
import { MIRAI_SHIDAI_KIND_LABELS } from "@/lib/mirai-labels";

export function formatShidaiDraftPlainText(draft: MiraiShidaiDraft): string {
  const lines: string[] = [
    "みらいプロジェクト 実行委員会",
    "次第（案）",
    "",
    draft.title,
  ];
  if (draft.plannedHeldOn) {
    lines.push(`開催予定：${draft.plannedHeldOn}`);
  }
  lines.push(`種別：${MIRAI_SHIDAI_KIND_LABELS[draft.kind]}`, "", draft.summary, "", "【議題】");
  draft.agenda.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
  if (draft.preparationNotes?.length) {
    lines.push("", "【備考（昨年・前回を踏まえたメモ）】");
    draft.preparationNotes.forEach((n) => lines.push(`・${n}`));
  }
  if (draft.homework?.length) {
    lines.push("", "【宿題・フォロー（事務局）】");
    draft.homework.forEach((h) => lines.push(`・${h}`));
  }
  return lines.join("\n");
}
