"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Home, Utensils } from "lucide-react";
import { BoxedChoiceRow, SplitChoiceRow } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import {
  addMorningRecipe,
  applyBreadKindChoice,
  applyMealSourceChoice,
  applyMorningStapleChoice,
  applyPassHomeChoice,
  effectiveBreadKind,
  effectiveMorningStaple,
  effectivePassHome,
} from "@/lib/meal-prefs";
import {
  BREAD_KIND_OPTIONS,
  matchRecipesForBreadKind,
  matchRecipesForOnigiri,
  morningStapleOptionsForDate,
} from "@/lib/morning-staple";
import { dishesOn, slotSourceKind } from "@/lib/meals";
import { visibleRecipes } from "@/lib/recipe-library";
import {
  MEAL_SOURCE_LABELS,
  PASS_HOME_LABEL,
  type BreadKind,
  type KitchenState,
  type MealSlot,
  type MealSourceKind,
  type MorningStapleChoice,
  type PassHomeChoice,
  type SavedRecipe,
} from "@/lib/types";

const SOURCE_CHOICES: { id: MealSourceKind; label: string }[] = [
  { id: "cook", label: MEAL_SOURCE_LABELS.cook },
  { id: "eatout", label: MEAL_SOURCE_LABELS.eatout },
  { id: "procure", label: MEAL_SOURCE_LABELS.procure },
];

function RecipeChips({
  recipes,
  onPick,
}: {
  recipes: SavedRecipe[];
  onPick: (title: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {recipes.map((recipe) => (
        <button
          key={recipe.id}
          type="button"
          className="min-h-11 rounded-full border border-[#1B6B32]/40 bg-white px-4 py-2 text-base font-semibold text-neutral-900"
          onClick={() => onPick(recipe.title)}
        >
          {recipe.title}
        </button>
      ))}
    </div>
  );
}

export function MealChoiceTags({
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
  const { member } = useCurrentMember();
  const breakfast = effectiveMorningStaple(state, date);
  const breadKind = effectiveBreadKind(state, date);
  const passHome = effectivePassHome(state, date, slot);
  const cookMode = passHome === "home";
  const sourceKind = slotSourceKind(dishesOn(state, date, slot));
  const isCook = cookMode && sourceKind === "cook";
  const showMorningStaple = slot === "morning" && isCook;
  const stapleOptions = morningStapleOptionsForDate(date);
  const library = visibleRecipes(state.recipes, member?.id || "member-self");
  const breadRecipes =
    showMorningStaple && breakfast === "bread"
      ? matchRecipesForBreadKind(library, breadKind)
      : [];
  const riceRecipes =
    showMorningStaple && breakfast === "rice"
      ? matchRecipesForOnigiri(library)
      : [];

  return (
    <div>
      <SplitChoiceRow
        items={[
          {
            id: "pass",
            label: PASS_HOME_LABEL,
            icon: Home,
          },
          {
            id: "home",
            label: "家",
            icon: Utensils,
          },
        ]}
        value={passHome}
        onChange={(id) =>
          onUpdate((prev) =>
            applyPassHomeChoice(prev, date, slot, id as PassHomeChoice),
          )
        }
      />
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        ここで選ぶのは、この日のこの枠だけです。
      </p>

      {cookMode ? (
        <BoxedChoiceRow
          className="mt-4"
          framed
          items={SOURCE_CHOICES}
          value={sourceKind}
          onChange={(id) =>
            onUpdate((prev) => applyMealSourceChoice(prev, date, slot, id))
          }
        />
      ) : null}

      {afterSource}

      {showMorningStaple ? (
        <BoxedChoiceRow
          className="mt-4"
          items={stapleOptions.map((option) => ({
            id: option.id,
            label: option.name,
          }))}
          value={breakfast}
          onChange={(id) =>
            onUpdate((prev) =>
              applyMorningStapleChoice(prev, date, id as MorningStapleChoice),
            )
          }
        />
      ) : null}

      {showMorningStaple && breakfast === "bread" ? (
        <>
          <BoxedChoiceRow
            className="mt-3"
            items={BREAD_KIND_OPTIONS.map((option) => ({
              id: option.id,
              label: option.name,
            }))}
            value={breadKind}
            onChange={(id) =>
              onUpdate((prev) => applyBreadKindChoice(prev, date, id as BreadKind))
            }
          />
          {breadRecipes.length > 0 ? (
            <RecipeChips
              recipes={breadRecipes}
              onPick={(title) =>
                onUpdate((prev) => addMorningRecipe(prev, date, title))
              }
            />
          ) : (
            <Link
              href="/recipes"
              className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]"
            >
              この種類のレシピを庫に足す
            </Link>
          )}
        </>
      ) : null}

      {showMorningStaple && breakfast === "rice" ? (
        riceRecipes.length > 0 ? (
          <RecipeChips
            recipes={riceRecipes}
            onPick={(title) =>
              onUpdate((prev) => addMorningRecipe(prev, date, title))
            }
          />
        ) : (
          <Link
            href="/recipes"
            className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]"
          >
            おにぎりレシピを庫に足す
          </Link>
        )
      ) : null}
    </div>
  );
}
