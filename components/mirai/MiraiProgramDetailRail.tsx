"use client";

/**
 * 番組表の詳細レール（docs/mirai-crosscut-schedule-design.md §8.2 / §18）。
 * 番組表は全幅の単一ペインのため、§2 の「Pane3=読む / Pane4=書く」を
 * このレール内で実現する:
 *   - 上段（読む）: 本日の予定/実績/差分の日次サマリ、選択ブロックの予実差
 *   - 下段（書く）: スタート/ストップタイマー・実績手入力・明示完了・未計画計測
 *
 * タイマー停止時は「完了にする?」ダイアログを出す（§18.2）。
 */

import { useState } from "react";
import { Check, Eraser, Handshake, Play, Square } from "lucide-react";

import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { type MiraiColumnId } from "@/lib/mirai-schema";
import { miraiColumnLabel } from "@/lib/mirai/columns";
import {
  type MiraiActualSummary,
  type MiraiProgramBlock,
  blockDiffMin,
  fmtDurationMin,
  hhmmOf,
} from "@/lib/mirai/program";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MiraiDelegateDialog } from "@/components/mirai/MiraiDelegateDialog";

type MiraiProgramDetailRailProps = {
  summary: MiraiActualSummary;
  viewedDate: string;
  visibleColumns: readonly MiraiColumnId[];
  /** 表示日の番組表上で選択中のブロック（当番など locked は選べない） */
  selectedBlock: MiraiProgramBlock | null;
  /** 計測中ブロック（選択と異なる場合あり。未計画計測など） */
  runningBlock: MiraiProgramBlock | null;
  /** 計測中の経過（mm:ss）。停止中は null */
  elapsedLabel: string | null;
  /** 端末ロール（ペアに振る createdBy） */
  deviceRole: string;
  actions: MiraiRosterActions;
};

