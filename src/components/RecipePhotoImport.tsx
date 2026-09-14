"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Field, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import { DEMO_EXTRACTED_RECIPE, DEMO_SAMPLE_PATH } from "@/lib/demo-recipe";
import { fileToDataUrl, resizeImageDataUrl } from "@/lib/image";
import { inferRecipeGenres, normalizeRecipeGenres } from "@/lib/recipe-genres";
import {
  RECIPE_GENRE_LABELS,
  RECIPE_GENRES,
  type RecipeGenre,
  type RecipeIngredient,
  type SavedRecipe,
} from "@/lib/types";

const DRAFT_KEY = "ai-kitchen-secretary:recipe-draft";

type Draft = {
  title: string;
  ingredients: RecipeIngredient[];
  photos: string[];
  coverIndex: number;
  screenshotType: SavedRecipe["screenshotType"];
  genres: RecipeGenre[];
  source: "openai" | "demo" | "fallback";
  warning?: string;
};

type ExtractResponse = {
  title?: string;
  screenshotType?: SavedRecipe["screenshotType"];
  ingredients?: RecipeIngredient[];
  genres?: RecipeGenre[];
  coverIndex?: number;
  source?: Draft["source"];
  warning?: string;
  error?: string;
};

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToDataUrl(
    new File([blob], "sample.svg", { type: blob.type || "image/svg+xml" }),
  );
}

function readStoredDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed?.title || !Array.isArray(parsed.photos)) return null;
    return {
      ...parsed,
      coverIndex: parsed.coverIndex ?? 0,
      genres: normalizeRecipeGenres(parsed.genres),
      source: parsed.source ?? "openai",
    };
  } catch {
    return null;
  }
}

function writeStoredDraft(draft: Draft | null) {
  if (typeof window === "undefined") return;
  if (!draft) {
    window.sessionStorage.removeItem(DRAFT_KEY);
    return;
  }
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota — draft stays in memory */
  }
}

function clampCover(index: number | undefined, photoCount: number): number {
  if (photoCount <= 0) return 0;
  if (typeof index !== "number" || !Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), photoCount - 1);
}

function resolveGenres(
  result: ExtractResponse,
  title: string,
  ingredients: RecipeIngredient[],
): RecipeGenre[] {
  if (Array.isArray(result.genres) && result.genres.length > 0) {
    return normalizeRecipeGenres(result.genres);
  }
  return inferRecipeGenres(title, ingredients);
}

function GenreChecks({
  genres,
  onToggle,
}: {
  genres: RecipeGenre[];
  onToggle: (genre: RecipeGenre) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {RECIPE_GENRES.map((genre) => {
        const on = genres.includes(genre);
        return (
          <button
            key={genre}
            type="button"
            onClick={() => onToggle(genre)}
            className={`rounded-lg px-3 py-1.5 text-base font-semibold leading-snug ${
              on
                ? "bg-[#1B6B32] text-white"
                : "bg-white text-neutral-600 ring-1 ring-[#e6e8e3]"
            }`}
          >
            {RECIPE_GENRE_LABELS[genre]}
          </button>
        );
      })}
    </div>
  );
}

