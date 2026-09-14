import type { KitchenState, RhythmSlot, Weekday } from "./types";
import { WEEKDAY_LABELS } from "./types";

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function tokyoParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
  };
}

export function tokyoDateKey(date = new Date()): string {
  const parts = tokyoParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysToKey(dateKey: string, days: number): string {
  return toDateKey(addDays(dateFromKey(dateKey), days));
}

export function formatJaDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_LABELS[date.getDay() as Weekday];
  return `${m}/${d}（${weekday}）`;
}

export type DayPlan = {
  dateKey: string;
  title: string;
  prepNote: string;
  isOff: boolean;
  source: "exception" | "rhythm" | "empty";
};

export function resolveDayPlan(state: KitchenState, date: Date): DayPlan {
  const dateKey = toDateKey(date);
  const exception = state.exceptions.find((item) => item.date === dateKey);
  if (exception) {
    return {
      dateKey,
      title: exception.isOff ? "休み" : exception.title,
      prepNote: exception.isOff ? "" : exception.prepNote,
      isOff: exception.isOff,
      source: "exception",
    };
  }

  const weekday = date.getDay() as Weekday;
  const slot = state.rhythm.find((item) => item.weekday === weekday);
  if (slot?.title.trim()) {
    return {
      dateKey,
      title: slot.title,
      prepNote: slot.prepNote,
      isOff: false,
      source: "rhythm",
    };
  }

  return {
    dateKey,
    title: "定番なし",
    prepNote: "",
    isOff: false,
    source: "empty",
  };
}

export function upsertRhythmSlot(
  rhythm: RhythmSlot[],
  slot: RhythmSlot,
): RhythmSlot[] {
  const others = rhythm.filter((item) => item.weekday !== slot.weekday);
  if (!slot.title.trim()) return others;
  return [...others, slot].sort((a, b) => a.weekday - b.weekday);
}
