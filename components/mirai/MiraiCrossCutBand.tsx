"use client";

/**
 * 横断帯（docs/mirai-crosscut-schedule-design.md §10）。
 * 基準日で全領域を 1 行に集約する全幅バンド。crossCutSnapshot の結果を描画するだけ。
 */

import { CalendarDays, Info, TriangleAlert } from "lucide-react";

import {
  type CrossCutAlert,
  type CrossCutAlertTone,
  type CrossCutSnapshot,
} from "@/lib/mirai/crosscut";
import { Badge } from "@/components/ui/badge";

type MiraiCrossCutBandProps = {
  snapshot: CrossCutSnapshot;
};

const ALERT_VARIANT: Record<
  CrossCutAlertTone,
  "outline" | "secondary" | "destructive"
> = {
  info: "outline",
  warning: "secondary",
  danger: "destructive",
};

function AlertBadge({ alert }: { alert: CrossCutAlert }) {
  const Icon = alert.tone === "info" ? Info : TriangleAlert;
  return (
    <Badge variant={ALERT_VARIANT[alert.tone]} size="xs">
      <Icon />
      {alert.message}
    </Badge>
  );
}

function mdLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function MiraiCrossCutBand({ snapshot }: MiraiCrossCutBandProps) {
  const { businessMonth } = snapshot;

  return (
    <section
      aria-label="横断サマリ"
      className="flex flex-col gap-2 border-b border-border bg-card px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          今日 {snapshot.asOfDate}
        </span>
        <span className="text-muted-foreground">今週 {snapshot.weekLabel}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          業務月 {businessMonth.label} · 締め
          {businessMonth.closeDate ? (
            <span className="text-foreground">
              {mdLabel(businessMonth.closeDate)}
            </span>
          ) : (
            <Badge variant="secondary" size="xs">
              未入力
            </Badge>
          )}
        </span>
        {snapshot.alerts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {snapshot.alerts.map((alert) => (
              <AlertBadge key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="領域ごとの状況">
        {snapshot.domains.map((domain) => (
          <li
            key={domain.domainId}
            className="flex min-w-36 flex-1 flex-col gap-1 rounded-md border border-border bg-background px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-foreground">
                {domain.domainName}
              </span>
              {domain.nearDueCount > 0 && (
                <Badge variant="secondary" size="xs">
                  期限近 {domain.nearDueCount}
                </Badge>
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {domain.currentPhaseLabel ?? "フェーズ未設定"}
            </span>
            {domain.nextMilestone && (
              <span className="truncate text-xs text-muted-foreground">
                次: {domain.nextMilestone.label} {mdLabel(domain.nextMilestone.date)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
