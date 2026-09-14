"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Card, PrimaryButton } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import {
  copyRecipeFromShare,
  findSameHouseholdRecipe,
  recipeOwnerId,
  recipeVisibilityOf,
  setRecipeVisibility,
} from "@/lib/recipe-library";
import {
  RECIPE_GENRE_LABELS,
  RECIPE_VISIBILITY_LABELS,
  type RecipeGenre,
  type RecipeShareSnapshot,
} from "@/lib/types";

export default function RecipeSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { state, ready, update, member } = useCurrentMember();
  const memberId = member?.id || "member-self";
  const [snapshot, setSnapshot] = useState<RecipeShareSnapshot | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "missing">(
    "loading",
  );
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(
          `/api/recipe-share/${encodeURIComponent(token)}`,
        );
        if (response.ok) {
          const next = (await response.json()) as RecipeShareSnapshot;
          if (!cancelled) {
            setSnapshot(next);
            setLoadState("ok");
          }
          return;
        }
      } catch {
        /* 同じ端末の下書きを見る */
      }
      const local = (state.recipeShares ?? []).find(
        (item) => item.token === token,
      );
      if (!cancelled) {
        if (local) {
          setSnapshot(local);
          setLoadState("ok");
        } else if (ready) {
          setLoadState("missing");
        }
      }
    }
    if (ready) void load();
    return () => {
      cancelled = true;
    };
  }, [token, ready, state.recipeShares]);

  const sameHouseholdRecipe = snapshot
    ? findSameHouseholdRecipe(state, snapshot)
    : undefined;

  function saveCopy() {
    if (!snapshot) return;
    if (sameHouseholdRecipe) return;
    const copied = copyRecipeFromShare(snapshot, memberId);
    update((prev) => ({
      ...prev,
      recipes: [copied, ...prev.recipes],
    }));
    setNote("自分のレシピ庫に保存しました。いまは自分だけです。");
  }

  function shareInHousehold() {
    if (!sameHouseholdRecipe) return;
    if (recipeOwnerId(sameHouseholdRecipe) !== memberId) {
      setNote("出した人だけが「家族全員」にできます。");
      return;
    }
    update((prev) => ({
      ...prev,
      recipes: prev.recipes.map((item) =>
        item.id === sameHouseholdRecipe.id
          ? setRecipeVisibility(item, "family")
          : item,
      ),
    }));
    setNote("この家のレシピ庫に出すようにしました。");
  }

  if (!ready || loadState === "loading") {
    return (
      <PublicShell title="レシピ">
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </PublicShell>
    );
  }

  if (loadState === "missing" || !snapshot) {
    return (
      <PublicShell title="レシピ">
        <Card>
          <p className="text-sm text-neutral-600">
            このリンクのレシピは見つかりませんでした。
          </p>
          <Link
            href="/recipes"
            className="mt-3 inline-block text-sm font-semibold text-[#1B6B32]"
          >
            レシピ庫へ
          </Link>
        </Card>
      </PublicShell>
    );
  }

  const cover =
    snapshot.photos[snapshot.coverIndex] ?? snapshot.photos[0] ?? null;
  const alreadyCopied = state.recipes.some(
    (recipe) =>
      recipe.sourceRecipeId === snapshot.sourceRecipeId ||
      recipe.id === snapshot.sourceRecipeId,
  );
  const visibility = sameHouseholdRecipe
    ? recipeVisibilityOf(sameHouseholdRecipe)
    : null;

  return (
    <PublicShell title="共有されたレシピ">
      <Card>
        <p className="text-lg font-bold">{snapshot.title}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(snapshot.genres.length > 0
            ? snapshot.genres
            : (["other"] as RecipeGenre[])
          ).map((genre) => (
            <span
              key={genre}
              className="rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-[#1B6B32]"
            >
              {RECIPE_GENRE_LABELS[genre]}
            </span>
          ))}
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={snapshot.title}
            className="mt-3 h-40 w-full rounded-xl object-cover"
          />
        ) : null}
        {snapshot.photos.length > 1 ? (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {snapshot.photos.map((photo, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${snapshot.token}-${index}`}
                src={photo}
                alt={`写真${index + 1}`}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ))}
          </div>
        ) : null}
        {snapshot.ingredients.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1 text-sm">
            {snapshot.ingredients.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                {item.amount ? `${item.name} ${item.amount}` : item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">材料はありません。</p>
        )}

        <div className="mt-4 space-y-2">
          {sameHouseholdRecipe ? (
            <>
              <p className="text-xs text-neutral-500">
                同じ家のレシピです。コピーはしません。
                {visibility
                  ? ` いまは「${RECIPE_VISIBILITY_LABELS[visibility]}」。`
                  : ""}
              </p>
              {visibility === "private" ? (
                <PrimaryButton type="button" onClick={shareInHousehold}>
                  家族全員に見せる
                </PrimaryButton>
              ) : (
                <p className="text-sm font-semibold text-[#1B6B32]">
                  すでにこの家のレシピ庫に出ています。
                </p>
              )}
            </>
          ) : alreadyCopied ? (
            <p className="text-sm font-semibold text-[#1B6B32]">
              すでに自分のレシピ庫にあります。
            </p>
          ) : (
            <PrimaryButton type="button" onClick={saveCopy}>
              自分のレシピ庫に保存
            </PrimaryButton>
          )}
          {note ? (
            <p className="text-xs font-semibold text-[#1B6B32]">{note}</p>
          ) : null}
        </div>
      </Card>
      <Link href="/recipes" className="text-sm font-semibold text-[#1B6B32]">
        レシピ庫を開く
      </Link>
    </PublicShell>
  );
}
