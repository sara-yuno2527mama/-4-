"use client";

import { useState } from "react";
import { Field, PrimaryButton, SecondaryButton } from "@/components/ui";
import { applyMealSourcePlace } from "@/lib/meal-prefs";
import { dishesOn, formatMealSourceLine } from "@/lib/meals";
import {
  MEAL_SOURCE_LABELS,
  type KitchenState,
  type MealSlot,
} from "@/lib/types";

export function MealSourcePlacePicker({
  state,
  date,
  slot,
  kind,
  onUpdate,
  disabled = false,
}: {
  state: KitchenState;
  date: string;
  slot: MealSlot;
  kind: "eatout" | "procure";
  onUpdate: (updater: (prev: KitchenState) => KitchenState) => void;
  disabled?: boolean;
}) {
  const [manual, setManual] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [note, setNote] = useState("");
  const places = (state.favoritePlaces ?? []).filter(
    (place) => place.kind === kind,
  );
  const current = dishesOn(state, date, slot).find(
    (dish) => dish.role !== "dessert" && dish.sourceKind === kind,
  );
  const currentPlace = (current?.placeName || current?.name || "").trim();
  const kindLabel = MEAL_SOURCE_LABELS[kind];

  function recordPlace(name: string) {
    const trimmed = name.trim();
    if (!trimmed || disabled) return;
    onUpdate((prev) => applyMealSourcePlace(prev, date, slot, kind, trimmed));
    setManual("");
    setNote(`${kindLabel}「${trimmed}」を記録しました。`);
  }

  function registerPlace() {
    const name = newPlaceName.trim();
    if (!name) return;
    const exists = places.some((place) => place.name === name);
    onUpdate((prev) => {
      if (exists) return prev;
      return {
        ...prev,
        favoritePlaces: [
          ...(prev.favoritePlaces ?? []),
          { id: crypto.randomUUID(), kind, name },
        ],
      };
    });
    setNewPlaceName("");
    setNote(
      exists
        ? `「${name}」はすでに定番にあります。`
        : `${kindLabel}の定番「${name}」を登録しました。`,
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-500">
        {kind === "procure"
          ? "買って帰る＝買って家で食べる（惣菜・弁当・テイクアウト等）。記録・編集できます。"
          : "外食として記録・編集できます。"}
      </p>
      {current ? (
        <p className="text-base font-semibold text-neutral-800">
          いま {formatMealSourceLine(current)}
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-base font-semibold text-neutral-800">
          定番の店から選ぶ
        </p>
        {places.length === 0 ? (
          <p className="text-base text-neutral-500">
            まだありません。下で登録できます。
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {places.map((place) => {
              const selected = currentPlace === place.name;
              return (
                <div
                  key={place.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                    selected
                      ? "border-[#1B6B32]/50 bg-white"
                      : "border-[#e6e8e3]"
                  }`}
                >
                  <span className="min-w-0 text-base font-semibold">{place.name}</span>
                  <div className="flex gap-2">
                    <PrimaryButton
                      type="button"
                      className="shrink-0"
                      disabled={disabled}
                      onClick={() => recordPlace(place.name)}
                    >
                      {selected ? "選び直す" : "記録する"}
                    </PrimaryButton>
                    <button
                      type="button"
                      className="min-h-11 px-2 text-base font-semibold text-rose-600"
                      onClick={() =>
                        onUpdate((prev) => ({
                          ...prev,
                          favoritePlaces: (prev.favoritePlaces ?? []).filter(
                            (item) => item.id !== place.id,
                          ),
                        }))
                      }
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-base font-semibold text-neutral-800">
          手入力で記録・編集
        </p>
        <div className="flex gap-2">
          <Field
            placeholder={
              kind === "eatout" ? "例: ○○食堂" : "例: スーパー惣菜"
            }
            value={manual}
            onChange={(event) => setManual(event.target.value)}
          />
          <PrimaryButton
            type="button"
            disabled={!manual.trim() || disabled}
            onClick={() => recordPlace(manual)}
          >
            記録
          </PrimaryButton>
        </div>
      </div>

      <div className="border-t border-[#e6e8e3] pt-3">
        <p className="mb-2 text-base font-semibold text-neutral-800">
          {kindLabel}の定番店を登録
        </p>
        <div className="flex gap-2">
          <Field
            placeholder="店名"
            value={newPlaceName}
            onChange={(event) => setNewPlaceName(event.target.value)}
          />
          <SecondaryButton
            type="button"
            disabled={!newPlaceName.trim()}
            onClick={registerPlace}
          >
            登録
          </SecondaryButton>
        </div>
      </div>

      {note ? (
        <p className="text-base font-semibold text-[#1B6B32]">{note}</p>
      ) : null}
    </div>
  );
}
