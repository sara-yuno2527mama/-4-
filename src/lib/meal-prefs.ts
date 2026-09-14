import {
  addPlannedDish,
  dishesOn,
  findPass,
  formatMealSourceLine,
  formatPassLine,
  isMealExceptionSource,
  passCovers,
  lastEveningProtein,
  replaceSlotDishes,
  replaceSlotWithException,
  slotSourceKind,
  weekdayFromKey,
} from "./meals";
import {
  defaultBreadKindForDate,
  defaultMorningStapleForDate,
  morningUsualDishName,
  normalizeMorningStapleSettings,
} from "./morning-staple";
import {
  MEAL_SOURCE_LABELS,
  PASS_HOME_LABEL,
  type BreadKind,
  type FrequentDish,
  type KitchenState,
  type MealSlot,
  type MealSlotPref,
  type MealSourceKind,
  type MorningStapleChoice,
  type PassHomeChoice,
  type PlannedDish,
  type ProteinKind,
  type WeekendBreakfastChoice,
} from "./types";

export const WEEKEND_BREAKFAST_OPTIONS: {
  id: WeekendBreakfastChoice;
  name: string;
}[] = [
  { id: "egg_sandwich", name: "卵サンド" },
  { id: "bread", name: "パン" },
];

export function getSlotPref(
  state: KitchenState,
  date: string,
  slot: MealSlot,
): MealSlotPref | undefined {
  return (state.mealSlotPrefs ?? []).find(
    (item) => item.date === date && item.slot === slot,
  );
}

export function isSlotHumanTouched(
  state: KitchenState,
  date: string,
  slot: MealSlot,
): boolean {
  return Boolean(getSlotPref(state, date, slot)?.humanTouched);
}

export function upsertSlotPref(
  prefs: MealSlotPref[],
  next: MealSlotPref,
): MealSlotPref[] {
  const others = prefs.filter(
    (item) => !(item.date === next.date && item.slot === next.slot),
  );
  return [...others, next];
}

export function markSlotHumanTouched(
  state: KitchenState,
  date: string,
  slot: MealSlot,
  patch: Partial<MealSlotPref> = {},
): KitchenState {
  const previous = getSlotPref(state, date, slot);
  return {
    ...state,
    mealSlotPrefs: upsertSlotPref(state.mealSlotPrefs ?? [], {
      date,
      slot,
      weekendBreakfast: previous?.weekendBreakfast,
      morningStaple: previous?.morningStaple,
      breadKind: previous?.breadKind,
      passHome:
        previous?.passHome ??
        previous?.weekendEvening ??
        previous?.saturdayEvening,
      weekendEvening:
        previous?.passHome ??
        previous?.weekendEvening ??
        previous?.saturdayEvening,
      ...patch,
      humanTouched: true,
    }),
  };
}

/** 土=卵サンド、日=パン。平日は null */
export function defaultWeekendBreakfast(
  dateKey: string,
): WeekendBreakfastChoice | null {
  const weekday = weekdayFromKey(dateKey);
  if (weekday === 6) return "egg_sandwich";
  if (weekday === 0) return "bread";
  return null;
}

export function isWeekendMorning(dateKey: string, slot: MealSlot): boolean {
  return slot === "morning" && defaultWeekendBreakfast(dateKey) !== null;
}

export function isWeekendEvening(dateKey: string, slot: MealSlot): boolean {
  if (slot !== "evening") return false;
  const weekday = weekdayFromKey(dateKey);
  return weekday === 6 || weekday === 0;
}

/** @deprecated isWeekendEvening を使う */
export function isSaturdayEvening(dateKey: string, slot: MealSlot): boolean {
  return isWeekendEvening(dateKey, slot);
}

export function isWeekdaySlot(dateKey: string): boolean {
  const weekday = weekdayFromKey(dateKey);
  return weekday >= 1 && weekday <= 5;
}

export function morningStapleSettingsOf(state: KitchenState) {
  return normalizeMorningStapleSettings(state.settings?.morningStaple);
}

