"use client";

import { addDaysToKey, formatJaDate } from "@/lib/dates";

export function DateStepper({
  dateKey,
  todayKey,
  onChange,
}: {
  dateKey: string;
  todayKey: string;
  onChange: (next: string) => void;
}) {
  const isToday = dateKey === todayKey;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="前の日"
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-[#1B6B32] hover:bg-white"
        onClick={() => onChange(addDaysToKey(dateKey, -1))}
      >
        ‹
      </button>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-4xl font-bold tracking-tight text-neutral-900">
          {formatJaDate(dateKey)}
        </p>
        {!isToday ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]"
            onClick={() => onChange(todayKey)}
          >
            今日に戻る
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="次の日"
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-[#1B6B32] hover:bg-white"
        onClick={() => onChange(addDaysToKey(dateKey, 1))}
      >
        ›
      </button>
    </div>
  );
}
