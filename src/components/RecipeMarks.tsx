"use client";

import {
  cardMarksOf,
  recipeHasMark,
  toggleRecipeMark,
} from "@/lib/recipe-library";
import {
  RECIPE_MARK_LABELS,
  RECIPE_MARKS,
  type RecipeMark,
  type SavedRecipe,
} from "@/lib/types";

export function RecipeMarkBadges({
  recipe,
  memberId,
}: {
  recipe: SavedRecipe;
  memberId: string;
}) {
  const marks = cardMarksOf(recipe, memberId);
  if (marks.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {marks.map((mark) => (
        <span
          key={mark}
          className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-800"
        >
          {RECIPE_MARK_LABELS[mark]}
        </span>
      ))}
    </div>
  );
}

export function RecipeMarkToggles({
  recipe,
  memberId,
  onChange,
}: {
  recipe: SavedRecipe;
  memberId: string;
  onChange: (next: SavedRecipe) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-base font-semibold text-neutral-800">マーク</p>
      <div className="flex flex-wrap gap-2">
        {RECIPE_MARKS.map((mark) => {
          const on = recipeHasMark(recipe, memberId, mark);
          return (
            <button
              key={mark}
              type="button"
              className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
                on
                  ? "bg-[#1B6B32] text-white"
                  : "bg-white text-neutral-600 ring-1 ring-[#e6e8e3]"
              }`}
              onClick={() => onChange(toggleRecipeMark(recipe, memberId, mark))}
            >
              {RECIPE_MARK_LABELS[mark]}
            </button>
          );
        })}
      </div>
      {recipeHasMark(recipe, memberId, "child") ? (
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          子どもに出してよい／食べられる・見せてよい
        </p>
      ) : null}
    </div>
  );
}

export function RecipeMarkFilter({
  value,
  onChange,
}: {
  value: RecipeMark | "all";
  onChange: (next: RecipeMark | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
          value === "all"
            ? "bg-[#1B6B32] text-white"
            : "bg-[#EDEDED] text-neutral-600"
        }`}
      >
        すべて
      </button>
      {RECIPE_MARKS.map((mark) => (
        <button
          key={mark}
          type="button"
          onClick={() => onChange(mark)}
          className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
            value === mark
              ? "bg-[#1B6B32] text-white"
              : "bg-[#EDEDED] text-neutral-600"
          }`}
        >
          {RECIPE_MARK_LABELS[mark]}
        </button>
      ))}
    </div>
  );
}