/** 人のその日の選択 > 設定の朝の定番。人の編集は上書きしない */
export function effectiveMorningStaple(
  state: KitchenState,
  dateKey: string,
): MorningStapleChoice {
  const pref = getSlotPref(state, dateKey, "morning");
  if (
    pref?.morningStaple === "rice" ||
    pref?.morningStaple === "bread" ||
    pref?.morningStaple === "egg_sandwich" ||
    pref?.morningStaple === "unset"
  ) {
    return pref.morningStaple;
  }
  if (
    pref?.weekendBreakfast === "rice" ||
    pref?.weekendBreakfast === "bread" ||
    pref?.weekendBreakfast === "egg_sandwich"
  ) {
    return pref.weekendBreakfast;
  }
  return defaultMorningStapleForDate(morningStapleSettingsOf(state), dateKey);
}

export function effectiveBreadKind(
  state: KitchenState,
  dateKey: string,
): BreadKind {
  const pref = getSlotPref(state, dateKey, "morning");
  if (
    pref?.breadKind === "toast" ||
    pref?.breadKind === "sandwich" ||
    pref?.breadKind === "hot_sandwich"
  ) {
    return pref.breadKind;
  }
  return defaultBreadKindForDate(morningStapleSettingsOf(state), dateKey);
}

export function effectiveMorningDishName(
  state: KitchenState,
  dateKey: string,
): string {
  return morningUsualDishName(
    effectiveMorningStaple(state, dateKey),
    effectiveBreadKind(state, dateKey),
  );
}

export function usesMorningProposal(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): boolean {
  return slot === "morning" && effectiveMorningStaple(state, dateKey) === "unset";
}

/** 人の選択 > 初期目安 */
export function effectiveWeekendBreakfast(
  state: KitchenState,
  dateKey: string,
): WeekendBreakfastChoice | null {
  const staple = effectiveMorningStaple(state, dateKey);
  if (staple === "egg_sandwich" || staple === "bread" || staple === "rice") {
    return staple;
  }
  return defaultWeekendBreakfast(dateKey);
}

/** 人の選択 > 保存した期間パス > 土日夕の初期実家 */
export function effectivePassHome(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): PassHomeChoice {
  const pref = getSlotPref(state, dateKey, slot);
  const explicit =
    pref?.passHome ?? pref?.weekendEvening ?? pref?.saturdayEvening;
  if (explicit === "pass" || explicit === "home") return explicit;
  if (state.passes.some((pass) => passCovers(pass, dateKey, slot))) {
    return "pass";
  }
  if (isWeekendEvening(dateKey, slot)) return "pass";
  return "home";
}

/** @deprecated effectivePassHome を使う（夕枠） */
export function effectiveWeekendEvening(
  state: KitchenState,
  dateKey: string,
): PassHomeChoice {
  return effectivePassHome(state, dateKey, "evening");
}

/** @deprecated effectivePassHome を使う */
export function effectiveSaturdayEvening(
  state: KitchenState,
  dateKey: string,
): PassHomeChoice {
  return effectivePassHome(state, dateKey, "evening");
}

export function weekendBreakfastLabel(
  choice: WeekendBreakfastChoice | null,
): string {
  if (choice === "egg_sandwich") return "卵サンド";
  if (choice === "bread") return "パン";
  if (choice === "rice") return "おにぎり";
  return "";
}

export type SlotLabelKind =
  | "meal"
  | "pass"
  | "default"
  | "suggestion"
  | "empty";

export type SlotLabel = {
  /** 献立名だけ。「（提案）」などは badge へ出す（truncate で切れないように） */
  text: string;
  kind: SlotLabelKind;
  /** 「定番」「提案」。確定・パス・未設定は null */
  badge: string | null;
  /** 「これにする」で1タップ確定できるか */
  canConfirm: boolean;
  /** 「レシピを検索」に渡す料理名。パス・未設定・外食／買って帰るは null */
  searchQuery: string | null;
};

/** 「主・副＋副」の区切りは検索では空白にする（サイト側の AND 検索に合わせる） */
function toSearchQuery(text: string): string | null {
  const query = text.replace(/[＋・]/g, " ").replace(/\s+/g, " ").trim();
  return query || null;
}

