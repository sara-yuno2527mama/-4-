"use client";

import { useState } from "react";
import { Copy, Pencil, Printer } from "lucide-react";

import { type MiraiShidaiDraft, type MiraiShidaiRecord } from "@/lib/mirai-schema";
import { formatShidaiDraftPlainText } from "@/lib/mirai/shidai-document";
import { MIRAI_SHIDAI_KIND_LABELS } from "@/lib/mirai-labels";
import { MiraiA4DocumentPreview } from "@/components/mirai/MiraiA4DocumentPreview";
import { MiraiA4PreviewFrame } from "@/components/mirai/MiraiA4PreviewFrame";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  InlineFieldRow,
  InlineTextareaField,
  InlineTextField,
  SectionLabel,
} from "@/components/primitives";
import { miraiPane4ClassName } from "@/lib/mirai/layout";
import "./mirai-a4-print.css";

type DocumentPaneMode = "preview" | "edit" | "homework";

type MiraiShidaiDocumentPaneProps = {
  monthLabel: string;
  draft: MiraiShidaiDraft | null;
  record: MiraiShidaiRecord | null;
  onUpdateDraft: (draft: MiraiShidaiDraft) => void;
};

export function MiraiShidaiDocumentPane({
  monthLabel,
  draft,
  record,
  onUpdateDraft,
}: MiraiShidaiDocumentPaneProps) {
  const [mode, setMode] = useState<DocumentPaneMode>("preview");
  const [copyDone, setCopyDone] = useState(false);

  const homeworkItems = record?.homework ?? draft?.homework ?? [];
  const homeworkTitle = record?.title ?? draft?.title ?? null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(formatShidaiDraftPlainText(draft));
    setCopyDone(true);
    window.setTimeout(() => setCopyDone(false), 2000);
  };

  const updateField = <K extends keyof MiraiShidaiDraft>(
    key: K,
    value: MiraiShidaiDraft[K],
  ) => {
    if (!draft) return;
    onUpdateDraft({ ...draft, [key]: value });
  };

  const agendaText = draft?.agenda.join("\n") ?? "";
  const notesText = draft?.preparationNotes?.join("\n") ?? "";
  const homeworkText = draft?.homework?.join("\n") ?? "";

  return (
    <aside
      aria-label="資料プレビューと編集"
      className={miraiPane4ClassName}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
          資料（A4）
        </h2>
        <ModeButton
          active={mode === "preview"}
          label="プレビュー"
          onClick={() => setMode("preview")}
        />
        <ModeButton
          active={mode === "edit"}
          label="編集"
          onClick={() => setMode("edit")}
        />
        <ModeButton
          active={mode === "homework"}
          label="宿題"
          onClick={() => setMode("homework")}
        />
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-3">
          {!draft ? (
            <Card>
              <CardHeader className="gap-1 p-3">
                <CardTitle className="text-sm">次第案がありません</CardTitle>
                <CardDescription className="text-xs">
                  {monthLabel}の次第案を data/mirai/dashboard.json の
                  shidaiDrafts に追加すると、プレビューと編集が使えます。
                </CardDescription>
              </CardHeader>
            </Card>
          ) : mode === "preview" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={handlePrint}>
                  <Printer aria-hidden="true" />
                  印刷 / PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleCopy()}
                >
                  <Copy aria-hidden="true" />
                  {copyDone ? "コピーしました" : "資料テキストをコピー"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMode("edit")}
                >
                  <Pencil aria-hidden="true" />
                  編集する
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                下の用紙が印刷イメージです。印刷ボタンで A4
                プレビューから PDF 保存もできます。
              </p>
              <MiraiA4PreviewFrame>
                <MiraiA4DocumentPreview draft={draft} monthLabel={monthLabel} />
              </MiraiA4PreviewFrame>
            </>
          ) : mode === "edit" ? (
            <Card>
              <CardHeader className="gap-1 p-3">
                <SectionLabel>次第案の編集</SectionLabel>
                <CardDescription className="text-xs normal-case tracking-normal">
                  保存はフィールドを離れると反映されます。プレビューで印刷イメージを確認できます。
                </CardDescription>
              </CardHeader>
              <div className="flex flex-col gap-3 px-3 pb-3">
                <dl className="flex flex-col gap-2.5 text-sm">
                  <InlineFieldRow label="タイトル">
                    <InlineTextField
                      value={draft.title}
                      onSave={(v) => updateField("title", v)}
                      ariaLabel="タイトル"
                    />
                  </InlineFieldRow>
                  <InlineFieldRow label="開催予定">
                    <InlineTextField
                      value={draft.plannedHeldOn ?? ""}
                      onSave={(v) => updateField("plannedHeldOn", v || undefined)}
                      ariaLabel="開催予定日"
                    />
                  </InlineFieldRow>
                  <InlineFieldRow label="種別">
                    <span className="text-sm">
                      {MIRAI_SHIDAI_KIND_LABELS[draft.kind]}
                    </span>
                  </InlineFieldRow>
                  <InlineFieldRow label="概要">
                    <InlineTextareaField
                      value={draft.summary}
                      onSave={(v) => updateField("summary", v)}
                      ariaLabel="概要"
                    />
                  </InlineFieldRow>
                  <InlineFieldRow label="議題（1行1項目）">
                    <InlineTextareaField
                      value={agendaText}
                      onSave={(v) =>
                        updateField(
                          "agenda",
                          v
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      ariaLabel="議題"
                    />
                  </InlineFieldRow>
                  <InlineFieldRow label="備考（1行1項目）">
                    <InlineTextareaField
                      value={notesText}
                      onSave={(v) =>
                        updateField(
                          "preparationNotes",
                          v
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      ariaLabel="備考"
                    />
                  </InlineFieldRow>
                  <InlineFieldRow label="宿題（1行1項目）">
                    <InlineTextareaField
                      value={homeworkText}
                      onSave={(v) =>
                        updateField(
                          "homework",
                          v
                            .split("\n")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        )
                      }
                      ariaLabel="宿題"
                    />
                  </InlineFieldRow>
                </dl>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setMode("preview")}
                >
                  プレビューで確認
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader className="gap-1 p-3">
                <SectionLabel>
                  {record ? "宿題・フォロー（当時）" : "宿題・フォロー（案）"}
                </SectionLabel>
                {homeworkTitle ? (
                  <CardDescription className="text-xs">
                    {homeworkTitle}
                    {record ? `（${record.heldOn}）` : null}
                  </CardDescription>
                ) : null}
              </CardHeader>
              {homeworkItems.length === 0 ? (
                <p className="px-3 pb-3 text-xs text-muted-foreground">
                  項目がありません。編集タブで宿題を追加できます。
                </p>
              ) : (
                <ul className="flex flex-col gap-2 px-3 pb-3 text-sm">
                  {homeworkItems.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-border bg-muted/30 px-2.5 py-2"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? "default" : "ghost"}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </Button>
  );
}
