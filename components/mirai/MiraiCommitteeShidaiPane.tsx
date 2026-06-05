"use client";

import { cn } from "@/lib/utils";
import { type MiraiAnnualMonth, type MiraiShidaiRecord } from "@/lib/mirai-schema";
import { type MiraiShidaiMonthGroup } from "@/lib/mirai/committee";
import { MIRAI_SHIDAI_KIND_LABELS } from "@/lib/mirai-labels";
import { miraiPane2ClassName } from "@/lib/mirai/layout";
import { MiraiAnnualMonthStrip } from "@/components/mirai/MiraiAnnualMonthStrip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type MiraiCommitteeShidaiPaneProps = {
  domainName: string;
  annualMonths: MiraiAnnualMonth[];
  selectedMonthId: string;
  onSelectMonth: (monthId: string) => void;
  windowSubtitle: string;
  groups: MiraiShidaiMonthGroup[];
  selectedShidaiId: string | null;
  onSelectShidai: (id: string) => void;
};

export function MiraiCommitteeShidaiPane({
  domainName,
  annualMonths,
  selectedMonthId,
  onSelectMonth,
  windowSubtitle,
  groups,
  selectedShidaiId,
  onSelectShidai,
}: MiraiCommitteeShidaiPaneProps) {
  const hasAny = groups.some((g) => g.records.length > 0);

  return (
    <section
      aria-label="実行委員会・次第一覧"
      className={miraiPane2ClassName}
    >
      <header className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {domainName}
        </h2>
      </header>

      <MiraiAnnualMonthStrip
        months={annualMonths}
        selectedMonthId={selectedMonthId}
        onSelectMonth={onSelectMonth}
        subtitle={windowSubtitle}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-3 py-4">
          {!hasAny ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              選択した月に対応する昨年の次第データはまだありません。
            </p>
          ) : (
            groups.map((group) => (
              <ShidaiMonthGroup
                key={group.yearMonth}
                group={group}
                selectedShidaiId={selectedShidaiId}
                onSelectShidai={onSelectShidai}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

function ShidaiMonthGroup({
  group,
  selectedShidaiId,
  onSelectShidai,
}: {
  group: MiraiShidaiMonthGroup;
  selectedShidaiId: string | null;
  onSelectShidai: (id: string) => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-3 mb-2 flex items-center gap-1.5 bg-background px-5 py-1.5">
        <h3 className="truncate text-xs font-medium text-muted-foreground">
          昨年 · {group.label}
        </h3>
        <Badge variant="secondary" size="xs">
          {group.records.length}
        </Badge>
      </div>
      {group.records.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
          次第なし
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {group.records.map((record) => (
            <ShidaiRow
              key={record.id}
              record={record}
              selected={record.id === selectedShidaiId}
              onSelect={onSelectShidai}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ShidaiRow({
  record,
  selected,
  onSelect,
}: {
  record: MiraiShidaiRecord;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(record.id)}
        className={cn(
          "flex w-full flex-col gap-1 rounded-md px-2.5 py-2.5 text-left transition-colors",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          selected
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-muted",
        )}
      >
        <span className="line-clamp-2 text-sm leading-snug">{record.title}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" size="xs">
            {MIRAI_SHIDAI_KIND_LABELS[record.kind]}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {record.heldOn}
          </span>
        </span>
      </button>
    </li>
  );
}