/** 表示用。人の「家」・期間パス > 土日定番目安 > 献立（デザート除外） > 提案 > 未設定 */
export function resolveSlotLabel(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): SlotLabel {
  const dishes = dishesOn(state, dateKey, slot);
  const pass = findPass(state, dateKey, slot);
  const nonDessert = dishes.filter((dish) => dish.role !== "dessert");
  const passHome = effectivePassHome(state, dateKey, slot);
  const touched = isSlotHumanTouched(state, dateKey, slot);

  // 期間パス・人が選んだパス（土日夕の初期より優先）。1日だけ「家」なら出さない
  if (passHome === "pass" && nonDessert.length === 0) {
    return {
      text: formatPassLine(pass?.reason ?? PASS_HOME_LABEL),
      kind: pass?.source === "default" ? "default" : "pass",
      badge: null,
      canConfirm: false,
      searchQuery: null,
    };
  }

  // 献立欄には主菜・副菜のみ（デザートは食べ忘れ欄）。人の編集は上書きしない
  if (nonDessert.length > 0) {
    const text = summarizeNames(nonDessert);
    // 外食・買って帰るは店名なので、レシピ検索には渡さない
    const eatingOut = nonDessert.some((dish) =>
      isMealExceptionSource(dish.sourceKind),
    );
    return {
      text,
      kind: "meal",
      badge: null,
      canConfirm: false,
      searchQuery: eatingOut ? null : toSearchQuery(text),
    };
  }

  // 人が触っていない朝の定番（ごはん→おにぎり。パンは種類名。決めていないは提案へ）
  if (!touched && slot === "morning" && passHome === "home") {
    const staple = effectiveMorningStaple(state, dateKey);
    if (staple !== "unset") {
      const name = effectiveMorningDishName(state, dateKey);
      return {
        text: name,
        kind: "default",
        badge: "定番",
        canConfirm: true,
        searchQuery: toSearchQuery(name),
      };
    }
  }

  if (slot === "morning" && passHome === "home") {
    const staple = effectiveMorningStaple(state, dateKey);
    if (staple !== "unset") {
      const name = effectiveMorningDishName(state, dateKey);
      return {
        text: name,
        kind: "meal",
        badge: null,
        canConfirm: false,
        searchQuery: toSearchQuery(name),
      };
    }
  }

  if (canProposeSlot(state, dateKey, slot)) {
    const proposal = buildWeekdayProposal(state, dateKey, slot);
    if (proposal.length > 0) {
      const text = proposal.map((d) => d.name).join("＋");
      return {
        text,
        kind: "suggestion",
        badge: "提案",
        canConfirm: true,
        searchQuery: toSearchQuery(text),
      };
    }
  }

  if (passHome === "pass") {
    return {
      text: PASS_HOME_LABEL,
      kind: "default",
      badge: null,
      canConfirm: false,
      searchQuery: null,
    };
  }

  return {
    text: "未設定",
    kind: "empty",
    badge: null,
    canConfirm: false,
    searchQuery: null,
  };
}

/**
 * 提案を出してよい枠か。ホームと献立で判定がずれないよう、ここに一本化する。
 * 献立が入っている・パス・人が触った夕の枠には出さない。
 */
export function canProposeSlot(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): boolean {
  const dishes = dishesOn(state, dateKey, slot);
  if (dishes.some((dish) => dish.role !== "dessert")) return false;
  if (effectivePassHome(state, dateKey, slot) !== "home") return false;
  if (usesMorningProposal(state, dateKey, slot)) return true;
  return slot === "evening" && !isSlotHumanTouched(state, dateKey, slot);
}

/** 出してよいときだけ提案の中身を返す。出さないときは空 */
export function slotProposal(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): FrequentDish[] {
  if (!canProposeSlot(state, dateKey, slot)) return [];
  return buildWeekdayProposal(state, dateKey, slot);
}

