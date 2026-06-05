/**
 * みらい 4 ペインの幅規律。
 * Pane3 が flex で潰れないよう min-width + 親の overflow-x-auto を組み合わせる。
 */

/** Pane2（一覧・月次次第）— 採用デモ 280px より少し狭く */
export const miraiPane2ClassName =
  "flex w-[240px] shrink-0 flex-col border-r border-border bg-background";

/** Pane3（詳細・次第案）— 常に最低 280px を確保 */
export const miraiPane3ClassName =
  "flex min-w-[280px] flex-1 shrink-0 flex-col bg-canvas";

/** Pane4（チェックリスト・A4 資料）— 400px より狭くして Pane3 の余地を確保 */
export const miraiPane4ClassName =
  "flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-border bg-background";

/** Pane2〜4 の親。狭いビューポートでは横スクロール */
export const miraiPanesRowClassName = "flex min-h-0 min-w-0 flex-1 overflow-x-auto";
