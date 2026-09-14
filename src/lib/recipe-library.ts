import type {
  KitchenState,
  RecipeMark,
  RecipePersonMark,
  RecipeShareSnapshot,
  RecipeVisibility,
  SavedRecipe,
} from "./types";
import { RECIPE_MARKS, RECIPE_PERSON_MARKS } from "./types";

const CARD_MARK_ORDER: RecipeMark[] = ["favorite", "later", "child", "made"];

export function recipeOwnerId(recipe: SavedRecipe): string {
  return recipe.ownerMemberId || "member-self";
}

/** 既存データは家族に出す扱い。新規保存は private を明示する */
export function recipeVisibilityOf(recipe: SavedRecipe): RecipeVisibility {
  return recipe.visibility === "private" ? "private" : "family";
}

export function canViewRecipe(recipe: SavedRecipe, memberId: string): boolean {
  if (recipeOwnerId(recipe) === memberId) return true;
  return recipeVisibilityOf(recipe) === "family";
}

export function canEditRecipe(recipe: SavedRecipe, memberId: string): boolean {
  return recipeOwnerId(recipe) === memberId;
}

export function visibleRecipes(
  recipes: SavedRecipe[] | undefined,
  memberId: string,
): SavedRecipe[] {
  return (recipes ?? []).filter((recipe) => canViewRecipe(recipe, memberId));
}

export function personMarksOf(
  recipe: SavedRecipe,
  memberId: string,
): RecipePersonMark[] {
  const raw = recipe.memberMarks?.[memberId] ?? [];
  return RECIPE_PERSON_MARKS.filter((mark) => raw.includes(mark));
}

export function recipeHasMark(
  recipe: SavedRecipe,
  memberId: string,
  mark: RecipeMark,
): boolean {
  if (mark === "child") return Boolean(recipe.childMark);
  return personMarksOf(recipe, memberId).includes(mark);
}

export function allMarksOf(recipe: SavedRecipe, memberId: string): RecipeMark[] {
  return CARD_MARK_ORDER.filter((mark) =>
    recipeHasMark(recipe, memberId, mark),
  );
}

/** 一覧は最大3。4つ全部なら「作った」を隠す。優先: お気に入り→いつか作りたい→子ども */
export function cardMarksOf(recipe: SavedRecipe, memberId: string): RecipeMark[] {
  const all = allMarksOf(recipe, memberId);
  const withoutMadeIfFull =
    all.length === 4 ? all.filter((mark) => mark !== "made") : all;
  return withoutMadeIfFull.slice(0, 3);
}

export function toggleRecipeMark(
  recipe: SavedRecipe,
  memberId: string,
  mark: RecipeMark,
): SavedRecipe {
  if (mark === "child") {
    return { ...recipe, childMark: !recipe.childMark };
  }
  const current = new Set(personMarksOf(recipe, memberId));
  if (current.has(mark)) current.delete(mark);
  else current.add(mark);
  return {
    ...recipe,
    memberMarks: {
      ...(recipe.memberMarks ?? {}),
      [memberId]: RECIPE_PERSON_MARKS.filter((item) => current.has(item)),
    },
  };
}

export function setRecipeVisibility(
  recipe: SavedRecipe,
  visibility: RecipeVisibility,
): SavedRecipe {
  return { ...recipe, visibility };
}

export function createRecipeShareSnapshot(
  recipe: SavedRecipe,
  householdId: string,
): RecipeShareSnapshot {
  return {
    token: `rs_${crypto.randomUUID().replaceAll("-", "")}`,
    householdId,
    sourceRecipeId: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients.map((item) => ({
      name: item.name,
      amount: item.amount,
    })),
    photos: [...recipe.photos],
    coverIndex: recipe.coverIndex,
    screenshotType: recipe.screenshotType,
    genres: [...recipe.genres],
    createdAt: new Date().toISOString(),
  };
}

export function copyRecipeFromShare(
  snapshot: RecipeShareSnapshot,
  ownerMemberId: string,
): SavedRecipe {
  return {
    id: crypto.randomUUID(),
    title: snapshot.title,
    ingredients: snapshot.ingredients.map((item) => ({
      name: item.name,
      amount: item.amount,
    })),
    photos: [...snapshot.photos],
    coverIndex: Math.min(
      Math.max(snapshot.coverIndex, 0),
      Math.max(snapshot.photos.length - 1, 0),
    ),
    screenshotType: snapshot.screenshotType ?? "unknown",
    genres: [...snapshot.genres],
    createdAt: new Date().toISOString(),
    ownerMemberId,
    visibility: "private",
    childMark: false,
    memberMarks: {},
    sourceRecipeId: snapshot.sourceRecipeId,
  };
}

export function findSameHouseholdRecipe(
  state: KitchenState,
  snapshot: RecipeShareSnapshot,
): SavedRecipe | undefined {
  if (state.householdId !== snapshot.householdId) return undefined;
  return state.recipes.find(
    (recipe) =>
      recipe.id === snapshot.sourceRecipeId ||
      recipe.sourceRecipeId === snapshot.sourceRecipeId,
  );
}

export function alreadyHasShareCopy(
  state: KitchenState,
  snapshot: RecipeShareSnapshot,
): boolean {
  return state.recipes.some(
    (recipe) =>
      recipe.id === snapshot.sourceRecipeId ||
      recipe.sourceRecipeId === snapshot.sourceRecipeId,
  );
}

export function upsertRecipeShare(
  shares: RecipeShareSnapshot[],
  snapshot: RecipeShareSnapshot,
  limit = 40,
): RecipeShareSnapshot[] {
  const others = shares.filter((item) => item.token !== snapshot.token);
  return [snapshot, ...others].slice(0, limit);
}

export function isRecipeMark(value: string): value is RecipeMark {
  return (RECIPE_MARKS as string[]).includes(value);
}