/** 「これにする」。提案はそのまま確定、定番は朝の定番をその日に書き込む */
export function confirmSlotLabel(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): KitchenState {
  const label = resolveSlotLabel(state, dateKey, slot);
  if (!label.canConfirm) return state;
  if (label.kind === "suggestion") {
    return acceptSlotProposal(state, dateKey, slot);
  }
  const staple = effectiveMorningStaple(state, dateKey);
  if (slot === "morning" && staple !== "unset") {
    return applyMorningStapleChoice(state, dateKey, staple);
  }
  return state;
}

function summarizeNames(dishes: PlannedDish[]): string {
  const exception = dishes.find(
    (dish) => dish.sourceKind === "eatout" || dish.sourceKind === "procure",
  );
  if (exception) {
    return formatMealSourceLine(exception);
  }
  const mains = dishes.filter((dish) => dish.role === "main");
  const sides = dishes.filter((dish) => dish.role === "side");
  return [
    mains.map((d) => d.name).join("・"),
    sides.map((d) => d.name).join("・"),
  ]
    .filter(Boolean)
    .join("＋");
}

/** 平日・土日「家」用の提案（自動では書き込まない） */
export function buildWeekdayProposal(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): FrequentDish[] {
  const frequents = state.frequentDishes ?? [];
  const mains = frequents.filter((dish) => dish.role === "main");
  const sides = frequents.filter((dish) => dish.role === "side");
  const result: FrequentDish[] = [];

  if (slot === "evening" && mains.length > 0) {
    const previous = lastEveningProtein(state, dateKey);
    const preferred: ProteinKind | null =
      previous === "meat" ? "fish" : previous === "fish" ? "meat" : null;
    const main =
      (preferred
        ? mains.find((dish) => dish.proteinKind === preferred)
        : null) ??
      mains[Math.abs(hashDate(dateKey)) % mains.length];
    result.push(main);
  } else if (slot === "morning" && frequents.length > 0) {
    // 朝は軽め: 副菜優先、なければ主菜
    if (sides.length > 0) {
      result.push(sides[Math.abs(hashDate(dateKey) + 1) % sides.length]);
    } else {
      result.push(mains[0] ?? frequents[0]);
    }
  }

  if (sides.length > 0) {
    const side = sides.find((dish) => !result.some((r) => r.id === dish.id));
    if (side) result.push(side);
    if (slot === "evening" && sides.length > 1) {
      const side2 = sides.find(
        (dish) => !result.some((r) => r.id === dish.id),
      );
      if (side2) result.push(side2);
    }
  }

  return result;
}

function hashDate(dateKey: string): number {
  return dateKey.split("-").reduce((sum, part) => sum + Number(part), 0);
}

export function applyMorningStapleChoice(
  state: KitchenState,
  dateKey: string,
  choice: MorningStapleChoice,
): KitchenState {
  const breadKind = effectiveBreadKind(state, dateKey);
  const weekendBreakfast: WeekendBreakfastChoice | undefined =
    choice === "egg_sandwich" || choice === "bread" || choice === "rice"
      ? choice
      : undefined;
  const next = markSlotHumanTouched(state, dateKey, "morning", {
    morningStaple: choice,
    weekendBreakfast,
    breadKind,
    passHome: "home",
    weekendEvening: "home",
  });
  if (choice === "unset") {
    return {
      ...next,
      meals: next.meals.filter(
        (dish) =>
          !(
            dish.date === dateKey &&
            dish.slot === "morning" &&
            dish.role !== "dessert"
          ),
      ),
    };
  }
  const name = morningUsualDishName(choice, breadKind);
  return {
    ...next,
    meals: replaceSlotDishes(next.meals, dateKey, "morning", {
      role: "main",
      name,
      proteinKind: null,
      sourceKind: "cook",
      placeName: null,
    }),
  };
}

export function applyBreadKindChoice(
  state: KitchenState,
  dateKey: string,
  kind: BreadKind,
): KitchenState {
  const next = markSlotHumanTouched(state, dateKey, "morning", {
    morningStaple: "bread",
    weekendBreakfast: "bread",
    breadKind: kind,
    passHome: "home",
    weekendEvening: "home",
  });
  return {
    ...next,
    meals: replaceSlotDishes(next.meals, dateKey, "morning", {
      role: "main",
      name: morningUsualDishName("bread", kind),
      proteinKind: null,
      sourceKind: "cook",
      placeName: null,
    }),
  };
}

