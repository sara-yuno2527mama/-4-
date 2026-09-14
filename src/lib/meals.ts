import { addDaysToKey, dateFromKey, formatJaDate, tokyoDateKey } from "./dates";
import {
  MEAL_SOURCE_LABELS,
  PASS_HOME_LABEL,
  PASS_REASON_LABELS,
  PROTEIN_LABELS,
  type DayPass,
  type KitchenState,
  type MealSlot,
  type MealSlotPref,
  type PassReasonId,
  type MealSourceKind,
  type PlannedDish,
  type ProteinKind,
  type Weekday,
} from "./types";

export function rollingFourteenDays(fromKey = tokyoDateKey()): string[] {
  return Array.from({ length: 14 }, (_, index) => addDaysToKey(fromKey, index));
}

export function rollingWeek(fromKey: string, week: 0 | 1): string[] {
  return rollingFourteenDays(fromKey).slice(week * 7, week * 7 + 7);
}

export function weekdayFromKey(dateKey: string): Weekday {
  return dateFromKey(dateKey).getDay() as Weekday;
}

export function isBreadReminderDay(dateKey: string): boolean {
  const weekday = weekdayFromKey(dateKey);
  return weekday === 4 || weekday === 5;
}

export function passCovers(
  pass: DayPass,
  dateKey: string,
  slot: MealSlot,
): boolean {
  if (dateKey < pass.startDate || dateKey > pass.endDate) return false;
  return pass.slot === "both" || pass.slot === slot;
}

/** UI表示用。それだけで意味が通る理由には「パス ·」を付けない */
export function formatPassLine(reason: string): string {
  if (reason === PASS_HOME_LABEL || reason.includes("パス")) return reason;
  return `パス · ${reason}`;
}

export function findPass(
  state: KitchenState,
  dateKey: string,
  slot: MealSlot,
): { reason: string; source: "stored" | "default" } | null {
  const pref = (state.mealSlotPrefs ?? []).find(
    (item) => item.date === dateKey && item.slot === slot,
  );
  const explicit =
    pref?.passHome ??
    (slot === "evening"
      ? pref?.weekendEvening ?? pref?.saturdayEvening
      : undefined);

  // 人の「家」選択 > 定番/保存パス
  if (explicit === "home") return null;

  const stored = state.passes.find((pass) => passCovers(pass, dateKey, slot));
  if (stored) {
    const reason =
      stored.reasonId === "custom" && stored.customReason.trim()
        ? stored.customReason.trim()
        : PASS_REASON_LABELS[stored.reasonId];
    return { reason, source: "stored" };
  }

  // 人が「実家ごはん（作らない）」を選んだ枠
  if (explicit === "pass") {
    return { reason: PASS_HOME_LABEL, source: "stored" };
  }

  // 目安: 土日の夕のみ初期で実家ごはん
  if (
    slot === "evening" &&
    (weekdayFromKey(dateKey) === 6 || weekdayFromKey(dateKey) === 0)
  ) {
    return { reason: PASS_HOME_LABEL, source: "default" };
  }
  return null;
}

export const PASS_LIST_WINDOW_DAYS = 60;

export function listedPeriodPasses(
  state: KitchenState,
  fromKey = tokyoDateKey(),
): DayPass[] {
  const windowEnd = addDaysToKey(fromKey, PASS_LIST_WINDOW_DAYS);
  return [...state.passes]
    .filter(
      (pass) => pass.startDate <= windowEnd && pass.endDate >= fromKey,
    )
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        a.endDate.localeCompare(b.endDate),
    );
}

export function passSlotLine(slot: MealSlot | "both"): string {
  if (slot === "morning") return "朝";
  if (slot === "evening") return "夕";
  return "朝夕";
}

export function passReasonLine(pass: DayPass): string {
  if (pass.reasonId === "custom" && pass.customReason.trim()) {
    return pass.customReason.trim();
  }
  return PASS_REASON_LABELS[pass.reasonId];
}

