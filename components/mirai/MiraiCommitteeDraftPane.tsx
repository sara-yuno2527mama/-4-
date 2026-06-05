"use client";

import { cn } from "@/lib/utils";
import {
  type MiraiShidaiDraft,
  type MiraiShidaiRecord,
} from "@/lib/mirai-schema";
import { type MiraiShidaiMonthGroup } from "@/lib/mirai/committee";
import { MIRAI_SHIDAI_KIND_LABELS } from "@/lib/mirai-labels";
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

type MiraiCommitteeDraftPaneProps = {
  selectedMonthLabel: string;
  priorYearGroups: MiraiShidaiMonthGroup[];
  currentYearPrior: MiraiShidaiRecord[];
  draft: MiraiShidaiDraft | null;
  focusedRecord: MiraiShidaiRecord | null;
  onFocusRecord: (id: string) => void;
};

export function MiraiCommitteeDraftPane({
  selectedMonthLabel,
  priorYearGroups,
  currentYearPrior,
  draft,
  focusedRecord,
  onFocusRecord,
}: MiraiCommitteeDraftPaneProps) {
  return (
    <section aria-label="今月の次第案" className={miraiPane3ClassName}>
      <ScrollArea className="h-full">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <ReferenceSection
            title="昨年（前後1か月を含む）"
            groups={priorYearGroups}
            focusedRecordId={focusedRecord?.id ?? null}
            onFocusRecord={onFocusRecord}
            emptyMessage="昨年の同時期の次第はまだ登録されていません。"
          />

          <CurrentYearPriorSection
            records={currentYearPrior}
            focusedRecordId={focusedRecord?.id ?? null}
            onFocusRecord={onFocusRecord}
          />

          <Separator />

          <DraftSection
            selectedMonthLabel={selectedMonthLabel}
            draft={draft}
          />
        </div>
      </ScrollArea>
    </section>
  );
}

function ReferenceSection({
  title,
  groups,
  focusedRecordId,
  onFocusRecord,
  emptyMessage,
}: {
  title: string;
  groups: MiraiShidaiMonthGroup[];
  focusedRecordId: string | null;
  onFocusRecord: (id: string) => void;
  emptyMessage: string;
}) {
  const hasAny = groups.some((g) => g.records.length > 0);

  return (
    <Card>
      <CardHeader className="gap-1 pb-2">
        <SectionLabel>{title}</SectionLabel>
        <CardDescription className="text-xs normal-case tracking-normal">
          Pane2 で選んだ次第の詳細は、下のカードをクリックすると展開します。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {!hasAny ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          groups.map((group) => (
            <div key={group.yearMonth} className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <ul className="flex flex-col gap-1">
                {group.records.map((record) => (
                  <ShidaiReferenceItem
                    key={record.id}
                    record={record}
                    expanded={record.id === focusedRecordId}
                    onSelect={() => onFocusRecord(record.id)}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CurrentYearPriorSection({
  records,
  focusedRecordId,
  onFocusRecord,
}: {
  records: MiraiShidaiRecord[];
  focusedRecordId: string | null;
  onFocusRecord: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-1 pb-2">
        <SectionLabel>今年・前回までの次第</SectionLabel>
        <CardDescription className="text-xs normal-case tracking-normal">
          選択した月より前に開催した本分の記録です。
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            今年・前月までの次第はまだ登録されていません。
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {records.map((record) => (
              <ShidaiReferenceItem
                key={record.id}
                record={record}
                expanded={record.id === focusedRecordId}
                onSelect={() => onFocusRecord(record.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ShidaiReferenceItem({
  record,
  expanded,
  onSelect,
}: {
  record: MiraiShidaiRecord;
  expanded: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col gap-2 rounded-md border border-border px-3 py-2.5 text-left transition-colors",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          expanded ? "bg-accent" : "hover:bg-muted",
        )}
      >
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" size="xs">
            {MIRAI_SHIDAI_KIND_LABELS[record.kind]}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {record.heldOn}
          </span>
        </span>
        <span className="text-sm font-medium">{record.title}</span>
        {expanded ? (
          <span className="flex flex-col gap-2 text-xs text-muted-foreground">
            <span>{record.summary}</span>
            <span className="font-medium text-foreground">議題</span>
            <ol className="flex list-decimal flex-col gap-1 pl-4">
              {record.agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </span>
        ) : (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {record.summary}
          </span>
        )}
      </button>
    </li>
  );
}

function DraftSection({
  selectedMonthLabel,
  draft,
}: {
  selectedMonthLabel: string;
  draft: MiraiShidaiDraft | null;
}) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <SectionLabel>今月の次第案</SectionLabel>
        <CardDescription className="text-xs normal-case tracking-normal">
          {selectedMonthLabel}分 · 上記の昨年・今年の次第を踏まえた案です。
        </CardDescription>
        {!draft ? (
          <CardTitle className="text-base">次第案は未作成です</CardTitle>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                {MIRAI_SHIDAI_KIND_LABELS[draft.kind]}
              </Badge>
              {draft.plannedHeldOn ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  開催予定 {draft.plannedHeldOn}
                </span>
              ) : null}
            </div>
            <CardTitle className="text-base">{draft.title}</CardTitle>
            <CardDescription>{draft.summary}</CardDescription>
          </>
        )}
      </CardHeader>
      {draft ? (
        <CardContent className="flex flex-col gap-4 pt-0">
          <div>
            <p className="mb-2 text-sm font-medium">議題（案）</p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
              {draft.agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          {draft.preparationNotes && draft.preparationNotes.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">昨年・前回を踏まえたメモ</p>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {draft.preparationNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