export function RecipePhotoImport({
  variant,
  embedded = false,
}: {
  variant: "home" | "page";
  embedded?: boolean;
}) {
  const { update, member } = useCurrentMember();
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "warn" | "neutral">(
    "neutral",
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [savedTitle, setSavedTitle] = useState("");

  useEffect(() => {
    const stored = readStoredDraft();
    if (stored) {
      setDraft(stored);
      setMessage(
        stored.warning ||
          "読み取り結果です。ずれていたら直して「確認して保存する」を押してください。",
      );
      setMessageTone(stored.source === "fallback" ? "warn" : "neutral");
    }
  }, []);

  function applyDraft(next: Draft | null, notice?: string, tone?: typeof messageTone) {
    setDraft(next);
    writeStoredDraft(next);
    if (notice) {
      setMessage(notice);
      setMessageTone(tone ?? "neutral");
    }
  }

  function openDraft(
    photos: string[],
    result: ExtractResponse,
    notice: string,
    tone: typeof messageTone,
  ) {
    const coverIndex = clampCover(result.coverIndex, photos.length);
    const title = result.title?.trim() || "無題のレシピ";
    const ingredients = result.ingredients?.length
      ? result.ingredients
      : [{ name: "", amount: "" }];
    applyDraft(
      {
        title,
        ingredients,
        photos,
        coverIndex,
        screenshotType: result.screenshotType ?? "unknown",
        genres: resolveGenres(result, title, ingredients),
        source: result.source ?? "openai",
        warning: result.warning,
      },
      notice,
      tone,
    );
    window.requestAnimationFrame(() => {
      draftRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function toggleGenre(genre: RecipeGenre) {
    if (!draft) return;
    const has = draft.genres.includes(genre);
    let next = has
      ? draft.genres.filter((item) => item !== genre)
      : [...draft.genres, genre];
    if (next.length === 0) next = ["other"];
    applyDraft({ ...draft, genres: next });
  }

  async function extractFromPhotos(photos: string[]) {
    setBusy(true);
    setMessage(
      photos.length > 1
        ? `${photos.length}枚を読み取っています…`
        : "画像を読み取っています…",
    );
    setMessageTone("neutral");
    setSavedTitle("");
    try {
      const response = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrls: photos }),
      });
      const result = (await response.json()) as ExtractResponse;
      if (!response.ok) {
        openDraft(
          photos,
          {
            ...DEMO_EXTRACTED_RECIPE,
            coverIndex: 0,
            source: "fallback",
            warning:
              result.error ||
              "画像の読み取りに失敗したため、甘酢鶏の例を仮表示しています。タイトル・材料を自分で直してから保存してください。",
          },
          result.error ||
            "読み取りに失敗しました。甘酢鶏の例を仮表示しています。内容を直してから保存してください。",
          "warn",
        );
        return;
      }

      if (result.source === "fallback") {
        openDraft(
          photos,
          {
            title: result.title || DEMO_EXTRACTED_RECIPE.title,
            ingredients: result.ingredients?.length
              ? result.ingredients
              : DEMO_EXTRACTED_RECIPE.ingredients,
            genres: result.genres ?? DEMO_EXTRACTED_RECIPE.genres,
            screenshotType:
              result.screenshotType ?? DEMO_EXTRACTED_RECIPE.screenshotType,
            coverIndex: result.coverIndex ?? 0,
            source: "fallback",
            warning: result.warning,
          },
          result.warning ||
            "読み取りに失敗したため、甘酢鶏の例を仮表示しています。内容を直してから保存してください。",
          "warn",
        );
        return;
      }

      openDraft(
        photos,
        result,
        "読み取り結果です。ずれていたら直して「確認して保存する」を押してください。",
        "ok",
      );
    } catch {
      openDraft(
        photos,
        {
          ...DEMO_EXTRACTED_RECIPE,
          coverIndex: 0,
          source: "fallback",
          warning:
            "通信エラーのため読み取りできませんでした。甘酢鶏の例を仮表示しています。タイトル・材料を自分で直してから保存してください。",
        },
        "通信エラーのため読み取りできませんでした。甘酢鶏の例を仮表示しています。内容を直してから保存してください。",
        "warn",
      );
    } finally {
      setBusy(false);
    }
  }

  async function runSample() {
    setBusy(true);
    setMessage("サンプルを用意しています…");
    setMessageTone("neutral");
    setSavedTitle("");
    try {
      let photo = DEMO_SAMPLE_PATH;
      try {
        photo = await resizeImageDataUrl(await urlToDataUrl(DEMO_SAMPLE_PATH));
      } catch {
        photo = DEMO_SAMPLE_PATH;
      }
      openDraft(
        [photo],
        {
          ...DEMO_EXTRACTED_RECIPE,
          coverIndex: 0,
          source: "demo",
        },
        "サンプルの読み取り結果です。確認して「確認して保存する」を押してください。",
        "ok",
      );
    } finally {
      setBusy(false);
    }
  }

  function saveDraft() {
    if (!draft) return;
    const photos =
      draft.photos.length > 0 ? draft.photos : [DEMO_SAMPLE_PATH];
    const title = draft.title.trim() || "無題のレシピ";
    const ingredients = draft.ingredients.filter((item) => item.name.trim());
    const recipe: SavedRecipe = {
      id: crypto.randomUUID(),
      title,
      ingredients,
      photos,
      coverIndex: clampCover(draft.coverIndex, photos.length),
      screenshotType: draft.screenshotType,
      genres: normalizeRecipeGenres(draft.genres),
      createdAt: new Date().toISOString(),
      ownerMemberId: member?.id || "member-self",
      visibility: "private",
      childMark: false,
      memberMarks: {},
      sourceRecipeId: null,
    };
    update((prev) => ({
      ...prev,
      recipes: [recipe, ...prev.recipes],
    }));
    applyDraft(null);
    setSavedTitle(recipe.title);
    setMessageTone("ok");
    setMessage(
      variant === "home"
        ? `「${recipe.title}」を保存しました。すぐ下のおすすめに出ます。`
        : `「${recipe.title}」を保存しました。下のレシピ庫に出ます。`,
    );
    window.requestAnimationFrame(() => {
      document
        .getElementById(variant === "home" ? "home-recommendations" : "recipe-library")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const body = (
    <>
      <SectionTitle>レシピ写真を読み取る</SectionTitle>
      <p className="mb-3 text-xs text-neutral-500">
        {variant === "home"
          ? "①写真を選ぶ（または②サンプル）→ ③内容確認 → ④「確認して保存する」。すぐ下のおすすめに出ます。"
          : "①写真を選ぶ（または②サンプル）→ ③内容確認 → ④「確認して保存する」。下のレシピ庫に出ます。"}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (event) => {
          const files = [...(event.target.files ?? [])].slice(0, 8);
          event.target.value = "";
          if (files.length === 0) return;
          const maxEdge = files.length > 1 ? 960 : 1280;
          const photos = [];
          for (const file of files) {
            photos.push(
              await resizeImageDataUrl(await fileToDataUrl(file), maxEdge),
            );
          }
          await extractFromPhotos(photos);
        }}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <PrimaryButton
          type="button"
          className="sm:flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "読み取り中…" : "① 写真を選ぶ（複数可）"}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          className="sm:flex-1"
          disabled={busy}
          onClick={() => void runSample()}
        >
          ② サンプル写真で試す
        </SecondaryButton>
      </div>
      {message ? (
        <p
          className={`mt-2 text-xs ${
            savedTitle || messageTone === "ok"
              ? "font-semibold text-[#1B6B32]"
              : messageTone === "warn"
                ? "font-semibold text-amber-800"
                : "text-neutral-600"
          }`}
        >
          {message}
        </p>
      ) : null}

      {draft ? (
        <div
          ref={draftRef}
          className={`mt-3 rounded-xl border p-3 ${
            draft.source === "fallback"
              ? "border-amber-400/60 bg-amber-50"
              : "border-[#1B6B32]/40 bg-white"
          }`}
        >
          <p className="text-base font-semibold text-neutral-900">③ 読み取りの確認</p>
          {draft.source === "fallback" ? (
            <p className="mt-1 text-xs font-semibold text-amber-800">
              ※ 本読取ではなく仮の例です。写真の実内容に直してください。
            </p>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              {draft.photos.length}枚保存予定 ·{" "}
              {draft.screenshotType === "instagram"
                ? "インスタ／リール型"
                : draft.screenshotType === "site"
                  ? "サイト型"
                  : "種別不明"}
              {" · "}
              表紙は完成写真優先（タップで変更可）
            </p>
          )}
          <label className="mt-2 mb-1 block text-xs text-neutral-500">料理名</label>
          <Field
            value={draft.title}
            onChange={(event) =>
              applyDraft({ ...draft, title: event.target.value })
            }
          />
          <p className="mt-2 mb-1 text-xs text-neutral-500">
            ジャンル（複数可・ずれたらタップで修正）
          </p>
          <GenreChecks genres={draft.genres} onToggle={toggleGenre} />
          <p className="mt-2 mb-1 text-xs text-neutral-500">材料</p>
          {draft.ingredients.map((ingredient, index) => (
            <div key={`ing-${index}`} className="mt-2 flex gap-2">
              <Field
                value={ingredient.name}
                onChange={(event) => {
                  const ingredients = [...draft.ingredients];
                  ingredients[index] = {
                    ...ingredients[index],
                    name: event.target.value,
                  };
                  applyDraft({ ...draft, ingredients });
                }}
              />
              <Field
                placeholder="分量"
                value={ingredient.amount}
                onChange={(event) => {
                  const ingredients = [...draft.ingredients];
                  ingredients[index] = {
                    ...ingredients[index],
                    amount: event.target.value,
                  };
                  applyDraft({ ...draft, ingredients });
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-[#1B6B32]"
            onClick={() =>
              applyDraft({
                ...draft,
                ingredients: [...draft.ingredients, { name: "", amount: "" }],
              })
            }
          >
            材料を足す
          </button>
          <p className="mt-3 mb-1 text-xs text-neutral-500">
            写真（{draft.photos.length}枚・タップで表紙）
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {draft.photos.map((photo, index) => (
              <button
                key={`${photo.slice(0, 24)}-${index}`}
                type="button"
                className="shrink-0"
                onClick={() => applyDraft({ ...draft, coverIndex: index })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`写真${index + 1}`}
                  className={`h-20 w-20 rounded-xl bg-white object-cover ${
                    index === draft.coverIndex ? "ring-2 ring-[#1B6B32]" : ""
                  }`}
                />
                <span className="mt-0.5 block text-center text-xs text-neutral-500">
                  {index === draft.coverIndex ? "表紙" : "表紙にする"}
                </span>
              </button>
            ))}
          </div>
          <PrimaryButton
            type="button"
            className="mt-3 w-full py-3"
            onClick={saveDraft}
          >
            ④ 確認して保存する
          </PrimaryButton>
          <SecondaryButton
            type="button"
            className="mt-2 w-full"
            onClick={() => {
              applyDraft(null);
              setMessage("読み取りをやめました。もう一度写真を選べます。");
              setMessageTone("neutral");
              setSavedTitle("");
            }}
          >
            読み取りをやめる
          </SecondaryButton>
        </div>
      ) : null}
    </>
  );

  if (embedded) return <div>{body}</div>;
  return <Card>{body}</Card>;
}
