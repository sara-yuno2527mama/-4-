"use client";

/**
 * 番組表（docs/mirai-crosscut-schedule-design.md §8）。
 * 縦=時間（9:00〜16:00、定期便日は16:15）× 横=選択した業務列。
 *
 * - 列ピッカーで選んだ列だけを表示（roster / localStorage）
 * - 当番（郵便 9:05・昼仕分け・定期便・昼当番・お弁当）は locked で自動配置（§6.1）
 * - 昼休み・退勤準備は背景バンド（§7）
 * - 予定ブロックは dashboard.json seed を表示（編集・タイマーは Phase 3）
 *
 * ブロックの縦位置は「分 × PX_PER_MIN」で absolute 配置する。
 */

import { useState } from "react";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type MiraiColumnId,
  type MiraiDailyBlock,
  type MiraiWorkDaySettings,
} from "@/lib/mirai-schema";
import { miraiColumnLabel } from "@/lib/mirai/columns";
import {
  type MiraiAssignee,
  type MiraiProgramBand,
  type MiraiProgramBlock,
  type MiraiWorkloadSummary,
  MIRAI_ASSIGNEES,
  dayHalfOf,
  dayWorkloadSummary,
  hhmmOf,
  programDayModel,
} from "@/lib/mirai/program";
import { type MiraiRosterState } from "@/lib/mirai/roster-state";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { formatISODate, parseISODate } from "@/lib/computed/profile";
import { MiraiColumnPicker } from "@/components/mirai/MiraiColumnPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** 1 分あたりの高さ（px）。時間軸の縦密度。 */
const PX_PER_MIN = 1.5;
/** 時間軸ガター幅（px）。ヘッダーの左スペーサーと揃える。 */
const AXIS_W = 56;
/** 各業務列の幅（px）。 */
const COL_W = 176;

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

type MiraiProgramTablePaneProps = {
  roster: MiraiRosterState;
  actions: MiraiRosterActions;
  settings: MiraiWorkDaySettings;
  dailyBlocks: readonly MiraiDailyBlock[];
  asOfDate: string;
};

function weekdayLabel(date: string): string {
  const d = parseISODate(date);
  if (!d) return "";
  const [, m, day] = date.split("-").map(Number);
  return `${m}/${day}（${WEEKDAY_JP[d.getDay()]}）`;
}

function shiftDate(date: string, days: number): string {
  const d = parseISODate(date);
  if (!d) return date;
  return formatISODate(addDays(d, days));
}

const BAND_CLASS: Record<MiraiProgramBand["kind"], string> = {
  lunch: "bg-muted/70",
  buffer: "bg-muted/40",
  holiday: "bg-muted",
};

