import { addDaysToKey, tokyoDateKey } from "./dates";
import { weekdayFromKey } from "./meals";
import { withDeliveries } from "./delivery";
import { DEFAULT_OISIX_DELIVERY, type KitchenState, type PlannedDish } from "./types";

export function isKitchenDemoEmpty(state: KitchenState): boolean {
  return (
    state.inventory.length === 0 &&
    state.recipes.length === 0 &&
    state.meals.length === 0 &&
    state.memos.length === 0 &&
    !state.members.some((member) => member.lineUserId)
  );
}

function isWeekendKey(dateKey: string): boolean {
  const weekday = weekdayFromKey(dateKey);
  return weekday === 0 || weekday === 6;
}

/** デモ献立が土日の定番（朝の卵サンド／パン、夕の実家）を潰さないようにする */
export function scrubDemoWeekendMeals(state: KitchenState): KitchenState {
  const meals = state.meals.filter((dish) => {
    if (!dish.id.startsWith("demo-meal-")) return true;
    if (!isWeekendKey(dish.date)) return true;
    // 土日の朝・夕のデモ献立（通常メニューもデザートも）は除去
    return false;
  });
  if (meals.length === state.meals.length) return state;
  return { ...state, meals };
}

function demoMeals(today: string): PlannedDish[] {
  const d = (offset: number) => addDaysToKey(today, offset);
  const items: PlannedDish[] = [];

  // 今日が平日のときだけ、今日の朝夕・デザートサンプルを載せる（土日定番を潰さない）
  if (!isWeekendKey(today)) {
    items.push(
      {
        id: "demo-meal-morning-main",
        date: today,
        slot: "morning",
        role: "main",
        name: "おにぎり",
        proteinKind: null,
        eaten: false,
      },
      {
        id: "demo-meal-morning-side",
        date: today,
        slot: "morning",
        role: "side",
        name: "ヨーグルト",
        proteinKind: null,
        eaten: false,
      },
      {
        id: "demo-meal-evening-main",
        date: today,
        slot: "evening",
        role: "main",
        name: "生姜焼き",
        proteinKind: "meat",
        eaten: false,
      },
      {
        id: "demo-meal-evening-side",
        date: today,
        slot: "evening",
        role: "side",
        name: "ひじき",
        proteinKind: null,
        eaten: false,
      },
      {
        id: "demo-meal-dessert",
        date: today,
        slot: "evening",
        role: "dessert",
        name: "プリン",
        proteinKind: null,
        eaten: false,
      },
    );
  }
  // 土日は朝夕・デザートのデモ献立を載せない（在庫のプリンは食べ忘れ用）

  const futureEvening: { id: string; offset: number; name: string; protein: "meat" | "fish"; side?: string }[] =
    [
      { id: "demo-meal-d1-eve", offset: 1, name: "塩鮭", protein: "fish", side: "サラダ" },
      { id: "demo-meal-d2-eve", offset: 2, name: "生姜焼き", protein: "meat" },
      { id: "demo-meal-d3-eve", offset: 3, name: "塩鮭", protein: "fish" },
      { id: "demo-meal-d4-eve", offset: 4, name: "生姜焼き", protein: "meat" },
    ];

  for (const item of futureEvening) {
    const date = d(item.offset);
    if (isWeekendKey(date)) continue;
    items.push({
      id: item.id,
      date,
      slot: "evening",
      role: "main",
      name: item.name,
      proteinKind: item.protein,
      eaten: false,
    });
    if (item.side) {
      items.push({
        id: `${item.id}-side`,
        date,
        slot: "evening",
        role: "side",
        name: item.side,
        proteinKind: null,
        eaten: false,
      });
    }
  }

  const pastEvening: { id: string; offset: number; name: string; protein: "meat" | "fish" }[] =
    [
      { id: "demo-meal-past1", offset: -1, name: "塩鮭", protein: "fish" },
      { id: "demo-meal-past2", offset: -2, name: "生姜焼き", protein: "meat" },
      { id: "demo-meal-past3", offset: -3, name: "塩鮭", protein: "fish" },
    ];

  for (const item of pastEvening) {
    const date = d(item.offset);
    if (isWeekendKey(date)) continue;
    items.push({
      id: item.id,
      date,
      slot: "evening",
      role: "main",
      name: item.name,
      proteinKind: item.protein,
      eaten: true,
    });
  }

  return items;
}

