"use client";

/**
 * 列ピッカー（docs/mirai-crosscut-schedule-design.md §3）。
 * 番組表に表示する業務列を大枠（総務 / みらいPJ / その他）別に ON/OFF する。
 * 選択は roster（localStorage）に保存され、次回も維持される。
 */

import { Columns3, RotateCcw } from "lucide-react";

import { type MiraiColumnGroup, type MiraiColumnId } from "@/lib/mirai-schema";
import {
  MIRAI_COLUMN_GROUP_LABELS,
  MIRAI_COLUMN_MASTER,
  type MiraiColumnMeta,
} from "@/lib/mirai/columns";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

type MiraiColumnPickerProps = {
  visibleColumns: MiraiColumnId[];
  actions: MiraiRosterActions;
};

const GROUP_ORDER: MiraiColumnGroup[] = ["soumu", "mirai", "other"];

function groupColumns(group: MiraiColumnGroup): MiraiColumnMeta[] {
  return MIRAI_COLUMN_MASTER.filter((c) => c.group === group);
}

export function MiraiColumnPicker({
  visibleColumns,
  actions,
}: MiraiColumnPickerProps) {
  const visibleSet = new Set(visibleColumns);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="表示する業務列を選ぶ"
          />
        }
      >
        <Columns3 />列
        <Badge variant="secondary" size="xs">
          {visibleColumns.length}
        </Badge>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            表示する列
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.resetColumns()}
          >
            <RotateCcw />
            既定
          </Button>
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          {GROUP_ORDER.map((group) => (
            <div key={group} className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {MIRAI_COLUMN_GROUP_LABELS[group]}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {groupColumns(group).map((col) => (
                  <Toggle
                    key={col.id}
                    size="sm"
                    variant="outline"
                    pressed={visibleSet.has(col.id)}
                    onPressedChange={() => actions.toggleColumn(col.id)}
                    title={col.note}
                  >
                    {col.label}
                  </Toggle>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
