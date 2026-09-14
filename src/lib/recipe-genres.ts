import {
  RECIPE_GENRES,
  type RecipeGenre,
  type RecipeIngredient,
} from "./types";

const GENRE_SET = new Set<string>(RECIPE_GENRES);

/** API・保存データのジャンルを正規化（未知は落とす。空なら other） */
export function normalizeRecipeGenres(raw: unknown): RecipeGenre[] {
  const list = Array.isArray(raw) ? raw : [];
  const genres = [
    ...new Set(
      list
        .map((item) => String(item ?? "").trim())
        .filter((item): item is RecipeGenre => GENRE_SET.has(item)),
    ),
  ];
  return genres.length > 0 ? genres : ["other"];
}

/** タイトル・材料からざっくり推定（読取失敗時や旧データの補完） */
export function inferRecipeGenres(
  title: string,
  ingredients: RecipeIngredient[] = [],
): RecipeGenre[] {
  const text = [title, ...ingredients.map((item) => item.name)].join(" ");
  const found = new Set<RecipeGenre>();

  if (/肉|鶏|豚|牛|ひき肉|ソーセージ|ベーコン|ハム/.test(text)) found.add("meat");
  if (/魚|鮭|さけ|鯖|さば|いわし|あじ|さんま|まぐろ|ツナ|えび|エビ|いか|イカ|海鮮/.test(text)) {
    found.add("fish");
  }
  if (/麺|うどん|そば|パスタ|ラーメン|焼きそば|そうめん|スパゲ/.test(text)) {
    found.add("noodle");
  }
  if (/米|ご飯|ごはん|丼|寿司|すし|おにぎり|チャーハン|炊き込み|雑炊/.test(text)) {
    found.add("rice");
  }
  if (/サラダ/.test(text)) found.add("salad");
  if (/スープ|汁|みそ汁|味噌汁|ポタージュ|スープ/.test(text)) found.add("soup");
  if (/デザート|スイーツ|ケーキ|プリン|アイス|ゼリー|おやつ/.test(text)) {
    found.add("dessert");
  }
  if (/副菜|煮物|和え|ナムル|ひじき|きんぴら|酢の物|おひたし/.test(text)) {
    found.add("side");
  }

  if (found.size === 0) found.add("other");
  return [...found];
}

/** よく作る1件のジャンル（蛋白ラベル＋名前推定） */
export function frequentDishGenres(dish: {
  name: string;
  role: "main" | "side";
  proteinKind: "meat" | "fish" | null;
}): RecipeGenre[] {
  const found = new Set<RecipeGenre>(inferRecipeGenres(dish.name));
  if (dish.proteinKind === "meat") found.add("meat");
  if (dish.proteinKind === "fish") found.add("fish");
  if (dish.role === "side" && found.size === 1 && found.has("other")) {
    found.clear();
    found.add("side");
  }
  return [...found];
}

