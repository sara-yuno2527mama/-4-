export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 0=日 … 6=土 */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

export type InventoryKind = "sideDish" | "dessert" | "ingredient" | "prepared";

export const INVENTORY_KIND_LABELS: Record<InventoryKind, string> = {
  sideDish: "総菜",
  dessert: "デザート",
  ingredient: "食材",
  prepared: "作り置き",
};

export type RecipeSiteId = "cookpad" | "kurashiru" | "google";

export type RhythmSlot = {
  weekday: Weekday;
  title: string;
  prepNote: string;
};

export type RhythmException = {
  id: string;
  date: string;
  title: string;
  prepNote: string;
  isOff: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  kind: InventoryKind;
  quantity: string;
  useByDate: string | null;
  memo: string;
  photoDataUrl: string | null;
  createdAt: string;
  /** 「使い切った」を押した日時。削除とは別で、一覧からは消える */
  usedUpAt?: string | null;
};

export type RecipeIngredient = {
  name: string;
  amount: string;
};

/** レシピジャンル（複数可） */
export type RecipeGenre =
  | "meat"
  | "fish"
  | "noodle"
  | "rice"
  | "side"
  | "salad"
  | "soup"
  | "dessert"
  | "other";

export const RECIPE_GENRES: RecipeGenre[] = [
  "meat",
  "fish",
  "noodle",
  "rice",
  "side",
  "salad",
  "soup",
  "dessert",
  "other",
];

export const RECIPE_GENRE_LABELS: Record<RecipeGenre, string> = {
  meat: "肉",
  fish: "魚",
  noodle: "麺",
  rice: "米",
  side: "副菜",
  salad: "サラダ",
  soup: "スープ",
  dessert: "デザート",
  other: "その他",
};

export type SavedRecipe = {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  photos: string[];
  coverIndex: number;
  screenshotType: "site" | "instagram" | "unknown";
  genres: RecipeGenre[];
  createdAt: string;
  /** 取り込んだ／保存した人。未設定は member-self */
  ownerMemberId?: string;
  /** 未設定は family（既存データ互換）。新規は private */
  visibility?: RecipeVisibility;
  /** 子どもに出してよい印（レシピの印） */
  childMark?: boolean;
  /** 人ごとのマーク（お気に入り／いつか作りたい／作った） */
  memberMarks?: Record<string, RecipePersonMark[]>;
  /** 共有リンクからコピーした場合の元ID */
  sourceRecipeId?: string | null;
};

export type RecipeVisibility = "private" | "family";

export type RecipePersonMark = "favorite" | "later" | "made";
export type RecipeMark = RecipePersonMark | "child";

export const RECIPE_PERSON_MARKS: RecipePersonMark[] = [
  "favorite",
  "later",
  "made",
];

export const RECIPE_MARKS: RecipeMark[] = [
  "favorite",
  "later",
  "child",
  "made",
];

export const RECIPE_MARK_LABELS: Record<RecipeMark, string> = {
  favorite: "お気に入り",
  later: "いつか作りたい",
  made: "作った",
  child: "子ども",
};

export const RECIPE_VISIBILITY_LABELS: Record<RecipeVisibility, string> = {
  private: "自分だけ",
  family: "家族全員",
};

/** 別世帯向け共有リンクのスナップショット（一覧には出さない） */
export type RecipeShareSnapshot = {
  token: string;
  householdId: string;
  sourceRecipeId: string;
  title: string;
  ingredients: RecipeIngredient[];
  photos: string[];
  coverIndex: number;
  screenshotType: SavedRecipe["screenshotType"];
  genres: RecipeGenre[];
  createdAt: string;
};

export type HouseholdMember = {
  id: string;
  displayName: string;
  email: string;
  lineUserId: string | null;
  lineLinked: boolean;
};

export type NotifyLog = {
  rhythmForDate: string | null;
  useByForDate: string | null;
  missingUseByForDate: string | null;
};

/** 朝の定番。平日のみ決めていない可 */
export type MorningStapleChoice = "rice" | "bread" | "egg_sandwich" | "unset";
export type WeekendMorningStaple = Exclude<MorningStapleChoice, "unset">;
export type BreadKind = "toast" | "sandwich" | "hot_sandwich";

export type MorningStapleSettings = {
  weekday: MorningStapleChoice;
  saturday: WeekendMorningStaple;
  sunday: WeekendMorningStaple;
  weekdayBreadKind: BreadKind;
  saturdayBreadKind: BreadKind;
  sundayBreadKind: BreadKind;
};

