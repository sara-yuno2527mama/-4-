import { DEMO_EXTRACTED_RECIPE } from "./demo-recipe";
import { inferRecipeGenres, normalizeRecipeGenres } from "./recipe-genres";
import { hasOpenAiApiKey, visionJson } from "./vision";
import type { RecipeGenre } from "./types";

export type ExtractedRecipe = {
  title: string;
  screenshotType: "site" | "instagram" | "unknown";
  ingredients: { name: string; amount: string }[];
  genres: RecipeGenre[];
  /** 完成写真優先の表紙（0始まり）。範囲外は呼び出し側で補正 */
  coverIndex: number;
  source: "openai" | "demo" | "fallback";
  warning?: string;
  /** フォールバック時のみ。キーや本文は含めない短い失敗コード */
  failCode?: string;
};

type VisionRecipePayload = Partial<ExtractedRecipe> & {
  coverIndex?: number;
  genres?: unknown;
};

function clampCoverIndex(value: unknown, photoCount: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || photoCount <= 0) return 0;
  return Math.min(Math.max(Math.trunc(n), 0), photoCount - 1);
}

function asExtracted(
  parsed: VisionRecipePayload,
  photoCount: number,
  source: ExtractedRecipe["source"],
  warning?: string,
): ExtractedRecipe {
  const screenshotType =
    parsed.screenshotType === "site" || parsed.screenshotType === "instagram"
      ? parsed.screenshotType
      : "unknown";
  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
        .map((item) => ({
          name: String(item?.name ?? "").trim(),
          amount: String(item?.amount ?? "").trim(),
        }))
        .filter((item) => item.name)
    : [];
  const title = String(parsed.title ?? "").trim() || "無題のレシピ";
  const rawGenres = Array.isArray(parsed.genres) ? parsed.genres : [];
  const fromAi =
    rawGenres.length > 0 ? normalizeRecipeGenres(rawGenres) : ([] as RecipeGenre[]);
  // normalize は空を other にするので、AIが空なら推定に回す
  const genres =
    rawGenres.length > 0 ? fromAi : inferRecipeGenres(title, ingredients);

  return {
    title,
    screenshotType,
    ingredients,
    genres,
    coverIndex: clampCoverIndex(parsed.coverIndex, photoCount),
    source,
    warning,
  };
}

function fallbackExtracted(
  reason: "missing_key" | "failed",
  failCode?: string,
): ExtractedRecipe {
  let warning =
    reason === "missing_key"
      ? "読み取り用のAPIキーが未設定のため、甘酢鶏の例を仮表示しています。タイトル・材料を自分で直してから保存してください。"
      : "画像の読み取りに失敗したため、甘酢鶏の例を仮表示しています。タイトル・材料を自分で直してから保存してください。";
  if (failCode?.includes("insufficient_quota") || failCode?.includes("credit_balance")) {
    warning =
      "OpenAIの利用枠（クレジット）が足りないため読み取れませんでした。課金設定後にもう一度お試しください。いまは甘酢鶏の例を仮表示しています。";
  } else if (failCode?.includes("vision_failed:401") || failCode?.includes("invalid_api_key")) {
    warning =
      "OpenAI APIキーが無効なため読み取れませんでした。Vercelのキーを確認してください。いまは甘酢鶏の例を仮表示しています。";
  }
  return {
    ...DEMO_EXTRACTED_RECIPE,
    genres: DEMO_EXTRACTED_RECIPE.genres,
    coverIndex: 0,
    source: "fallback",
    warning,
    failCode,
  };
}

export async function extractRecipeFromImages(
  imageDataUrls: string[],
  options?: { demoSample?: boolean },
): Promise<ExtractedRecipe> {
  const photos = imageDataUrls.filter((item) => item.startsWith("data:image/"));
  const photoCount = Math.max(photos.length, 1);

  if (options?.demoSample) {
    return {
      ...DEMO_EXTRACTED_RECIPE,
      genres: DEMO_EXTRACTED_RECIPE.genres,
      coverIndex: 0,
      source: "demo",
    };
  }

  if (photos.length === 0) {
    return fallbackExtracted("failed");
  }

  if (!hasOpenAiApiKey()) {
    return fallbackExtracted("missing_key");
  }

  try {
    const parsed = await visionJson<VisionRecipePayload>(
      [
        `料理レシピのスクショが${photos.length}枚あります。全枚を見て内容をまとめてください。`,
        "サイト型（完成写真＋材料、例: オレンジページ）か、インスタ／リール型（工程写真＋画面上の材料テキスト）かを判別してください。",
        "タイトル、材料名、分量、ジャンルを JSON で返してください。複数枚に材料が分かれていても統合してください。",
        "genres は当てはまるものを複数可。値は次のみ: meat(肉) fish(魚) noodle(麺) rice(米) side(副菜) salad(サラダ) soup(スープ) dessert(デザート) other(その他)。",
        "coverIndex は完成写真として最も適した画像の0始まりインデックスです。サイト型なら完成写真、工程のみなら一番料理らしく見える枚。判断できなければ0。",
        '形式: {"title":"料理名","screenshotType":"site"|"instagram","coverIndex":0,"genres":["meat"],"ingredients":[{"name":"食材","amount":"分量"}]}',
        "分量は写っていれば。手順は入れない。読めなければ空文字や空配列。甘酢鶏など架空の料理で埋めない。",
      ].join(""),
      photos,
    );
    return asExtracted(parsed, photoCount, "openai");
  } catch (error) {
    const failCode =
      error instanceof Error ? error.message.slice(0, 220) : "unknown";
    console.error("[recipe-extract]", failCode);
    return fallbackExtracted("failed", failCode);
  }
}

/** @deprecated 単枚互換。新規は extractRecipeFromImages を使う */
export async function extractRecipeFromImage(
  imageDataUrl: string,
  options?: { demoSample?: boolean },
): Promise<ExtractedRecipe> {
  return extractRecipeFromImages([imageDataUrl], options);
}