/** 例: 9/12（土）〜9/15（火） · 朝夕 · 連休 */
export function formatPassListLine(pass: DayPass): string {
  const dates =
    pass.startDate === pass.endDate
      ? formatJaDate(pass.startDate)
      : `${formatJaDate(pass.startDate)}〜${formatJaDate(pass.endDate)}`;
  return `${dates} · ${passSlotLine(pass.slot)} · ${passReasonLine(pass)}`;
}

export function addPeriodPass(
  state: KitchenState,
  input: {
    startDate: string;
    endDate: string;
    slot: MealSlot | "both";
    reasonId: PassReasonId;
    customReason: string;
  },
): KitchenState {
  const start =
    input.startDate <= input.endDate ? input.startDate : input.endDate;
  const end =
    input.startDate <= input.endDate ? input.endDate : input.startDate;
  const pass: DayPass = {
    id: crypto.randomUUID(),
    startDate: start,
    endDate: end,
    slot: input.slot,
    reasonId: input.reasonId,
    customReason: input.customReason.trim(),
  };

  const coversPref = (pref: MealSlotPref) =>
    pref.date >= start &&
    pref.date <= end &&
    (input.slot === "both" || pref.slot === input.slot);

  return {
    ...state,
    passes: [...state.passes, pass],
    meals: state.meals.filter((dish) => {
      if (dish.role === "dessert") return true;
      if (dish.date < start || dish.date > end) return true;
      if (input.slot === "both" || dish.slot === input.slot) return false;
      return true;
    }),
    mealSlotPrefs: (state.mealSlotPrefs ?? []).map((pref) => {
      if (!coversPref(pref)) return pref;
      const next = { ...pref };
      delete next.passHome;
      delete next.weekendEvening;
      delete next.saturdayEvening;
      return next;
    }),
  };
}

export function dishesOn(
  state: KitchenState,
  dateKey: string,
  slot?: MealSlot,
): PlannedDish[] {
  return state.meals.filter(
    (dish) => dish.date === dateKey && (slot ? dish.slot === slot : true),
  );
}

export function isMealExceptionSource(
  kind: PlannedDish["sourceKind"] | undefined,
): kind is "eatout" | "procure" {
  return kind === "eatout" || kind === "procure";
}

export function slotSourceKind(dishes: PlannedDish[]): MealSourceKind {
  const exception = dishes.find(
    (dish) =>
      dish.role !== "dessert" && isMealExceptionSource(dish.sourceKind),
  );
  return exception?.sourceKind ?? "cook";
}

export function formatMealSourceLine(dish: PlannedDish): string {
  if (!isMealExceptionSource(dish.sourceKind)) return dish.name;
  const kindLabel = MEAL_SOURCE_LABELS[dish.sourceKind];
  const place = (dish.placeName || dish.name).trim();
  if (!place || place === kindLabel) return kindLabel;
  return `${kindLabel} · ${place}`;
}

export function summarizeSlot(dishes: PlannedDish[]): string {
  const exception = dishes.find((dish) =>
    isMealExceptionSource(dish.sourceKind),
  );
  if (exception) {
    return formatMealSourceLine(exception);
  }
  const mains = dishes.filter((dish) => dish.role === "main");
  const sides = dishes.filter((dish) => dish.role === "side");
  // デザートは献立サマリーに出さない（食べ忘れ欄用）
  if (mains.length === 0 && sides.length === 0) {
    return "";
  }
  const mainText = mains
    .map((dish) =>
      dish.proteinKind
        ? `${dish.name}（${PROTEIN_LABELS[dish.proteinKind]}）`
        : dish.name,
    )
    .join("・");
  const sideText = sides.map((dish) => dish.name).join("・");
  return [mainText, sideText].filter(Boolean).join("＋");
}

