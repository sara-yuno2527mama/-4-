"use client";

/**
 * 繰越帯（docs/mirai-crosscut-schedule-design.md §8.4 / §18.3）。
 * 表示日より前の未完了ブロックを累積表示し、[今日に載せる] で移動、[破棄] でトレイから外す。
 */

import { Undo2 } from "lucide-react";

import { type MiraiDailyBlock } from "@/lib/mirai-schema";
import { miraiColumnLabel } from "@/lib/mirai/columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MiraiCarryoverStripProps = {
  items: readonly MiraiDailyBlock[];
  onPlaceToday: (block: MiraiDailyBlock) => void;
  onDismiss: (blockId: string) => void;
};

function shortDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d}`;
}

export function MiraiCarryoverStrip({
  items,
  onPlaceToday,
  onDismiss,
}: MiraiCarryoverStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 border-b border-border bg-secondary/40 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Undo2 className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">繰越</span>
        <Badge variant="secondary" size="xs">
          {items.length}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          未完了は完了または破棄まで表示。[今日に載せる] で当日へ移動
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1"
          >
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {shortDate(item.date)}
            </span>
            <span className="max-w-40 truncate text-[11px] font-medium text-foreground">
              {item.title}
            </span>
            <Badge variant="outline" size="xs">
              {miraiColumnLabel(item.columnId)}
            </Badge>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onPlaceToday(item)}
            >
              今日に載せる
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => onDismiss(item.id)}
            >
              破棄
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
