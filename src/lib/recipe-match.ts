import type { InventoryItem, SavedRecipe } from "./types";

export type RecipeMatch = {
  recipe: SavedRecipe;
  matched: string[];
  leftoverMatched: string[];
  score: number;
};

function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[0-9０-９]+(\.[0-9０-９]+)?\s*(g|kg|ml|l|グラム|個|本|枚|杯|丁|片|少々|適量)?/gi, "")
    .replace(/[・、,，]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function namesOverlap(left: string, right: string): boolean {
  const a = normalizeFoodName(left);
  const b = normalizeFoodName(right);
  if (a.length < 2 || b.length < 2) return false;
  return a.includes(b) || b.includes(a);
}

export function matchRecipesToInventory(
  recipes: SavedRecipe[],
  inventory: InventoryItem[],
  leftoverNames: string[] = [],
): RecipeMatch[] {
  return recipes
    .map((recipe) => {
      const matched = recipe.ingredients.filter((ingredient) =>
        inventory.some((item) => namesOverlap(ingredient.name, item.name)),
      );
      const leftoverMatched = matched.filter((ingredient) =>
        leftoverNames.some((name) => namesOverlap(ingredient.name, name)),
      );
      return {
        recipe,
        matched: [...new Set(matched.map((item) => item.name))],
        leftoverMatched: [...new Set(leftoverMatched.map((item) => item.name))],
        score: matched.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.leftoverMatched.length !== a.leftoverMatched.length) {
        return b.leftoverMatched.length - a.leftoverMatched.length;
      }
      return b.score - a.score;
    });
}
