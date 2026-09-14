"use client";

import { Card } from "@/components/ui";
import { recipeCover } from "@/lib/kitchen-state";
import {
  formatMealSourceLine,
  isMealExceptionSource,
  slotSourceKind,
} from "@/lib/meals";
import { MEAL_SOURCE_LABELS, type KitchenState, type PlannedDish } from "@/lib/types";

export function MealSlotSummaryCard({
  state,
  dishes,
  showPass,
  passLabel,
}: {
  state: KitchenState;
  dishes: PlannedDish[];
  showPass: boolean;
  passLabel: string;
}) {
  const nonDessert = dishes.filter((dish) => dish.role !== "dessert");
  const sourceKind = slotSourceKind(nonDessert);

  if (showPass) {
    return (
      <Card className="p-0">
        <p className="px-4 py-6 text-center text-xl font-bold">{passLabel}</p>
      </Card>
    );
  }

  const exception = nonDessert.find((dish) =>
    isMealExceptionSource(dish.sourceKind),
  );
  if (sourceKind === "eatout" || sourceKind === "procure") {
    return (
      <Card className="p-0">
        <p className="px-4 py-6 text-center text-xl font-bold">
          {exception
            ? formatMealSourceLine(exception)
            : MEAL_SOURCE_LABELS[sourceKind]}
        </p>
      </Card>
    );
  }

  const main = nonDessert.find((dish) => dish.role === "main");
  const sides = nonDessert.filter((dish) => dish.role === "side").slice(0, 2);
  const matched = main
    ? state.recipes.find((recipe) => recipe.title === main.name)
    : undefined;
  const cover = matched ? recipeCover(matched) : null;

  if (!main && sides.length === 0) {
    return (
      <Card className="p-0">
        <p className="px-4 py-6 text-center text-base text-neutral-500">
          よく作るから追加できます。
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={main?.name ?? ""}
          className="h-40 w-full object-cover"
        />
      ) : null}
      <div className="space-y-1 px-4 py-3">
        {main ? (
          <p className="text-xl font-bold leading-snug">
            <span className="mr-2 text-sm font-bold text-[#1B6B32]">主</span>
            {main.name}
          </p>
        ) : null}
        {sides[0] ? (
          <p className="text-xl font-bold leading-snug">
            <span className="mr-2 text-sm font-bold text-[#1B6B32]">副1</span>
            {sides[0].name}
          </p>
        ) : null}
        {sides[1] ? (
          <p className="text-xl font-bold leading-snug">
            <span className="mr-2 text-sm font-bold text-[#1B6B32]">副2</span>
            {sides[1].name}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
