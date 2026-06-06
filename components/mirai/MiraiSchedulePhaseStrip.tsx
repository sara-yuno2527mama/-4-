"use client";

import { type MiraiSchedulePhase } from "@/lib/mirai-schema";
import { Badge } from "@/components/ui/badge";

type MiraiSchedulePhaseStripProps = {
  phases: MiraiSchedulePhase[];
  currentPhaseId: string | null;
  asOfDate: string;
  title?: string;
};

export function MiraiSchedulePhaseStrip({
  phases,
  currentPhaseId,
  asOfDate,
  title = "年間スケジュール",
}: MiraiSchedulePhaseStripProps) {
  const current = phases.find((p) => p.id === currentPhaseId);

  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          基準日 {asOfDate}
          {current ? (
            <>
              {" "}
              · 今は
              <span className="font-medium text-foreground">
                {current.label}
              </span>
            </>
          ) : (
            " · いまのフェーズは期間外"
          )}
        </p>
      </div>
      <div
        className="flex gap-1 overflow-x-auto pb-0.5"
        role="list"
        aria-label="年間フェーズ"
      >
        {phases.map((phase) => {
          const isCurrent = phase.id === currentPhaseId;
          return (
            <Badge
              key={phase.id}
              role="listitem"
              variant={isCurrent ? "default" : "outline"}
              size="xs"
              title={`${phase.label}（${phase.start}〜${phase.end}）`}
            >
              {phase.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