export function addMorningRecipe(
  state: KitchenState,
  dateKey: string,
  title: string,
): KitchenState {
  const name = title.trim();
  if (!name) return state;
  const next = markSlotHumanTouched(state, dateKey, "morning", {
    passHome: "home",
    weekendEvening: "home",
  });
  return {
    ...next,
    meals: addPlannedDish(next.meals, {
      date: dateKey,
      slot: "morning",
      role: "main",
      name,
      proteinKind: null,
    }),
  };
}

export function applyWeekendBreakfastChoice(
  state: KitchenState,
  dateKey: string,
  choice: WeekendBreakfastChoice,
): KitchenState {
  return applyMorningStapleChoice(state, dateKey, choice);
}

export function applyPassHomeChoice(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
  choice: PassHomeChoice,
): KitchenState {
  let next = markSlotHumanTouched(state, dateKey, slot, {
    passHome: choice,
    weekendEvening: choice,
  });
  if (choice === "pass") {
    next = {
      ...next,
      meals: next.meals.filter(
        (dish) =>
          !(
            dish.date === dateKey &&
            dish.slot === slot &&
            dish.role !== "dessert"
          ),
      ),
    };
  }
  return next;
}

export function applyMealSourceChoice(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
  kind: MealSourceKind,
): KitchenState {
  const next = applyPassHomeChoice(state, dateKey, slot, "home");
  const current = slotSourceKind(dishesOn(next, dateKey, slot));
  if (kind === "cook") {
    if (current === "cook") return next;
    return {
      ...next,
      meals: next.meals.filter(
        (dish) =>
          !(
            dish.date === dateKey &&
            dish.slot === slot &&
            dish.role !== "dessert"
          ),
      ),
    };
  }
  if (current === kind) return next;
  return {
    ...next,
    meals: replaceSlotWithException(
      next.meals,
      dateKey,
      slot,
      kind,
      MEAL_SOURCE_LABELS[kind],
    ),
  };
}

export function applyMealSourcePlace(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
  kind: "eatout" | "procure",
  placeName: string,
): KitchenState {
  const name = placeName.trim();
  if (!name) return state;
  const next = applyPassHomeChoice(state, dateKey, slot, "home");
  return {
    ...next,
    meals: replaceSlotWithException(next.meals, dateKey, slot, kind, name),
  };
}

/** @deprecated applyPassHomeChoice を使う */
export function applyWeekendEveningChoice(
  state: KitchenState,
  dateKey: string,
  choice: PassHomeChoice,
): KitchenState {
  return applyPassHomeChoice(state, dateKey, "evening", choice);
}

/** @deprecated applyPassHomeChoice を使う */
export function applySaturdayEveningChoice(
  state: KitchenState,
  dateKey: string,
  choice: PassHomeChoice,
): KitchenState {
  return applyPassHomeChoice(state, dateKey, "evening", choice);
}

export function acceptSlotProposal(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): KitchenState {
  if (dishesOn(state, dateKey, slot).some((d) => d.role !== "dessert")) {
    return markSlotHumanTouched(state, dateKey, slot);
  }
  const proposal = buildWeekdayProposal(state, dateKey, slot);
  if (proposal.length === 0) return state;

  let meals = state.meals.filter(
    (dish) =>
      !(dish.date === dateKey && dish.slot === slot && dish.role !== "dessert"),
  );
  for (const dish of proposal) {
    meals = addPlannedDish(meals, {
      date: dateKey,
      slot,
      role: dish.role,
      name: dish.name,
      proteinKind: dish.proteinKind,
      sourceKind: "cook",
      placeName: null,
    });
  }
  return markSlotHumanTouched({ ...state, meals }, dateKey, slot);
}

/** 提案を出してよいか（実家パスのときは出さない） */
export function shouldShowEveningProposal(
  state: KitchenState,
  dateKey: string,
): boolean {
  if (effectivePassHome(state, dateKey, "evening") !== "home") return false;
  return slotSourceKind(dishesOn(state, dateKey, "evening")) === "cook";
}
