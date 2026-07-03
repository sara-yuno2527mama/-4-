/**
 * 横断スナップショット（docs/mirai-crosscut-schedule-design.md §10）。
 *
 * 基準日 asOfDate で全領域を横断し、以下を 1 か所に集約する純粋関数:
 *   - 今週（カレンダー週・月〜日）
 *   - 業務月（請求締め日ベース）
 *   - 各領域の現在フェーズ・期限が近い件数・次マイルストーン
 *   - ルールアラート（締め日未入力・お弁当3日前・定期便16:15・委員会接近）
 *
 * 副作用なし。UI（MiraiCrossCutBand）はこの結果を描画するだけ。
 */

import { differenceInCalendarDays, endOfWeek, format, startOfWeek } from "date-fns";

import { type MiraiDashboard } from "@/lib/mirai-schema";
import { type MiraiRosterState } from "@/lib/mirai/roster-state";
import { MIRAI_COMMITTEE_MEETING_KIND_LABELS } from "@/lib/mirai-labels";
import {
  businessMonthPeriod,
  currentBusinessMonthId,
  type MiraiBusinessMonthPeriod,
} from "@/lib/mirai/business-month";
import { currentSchedulePhase, isOpenTask } from "@/lib/mirai/computed";
import { formatISODate, parseISODate } from "@/lib/computed/profile";

/** 「期限が近い」と見なす日数（今週相当） */
const NEAR_DUE_DAYS = 7;
/** お弁当アラートの先出し日数（§6.3） */
const BENTO_LEAD_DAYS = 3;
/** 委員会・事前打合せの接近アラート日数 */
const MEETING_SOON_DAYS = 7;

export type CrossCutAlertTone = "info" | "warning" | "danger";

export type CrossCutAlert = {
  id: string;
  tone: CrossCutAlertTone;
  message: string;
};

export type CrossCutMilestone = {
  label: string;
  /** YYYY-MM-DD */
  date: string;
  /** 基準日からの日数（負=超過） */
  daysUntil: number;
};

export type CrossCutDomainStatus = {
  domainId: string;
  domainName: string;
  currentPhaseLabel: string | null;
  /** 期限が近い / 超過している未完了タスク件数 */
  nearDueCount: number;
  nextMilestone: CrossCutMilestone | null;
};

export type CrossCutSnapshot = {
  asOfDate: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  businessMonth: MiraiBusinessMonthPeriod;
  domains: CrossCutDomainStatus[];
  alerts: CrossCutAlert[];
  /** 本日が定期便日（16:15 退勤・残業。§7.2） */
  regularMailToday: boolean;
};

function mdLabel(isoDate: string): string {
  const d = parseISODate(isoDate);
  return d ? format(d, "M/d") : isoDate;
}

function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (!a || !b) return 0;
  return differenceInCalendarDays(b, a);
}

function domainStatus(
  dashboard: MiraiDashboard,
  roster: MiraiRosterState,
  asOfDate: string,
  domain: MiraiDashboard["domains"][number],
  businessMonth: MiraiBusinessMonthPeriod,
): CrossCutDomainStatus {
  const trackIds = new Set(domain.tracks.map((t) => t.id));
  const openTasks = dashboard.tasks.filter(
    (t) => trackIds.has(t.trackId) && isOpenTask(t),
  );

  const nearDueCount = openTasks.filter(
    (t) => daysBetween(asOfDate, t.dueDate) <= NEAR_DUE_DAYS,
  ).length;

  const candidates: CrossCutMilestone[] = [];

  // 未完了タスクの直近期限
  for (const t of openTasks) {
    const daysUntil = daysBetween(asOfDate, t.dueDate);
    if (daysUntil >= 0) {
      candidates.push({ label: t.title, date: t.dueDate, daysUntil });
    }
  }

  // 総務：業務月の締め日
  if (domain.id === "soumu" && businessMonth.closeDate) {
    const daysUntil = daysBetween(asOfDate, businessMonth.closeDate);
    if (daysUntil >= 0) {
      candidates.push({
        label: `${businessMonth.label}締め`,
        date: businessMonth.closeDate,
        daysUntil,
      });
    }
  }

  // 実行委員会：確定した会議日程（§16.1）
  if (domain.id === "mirai-committee") {
    for (const m of roster.committeeMeetings) {
      const daysUntil = daysBetween(asOfDate, m.heldOn);
      if (daysUntil >= 0) {
        candidates.push({
          label: MIRAI_COMMITTEE_MEETING_KIND_LABELS[m.kind],
          date: m.heldOn,
          daysUntil,
        });
      }
    }
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date));

  return {
    domainId: domain.id,
    domainName: domain.name,
    currentPhaseLabel:
      currentSchedulePhase(domain.schedulePhases, asOfDate)?.label ?? null,
    nearDueCount,
    nextMilestone: candidates[0] ?? null,
  };
}

