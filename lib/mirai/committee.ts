import { addMonths, format, subMonths, subYears } from "date-fns";

import { type MiraiShidaiRecord } from "@/lib/mirai-schema";

function parseYearMonthId(yearMonth: string): Date {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** 選択月の「昨年」およびその前後1か月（YYYY-MM の3件） */
export function priorYearMonthWindow(selectedMonthId: string): string[] {
  const anchor = subYears(parseYearMonthId(selectedMonthId), 1);
  return [
    format(subMonths(anchor, 1), "yyyy-MM"),
    format(anchor, "yyyy-MM"),
    format(addMonths(anchor, 1), "yyyy-MM"),
  ];
}

export function yearMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${y}年${m}月`;
}

export function annualMonthIdFromDate(isoDate: string): string {
  const [y, m] = isoDate.split("-");
  return `${y}-${m}`;
}

export type MiraiShidaiMonthGroup = {
  yearMonth: string;
  label: string;
  records: MiraiShidaiRecord[];
};

export function shidaiGroupsForWindow(
  records: MiraiShidaiRecord[],
  windowMonths: string[],
): MiraiShidaiMonthGroup[] {
  return windowMonths.map((yearMonth) => ({
    yearMonth,
    label: yearMonthLabel(yearMonth),
    records: records
      .filter((r) => r.yearMonth === yearMonth)
      .sort((a, b) => a.heldOn.localeCompare(b.heldOn)),
  }));
}

/** 選択月と同じ年で、選択月より前に開催した次第（今年・前回まで） */
export function currentYearPriorShidai(
  records: MiraiShidaiRecord[],
  selectedMonthId: string,
): MiraiShidaiRecord[] {
  const [year, month] = selectedMonthId.split("-").map(Number);
  return records
    .filter((r) => {
      const [ry, rm] = r.yearMonth.split("-").map(Number);
      return ry === year && rm < month;
    })
    .sort((a, b) => a.heldOn.localeCompare(b.heldOn));
}

export function priorYearShidaiFlat(
  records: MiraiShidaiRecord[],
  windowMonths: string[],
): MiraiShidaiRecord[] {
  return windowMonths.flatMap((ym) =>
    records
      .filter((r) => r.yearMonth === ym)
      .sort((a, b) => a.heldOn.localeCompare(b.heldOn)),
  );
}
