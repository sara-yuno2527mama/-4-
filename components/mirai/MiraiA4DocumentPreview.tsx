"use client";

import { type MiraiShidaiDraft } from "@/lib/mirai-schema";
import { MIRAI_SHIDAI_KIND_LABELS } from "@/lib/mirai-labels";

type MiraiA4DocumentPreviewProps = {
  draft: MiraiShidaiDraft;
  monthLabel: string;
};

export function MiraiA4DocumentPreview({
  draft,
  monthLabel,
}: MiraiA4DocumentPreviewProps) {
  return (
    <article
      id="mirai-a4-print-root"
      className="box-border bg-card text-foreground shadow-md"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
      }}
    >
      <header className="flex flex-col gap-1 border-b border-border pb-4">
        <p className="text-xs text-muted-foreground">
          みらいプロジェクト 実行委員会
        </p>
        <p className="text-sm font-semibold">次第（案）· {monthLabel}</p>
      </header>

      <div className="flex flex-col gap-4 pt-6 text-sm leading-relaxed">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">{draft.title}</h1>
          <dl className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {draft.plannedHeldOn ? (
              <div className="flex gap-2">
                <dt>開催予定</dt>
                <dd className="tabular-nums">{draft.plannedHeldOn}</dd>
              </div>
            ) : null}
            <div className="flex gap-2">
              <dt>種別</dt>
              <dd>{MIRAI_SHIDAI_KIND_LABELS[draft.kind]}</dd>
            </div>
          </dl>
        </div>

        <p>{draft.summary}</p>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">議題</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            {draft.agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        {draft.preparationNotes && draft.preparationNotes.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">備考</h2>
            <ul className="flex flex-col gap-1.5">
              {draft.preparationNotes.map((note) => (
                <li key={note} className="pl-0">
                  {note}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {draft.homework && draft.homework.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">宿題・フォロー（事務局）</h2>
            <ul className="flex flex-col gap-1.5">
              {draft.homework.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
