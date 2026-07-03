"use client";

/**
 * 当月メモ（docs/mirai-crosscut-schedule-design.md §5.3）。
 * すぐ入力で追加した締め日・当番・お弁当・休み・委員会日程の一覧確認と削除。
 * Pane1（サイドバー）内。編集の主導線は「すぐ入力」側に置く。
 */

import { X } from "lucide-react";

import { type MiraiRosterState } from "@/lib/mirai/roster-state";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import {
  MIRAI_COMMITTEE_MEETING_KIND_LABELS,
  MIRAI_HOLIDAY_KIND_LABELS,
} from "@/lib/mirai-labels";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

type MiraiMonthMemoSectionProps = {
  roster: MiraiRosterState;
  businessMonthId: string;
  closeDate: string | null;
  asOfDate: string;
  actions: MiraiRosterActions;
};

function mdLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${Number(m)}/${Number(d)}`;
}

function RemovableChip({
  label,
  removeLabel,
  onRemove,
}: {
  label: string;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card py-0 pr-0.5 pl-2 text-xs text-foreground">
      {label}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <X />
      </Button>
    </span>
  );
}

function MemoRow({
  label,
  isEmpty,
  children,
}: {
  label: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-sidebar-foreground/70">{label}</span>
      {isEmpty ? (
        <span className="text-xs text-muted-foreground">なし</span>
      ) : (
        <div className="flex flex-wrap gap-1">{children}</div>
      )}
    </div>
  );
}

export function MiraiMonthMemoSection({
  roster,
  businessMonthId,
  closeDate,
  asOfDate,
  actions,
}: MiraiMonthMemoSectionProps) {
  const r = roster.rosters.find((x) => x.yearMonth === businessMonthId);
  const lunch = r?.lunchDutyDates ?? [];
  const mail = r?.mailDutyDates ?? [];
  const regular = new Set(r?.mailWithRegularDates ?? []);
  const bento = r?.bentoDates ?? [];
  const holidays = r?.holidays ?? [];
  const upcomingMeetings = roster.committeeMeetings.filter(
    (m) => m.heldOn >= asOfDate,
  );

  return (
    <SidebarGroup className="px-2">
      <SidebarGroupLabel className="px-0 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
        当月メモ
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-3 pt-1">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sidebar-foreground/70">締め</span>
          <span className="text-xs text-foreground">
            {closeDate ? mdLabel(closeDate) : "未入力"}
          </span>
        </div>

        <MemoRow label="昼当番" isEmpty={lunch.length === 0}>
          {lunch.map((d) => (
            <RemovableChip
              key={d.date}
              label={mdLabel(d.date)}
              removeLabel={`昼当番 ${mdLabel(d.date)} を削除`}
              onRemove={() =>
                actions.removeLunchDuty(businessMonthId, d.date)
              }
            />
          ))}
        </MemoRow>

        <MemoRow label="郵便当番" isEmpty={mail.length === 0}>
          {mail.map((d) => (
            <RemovableChip
              key={d.date}
              label={`${mdLabel(d.date)}${regular.has(d.date) ? " +定期" : ""}`}
              removeLabel={`郵便当番 ${mdLabel(d.date)} を削除`}
              onRemove={() => actions.removeMailDuty(businessMonthId, d.date)}
            />
          ))}
        </MemoRow>

        <MemoRow label="お弁当" isEmpty={bento.length === 0}>
          {bento.map((d) => (
            <RemovableChip
              key={d}
              label={mdLabel(d)}
              removeLabel={`お弁当 ${mdLabel(d)} を削除`}
              onRemove={() => actions.removeBento(businessMonthId, d)}
            />
          ))}
        </MemoRow>

        <MemoRow label="休み" isEmpty={holidays.length === 0}>
          {holidays.map((h, i) => (
            <RemovableChip
              key={`${h.start}-${h.kind}-${i}`}
              label={`${MIRAI_HOLIDAY_KIND_LABELS[h.kind]} ${mdLabel(h.start)}`}
              removeLabel={`休み ${mdLabel(h.start)} を削除`}
              onRemove={() => actions.removeHoliday(businessMonthId, i)}
            />
          ))}
        </MemoRow>

        <MemoRow label="実行委員会・事前打合せ" isEmpty={upcomingMeetings.length === 0}>
          {upcomingMeetings.map((m) => (
            <RemovableChip
              key={m.id}
              label={`${MIRAI_COMMITTEE_MEETING_KIND_LABELS[m.kind]} ${mdLabel(m.heldOn)}`}
              removeLabel={`${MIRAI_COMMITTEE_MEETING_KIND_LABELS[m.kind]} ${mdLabel(m.heldOn)} を削除`}
              onRemove={() => actions.removeCommitteeMeeting(m.id)}
            />
          ))}
        </MemoRow>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
