import {
  DEFAULT_FAVORITE_PLACES,
  DEFAULT_FREQUENT_DISHES,
  DEFAULT_STATE,
  type DayPass,
  type FavoritePlace,
  type FrequentDish,
  type HouseholdMember,
  type InventoryItem,
  type InventoryKind,
  type KitchenMemo,
  type KitchenState,
  type MealSlotPref,
  type MealSourceKind,
  type PlannedDish,
  type RecipeGenre,
  type RecipeIngredient,
  type RecipePersonMark,
  type RecipeShareSnapshot,
  type RecipeVisibility,
  type SavedRecipe,
  type PassHomeChoice,
  type PassReasonId,
  type WeekendBreakfastChoice,
  type MorningStapleChoice,
  type BreadKind,
  type RecipeSiteId,
} from "./types";
import { inferRecipeGenres, normalizeRecipeGenres } from "./recipe-genres";
import { normalizeMorningStapleSettings } from "./morning-staple";
import { migrateDeliveries, oisixMirror } from "./delivery";

const INVENTORY_KINDS: InventoryKind[] = [
  "sideDish",
  "dessert",
  "ingredient",
  "prepared",
];

export function normalizeInventoryKind(kind: string | undefined): InventoryKind {
  if (kind === "delivered") return "ingredient";
  if (INVENTORY_KINDS.includes(kind as InventoryKind)) {
    return kind as InventoryKind;
  }
  return "ingredient";
}

export function normalizeRecipe(recipe: {
  id?: string;
  title?: string;
  ingredients?: Array<string | RecipeIngredient>;
  photos?: string[];
  photoDataUrl?: string | null;
  coverIndex?: number;
  screenshotType?: SavedRecipe["screenshotType"];
  genres?: RecipeGenre[];
  createdAt?: string;
  ownerMemberId?: string;
  visibility?: RecipeVisibility;
  childMark?: boolean;
  memberMarks?: Record<string, RecipePersonMark[]>;
  sourceRecipeId?: string | null;
}): SavedRecipe {
  const photos =
    recipe.photos?.filter(Boolean) ??
    (recipe.photoDataUrl ? [recipe.photoDataUrl] : []);
  const ingredients = (recipe.ingredients ?? []).map((item) => {
    if (typeof item === "string") {
      return { name: item.trim(), amount: "" };
    }
    return {
      name: String(item.name ?? "").trim(),
      amount: String(item.amount ?? "").trim(),
    };
  }).filter((item) => item.name);
  const coverIndex = Math.min(
    Math.max(recipe.coverIndex ?? 0, 0),
    Math.max(photos.length - 1, 0),
  );
  const title = recipe.title?.trim() || "無題のレシピ";
  const genres =
    Array.isArray(recipe.genres) && recipe.genres.length > 0
      ? normalizeRecipeGenres(recipe.genres)
      : inferRecipeGenres(title, ingredients);
  const visibility: RecipeVisibility =
    recipe.visibility === "private" || recipe.visibility === "family"
      ? recipe.visibility
      : "family";
  const memberMarks: Record<string, RecipePersonMark[]> = {};
  for (const [memberId, marks] of Object.entries(recipe.memberMarks ?? {})) {
    const next = (Array.isArray(marks) ? marks : []).filter(
      (mark): mark is RecipePersonMark =>
        mark === "favorite" || mark === "later" || mark === "made",
    );
    if (next.length > 0) memberMarks[memberId] = next;
  }
  return {
    id: recipe.id || crypto.randomUUID(),
    title,
    ingredients,
    photos,
    coverIndex,
    screenshotType: recipe.screenshotType ?? "unknown",
    genres,
    createdAt: recipe.createdAt || new Date().toISOString(),
    ownerMemberId: recipe.ownerMemberId?.trim() || "member-self",
    visibility,
    childMark: Boolean(recipe.childMark),
    memberMarks,
    sourceRecipeId: recipe.sourceRecipeId || null,
  };
}

function normalizeRecipeShare(
  share: Partial<RecipeShareSnapshot> & { token?: string },
): RecipeShareSnapshot | null {
  const token = share.token?.trim();
  const title = share.title?.trim();
  if (!token || !title) return null;
  const photos = (share.photos ?? []).filter(Boolean);
  const ingredients = (share.ingredients ?? [])
    .map((item) => ({
      name: String(item.name ?? "").trim(),
      amount: String(item.amount ?? "").trim(),
    }))
    .filter((item) => item.name);
  return {
    token,
    householdId: share.householdId?.trim() || "household-local",
    sourceRecipeId: share.sourceRecipeId?.trim() || token,
    title,
    ingredients,
    photos,
    coverIndex: Math.min(
      Math.max(share.coverIndex ?? 0, 0),
      Math.max(photos.length - 1, 0),
    ),
    screenshotType: share.screenshotType ?? "unknown",
    genres: normalizeRecipeGenres(share.genres),
    createdAt: share.createdAt || new Date().toISOString(),
  };
}

