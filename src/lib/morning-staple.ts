import { weekdayFromKey } from "./meals";
import type {
  BreadKind,
  MorningStapleChoice,
  MorningStapleSettings,
  SavedRecipe,
  WeekendMorningStaple,
} from "./types";

export const DEFAULT_MORNING_STAPLE: MorningStapleSettings = {
  weekday: "rice",
  saturday: "egg_sandwich",
  sunday: "bread",
  weekdayBreadKind: "toast",
  saturdayBreadKind: "toast",
  sundayBreadKind: "toast",
};

export const WEEKDAY_MORNING_OPTIONS: { id: MorningStapleChoice; name: string }[] =
  [
    { id: "rice", name: "ごはん" },
    { id: "bread", name: "パン" },
    { id: "egg_sandwich", name: "卵サンド" },
    { id: "unset", name: "決めていない" },
  ];

export const SATURDAY_MORNING_OPTIONS: {
  id: WeekendMorningStaple;
  name: string;
}[] = [
  { id: "egg_sandwich", name: "卵サンド" },
  { id: "bread", name: "パン" },
  { id: "rice", name: "ごはん" },
];

export const SUNDAY_MORNING_OPTIONS: {
  id: WeekendMorningStaple;
  name: string;
}[] = [
  { id: "bread", name: "パン" },
  { id: "egg_sandwich", name: "卵サンド" },
  { id: "rice", name: "ごはん" },
];

export const BREAD_KIND_OPTIONS: { id: BreadKind; name: string }[] = [
  { id: "toast", name: "食パン" },
  { id: "sandwich", name: "サンドイッチ" },
  { id: "hot_sandwich", name: "ホットサンド" },
];

export function breadKindLabel(kind: BreadKind): string {
  return BREAD_KIND_OPTIONS.find((item) => item.id === kind)?.name ?? "食パン";
}

export function morningStapleChoiceLabel(choice: MorningStapleChoice): string {
  if (choice === "rice") return "ごはん";
  if (choice === "bread") return "パン";
  if (choice === "egg_sandwich") return "卵サンド";
  return "決めていない";
}

/** 献立・ホームに出す料理名。パンは種類名。ごはんはおにぎり */
export function morningUsualDishName(
  staple: MorningStapleChoice,
  breadKind: BreadKind,
): string {
  if (staple === "rice") return "おにぎり";
  if (staple === "egg_sandwich") return "卵サンド";
  if (staple === "bread") return breadKindLabel(breadKind);
  return "";
}

export function morningStapleOptionsForDate(dateKey: string): {
  id: MorningStapleChoice;
  name: string;
}[] {
  const weekday = weekdayFromKey(dateKey);
  if (weekday === 6) return SATURDAY_MORNING_OPTIONS;
  if (weekday === 0) return SUNDAY_MORNING_OPTIONS;
  return WEEKDAY_MORNING_OPTIONS;
}

function asStaple(value: unknown): MorningStapleChoice | null {
  if (
    value === "rice" ||
    value === "bread" ||
    value === "egg_sandwich" ||
    value === "unset"
  ) {
    return value;
  }
  return null;
}

function asWeekendStaple(value: unknown): WeekendMorningStaple | null {
  if (value === "rice" || value === "bread" || value === "egg_sandwich") {
    return value;
  }
  return null;
}

function asBreadKind(value: unknown): BreadKind | null {
  if (value === "toast" || value === "sandwich" || value === "hot_sandwich") {
    return value;
  }
  return null;
}

export function normalizeMorningStapleSettings(
  raw: Partial<MorningStapleSettings> | null | undefined,
): MorningStapleSettings {
  return {
    weekday: asStaple(raw?.weekday) ?? DEFAULT_MORNING_STAPLE.weekday,
    saturday:
      asWeekendStaple(raw?.saturday) ?? DEFAULT_MORNING_STAPLE.saturday,
    sunday: asWeekendStaple(raw?.sunday) ?? DEFAULT_MORNING_STAPLE.sunday,
    weekdayBreadKind:
      asBreadKind(raw?.weekdayBreadKind) ??
      DEFAULT_MORNING_STAPLE.weekdayBreadKind,
    saturdayBreadKind:
      asBreadKind(raw?.saturdayBreadKind) ??
      DEFAULT_MORNING_STAPLE.saturdayBreadKind,
    sundayBreadKind:
      asBreadKind(raw?.sundayBreadKind) ??
      DEFAULT_MORNING_STAPLE.sundayBreadKind,
  };
}

export function defaultMorningStapleForDate(
  settings: MorningStapleSettings,
  dateKey: string,
): MorningStapleChoice {
  const weekday = weekdayFromKey(dateKey);
  if (weekday === 6) return settings.saturday;
  if (weekday === 0) return settings.sunday;
  return settings.weekday;
}

export function defaultBreadKindForDate(
  settings: MorningStapleSettings,
  dateKey: string,
): BreadKind {
  const weekday = weekdayFromKey(dateKey);
  if (weekday === 6) return settings.saturdayBreadKind;
  if (weekday === 0) return settings.sundayBreadKind;
  return settings.weekdayBreadKind;
}

function recipeSearchText(recipe: SavedRecipe): string {
  return [recipe.title, ...recipe.ingredients.map((item) => item.name)].join(
    " ",
  );
}

const BREAD_HINTS = [
  "ホットサンド",
  "トースト",
  "食パン",
  "サンドイッチ",
];

const ONIGIRI_HINTS = ["おにぎり", "おむすび", "ご飯", "ごはん"];

function hasAny(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

/** ごはん定番の朝。名前におにぎり向き。パン提案とは混ぜない */
export function matchRecipesForOnigiri(
  recipes: SavedRecipe[],
  limit = 3,
): SavedRecipe[] {
  const hits = recipes.filter((recipe) => {
    const name = recipe.title;
    if (!hasAny(name, ONIGIRI_HINTS)) return false;
    if (hasAny(name, BREAD_HINTS)) return false;
    return true;
  });
  return hits.slice(0, limit);
}

/** 種類ごとのレシピ。マーク種類は増やさない。おにぎり提案とは混ぜない */
export function matchRecipesForBreadKind(
  recipes: SavedRecipe[],
  kind: BreadKind,
  limit = 3,
): SavedRecipe[] {
  const hits = recipes.filter((recipe) => {
    const text = recipeSearchText(recipe);
    if (hasAny(recipe.title, ONIGIRI_HINTS)) return false;
    if (kind === "hot_sandwich") return text.includes("ホットサンド");
    if (kind === "sandwich") {
      return (
        (text.includes("サンドイッチ") || text.includes("サンド")) &&
        !text.includes("ホットサンド")
      );
    }
    return (
      text.includes("トースト") ||
      text.includes("食パン") ||
      text.includes("ジャム")
    );
  });
  return hits.slice(0, limit);
}
