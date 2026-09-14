"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  RecipeMarkBadges,
  RecipeMarkFilter,
  RecipeMarkToggles,
} from "@/components/RecipeMarks";
import { RecipePhotoImport } from "@/components/RecipePhotoImport";
import { Card, Field, PrimaryButton, SecondaryButton } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import { recipeCover } from "@/lib/kitchen-state";
import {
  canEditRecipe,
  createRecipeShareSnapshot,
  isRecipeMark,
  recipeHasMark,
  recipeVisibilityOf,
  setRecipeVisibility,
  upsertRecipeShare,
  visibleRecipes,
} from "@/lib/recipe-library";
import {
  RECIPE_GENRE_LABELS,
  RECIPE_GENRES,
  RECIPE_VISIBILITY_LABELS,
  type RecipeGenre,
  type RecipeMark,
  type RecipeVisibility,
  type SavedRecipe,
} from "@/lib/types";

/** 保存後の料理名の直し（読み取りがずれたとき用） */
function RecipeTitleEditor({
  recipe,
  onPatch,
}: {
  recipe: SavedRecipe;
  onPatch: (next: SavedRecipe) => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [saved, setSaved] = useState(false);
  const trimmed = title.trim();
  const changed = trimmed.length > 0 && trimmed !== recipe.title;

  return (
    <div>
      <p className="mb-2 text-base font-semibold text-neutral-800">料理名</p>
      <div className="flex gap-2">
        <Field

          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setSaved(false);
          }}
        />
        <PrimaryButton
          type="button"
          className="shrink-0"
          disabled={!changed}
          onClick={() => {
            onPatch({ ...recipe, title: trimmed });
            setSaved(true);
          }}
        >
          直す
        </PrimaryButton>
      </div>
      {saved ? (
        <p className="mt-1.5 text-xs font-semibold text-[#1B6B32]">
          料理名を直しました。
        </p>
      ) : (
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          読み取りがずれていたら、ここで直せます。
        </p>
      )}
    </div>
  );
}