export function recipeCover(recipe: SavedRecipe): string | null {
  return recipe.photos[recipe.coverIndex] ?? recipe.photos[0] ?? null;
}

export function normalizeMember(
  member: Partial<HouseholdMember> & { id?: string },
): HouseholdMember {
  const lineUserId = member.lineUserId ?? null;
  return {
    id: member.id || crypto.randomUUID(),
    displayName: member.displayName?.trim() || "メンバー",
    email: member.email?.trim().toLowerCase() || "",
    lineUserId,
    lineLinked: Boolean(lineUserId || member.lineLinked),
  };
}

function normalizeInventoryItem(item: Partial<InventoryItem> & { id?: string }): InventoryItem {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name?.trim() || "食材",
    kind: normalizeInventoryKind(item.kind),
    quantity: item.quantity ?? "",
    useByDate: item.useByDate || null,
    memo: item.memo ?? "",
    photoDataUrl: item.photoDataUrl ?? null,
    createdAt: item.createdAt || new Date().toISOString(),
    usedUpAt: item.usedUpAt || null,
  };
}

function normalizeFrequent(dish: Partial<FrequentDish> & { id?: string }): FrequentDish {
  const role = dish.role === "main" ? "main" : "side";
  return {
    id: dish.id || crypto.randomUUID(),
    name: dish.name?.trim() || "料理",
    role,
    proteinKind:
      role === "main" ? (dish.proteinKind === "meat" ? "meat" : "fish") : null,
  };
}

function normalizePass(pass: Partial<DayPass> & { id?: string }): DayPass {
  const start = pass.startDate || pass.endDate || "";
  const reasonId: PassReasonId =
    pass.reasonId === "home" ||
    pass.reasonId === "invited" ||
    pass.reasonId === "eatout" ||
    pass.reasonId === "papa" ||
    pass.reasonId === "holiday" ||
    pass.reasonId === "custom"
      ? pass.reasonId
      : "custom";
  return {
    id: pass.id || crypto.randomUUID(),
    startDate: start,
    endDate: pass.endDate || start,
    slot: pass.slot === "morning" || pass.slot === "evening" ? pass.slot : "both",
    reasonId,
    customReason: pass.customReason ?? "",
  };
}

function normalizeMeal(dish: Partial<PlannedDish> & { id?: string }): PlannedDish {
  const sourceKind: MealSourceKind =
    dish.sourceKind === "eatout" || dish.sourceKind === "procure"
      ? dish.sourceKind
      : "cook";
  return {
    id: dish.id || crypto.randomUUID(),
    date: dish.date || "",
    slot: dish.slot === "morning" ? "morning" : "evening",
    role: dish.role === "side" || dish.role === "dessert" ? dish.role : "main",
    name: dish.name?.trim() || "料理",
    proteinKind:
      dish.proteinKind === "meat" || dish.proteinKind === "fish"
        ? dish.proteinKind
        : null,
    eaten: Boolean(dish.eaten),
    sourceKind,
    placeName: dish.placeName?.trim() || null,
  };
}

function normalizeFavoritePlace(
  place: Partial<FavoritePlace> & { id?: string },
): FavoritePlace | null {
  const name = place.name?.trim();
  if (!name) return null;
  return {
    id: place.id || crypto.randomUUID(),
    kind: place.kind === "procure" ? "procure" : "eatout",
    name,
  };
}

function normalizeSlotPref(
  pref: Partial<MealSlotPref> & { date?: string; slot?: string },
): MealSlotPref | null {
  if (!pref.date) return null;
  const weekendBreakfast: WeekendBreakfastChoice | undefined =
    pref.weekendBreakfast === "egg_sandwich" ||
    pref.weekendBreakfast === "bread" ||
    pref.weekendBreakfast === "rice"
      ? pref.weekendBreakfast
      : undefined;
  const morningStaple: MorningStapleChoice | undefined =
    pref.morningStaple === "rice" ||
    pref.morningStaple === "bread" ||
    pref.morningStaple === "egg_sandwich" ||
    pref.morningStaple === "unset"
      ? pref.morningStaple
      : weekendBreakfast === "rice" ||
          weekendBreakfast === "bread" ||
          weekendBreakfast === "egg_sandwich"
        ? weekendBreakfast
        : undefined;
  const breadKind: BreadKind | undefined =
    pref.breadKind === "toast" ||
    pref.breadKind === "sandwich" ||
    pref.breadKind === "hot_sandwich"
      ? pref.breadKind
      : undefined;
  const passHomeRaw =
    pref.passHome ?? pref.weekendEvening ?? pref.saturdayEvening;
  const passHome: PassHomeChoice | undefined =
    passHomeRaw === "pass" || passHomeRaw === "home" ? passHomeRaw : undefined;
  return {
    date: pref.date,
    slot: pref.slot === "morning" ? "morning" : "evening",
    humanTouched: Boolean(pref.humanTouched),
    weekendBreakfast,
    morningStaple,
    breadKind,
    passHome,
    weekendEvening: passHome,
  };
}