export type AppSettings = {
  recipeSite: RecipeSiteId;
  notifyRhythmHour: number;
  notifyUseByHour: number;
  morningStaple: MorningStapleSettings;
};

export type MealSlot = "morning" | "evening";
export type DishRole = "main" | "side" | "dessert";
export type ProteinKind = "meat" | "fish";

export const PROTEIN_LABELS: Record<ProteinKind, string> = {
  meat: "肉",
  fish: "魚",
};

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  morning: "朝",
  evening: "夕",
};

export const DISH_ROLE_LABELS: Record<DishRole, string> = {
  main: "主菜",
  side: "副菜",
  dessert: "デザート",
};

export type FrequentDish = {
  id: string;
  name: string;
  role: "main" | "side";
  proteinKind: ProteinKind | null;
};

export type PassReasonId =
  | "home"
  | "invited"
  | "eatout"
  | "papa"
  | "holiday"
  | "custom";

/** 表示だけの言い換え。データ・内部名は "pass" のまま */
export const PASS_HOME_LABEL = "実家ごはん（作らない）";

export const PASS_REASON_LABELS: Record<PassReasonId, string> = {
  home: PASS_HOME_LABEL,
  invited: "お呼ばれ",
  eatout: "外食",
  papa: "パパ担当",
  holiday: "連休",
  custom: "手入力",
};

export const PASS_REASON_IDS: PassReasonId[] = [
  "home",
  "invited",
  "eatout",
  "papa",
  "holiday",
  "custom",
];

export type DayPass = {
  id: string;
  startDate: string;
  endDate: string;
  slot: MealSlot | "both";
  reasonId: PassReasonId;
  customReason: string;
};

export type PlannedDish = {
  id: string;
  date: string;
  slot: MealSlot;
  role: DishRole;
  name: string;
  proteinKind: ProteinKind | null;
  eaten: boolean;
  /** 家で作る／外食／調達（未設定は cook） */
  sourceKind?: MealSourceKind;
  /** 外食・調達の店名（記録・編集用） */
  placeName?: string | null;
};

/** 献立の出所。家で作る／外食／調達 */
export type MealSourceKind = "cook" | "eatout" | "procure";

export const MEAL_SOURCE_LABELS: Record<MealSourceKind, string> = {
  cook: "家で作る",
  eatout: "外食",
  /** データ側の値は "procure" のまま。表示だけ「買って帰る」 */
  procure: "買って帰る",
};

/** 外食／調達の定番の店 */
export type FavoritePlace = {
  id: string;
  kind: "eatout" | "procure";
  name: string;
};

/** 土日朝の選択（ごはん追加。旧データは卵サンド／パンのみ） */
export type WeekendBreakfastChoice = "egg_sandwich" | "bread" | "rice";

/** 実家（パス）／家。どの日の朝夕でも選択可 */
export type PassHomeChoice = "pass" | "home";
/** @deprecated PassHomeChoice を使う */
export type WeekendEveningChoice = PassHomeChoice;
/** @deprecated PassHomeChoice を使う */
export type SaturdayEveningChoice = PassHomeChoice;

/**
 * 枠ごとの人の選択・編集ロック。
 * 優先: 人の編集・選択 > 定番/提案の自動
 */
export type MealSlotPref = {
  date: string;
  slot: MealSlot;
  humanTouched: boolean;
  weekendBreakfast?: WeekendBreakfastChoice;
  /** その朝の定番（設定より優先。人の選択） */
  morningStaple?: MorningStapleChoice;
  /** パンを選んだときの種類 */
  breadKind?: BreadKind;
  /** 実家（パス）／家（どの日・枠でも） */
  passHome?: PassHomeChoice;
  /** 旧: 土日夕。passHome へ移行 */
  weekendEvening?: PassHomeChoice;
  /** 旧フィールド互換 */
  saturdayEvening?: PassHomeChoice;
};

export type KitchenMemo = {
  id: string;
  text: string;
  createdAt: string;
};

export type DeliveryKind = "oisix" | "fcoop" | "other";

export type DeliveryService = {
  id: string;
  kind: DeliveryKind;
  name: string;
  showOnHome: boolean;
  /** その他のみ。data URL。外部URLは使わない */
  markImageDataUrl?: string | null;
  deliveryDate: string | null;
  changeDeadlineAt: string | null;
  amount: string;
  menuItems: string[];
  ingredients: string[];
  pendingPlus14: boolean;
};

export type OisixCycle = {
  deliveryDate: string | null;
  changeDeadlineAt: string | null;
  amount: string;
  menuItems: string[];
  ingredients: string[];
  pendingPlus14: boolean;
};