function GenreBadges({ genres }: { genres: RecipeGenre[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {(genres.length > 0 ? genres : (["other"] as RecipeGenre[])).map(
        (genre) => (
          <span
            key={genre}
            className="rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-[#1B6B32]"
          >
            {RECIPE_GENRE_LABELS[genre]}
          </span>
        ),
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  memberId,
  open,
  shareNote,
  onOpen,
  onPatch,
  onDelete,
  onShare,
}: {
  recipe: SavedRecipe;
  memberId: string;
  open: boolean;
  shareNote: string;
  onOpen: () => void;
  onPatch: (next: SavedRecipe) => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const cover = recipeCover(recipe);
  const canEdit = canEditRecipe(recipe, memberId);
  const visibility = recipeVisibilityOf(recipe);

  return (
    <li className="rounded-xl bg-[#EDEDED] p-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="min-w-0 text-left" onClick={onOpen}>
          <p className="text-base font-bold">{recipe.title}</p>
          <GenreBadges genres={recipe.genres ?? []} />
          <RecipeMarkBadges recipe={recipe} memberId={memberId} />
        </button>
        {canEdit ? (
          <button
            type="button"
            className="min-h-11 shrink-0 px-2 text-base font-semibold text-neutral-500"
            onClick={onDelete}
          >
            削除
          </button>
        ) : (
          <span className="shrink-0 text-xs text-neutral-400">献立に使えます</span>
        )}
      </div>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={recipe.title}
          className="mt-2 h-52 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mt-2 flex h-52 w-full items-center justify-center rounded-lg bg-white text-sm text-[#1B6B32]">
          写真なし
        </div>
      )}
      {canEdit && recipe.photos.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {recipe.photos.map((photo, index) => (
            <button
              key={`${recipe.id}-${index}`}
              type="button"
              className="shrink-0"
              onClick={() => onPatch({ ...recipe, coverIndex: index })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`写真${index + 1}`}
                className={`h-12 w-12 rounded-lg object-cover ${
                  index === recipe.coverIndex ? "ring-2 ring-[#1B6B32]" : ""
                }`}
              />
              <span className="block text-xs text-neutral-500">
                {index === recipe.coverIndex ? "表紙" : "表紙にする"}
              </span>
            </button>
          ))}
        </div>
      ) : !canEdit && recipe.photos.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {recipe.photos.map((photo, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${recipe.id}-view-${index}`}
              src={photo}
              alt={`写真${index + 1}`}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}
      {recipe.ingredients.length > 0 ? (
        <p className="mt-2 text-sm text-neutral-600">
          {recipe.ingredients
            .map((item) =>
              item.amount ? `${item.name} ${item.amount}` : item.name,
            )
            .join("、")}
        </p>
      ) : (
        <p className="mt-2 text-sm text-neutral-400">食材を読み取れませんでした</p>
      )}

      {open ? (
        <div className="mt-3 space-y-3 border-t border-[#e6e8e3] pt-3">
          <RecipeMarkToggles
            recipe={recipe}
            memberId={memberId}
            onChange={onPatch}
          />
          {canEdit ? (
            <>
              {/* 保存で title が変わったら入力欄を作り直す */}
              <RecipeTitleEditor
                key={`${recipe.id}-${recipe.title}`}
                recipe={recipe}
                onPatch={onPatch}
              />
              <div>
                <p className="mb-2 text-base font-semibold text-neutral-800">
                  見せる人
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["private", "family"] as RecipeVisibility[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`min-h-11 rounded-lg px-3 text-base font-semibold ${
                        visibility === id
                          ? "bg-[#1B6B32] text-white"
                          : "bg-white text-neutral-600 ring-1 ring-[#e6e8e3]"
                      }`}
                      onClick={() =>
                        onPatch(setRecipeVisibility(recipe, id))
                      }
                    >
                      {RECIPE_VISIBILITY_LABELS[id]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <SecondaryButton type="button" onClick={onShare}>
                  共有リンクを送る
                </SecondaryButton>
                {shareNote ? (
                  <p className="mt-1.5 text-xs font-semibold text-[#1B6B32]">
                    {shareNote}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                    写真・料理名・材料・ジャンルを、知っている人だけに送れます。
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="mt-2 inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]"
          onClick={onOpen}
        >
          開いて直す・マークする
        </button>
      )}
    </li>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="レシピ庫">
          <p className="text-base text-neutral-500">読み込み中…</p>
        </AppShell>
      }
    >
      <RecipesPageBody />
    </Suspense>
  );
}

function RecipesPageBody() {
  const { state, ready, update, member } = useCurrentMember();
  const memberId = member?.id || "member-self";
  // ホームの近道（例 /recipes?mark=child）から絞った状態で開く
  const markParam = useSearchParams().get("mark") ?? "";
  const [genreFilter, setGenreFilter] = useState<RecipeGenre | "all">("all");
  const [markFilter, setMarkFilter] = useState<RecipeMark | "all">(
    isRecipeMark(markParam) ? markParam : "all",
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [shareNotes, setShareNotes] = useState<Record<string, string>>({});

  const recipes = useMemo(
    () =>
      [...visibleRecipes(state.recipes, memberId)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [state.recipes, memberId],
  );

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      const genreOk =
        genreFilter === "all" ||
        (recipe.genres ?? []).includes(genreFilter);
      const markOk =
        markFilter === "all" ||
        recipeHasMark(recipe, memberId, markFilter);
      return genreOk && markOk;
    });
  }, [recipes, genreFilter, markFilter, memberId]);

  const grouped = useMemo(() => {
    if (genreFilter !== "all" || markFilter !== "all") return null;
    return RECIPE_GENRES.map((genre) => ({
      genre,
      items: recipes.filter((recipe) =>
        (recipe.genres ?? []).includes(genre),
      ),
    })).filter((group) => group.items.length > 0);
  }, [genreFilter, markFilter, recipes]);

  function patchRecipe(next: SavedRecipe) {
    update((prev) => ({
      ...prev,
      recipes: prev.recipes.map((item) =>
        item.id === next.id ? next : item,
      ),
    }));
  }

  async function shareRecipe(recipe: SavedRecipe) {
    if (!canEditRecipe(recipe, memberId)) return;
    const snapshot = createRecipeShareSnapshot(recipe, state.householdId);
    update((prev) => ({
      ...prev,
      recipeShares: upsertRecipeShare(prev.recipeShares ?? [], snapshot),
    }));
    try {
      await fetch("/api/recipe-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
    } catch {
      /* 端末共有はローカルURLでも可 */
    }
    const url = `${window.location.origin}/r/${snapshot.token}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `${recipe.title}のレシピ`,
          url,
        });
        setShareNotes((prev) => ({
          ...prev,
          [recipe.id]: "共有画面を開きました。",
        }));
        return;
      }
    } catch {
      /* キャンセル時はコピーへ */
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotes((prev) => ({
        ...prev,
        [recipe.id]: "リンクをコピーしました。LINEなどへ貼れます。",
      }));
    } catch {
      setShareNotes((prev) => ({ ...prev, [recipe.id]: url }));
    }
  }

  if (!ready) {
    return (
      <AppShell title="レシピ庫">
        <p className="text-base text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="レシピ庫">
      <RecipePhotoImport variant="page" />

      <Card>
        <h2
          id="recipe-library"
          className="mb-3 scroll-mt-4 text-base font-bold"
        >
          レシピ庫
        </h2>

        {recipes.length === 0 ? (
          <p className="text-base text-neutral-600">
            上で「確認して保存する」まで進めると、ここに出ます。新規は自分だけです。
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs text-neutral-500">ジャンルで絞り込み</p>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGenreFilter("all")}
                className={`min-h-11 rounded-lg px-3 text-base font-semibold leading-snug ${
                  genreFilter === "all"
                    ? "bg-[#1B6B32] text-white"
                    : "bg-[#EDEDED] text-neutral-600"
                }`}
              >
                すべて
              </button>
              {RECIPE_GENRES.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setGenreFilter(genre)}
                  className={`min-h-11 rounded-lg px-3 text-base font-semibold leading-snug ${
                    genreFilter === genre
                      ? "bg-[#1B6B32] text-white"
                      : "bg-[#EDEDED] text-neutral-600"
                  }`}
                >
                  {RECIPE_GENRE_LABELS[genre]}
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs text-neutral-500">
              マークで絞り込み（「いつか作りたい」など）
            </p>
            <div className="mb-4">
              <RecipeMarkFilter value={markFilter} onChange={setMarkFilter} />
            </div>

            {grouped ? (
              <div className="flex flex-col gap-5">
                {grouped.map(({ genre, items }) => (
                  <section key={genre}>
                    <h3 className="mb-2 text-xs font-bold text-[#1B6B32]">
                      {RECIPE_GENRE_LABELS[genre]}
                      <span className="ml-1 font-normal text-neutral-400">
                        {items.length}
                      </span>
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {items.map((recipe) => (
                        <RecipeCard
                          key={`${genre}-${recipe.id}`}
                          recipe={recipe}
                          memberId={memberId}
                          open={openId === recipe.id}
                          shareNote={shareNotes[recipe.id] ?? ""}
                          onOpen={() =>
                            setOpenId((prev) =>
                              prev === recipe.id ? null : recipe.id,
                            )
                          }
                          onPatch={patchRecipe}
                          onDelete={() =>
                            update((prev) => ({
                              ...prev,
                              recipes: prev.recipes.filter(
                                (item) => item.id !== recipe.id,
                              ),
                            }))
                          }
                          onShare={() => void shareRecipe(recipe)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-neutral-500">
                この条件のレシピはまだありません。
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {filtered.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    memberId={memberId}
                    open={openId === recipe.id}
                    shareNote={shareNotes[recipe.id] ?? ""}
                    onOpen={() =>
                      setOpenId((prev) =>
                        prev === recipe.id ? null : recipe.id,
                      )
                    }
                    onPatch={patchRecipe}
                    onDelete={() =>
                      update((prev) => ({
                        ...prev,
                        recipes: prev.recipes.filter(
                          (item) => item.id !== recipe.id,
                        ),
                      }))
                    }
                    onShare={() => void shareRecipe(recipe)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </AppShell>
  );
}
