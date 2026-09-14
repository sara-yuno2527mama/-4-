"use client";

import type { ReactNode } from "react";
import { MealChoiceTags } from "@/components/MealChoiceTags";
import { MealSourcePlacePicker } from "@/components/MealSourcePlacePicker";
import { confirmLinkClass } from "@/components/ui";
import {
  confirmSlotLabel,
  effectivePassHome,
  slotProposal,
} from "@/lib/meal-prefs";
import { dishesOn, slotSourceKind } from "@/lib/meals";
import type { KitchenState, MealSlot } from "@/lib/types";

export function MealPlanQuickChoices({
  state,
  date,
  slot,
  onUpdate,
  afterSource = null,
}: {
  state: KitchenState;
  date: string;
  slot: MealSlot;
  onUpdate: (updater: (prev: KitchenState) => KitchenState) => void;
  afterSource?: ReactNode;
}) {
  const passHome = effectivePassHome(state, date, slot);
  const slotDishes = dishesOn(state, date, slot);
  const cookMode = passHome === "home";
  const sourceKind = slotSourceKind(slotDishes);
  const proposal = slotProposal(state, date, slot);

  return (
    <div className="mt-4 space-y-4">
      <MealChoiceTags
        state={state}
        date={date}
        slot={slot}
        onUpdate={onUpdate}
        afterSource={afterSource}
      />

      {cookMode && (sourceKind === "eatout" || sourceKind === "procure") ? (
        <MealSourcePlacePicker
          key={`${date}-${slot}-${sourceKind}`}
          state={state}
          date={date}
          slot={slot}
          kind={sourceKind}
          onUpdate={onUpdate}
        />
      ) : null}

      {proposal.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-xl font-bold leading-snug text-neutral-900">
            {proposal.map((dish) => dish.name).join("＋")}
          </p>
          <button
            type="button"
            className={confirmLinkClass}
            onClick={() =>
              onUpdate((prev) => confirmSlotLabel(prev, date, slot))
            }
          >
            これにする
          </button>
        </div>
      ) : null}
    </div>
  );
}