export type KitchenState = {
  version: 1;
  householdId: string;
  householdName: string;
  inviteToken: string | null;
  familyPhotoDataUrl: string | null;
  members: HouseholdMember[];
  rhythm: RhythmSlot[];
  exceptions: RhythmException[];
  inventory: InventoryItem[];
  recipes: SavedRecipe[];
  /** 共有リンク用。画面の一覧には出さない */
  recipeShares: RecipeShareSnapshot[];
  meals: PlannedDish[];
  passes: DayPass[];
  mealSlotPrefs: MealSlotPref[];
  frequentDishes: FrequentDish[];
  favoritePlaces: FavoritePlace[];
  memos: KitchenMemo[];
  /** 宅配サービス（複数）。ホームは showOnHome だけ */
  deliveries: DeliveryService[];
  /** 旧データ互換。オイシックスサービスの日付ミラー */
  oisix: OisixCycle;
  settings: AppSettings;
  notifyLog: NotifyLog;
};

export const DEFAULT_OISIX: OisixCycle = {
  deliveryDate: null,
  changeDeadlineAt: null,
  amount: "",
  menuItems: [],
  ingredients: [],
  pendingPlus14: false,
};

export const DEFAULT_OISIX_DELIVERY: DeliveryService = {
  id: "delivery-oisix",
  kind: "oisix",
  name: "オイシックス",
  showOnHome: true,
  markImageDataUrl: null,
  ...DEFAULT_OISIX,
};

export const DEFAULT_FREQUENT_DISHES: FrequentDish[] = [
  { id: "freq-salmon", name: "塩鮭", role: "main", proteinKind: "fish" },
  { id: "freq-ginger", name: "生姜焼き", role: "main", proteinKind: "meat" },
  { id: "freq-hijiki", name: "ひじき", role: "side", proteinKind: null },
  { id: "freq-salad", name: "サラダ", role: "side", proteinKind: null },
  { id: "freq-yogurt", name: "ヨーグルト", role: "side", proteinKind: null },
];

export const DEFAULT_FAVORITE_PLACES: FavoritePlace[] = [
  { id: "place-eat-sushi", kind: "eatout", name: "回転寿司" },
  { id: "place-eat-yakiniku", kind: "eatout", name: "焼肉" },
  { id: "place-proc-deli", kind: "procure", name: "スーパー惣菜" },
  { id: "place-proc-bento", kind: "procure", name: "お弁当屋" },
  { id: "place-proc-takeout", kind: "procure", name: "テイクアウト" },
];

export const DEFAULT_STATE: KitchenState = {
  version: 1,
  householdId: "household-local",
  householdName: "木山家",
  inviteToken: null,
  familyPhotoDataUrl: null,
  members: [
    {
      id: "member-self",
      displayName: "ママ",
      email: "",
      lineUserId: null,
      lineLinked: false,
    },
    {
      id: "member-papa",
      displayName: "パパ",
      email: "",
      lineUserId: null,
      lineLinked: false,
    },
  ],
  rhythm: [
    { weekday: 1, title: "おにぎり", prepNote: "具を前日に用意" },
    { weekday: 2, title: "おにぎり", prepNote: "具を前日に用意" },
    { weekday: 3, title: "おにぎり", prepNote: "具を前日に用意" },
    { weekday: 4, title: "おにぎり", prepNote: "具を前日に用意" },
    { weekday: 5, title: "おにぎり", prepNote: "具を前日に用意" },
    { weekday: 6, title: "卵サンド", prepNote: "卵をゆでておく" },
  ],
  exceptions: [],
  inventory: [],
  recipes: [],
  recipeShares: [],
  meals: [],
  passes: [],
  mealSlotPrefs: [],
  frequentDishes: DEFAULT_FREQUENT_DISHES,
  favoritePlaces: DEFAULT_FAVORITE_PLACES,
  memos: [],
  deliveries: [{ ...DEFAULT_OISIX_DELIVERY }],
  oisix: DEFAULT_OISIX,
  settings: {
    recipeSite: "cookpad",
    notifyRhythmHour: 20,
    notifyUseByHour: 7,
    morningStaple: {
      weekday: "rice",
      saturday: "egg_sandwich",
      sunday: "bread",
      weekdayBreadKind: "toast",
      saturdayBreadKind: "toast",
      sundayBreadKind: "toast",
    },
  },
  notifyLog: {
    rhythmForDate: null,
    useByForDate: null,
    missingUseByForDate: null,
  },
};
