/**
 * 番組表の業務列マスタ（docs/mirai-crosscut-schedule-design.md §3）。
 *
 * `miraiColumnIdSchema`（lib/mirai-schema.ts）が列 ID の正本。
 * 本ファイルは各列の「表示ラベル・大枠グループ・初回表示 ON」の人間向けメタを持つ。
 * 列ピッカーのユーザー設定（visibleColumns / presets）は localStorage → 将来 DB。
 */

import {
  type MiraiColumnGroup,
  type MiraiColumnId,
} from "@/lib/mirai-schema";

export type MiraiColumnMeta = {
  id: MiraiColumnId;
  label: string;
  group: MiraiColumnGroup;
  /** 補足（列ピッカーのツールチップ等） */
  note?: string;
  /** 初回表示で ON にする列（§3.3） */
  defaultOn: boolean;
};

/** 列ピッカーの大枠見出し（§3.1） */
export const MIRAI_COLUMN_GROUP_LABELS: Record<MiraiColumnGroup, string> = {
  soumu: "総務",
  mirai: "みらいPJ",
  other: "その他",
};

/** 列マスタ（§3.2）。表示順もこの配列順に従う。 */
export const MIRAI_COLUMN_MASTER: readonly MiraiColumnMeta[] = [
  { id: "soumu-uniform", label: "制服", group: "soumu", defaultOn: false },
  {
    id: "soumu-etc",
    label: "ETC",
    group: "soumu",
    note: "新電電 + ETCワールドを1列",
    defaultOn: false,
  },
  {
    id: "soumu-travel",
    label: "出張手配",
    group: "soumu",
    note: "請求処理時の JTB を含む",
    defaultOn: true,
  },
  { id: "soumu-attendance", label: "勤怠", group: "soumu", defaultOn: false },
  {
    id: "soumu-general",
    label: "総務全体",
    group: "soumu",
    note: "当番ブロックもこの列",
    defaultOn: false,
  },
  {
    id: "soumu-kaizen",
    label: "業務改善（総務）",
    group: "soumu",
    note: "Excel/手順/効率化打合せのみ。WS開発時間は含めない",
    defaultOn: false,
  },
  { id: "mirai-join", label: "参観", group: "mirai", defaultOn: false },
  { id: "mirai-sponsor", label: "協賛", group: "mirai", defaultOn: false },
  {
    id: "mirai-committee",
    label: "実行委員会",
    group: "mirai",
    note: "事前打合せ + 実行委員会",
    defaultOn: true,
  },
  {
    id: "mirai-showcase",
    label: "発表会",
    group: "mirai",
    note: "固定 11/23・Excel 読込",
    defaultOn: false,
  },
  { id: "mirai-report", label: "報告書", group: "mirai", defaultOn: false },
  {
    id: "mirai-kaizen",
    label: "業務改善（みらいPJ）",
    group: "mirai",
    defaultOn: true,
  },
  { id: "private", label: "プライベート", group: "other", defaultOn: true },
  { id: "other", label: "その他", group: "other", defaultOn: false },
];

/** 初回表示で ON の列 ID（§3.3） */
export const MIRAI_DEFAULT_VISIBLE_COLUMNS: readonly MiraiColumnId[] =
  MIRAI_COLUMN_MASTER.filter((c) => c.defaultOn).map((c) => c.id);

export function miraiColumnMeta(id: MiraiColumnId): MiraiColumnMeta | undefined {
  return MIRAI_COLUMN_MASTER.find((c) => c.id === id);
}

export function miraiColumnLabel(id: MiraiColumnId): string {
  return miraiColumnMeta(id)?.label ?? id;
}
