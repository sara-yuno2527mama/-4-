"use client";

import { useState } from "react";
import {
  BoxedChoiceRow,
  Card,
  Field,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "@/components/ui";
import {
  addPeriodPass,
  formatPassListLine,
  listedPeriodPasses,
} from "@/lib/meals";
import { tokyoDateKey } from "@/lib/dates";
import {
  PASS_HOME_LABEL,
  PASS_REASON_IDS,
  PASS_REASON_LABELS,
  type KitchenState,
  type MealSlot,
  type PassReasonId,
} from "@/lib/types";

const SLOT_CHOICES: { id: MealSlot | "both"; label: string }[] = [
  { id: "morning", label: "朝" },
  { id: "evening", label: "夕" },
  { id: "both", label: "両方" },
];

export function PassDaysCard({
  state,
  selectedDate,
  onUpdate,
}: {
  state: KitchenState;
  selectedDate: string;
  onUpdate: (updater: (prev: KitchenState) => KitchenState) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [slot, setSlot] = useState<MealSlot | "both">("both");
  const [reasonId, setReasonId] = useState<PassReasonId>("holiday");
  const [customReason, setCustomReason] = useState("");

  const listed = listedPeriodPasses(state, tokyoDateKey());

  function openForm() {
    setStartDate(selectedDate);
    setEndDate(selectedDate);
    setSlot("both");
    setReasonId("holiday");
    setCustomReason("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setCustomReason("");
  }

  return (
    <Card>
      <SectionTitle>連休などまとめてパスにする</SectionTitle>
      <p className="mb-3 text-xs leading-relaxed text-neutral-500">
        何日か続けて実家・旅行などのときに。1日だけなら、上の「{PASS_HOME_LABEL}／家」で足ります。
      </p>
      {listed.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {listed.map((pass) => (
            <li
              key={pass.id}
              className="flex items-center justify-between gap-2"
            >
              <p className="text-base">{formatPassListLine(pass)}</p>
              <button
                type="button"
                className="min-h-11 shrink-0 px-2 text-base font-semibold text-neutral-500"
                onClick={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    passes: prev.passes.filter((item) => item.id !== pass.id),
                  }))
                }
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-neutral-500">
          今日から約60日先までに、設定したパスはありません。
        </p>
      )}

      {formOpen ? (
        <>
          <p className="mb-2 text-base font-semibold text-neutral-800">
            まとめてパスにする
          </p>
          <label className="mb-1 block text-xs text-neutral-500">理由</label>
          <select
            className="mb-2 min-h-11 w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-base"
            value={reasonId}
            onChange={(event) =>
              setReasonId(event.target.value as PassReasonId)
            }
          >
            {PASS_REASON_IDS.map((id) => (
              <option key={id} value={id}>
                {PASS_REASON_LABELS[id]}
              </option>
            ))}
          </select>
          {reasonId === "custom" ? (
            <Field
              className="mb-2"
              placeholder="理由"
              value={customReason}
              onChange={(event) => setCustomReason(event.target.value)}
            />
          ) : null}
          <label className="mb-1 block text-xs text-neutral-500">開始日</label>
          <Field
            type="date"
            className="mb-2"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <label className="mb-1 block text-xs text-neutral-500">終了日</label>
          <Field
            type="date"
            className="mb-2"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <p className="mb-1 text-xs text-neutral-500">朝／夕／両方</p>
          <div className="mb-3">
            <BoxedChoiceRow
              items={SLOT_CHOICES}
              value={slot}
              onChange={setSlot}
            />
          </div>
          <PrimaryButton
            type="button"

            disabled={!startDate || !endDate}
            onClick={() => {
              onUpdate((prev) =>
                addPeriodPass(prev, {
                  startDate,
                  endDate,
                  slot,
                  reasonId,
                  customReason,
                }),
              );
              closeForm();
            }}
          >
            保存
          </PrimaryButton>
          <button
            type="button"
            className="mt-2 block min-h-11 text-base font-semibold text-neutral-500"
            onClick={closeForm}
          >
            やめる
          </button>
        </>
      ) : (
        <SecondaryButton
          type="button"

          onClick={openForm}
        >
          まとめてパスにする
        </SecondaryButton>
      )}
    </Card>
  );
}