function normalizeMemo(memo: Partial<KitchenMemo> & { id?: string }): KitchenMemo {
  return {
    id: memo.id || crypto.randomUUID(),
    text: memo.text?.trim() || "",
    createdAt: memo.createdAt || new Date().toISOString(),
  };
}

export function normalizeKitchenState(
  parsed: Partial<KitchenState> | null | undefined,
): KitchenState {
  const base = structuredClone(DEFAULT_STATE);
  if (!parsed || parsed.version !== 1) return base;
  const members = (parsed.members ?? base.members).map(normalizeMember);
  const frequentDishes = (parsed.frequentDishes ?? DEFAULT_FREQUENT_DISHES).map(
    normalizeFrequent,
  );
  const deliveries = migrateDeliveries(parsed.deliveries, parsed.oisix);
  return {
    ...base,
    ...parsed,
    householdId: parsed.householdId || base.householdId,
    inviteToken: parsed.inviteToken ?? null,
    familyPhotoDataUrl: parsed.familyPhotoDataUrl ?? null,
    members: members.length > 0 ? members : base.members,
    recipes: (parsed.recipes ?? base.recipes).map((recipe) =>
      normalizeRecipe(recipe),
    ),
    recipeShares: (parsed.recipeShares ?? [])
      .map(normalizeRecipeShare)
      .filter((item): item is RecipeShareSnapshot => Boolean(item)),
    inventory: (parsed.inventory ?? []).map(normalizeInventoryItem),
    meals: (parsed.meals ?? []).map(normalizeMeal),
    passes: (parsed.passes ?? []).map(normalizePass),
    mealSlotPrefs: (parsed.mealSlotPrefs ?? [])
      .map(normalizeSlotPref)
      .filter((item): item is MealSlotPref => Boolean(item)),
    frequentDishes:
      frequentDishes.length > 0 ? frequentDishes : DEFAULT_FREQUENT_DISHES,
    favoritePlaces: parsed.favoritePlaces
      ? parsed.favoritePlaces
          .map(normalizeFavoritePlace)
          .filter((item): item is FavoritePlace => Boolean(item))
      : DEFAULT_FAVORITE_PLACES,
    memos: (parsed.memos ?? []).map(normalizeMemo).filter((memo) => memo.text),
    deliveries,
    oisix: oisixMirror(deliveries),
    settings: {
      ...base.settings,
      ...parsed.settings,
      recipeSite:
        parsed.settings?.recipeSite === "kurashiru" ||
        parsed.settings?.recipeSite === "google" ||
        parsed.settings?.recipeSite === "cookpad"
          ? (parsed.settings.recipeSite as RecipeSiteId)
          : base.settings.recipeSite,
      morningStaple: normalizeMorningStapleSettings(
        parsed.settings?.morningStaple,
      ),
    },
    notifyLog: {
      ...base.notifyLog,
      ...parsed.notifyLog,
    },
  };
}

export function preserveLineIds(
  incoming: KitchenState,
  existing: KitchenState,
): KitchenState {
  const byId = new Map(existing.members.map((member) => [member.id, member]));
  let members = incoming.members.map((member) => {
    const previous = byId.get(member.id);
    const lineUserId = member.lineUserId || previous?.lineUserId || null;
    return {
      ...member,
      lineUserId,
      lineLinked: Boolean(lineUserId),
    };
  });

  if (!members.some((member) => member.lineUserId)) {
    const linked = existing.members.find((member) => member.lineUserId);
    if (linked) {
      members = members.map((member, index) =>
        member.id === "member-self" || index === 0
          ? {
              ...member,
              lineUserId: linked.lineUserId,
              lineLinked: true,
            }
          : member,
      );
    }
  }

  return {
    ...incoming,
    members,
    notifyLog:
      existing.notifyLog ?? incoming.notifyLog ?? DEFAULT_STATE.notifyLog,
  };
}

export function selfMember(state: KitchenState): HouseholdMember | undefined {
  return (
    state.members.find((member) => member.id === "member-self") ??
    state.members[0]
  );
}

export function linkedLineUserId(state: KitchenState): string | null {
  return (
    state.members.find((member) => member.lineUserId)?.lineUserId ?? null
  );
}
