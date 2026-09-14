"use client";

/**
 * ペアに振った仕事の別枠（docs/mirai-crosscut-schedule-design.md §2 / §9 / §9.1）。
 * 横断帯の下・メインコンテンツの上に全幅表示。0件でも細い帯を常時表示。
 */

import { useState } from "react";
import { Handshake, Plus } from "lucide-react";

import { type MiraiDelegatedToPair } from "@/lib/mirai-schema";
import { miraiColumnLabel } from "@/lib/mirai/columns";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { parseISODate } from "@/lib/computed/profile";
import { differenceInCalendarDays } from "date-fns";
import { MiraiDelegateDialog } from "@/components/mirai/MiraiDelegateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MiraiDelegatedStripProps = {
  items: readonly MiraiDelegatedToPair[];
  /** 端末ロール（振った側のみ [完了] 可） */
  deviceRole: string;
  asOfDate: string;
  actions: MiraiRosterActions;
};

function shortDate(date: string): string {
  const d = parseISODate(date);
  if (!d) return date;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function deadlineTone(
  asOfDate: string,
  deadline: string,
): "default" | "secondary" | "destructive" | "outline" {
  const a = parseISODate(asOfDate);
  const b = parseISODate(deadline);
  if (!a || !b) return "outline";
  const days = differenceInCalendarDays(b, a);
  if (days < 0) return "destructive";
  if (days === 0) return "default";
  if (days <= 3) return "secondary";
  return "outline";
}

export function MiraiDelegatedStrip({
  items,
  deviceRole,
  asOfDate,
  actions,
}: MiraiDelegatedStripProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isEmpty = items.length === 0;

  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-border bg-secondary/30 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Handshake className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            ペアに振った仕事
            {isEmpty ? " — なし" : null}
          </span>
          {!isEmpty ? (
            <Badge variant="secondary" size="xs">
              {items.length}
            </Badge>
          ) : null}
          {!isEmpty ? (
            <span className="text-[11px] text-muted-foreground">
              振った側が [完了] で消える
            </span>
          ) : null}
          <Button
            size="xs"
            variant="outline"
            className="ml-auto"
            onClick={() => setDialogOpen(true)}
          >
            <Plus />
            ペアに振る
          </Button>
        </div>

        {!isEmpty ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const isDelegator = item.createdBy === deviceRole;
              return (
                <div
                  key={item.id}
                  className="flex max-w-full flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1"
                >
                  <Badge variant="outline" size="xs">
                    振 {shortDate(item.delegatedOn)}
                  </Badge>
                  <Badge
                    variant={deadlineTone(asOfDate, item.deadline)}
                    size="xs"
                  >
                    期限 {shortDate(item.deadline)}
                  </Badge>
                  <span className="max-w-48 truncate text-[11px] font-medium text-foreground">
                    {item.title}
                  </span>
                  {item.columnId ? (
                    <Badge variant="outline" size="xs">
                      {miraiColumnLabel(item.columnId)}
                    </Badge>
                  ) : null}
                  {isDelegator ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => actions.completeDelegated(item.id)}
                    >
                      完了
                    </Button>
                  ) : null}
                  {isDelegator ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => actions.removeDelegated(item.id)}
                    >
                      取消
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <MiraiDelegateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        createdBy={deviceRole}
        actions={actions}
        defaultDeadline={asOfDate}
        defaultDelegatedOn={asOfDate}
      />
    </>
  );
}
