"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { type MiraiChecklistItem } from "@/lib/mirai-schema";
import { miraiPane4ClassName } from "@/lib/mirai/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type MiraiTaskChecklistPaneProps = {
  taskTitle: string | null;
  items: MiraiChecklistItem[];
};

export function MiraiTaskChecklistPane({
  taskTitle,
  items,
}: MiraiTaskChecklistPaneProps) {
  const [doneById, setDoneById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.done])),
  );

  const toggle = (id: string) => {
    setDoneById((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const doneCount = items.filter((item) => doneById[item.id]).length;

  return (
    <aside
      aria-label="進捗チェック"
      className={miraiPane4ClassName}
    >
      <header className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
          進捗チェック
        </h2>
        {items.length > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {doneCount}/{items.length}
          </span>
        ) : null}
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-3">
          {!taskTitle ? (
            <Card>
              <CardHeader className="gap-1 p-3">
                <CardTitle className="text-sm">タスク未選択</CardTitle>
                <CardDescription className="text-xs">
                  チェックリスト付きのタスクを選ぶと、ここで進捗を確認できます。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : items.length === 0 ? (
            <Card>
              <CardHeader className="gap-1 p-3">
                <CardTitle className="text-sm">{taskTitle}</CardTitle>
                <CardDescription className="text-xs">
                  このタスクにはチェックリストがありません。会議宿題や協賛フローなど、細分化した項目は JSON に追加できます。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader className="gap-1 p-3">
                <CardTitle className="text-sm">{taskTitle}</CardTitle>
                <CardDescription className="text-xs">
                  完了はこの画面だけの状態です（保存APIは未接続）。
                </CardDescription>
              </CardHeader>
              <ul className="flex flex-col gap-1 px-3 pb-3">
                {items.map((item) => {
                  const done = doneById[item.id] ?? item.done;
                  return (
                    <li key={item.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "h-auto w-full justify-start gap-2 px-2 py-2 text-left font-normal",
                          done && "text-muted-foreground",
                        )}
                      >
                        {done ? (
                          <Check
                            aria-hidden="true"
                            className="size-4 shrink-0 text-primary"
                          />
                        ) : (
                          <Circle
                            aria-hidden="true"
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            done && "line-through decoration-muted-foreground",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="sr-only">
                          {done ? "完了" : "未完了"}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
