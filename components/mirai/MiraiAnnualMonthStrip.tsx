"use client";

import { type MiraiAnnualMonth } from "@/lib/mirai-schema";
import { Button } from "@/components/ui/button";

type MiraiAnnualMonthStripProps = {
  months: MiraiAnnualMonth[];
  selectedMonthId: string;
  onSelectMonth: (monthId: string) => void;
  subtitle: string;
};

export function MiraiAnnualMonthStrip({
  months,
  selectedMonthId,
  onSelectMonth,
  subtitle,
}: MiraiAnnualMonthStripProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-foreground">
          みらいプロジェクト年間スケジュール
        </p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div
        className="flex flex-wrap gap-1"
        role="list"
        aria-label="月を選択"
      >
        {months.map((month) => {
          const isSelected = month.id === selectedMonthId;
          return (
            <Button
              key={month.id}
              type="button"
              role="listitem"
              size="xs"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelectMonth(month.id)}
              aria-pressed={isSelected}
            >
              {month.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