export function seedDemoKitchenState(state: KitchenState): KitchenState {
  const members = state.members.map((member) => ({
    ...member,
    displayName:
      member.displayName === "papa" || member.displayName === "自分"
        ? member.id === "member-self"
          ? "ママ"
          : "パパ"
        : member.displayName,
  }));

  if (!isKitchenDemoEmpty(state)) {
    return scrubDemoWeekendMeals({
      ...state,
      members,
      inviteToken: state.inviteToken || "invite-demo-kitchen",
    });
  }

  const today = tokyoDateKey();
  const tomorrow = addDaysToKey(today, 1);
  const inTwoDays = addDaysToKey(today, 2);
  const delivery = addDaysToKey(today, 4);

  const next = scrubDemoWeekendMeals({
    ...state,
    householdName: state.householdName === "わが家" ? "木山家" : state.householdName,
    inviteToken: state.inviteToken || "invite-demo-kitchen",
    members,
    inventory: [
      {
        id: "demo-chicken",
        name: "鶏もも肉",
        kind: "ingredient",
        quantity: "2枚",
        useByDate: inTwoDays,
        memo: "",
        photoDataUrl: null,
        createdAt: `${today}T08:00:00.000Z`,
      },
      {
        id: "demo-hijiki",
        name: "ひじき",
        kind: "prepared",
        quantity: "1パック",
        useByDate: tomorrow,
        memo: "",
        photoDataUrl: null,
        createdAt: `${today}T08:00:00.000Z`,
      },
      {
        id: "demo-pudding",
        name: "プリン",
        kind: "dessert",
        quantity: "2個",
        useByDate: today,
        memo: "",
        photoDataUrl: null,
        createdAt: `${today}T08:00:00.000Z`,
      },
      {
        id: "demo-milk",
        name: "牛乳",
        kind: "ingredient",
        quantity: "1本",
        useByDate: null,
        memo: "",
        photoDataUrl: null,
        createdAt: `${today}T08:00:00.000Z`,
      },
    ],
    recipes: [
      {
        id: "demo-recipe-teriyaki",
        title: "鶏の照り焼き",
        ingredients: [
          { name: "鶏もも肉", amount: "300g" },
          { name: "しょうゆ", amount: "大さじ2" },
          { name: "みりん", amount: "大さじ2" },
        ],
        photos: ["/demo/cover-teriyaki.svg"],
        coverIndex: 0,
        screenshotType: "site",
        genres: ["meat"],
        createdAt: `${today}T08:00:00.000Z`,
      },
      {
        id: "demo-recipe-hijiki",
        title: "ひじきの煮物",
        ingredients: [
          { name: "ひじき", amount: "20g" },
          { name: "人参", amount: "1/3本" },
        ],
        photos: ["/demo/cover-hijiki.svg"],
        coverIndex: 0,
        screenshotType: "site",
        genres: ["side"],
        createdAt: `${today}T08:00:00.000Z`,
      },
    ],
    meals: demoMeals(today),
    memos: [
      {
        id: "demo-memo-1",
        text: "牛乳を出す",
        createdAt: `${today}T07:30:00.000Z`,
      },
      {
        id: "demo-memo-2",
        text: "保育園の提出物",
        createdAt: `${today}T07:10:00.000Z`,
      },
    ],
    oisix: {
      ...state.oisix,
      deliveryDate: delivery,
      changeDeadlineAt: `${inTwoDays}T12:00`,
      menuItems: state.oisix.menuItems.length
        ? state.oisix.menuItems
        : ["塩鮭", "ひじき"],
    },
  });
  const oisix = next.oisix;
  const deliveries = (next.deliveries ?? []).some((item) => item.kind === "oisix")
    ? (next.deliveries ?? []).map((item) =>
        item.kind === "oisix"
          ? { ...item, ...oisix, showOnHome: true, name: "オイシックス" }
          : item,
      )
    : [{ ...DEFAULT_OISIX_DELIVERY, ...oisix, showOnHome: true }];
  return withDeliveries(next, deliveries);
}