export function MiraiProgramTablePane({
  roster,
  actions,
  settings,
  dailyBlocks,
  asOfDate,
}: MiraiProgramTablePaneProps) {
  const [date, setDate] = useState(asOfDate);
  const [assignee, setAssignee] = useState<MiraiAssignee>("主");

  const visibleColumns = roster.visibleColumns;
  const model = programDayModel(roster, settings, date, dailyBlocks);
  const { dayStartMin, dayEndMin, flags, bands, blocks, allDayOff } = model;

  const currentHalf = dayHalfOf(roster, date);
  const workload = dayWorkloadSummary(model, assignee);

  const top = (min: number) => (min - dayStartMin) * PX_PER_MIN;
  const height = (a: number, b: number) => (b - a) * PX_PER_MIN;
  const gridHeight = height(dayStartMin, dayEndMin);

  const hourMarks: number[] = [];
  for (let m = dayStartMin; m <= dayEndMin; m += 60) hourMarks.push(m);
  if (hourMarks[hourMarks.length - 1] !== dayEndMin) hourMarks.push(dayEndMin);

  const blocksByColumn = (columnId: MiraiColumnId) =>
    blocks.filter((b) => b.columnId === columnId && b.assignee === assignee);

  const dayBadges: { label: string; variant: "secondary" | "destructive" }[] =
    [];
  if (flags.isMailDuty)
    dayBadges.push({ label: "郵便当番", variant: "secondary" });
  if (flags.isRegularMail)
    dayBadges.push({ label: "定期便 16:15退勤", variant: "destructive" });
  if (flags.isLunchDuty)
    dayBadges.push({ label: "昼当番", variant: "secondary" });
  if (flags.isBento) dayBadges.push({ label: "お弁当", variant: "secondary" });

  return (
    <section
      aria-label="番組表"
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-canvas"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="前日"
            onClick={() => setDate((d) => shiftDate(d, -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-20 text-center text-sm font-semibold text-foreground tabular-nums">
            {weekdayLabel(date)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="翌日"
            onClick={() => setDate((d) => shiftDate(d, 1))}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={date === asOfDate}
            onClick={() => setDate(asOfDate)}
          >
            今日
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {dayBadges.length === 0 && allDayOff === null ? (
            <span className="text-xs text-muted-foreground">通常日</span>
          ) : (
            dayBadges.map((b) => (
              <Badge key={b.label} variant={b.variant} size="xs">
                {b.label}
              </Badge>
            ))
          )}
        </div>

        <div className="ml-auto">
          <MiraiColumnPicker
            visibleColumns={visibleColumns}
            actions={actions}
          />
        </div>
      </div>

      {allDayOff ? null : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background px-3 py-2">
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="担当の切替"
          >
            {MIRAI_ASSIGNEES.map((a) => (
              <Button
                key={a}
                size="sm"
                variant={assignee === a ? "secondary" : "ghost"}
                aria-pressed={assignee === a}
                onClick={() => setAssignee(a)}
              >
                {a}
              </Button>
            ))}
          </div>

          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="勤務形態"
          >
            <span className="mr-0.5 text-[11px] text-muted-foreground">
              勤務
            </span>
            <Button
              size="sm"
              variant={currentHalf === null ? "secondary" : "ghost"}
              aria-pressed={currentHalf === null}
              onClick={() => actions.setDayHalf(date, null)}
            >
              通常
            </Button>
            <Button
              size="sm"
              variant={currentHalf === "am" ? "secondary" : "ghost"}
              aria-pressed={currentHalf === "am"}
              onClick={() => actions.setDayHalf(date, "am")}
            >
              AM休
            </Button>
            <Button
              size="sm"
              variant={currentHalf === "pm" ? "secondary" : "ghost"}
              aria-pressed={currentHalf === "pm"}
              onClick={() => actions.setDayHalf(date, "pm")}
            >
              PM休
            </Button>
          </div>

          <div className="ml-auto">
            <WorkloadBar summary={workload} />
          </div>
        </div>
      )}

      {visibleColumns.length === 0 ? (
        <ProgramEmpty message="「列」から表示する業務列を選んでください。" />
      ) : allDayOff ? (
        <ProgramEmpty
          message={`${weekdayLabel(date)} は終日休みです（番組表なし）。`}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="w-max min-w-full">
            {/* 列ヘッダー（縦スクロール時に固定） */}
            <div className="sticky top-0 z-20 flex border-b border-border bg-background">
              <div className="shrink-0" style={{ width: AXIS_W }} />
              {visibleColumns.map((columnId) => (
                <div
                  key={columnId}
                  className="shrink-0 truncate border-l border-border px-2 py-1.5 text-xs font-medium text-foreground first:border-l-0"
                  style={{ width: COL_W }}
                >
                  {miraiColumnLabel(columnId)}
                </div>
              ))}
            </div>

            {/* 本体（時間軸 + 列） */}
            <div className="relative flex" style={{ height: gridHeight }}>
              <div
                className="relative shrink-0 border-r border-border"
                style={{ width: AXIS_W }}
              >
                {hourMarks.map((m) => (
                  <span
                    key={m}
                    className="absolute right-1.5 text-[10px] text-muted-foreground tabular-nums"
                    style={{ top: top(m) }}
                  >
                    {hhmmOf(m)}
                  </span>
                ))}
              </div>

              <div className="relative flex">
                {/* 背景：時間ガイド線 + バンド（全列にまたがる） */}
                <div className="pointer-events-none absolute inset-0">
                  {hourMarks.map((m) => (
                    <div
                      key={m}
                      className="absolute inset-x-0 border-t border-border/50"
                      style={{ top: top(m) }}
                    />
                  ))}
                  {bands.map((band) => (
                    <div
                      key={band.id}
                      className={cn(
                        "absolute inset-x-0 flex items-start",
                        BAND_CLASS[band.kind],
                      )}
                      style={{
                        top: top(band.startMin),
                        height: height(band.startMin, band.endMin),
                      }}
                    >
                      <span className="px-2 py-0.5 text-[10px] text-muted-foreground">
                        {band.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 列ごとのブロック */}
                {visibleColumns.map((columnId) => (
                  <div
                    key={columnId}
                    className="relative shrink-0 border-l border-border first:border-l-0"
                    style={{ width: COL_W }}
                  >
                    {blocksByColumn(columnId).map((block) => (
                      <ProgramBlockView
                        key={block.key}
                        block={block}
                        top={top(block.startMin)}
                        blockHeight={height(block.startMin, block.endMin)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProgramBlockView({
  block,
  top,
  blockHeight,
}: {
  block: MiraiProgramBlock;
  top: number;
  blockHeight: number;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-1 flex flex-col gap-0.5 overflow-hidden rounded-md border px-1.5 py-1",
        block.locked
          ? "border-border bg-secondary text-secondary-foreground"
          : "border-border bg-card text-card-foreground shadow-xs",
      )}
      style={{ top, height: blockHeight }}
      title={`${block.title}（${block.timeLabel}）`}
    >
      <span className="flex items-center gap-1">
        {block.locked ? (
          <Lock className="size-3 shrink-0 text-muted-foreground" />
        ) : null}
        <span className="truncate text-[11px] leading-tight font-medium">
          {block.title}
        </span>
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {block.timeLabel}
      </span>
    </div>
  );
}

/** 分 → 「4時間55分」形式（業務時間バーの表示用） */
function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/** 業務時間バー（§7.3）。予定 vs 実質可能時間と、15:30 見込み超過アラート。 */
function WorkloadBar({ summary }: { summary: MiraiWorkloadSummary }) {
  const { availableMin, plannedMin, overMin } = summary;
  const over = overMin > 0;
  const ratio =
    availableMin > 0
      ? Math.min(1, plannedMin / availableMin)
      : plannedMin > 0
        ? 1
        : 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-28 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`予定 ${fmtDur(plannedMin)} / 可能 ${fmtDur(availableMin)}`}
      >
        <div
          className={cn(
            "h-full rounded-full",
            over ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        予定 {fmtDur(plannedMin)} / 可能 {fmtDur(availableMin)}
      </span>
      {over ? (
        <Badge variant="destructive" size="xs">
          15:30に収まらない見込み +{fmtDur(overMin)}
        </Badge>
      ) : null}
    </div>
  );
}

function ProgramEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6">
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
