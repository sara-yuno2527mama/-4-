"use client";

import { BoxedChoiceRow } from "@/components/ui";
import {
  BREAD_KIND_OPTIONS,
  SATURDAY_MORNING_OPTIONS,
  SUNDAY_MORNING_OPTIONS,
  WEEKDAY_MORNING_OPTIONS,
} from "@/lib/morning-staple";
import type { MorningStapleSettings } from "@/lib/types";

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; name: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <BoxedChoiceRow
      items={options.map((option) => ({ id: option.id, label: option.name }))}
      value={value}
      onChange={onChange}
    />
  );
}

export function MorningStapleSettingsCard({
  value,
  onChange,
}: {
  value: MorningStapleSettings;
  onChange: (next: MorningStapleSettings) => void;
}) {
  return (
    <>
      <h2 className="text-base font-bold">朝の定番</h2>
      <p className="mt-1 mb-4 text-xs leading-relaxed text-neutral-500">
        人が直した日は上書きしません。決めていない平日は今どおり提案します。
      </p>

      <p className="mb-2 text-base font-semibold text-neutral-800">平日朝</p>
      <ChipRow
        options={WEEKDAY_MORNING_OPTIONS}
        value={value.weekday}
        onChange={(weekday) => onChange({ ...value, weekday })}
      />
      {value.weekday === "bread" ? (
        <div className="mt-3">
          <p className="mb-2 text-xs text-neutral-500">パンの種類</p>
          <ChipRow
            options={BREAD_KIND_OPTIONS}
            value={value.weekdayBreadKind}
            onChange={(weekdayBreadKind) =>
              onChange({ ...value, weekdayBreadKind })
            }
          />
        </div>
      ) : null}

      <p className="mt-5 mb-2 text-base font-semibold text-neutral-800">土曜朝</p>
      <ChipRow
        options={SATURDAY_MORNING_OPTIONS}
        value={value.saturday}
        onChange={(saturday) => onChange({ ...value, saturday })}
      />
      {value.saturday === "bread" ? (
        <div className="mt-3">
          <p className="mb-2 text-xs text-neutral-500">パンの種類</p>
          <ChipRow
            options={BREAD_KIND_OPTIONS}
            value={value.saturdayBreadKind}
            onChange={(saturdayBreadKind) =>
              onChange({ ...value, saturdayBreadKind })
            }
          />
        </div>
      ) : null}

      <p className="mt-5 mb-2 text-base font-semibold text-neutral-800">日曜朝</p>
      <ChipRow
        options={SUNDAY_MORNING_OPTIONS}
        value={value.sunday}
        onChange={(sunday) => onChange({ ...value, sunday })}
      />
      {value.sunday === "bread" ? (
        <div className="mt-3">
          <p className="mb-2 text-xs text-neutral-500">パンの種類</p>
          <ChipRow
            options={BREAD_KIND_OPTIONS}
            value={value.sundayBreadKind}
            onChange={(sundayBreadKind) =>
              onChange({ ...value, sundayBreadKind })
            }
          />
        </div>
      ) : null}
    </>
  );
}
