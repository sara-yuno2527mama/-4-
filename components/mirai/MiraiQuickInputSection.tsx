"use client";

/**
 * すぐ入力（docs/mirai-crosscut-schedule-design.md §5.2 / §16.1）。
 * Pane1（サイドバー）内で「判明次第 1 件追加」する主モード。
 * 日付は InlineDateField を再利用。列挙値の選択は shadcn Select。
 */

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  type MiraiAnnualMonth,
  type MiraiCommitteeMeetingKind,
  type MiraiHolidayKind,
} from "@/lib/mirai-schema";
import { type MiraiRosterState } from "@/lib/mirai/roster-state";
import { type MiraiRosterActions } from "@/hooks/use-mirai-roster";
import { businessMonthLabel } from "@/lib/mirai/business-month";
import {
  MIRAI_COMMITTEE_MEETING_KIND_LABELS,
  MIRAI_HOLIDAY_KIND_LABELS,
} from "@/lib/mirai-labels";
import { InlineDateField } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

type MiraiQuickInputSectionProps = {
  roster: MiraiRosterState;
  actions: MiraiRosterActions;
  annualMonths: MiraiAnnualMonth[];
  currentBusinessMonthId: string;
};

/** ラベル + 日付 + 追加ボタンの 1 行 */
function DateAddRow({
  label,
  ariaLabel,
  onAdd,
}: {
  label: string;
  ariaLabel: string;
  onAdd: (date: string) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-sidebar-foreground/70">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <InlineDateField value={draft} onSave={setDraft} ariaLabel={ariaLabel} />
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={!draft}
          onClick={() => {
            onAdd(draft);
            setDraft("");
          }}
        >
          <Plus />
          追加
        </Button>
      </div>
    </div>
  );
}

export function MiraiQuickInputSection({
  roster,
  actions,
  annualMonths,
  currentBusinessMonthId,
}: MiraiQuickInputSectionProps) {
  const [closeMonthId, setCloseMonthId] = useState(currentBusinessMonthId);
  const [holidayKind, setHolidayKind] = useState<MiraiHolidayKind>("full");
  const [holidayDraft, setHolidayDraft] = useState("");
  const [meetingKind, setMeetingKind] =
    useState<MiraiCommitteeMeetingKind>("committee");
  const [meetingDraft, setMeetingDraft] = useState("");

  const closeDate =
    roster.businessMonths.find((b) => b.id === closeMonthId)?.billingCloseDate ??
    "";

  return (
    <SidebarGroup className="px-2">
      <SidebarGroupLabel className="px-0 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
        すぐ入力
      </SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-3 pt-1">
        {/* 請求締め日（§4.2） */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sidebar-foreground/70">請求締め日</span>
          <Select
            value={closeMonthId}
            onValueChange={(v) => v && setCloseMonthId(v)}
          >
            <SelectTrigger
              aria-label="締め日を入力する業務月"
              className="h-8 w-full bg-card hover:bg-accent/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {annualMonths.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {businessMonthLabel(m.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InlineDateField
            value={closeDate}
            onSave={(d) => actions.setBillingCloseDate(closeMonthId, d)}
            ariaLabel="請求締め日"
          />
        </div>

        <DateAddRow
          label="昼当番"
          ariaLabel="昼当番の日付"
          onAdd={actions.addLunchDuty}
        />
        <DateAddRow
          label="郵便当番"
          ariaLabel="郵便当番の日付"
          onAdd={actions.addMailDuty}
        />
        <DateAddRow
          label="郵便 + 定期便"
          ariaLabel="郵便＋定期便の日付"
          onAdd={actions.addMailWithRegular}
        />
        <DateAddRow
          label="お弁当"
          ariaLabel="お弁当の日付"
          onAdd={actions.addBento}
        />

        {/* 休み（種別 + 日付） */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sidebar-foreground/70">休み</span>
          <Select
            value={holidayKind}
            onValueChange={(v) => v && setHolidayKind(v as MiraiHolidayKind)}
          >
            <SelectTrigger
              aria-label="休みの種別"
              className="h-8 w-full bg-card hover:bg-accent/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {(
                Object.keys(MIRAI_HOLIDAY_KIND_LABELS) as MiraiHolidayKind[]
              ).map((k) => (
                <SelectItem key={k} value={k}>
                  {MIRAI_HOLIDAY_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <InlineDateField
                value={holidayDraft}
                onSave={setHolidayDraft}
                ariaLabel="休みの日付"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={!holidayDraft}
              onClick={() => {
                actions.addHoliday(holidayDraft, holidayKind);
                setHolidayDraft("");
              }}
            >
              <Plus />
              追加
            </Button>
          </div>
        </div>

        {/* 実行委員会・事前打合せ（§16.1） */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sidebar-foreground/70">
            実行委員会・事前打合せ
          </span>
          <Select
            value={meetingKind}
            onValueChange={(v) =>
              v && setMeetingKind(v as MiraiCommitteeMeetingKind)
            }
          >
            <SelectTrigger
              aria-label="実行委員会の種別"
              className="h-8 w-full bg-card hover:bg-accent/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {(
                Object.keys(
                  MIRAI_COMMITTEE_MEETING_KIND_LABELS,
                ) as MiraiCommitteeMeetingKind[]
              ).map((k) => (
                <SelectItem key={k} value={k}>
                  {MIRAI_COMMITTEE_MEETING_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <InlineDateField
                value={meetingDraft}
                onSave={setMeetingDraft}
                ariaLabel="実行委員会・事前打合せの日付"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={!meetingDraft}
              onClick={() => {
                actions.addCommitteeMeeting(meetingKind, meetingDraft);
                setMeetingDraft("");
              }}
            >
              <Plus />
              追加
            </Button>
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
