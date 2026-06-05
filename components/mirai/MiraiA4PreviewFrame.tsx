"use client";

import type { ReactNode } from "react";

/** Pane4 幅に収める A4 縮小率（210mm 用紙を約 370px 枠内に収める） */
const A4_PREVIEW_SCALE = 0.44;

type MiraiA4PreviewFrameProps = {
  children: ReactNode;
};

/**
 * transform: scale だけだとレイアウト上の幅が 210mm のまま残り、
 * プレビューが右にずれて見える。外枠を縮小後サイズに合わせて中央配置する。
 */
export function MiraiA4PreviewFrame({ children }: MiraiA4PreviewFrameProps) {
  return (
    <div className="flex justify-center rounded-md border border-border bg-muted/40 p-3">
      <div
        className="overflow-hidden"
        style={{
          width: `calc(210mm * ${A4_PREVIEW_SCALE})`,
          minHeight: `calc(297mm * ${A4_PREVIEW_SCALE})`,
        }}
      >
        <div
          style={{
            transform: `scale(${A4_PREVIEW_SCALE})`,
            transformOrigin: "top left",
            width: "210mm",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