/** 予実差を符号つきバッジで表す（0=予定どおり / +=超過 / −=短縮） */
function DiffBadge({ diffMin }: { diffMin: number }) {
  if (diffMin === 0) {
    return (
      <Badge variant="outline" size="xs">
        予定どおり
      </Badge>
    );
  }
  const over = diffMin > 0;
  return (
    <Badge variant={over ? "destructive" : "secondary"} size="xs">
      {over ? "+" : "−"}
      {fmtDurationMin(Math.abs(diffMin))}
    </Badge>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

function BlockDetailCard({
  block,
  running,
  elapsedLabel,
  actions,
  onStop,
}: {
  block: MiraiProgramBlock;
  running: boolean;
  elapsedLabel: string | null;
  actions: MiraiRosterActions;
  onStop: (blockId: string) => void;
}) {
  const blockId = block.id!;
  const diff = blockDiffMin(block);
  const actualStartHHmm =
    block.actualStartMin !== undefined ? hhmmOf(block.actualStartMin) : "";
  const actualEndHHmm =
    block.actualEndMin !== undefined ? hhmmOf(block.actualEndMin) : "";

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle emphasis="prominent">{block.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <Badge variant="outline" size="xs" className="self-start">
            {miraiColumnLabel(block.columnId)}
          </Badge>
          <SummaryRow label="予定" value={block.timeLabel} />
          <SummaryRow
            label="実績"
            value={
              actualStartHHmm && actualEndHHmm
                ? `${actualStartHHmm}–${actualEndHHmm}`
                : running
                  ? `${elapsedLabel ?? "計測中…"}`
                  : "—"
            }
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">差分</span>
            {diff !== null ? (
              <DiffBadge diffMin={diff} />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={block.done ? "secondary" : "outline"}
            aria-pressed={block.done}
            onClick={() => actions.setBlockDone(blockId, !block.done)}
          >
            <Check />
            {block.done ? "完了済み" : "未完了"}
          </Button>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-1.5">
          {running ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStop(blockId)}
            >
              <Square />
              停止して記録
            </Button>
          ) : (
            <Button size="sm" onClick={() => actions.startTimer(blockId)}>
              <Play />
              開始
            </Button>
          )}
          {(actualStartHHmm || actualEndHHmm) && !running ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.clearBlockActual(blockId)}
            >
              <Eraser />
              実績クリア
            </Button>
          ) : null}
        </div>

        <form
          key={`${blockId}:${actualStartHHmm}:${actualEndHHmm}`}
          className="flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            actions.setBlockActual(
              blockId,
              String(data.get("start") ?? ""),
              String(data.get("end") ?? ""),
            );
          }}
        >
          <span className="text-xs text-muted-foreground">実績を手入力</span>
          <div className="flex items-center gap-1.5">
            <Input
              name="start"
              type="time"
              aria-label="実績開始"
              defaultValue={actualStartHHmm}
              className="bg-card"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              name="end"
              type="time"
              aria-label="実績終了"
              defaultValue={actualEndHHmm}
              className="bg-card"
            />
            <Button type="submit" size="sm" variant="outline">
              記録
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function MiraiProgramDetailRail({
  summary,
  viewedDate,
  visibleColumns,
  selectedBlock,
  runningBlock,
  elapsedLabel,
  deviceRole,
  actions,
}: MiraiProgramDetailRailProps) {
  const [donePromptBlockId, setDonePromptBlockId] = useState<string | null>(
    null,
  );
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [unplannedColumn, setUnplannedColumn] = useState<MiraiColumnId>(
    visibleColumns[0] ?? "other",
  );

  const activeBlock = runningBlock ?? selectedBlock;
  const activeRunning = !!runningBlock;

  const handleStop = (blockId: string) => {
    actions.stopTimer();
    setDonePromptBlockId(blockId);
  };

  const columnOptions =
    visibleColumns.length > 0 ? visibleColumns : (["other"] as MiraiColumnId[]);

  return (
    <aside
      aria-label="番組表の詳細"
      className="flex w-72 shrink-0 flex-col gap-3 overflow-auto border-l border-border bg-background p-3"
    >
      <Card size="sm">
        <CardHeader>
          <CardTitle emphasis="prominent">本日の合計</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <SummaryRow label="予定" value={fmtDurationMin(summary.plannedMin)} />
          <SummaryRow
            label="実績"
            value={
              summary.doneCount > 0 ? fmtDurationMin(summary.actualMin) : "—"
            }
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">差分</span>
            {summary.doneCount > 0 ? (
              <DiffBadge diffMin={summary.diffMin} />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {summary.doneCount} / {summary.totalCount} 件 完了
          </span>
        </CardContent>
      </Card>

      {activeBlock?.id ? (
        <BlockDetailCard
          block={activeBlock}
          running={activeRunning}
          elapsedLabel={elapsedLabel}
          actions={actions}
          onStop={handleStop}
        />
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          番組表のブロックを選ぶと、予定・実績・差分とタイマーを操作できます。
        </p>
      )}

      {!runningBlock ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle emphasis="prominent">未計画の計測</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              列を選んでタイマーを開始。停止で実績ブロックを新規作成します。
            </span>
            <div className="flex flex-wrap gap-1">
              {columnOptions.map((columnId) => (
                <Button
                  key={columnId}
                  size="sm"
                  variant={unplannedColumn === columnId ? "secondary" : "outline"}
                  aria-pressed={unplannedColumn === columnId}
                  onClick={() => setUnplannedColumn(columnId)}
                >
                  {miraiColumnLabel(columnId)}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={() =>
                actions.startUnplannedTimer(unplannedColumn, viewedDate)
              }
            >
              <Play />
              計測開始
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card size="sm">
        <CardHeader>
          <CardTitle emphasis="prominent">ペアに振る</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">
            期限付きで別枠に表示。振った側（{deviceRole}）が完了すると消えます。
          </span>
          <Button size="sm" variant="outline" onClick={() => setDelegateOpen(true)}>
            <Handshake />
            ペアに振る
          </Button>
        </CardContent>
      </Card>

      <MiraiDelegateDialog
        open={delegateOpen}
        onOpenChange={setDelegateOpen}
        createdBy={deviceRole}
        actions={actions}
        defaultDeadline={viewedDate}
        defaultDelegatedOn={viewedDate}
      />

      <AlertDialog
        open={donePromptBlockId !== null}
        onOpenChange={(open) => {
          if (!open) setDonePromptBlockId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>完了にしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              実績を記録しました。タスクを完了として扱う場合は「完了にする」を選んでください。未完了のまま残すこともできます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDonePromptBlockId(null)}>
              未完了のまま
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (donePromptBlockId) {
                  actions.setBlockDone(donePromptBlockId, true);
                }
                setDonePromptBlockId(null);
              }}
            >
              完了にする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
