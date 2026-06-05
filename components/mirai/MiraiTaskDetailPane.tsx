"use client";

import { type MiraiTask, type MiraiTaskStatus } from "@/lib/mirai-schema";
import { MIRAI_TASK_STATUS_LABELS } from "@/lib/mirai-labels";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/primitives";
import { miraiPane3ClassName } from "@/lib/mirai/layout";

type MiraiTaskDetailPaneProps = {
  task: MiraiTask | null;
  domainName: string;
  trackName: string;
};

const statusBadgeVariant: Record<
  MiraiTaskStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  todo: "secondary",
  doing: "default",
  done: "outline",
  blocked: "destructive",
};

export function MiraiTaskDetailPane({
  task,
  domainName,
  trackName,
}: MiraiTaskDetailPaneProps) {
  return (
    <section aria-label="タスク詳細" className={miraiPane3ClassName}>
      <ScrollArea className="h-full">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          {!task ? (
            <Card>
              <CardHeader className="gap-1">
                <CardTitle className="text-base">タスクを選択</CardTitle>
                <CardDescription>
                  左の一覧から、参観デー・実行委員会・総務のタスクを選ぶと詳細が表示されます。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant[task.status]}>
                      {MIRAI_TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    <Badge variant="outline">{task.owner}</Badge>
                  </div>
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>{task.summary}</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="gap-1 pb-2">
                  <SectionLabel>マイルストン</SectionLabel>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 pt-0 text-sm">
                  <p>
                    <span className="text-muted-foreground">領域：</span>
                    {domainName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">トラック：</span>
                    {trackName}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1 pb-2">
                  <SectionLabel>期限・担当</SectionLabel>
                </CardHeader>
                <CardContent className="pt-0">
                  <dl className="flex flex-col gap-2.5 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">期限</dt>
                      <dd className="tabular-nums">{task.dueDate}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">事務局担当</dt>
                      <dd>{task.owner}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <RoleSplitCard />
            </>
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

function RoleSplitCard() {
  return (
    <Card>
      <CardHeader className="gap-1 pb-2">
        <SectionLabel>事務局の役割分担</SectionLabel>
        <CardDescription>
          今回の画面スコープ：マイルストン達成と、主／ペアの切り分けの可視化
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0 text-sm">
        <div className="flex flex-col gap-1">
          <p className="font-medium">事務局（主）</p>
          <p className="text-muted-foreground">
            クリティカルパス — 参加・協賛・発表会・報告、実行委員会の資料・議案
          </p>
        </div>
        <Separator />
        <div className="flex flex-col gap-1">
          <p className="font-medium">事務局（ペア）</p>
          <p className="text-muted-foreground">
            会議の日程調整・案内・出欠、経理実行（承認は事務局長）、Excel・総務系
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