export function lastEveningProtein(
  state: KitchenState,
  beforeDateKey: string,
): ProteinKind | null {
  const previous = state.meals
    .filter(
      (dish) =>
        dish.slot === "evening" &&
        dish.role === "main" &&
        dish.proteinKind &&
        !isMealExceptionSource(dish.sourceKind) &&
        dish.date < beforeDateKey,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return previous?.proteinKind ?? null;
}

export function formatWeekdayLine(dateKey: string): string {
  return formatJaDate(dateKey);
}

export function addPlannedDish(
  meals: PlannedDish[],
  dish: Omit<PlannedDish, "id" | "eaten"> & {
    eaten?: boolean;
    id?: string;
  },
): PlannedDish[] {
  return [
    ...meals,
    {
      ...dish,
      id: dish.id || crypto.randomUUID(),
      eaten: Boolean(dish.eaten),
      sourceKind: dish.sourceKind ?? "cook",
      placeName: dish.placeName ?? null,
    },
  ];
}

export function suggestedRolesFilled(dishes: PlannedDish[]): {
  hasMain: boolean;
  sideCount: number;
} {
  return {
    hasMain: dishes.some((dish) => dish.role === "main"),
    sideCount: dishes.filter((dish) => dish.role === "side").length,
  };
}

export function dessertUneaten(state: KitchenState, dateKey: string): PlannedDish[] {
  return state.meals.filter(
    (dish) => dish.date === dateKey && dish.role === "dessert" && !dish.eaten,
  );
}

/** 今日〜14日＋保存済みの過去日（古い順→未来） */
export function mealCalendarKeys(
  state: KitchenState,
  todayKey = tokyoDateKey(),
): string[] {
  const past = new Set<string>();
  for (const dish of state.meals) {
    if (dish.date < todayKey) past.add(dish.date);
  }
  for (const pass of state.passes) {
    let cursor = pass.startDate;
    for (let i = 0; i < 400; i++) {
      if (cursor > pass.endDate) break;
      if (cursor < todayKey) past.add(cursor);
      cursor = addDaysToKey(cursor, 1);
    }
  }
  return [...[...past].sort(), ...rollingFourteenDays(todayKey)];
}

/** その日の献立から傾向用ジャンル（肉・魚などを優先） */
export function dayHighlightGenres(
  state: KitchenState,
  dateKey: string,
): ProteinKind[] {
  const order: ProteinKind[] = [];
  const seen = new Set<ProteinKind>();
  const push = (kind: ProteinKind | null | undefined) => {
    if (!kind || seen.has(kind)) return;
    seen.add(kind);
    order.push(kind);
  };

  for (const dish of dishesOn(state, dateKey)) {
    if (isMealExceptionSource(dish.sourceKind)) continue;
    if (dish.proteinKind) push(dish.proteinKind);
    const recipe = state.recipes.find((item) => item.title === dish.name);
    if (recipe?.genres.includes("meat")) push("meat");
    if (recipe?.genres.includes("fish")) push("fish");
  }
  return order;
}

export function replaceSlotDishes(
  meals: PlannedDish[],
  date: string,
  slot: MealSlot,
  next: {
    role: PlannedDish["role"];
    name: string;
    proteinKind: PlannedDish["proteinKind"];
    eaten?: boolean;
    sourceKind?: PlannedDish["sourceKind"];
    placeName?: string | null;
  },
): PlannedDish[] {
  const kept = meals.filter(
    (dish) =>
      !(dish.date === date && dish.slot === slot && dish.role !== "dessert"),
  );
  return addPlannedDish(kept, {
    date,
    slot,
    role: next.role,
    name: next.name,
    proteinKind: next.proteinKind,
    eaten: next.eaten,
    sourceKind: next.sourceKind ?? "cook",
    placeName: next.placeName ?? null,
  });
}

/** 外食・買って帰るを記録（枠の料理を差し替え）。店名が空なら種別名だけ残す */
export function replaceSlotWithException(
  meals: PlannedDish[],
  date: string,
  slot: MealSlot,
  kind: "eatout" | "procure",
  placeName: string,
): PlannedDish[] {
  const label = MEAL_SOURCE_LABELS[kind];
  const name = placeName.trim() || label;
  return replaceSlotDishes(meals, date, slot, {
    role: "main",
    name,
    proteinKind: null,
    sourceKind: kind,
    placeName: name,
  });
}