function buildAlerts(
  roster: MiraiRosterState,
  asOfDate: string,
  businessMonth: MiraiBusinessMonthPeriod,
): { alerts: CrossCutAlert[]; regularMailToday: boolean } {
  const alerts: CrossCutAlert[] = [];

  // 1. 締め日未入力（§4.2 入力促し）
  if (businessMonth.needsCloseDate) {
    alerts.push({
      id: "close-missing",
      tone: "warning",
      message: `${businessMonth.label}の請求締め日が未入力です`,
    });
  }

  const roomOfMonth = (ym: string) =>
    roster.rosters.find((r) => r.yearMonth === ym);
  const asOfMonth = roomOfMonth(asOfDate.slice(0, 7));

  // 2. 本日が定期便日 → 16:15 退勤（§7.2）
  const regularMailToday =
    asOfMonth?.mailWithRegularDates.includes(asOfDate) ?? false;
  if (regularMailToday) {
    alerts.push({
      id: "regular-mail-today",
      tone: "danger",
      message: "本日は定期便のため16:15退勤（残業）",
    });
  }

  // 3. お弁当 3 日前（§6.3）
  const bentoDates = roster.rosters.flatMap((r) => r.bentoDates);
  const nearestBento = bentoDates
    .map((d) => ({ date: d, daysUntil: daysBetween(asOfDate, d) }))
    .filter((b) => b.daysUntil >= 0 && b.daysUntil <= BENTO_LEAD_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];
  if (nearestBento) {
    alerts.push({
      id: `bento-${nearestBento.date}`,
      tone: "info",
      message:
        nearestBento.daysUntil === 0
          ? "本日はお弁当の日"
          : `お弁当まであと${nearestBento.daysUntil}日（買い出し）`,
    });
  }

  // 4. 実行委員会・事前打合せの接近（§16.1）
  for (const m of roster.committeeMeetings) {
    const daysUntil = daysBetween(asOfDate, m.heldOn);
    if (daysUntil >= 0 && daysUntil <= MEETING_SOON_DAYS) {
      alerts.push({
        id: `meeting-${m.id}`,
        tone: "info",
        message: `${MIRAI_COMMITTEE_MEETING_KIND_LABELS[m.kind]} ${mdLabel(m.heldOn)}${
          daysUntil === 0 ? "（本日）" : `（あと${daysUntil}日）`
        }`,
      });
    }
  }

  return { alerts, regularMailToday };
}

export function crossCutSnapshot(
  dashboard: MiraiDashboard,
  asOfDate: string,
  roster: MiraiRosterState,
): CrossCutSnapshot {
  const asOf = parseISODate(asOfDate) ?? new Date();
  const weekStartDate = startOfWeek(asOf, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(asOf, { weekStartsOn: 1 });
  const weekStart = formatISODate(weekStartDate);
  const weekEnd = formatISODate(weekEndDate);

  const candidateMonthIds =
    dashboard.annualMonths?.map((m) => m.id) ?? [asOfDate.slice(0, 7)];
  const businessMonthId = currentBusinessMonthId(
    roster.businessMonths,
    candidateMonthIds,
    asOfDate,
  );
  const businessMonth = businessMonthPeriod(
    roster.businessMonths,
    businessMonthId,
  );

  const domains = dashboard.domains.map((domain) =>
    domainStatus(dashboard, roster, asOfDate, domain, businessMonth),
  );

  const { alerts, regularMailToday } = buildAlerts(
    roster,
    asOfDate,
    businessMonth,
  );

  return {
    asOfDate,
    weekStart,
    weekEnd,
    weekLabel: `${format(weekStartDate, "M/d")}–${format(weekEndDate, "M/d")}`,
    businessMonth,
    domains,
    alerts,
    regularMailToday,
  };
}
