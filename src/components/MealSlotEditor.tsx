"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RecipeSearchButton } from "@/components/RecipeSearchButton";
import {
  BoxedChoiceFrame,
  Field,
  PrimaryButton,
  SecondaryButton,
  boxedChoiceClass,
} from "@/components/ui";
import {
  addPlannedDish,
  findPass,
  formatMealSourceLine,
  formatPassLine,
  formatWeekdayLine,
  lastEveningProtein,
  replaceSlotDishes,
  slotSourceKind,
} from "@/lib/meals";
import {
  effectiveMorningDishName,
  effectiveMorningStaple,
  effectivePassHome,
  markSlotHumanTouched,
} from "@/lib/meal-prefs";
import { MealPlanQuickChoices } from "@/components/MealPlanQuickChoices";
import { useCurrentMember } from "@/hooks/use-current-member";
import { frequentDishGenres } from "@/lib/recipe-genres";
import { recipeCover } from "@/lib/kitchen-state";
import { visibleRecipes } from "@/lib/recipe-library";
import {
  PASS_HOME_LABEL,
  PROTEIN_LABELS,
  RECIPE_GENRE_LABELS,
  RECIPE_GENRES,
  type DishRole,
  type FrequentDish,
  type KitchenState,
  type MealSlot,
  type PlannedDish,
  type ProteinKind,
  type RecipeGenre,
  type SavedRecipe,
} from "@/lib/types";

type SourceTab = "frequent" | "recipes";

function recipeAsDish(recipe: SavedRecipe): {
  role: DishRole;
  name: string;
  proteinKind: ProteinKind | null;
} {
  if (recipe.genres.includes("dessert")) {
    return { role: "dessert", name: recipe.title, proteinKind: null };
  }
  if (recipe.genres.includes("meat")) {
    return { role: "main", name: recipe.title, proteinKind: "meat" };
  }
  if (recipe.genres.includes("fish")) {
    return { role: "main", name: recipe.title, proteinKind: "fish" };
  }
  return { role: "side", name: recipe.title, proteinKind: null };
}

function GenrePicker({
  selected,
  onSelect,
}: {
  selected: RecipeGenre | null;
  onSelect: (genre: RecipeGenre) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-base font-semibold leading-snug text-neutral-800">
        ① ジャンルを選ぶ
      </p>
      <BoxedChoiceFrame>
        {RECIPE_GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => onSelect(genre)}
            className={boxedChoiceClass(selected === genre)}
          >
            {RECIPE_GENRE_LABELS[genre]}
          </button>
        ))}
      </BoxedChoiceFrame>
    </div>
  );
}

export function MealSlotEditor({
  open,
  onClose,
  state,
  date,
  slot,
  onUpdate,
  pickOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  state: KitchenState;
  date: string;
  slot: MealSlot;
  onUpdate: (updater: (prev: KitchenState) => KitchenState) => void;
  /** 献立の「メニューを選び直す」。3択だけ出して、いまの内容などは出さない */
  pickOnly?: boolean;
}) {
  const { member } = useCurrentMember();
  const memberId = member?.id || "member-self";
  const [tab, setTab] = useState<SourceTab>("frequent");
  const [genreFilter, setGenreFilter] = useState<RecipeGenre | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualRole, setManualRole] = useState<"main" | "side">("main");
  const [manualProtein, setManualProtein] = useState<ProteinKind>("meat");
  const [note, setNote] = useState("");
  const [proteinNote, setProteinNote] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `meal-slot-editor-${date}-${slot}`;

  const slotLabel = slot === "morning" ? "朝" : "夕";
  const pass = findPass(state, date, slot);
  const dishes = useMemo(
    () =>
      state.meals.filter((dish) => dish.date === date && dish.slot === slot),
    [state.meals, date, slot],
  );
  const nonDessert = dishes.filter((d) => d.role !== "dessert");
  const passHome = effectivePassHome(state, date, slot);
  const showPass = passHome === "pass" && nonDessert.length === 0;
  const sourceKind = slotSourceKind(dishes);
  const isCook = passHome === "home" && sourceKind === "cook";
  const passLabel = formatPassLine(pass?.reason ?? PASS_HOME_LABEL);
  const recipes = useMemo(
    () =>
      [...visibleRecipes(state.recipes ?? [], memberId)].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [state.recipes, memberId],
  );

  const filteredFrequent = useMemo(() => {
    if (!genreFilter) return [];
    return state.frequentDishes.filter((dish) =>
      frequentDishGenres(dish).includes(genreFilter),
    );
  }, [state.frequentDishes, genreFilter]);

  const filteredRecipes = useMemo(() => {
    if (!genreFilter) return [];
    return recipes.filter((recipe) =>
      (recipe.genres ?? []).includes(genreFilter),
    );
  }, [recipes, genreFilter]);

  const searchQuery =
    nonDessert.find((dish) => dish.role === "main")?.name.trim() ||
    nonDessert[0]?.name.trim() ||
    (slot === "morning" &&
    passHome === "home" &&
    effectiveMorningStaple(state, date) !== "unset"
      ? effectiveMorningDishName(state, date)
      : "");

  useEffect(() => {
    setTab("frequent");
    setGenreFilter(null);
  }, [open, date, slot]);

  // Escで閉じる。開いている間だけ聞く
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // 開いたら先頭（閉じる）にフォーカスを移す
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function switchTab(next: SourceTab) {
    setTab(next);
  }

  function applyDish(
    dish: {
      role: DishRole;
      name: string;
      proteinKind: ProteinKind | null;
    },
    mode: "add" | "replace",
  ) {
    if (showPass && dish.role !== "dessert") {
      setNote("パスの日はそのままです。パスをやめてから編集してください。");
      return;
    }
    if (!isCook && dish.role !== "dessert") {
      setNote("家で作るを選んでから編集してください。");
      return;
    }
    if (dish.role === "main" && slot === "evening" && dish.proteinKind) {
      const previous = lastEveningProtein(state, date);
      if (previous && previous === dish.proteinKind) {
        const other = previous === "meat" ? "魚" : "肉";
        setProteinNote(
          `注意: 夕食の主菜が${PROTEIN_LABELS[previous]}続きです。${other}がおすすめ（禁止ではありません）。`,
        );
      } else {
        setProteinNote("");
      }
    } else {
      setProteinNote("");
    }

    onUpdate((prev) => {
      const withMeals = {
        ...prev,
        meals:
          mode === "replace"
            ? replaceSlotDishes(prev.meals, date, slot, {
                ...dish,
                sourceKind: "cook",
                placeName: null,
              })
            : addPlannedDish(prev.meals, {
                date,
                slot,
                role: dish.role,
                name: dish.name,
                proteinKind: dish.proteinKind,
                sourceKind: "cook",
                placeName: null,
              }),
      };
      return markSlotHumanTouched(withMeals, date, slot);
    });
    setNote(
      mode === "replace"
        ? `「${dish.name}」に差し替えました。`
        : `「${dish.name}」を追加しました。`,
    );
  }

  function addFrequent(dish: FrequentDish, mode: "add" | "replace") {
    applyDish(
      {
        role: dish.role,
        name: dish.name,
        proteinKind: dish.proteinKind,
      },
      mode,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      // 背景タップで閉じる（中身のクリックでは閉じない）
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lg leading-relaxed"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id={titleId} className="text-base font-bold leading-snug">
              {pickOnly
                ? `${formatWeekdayLine(date)} の${slotLabel}のメニュー`
                : `${formatWeekdayLine(date)} の${slotLabel}を編集`}
            </p>
            {pickOnly ? null : (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                「家で作る」「外食」「買って帰る」を選べます。土日夕は{PASS_HOME_LABEL}／家のままです。
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="-mr-2 min-h-11 shrink-0 px-2 text-base font-semibold text-neutral-500"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>

        {pickOnly ? null : (
        <>
        <div className="mt-5 rounded-xl bg-[#EDEDED] p-4">
          <p className="text-base font-semibold leading-snug text-neutral-800">いまの内容</p>
          {showPass ? (
            <p className="mt-3 text-base font-semibold leading-snug">{passLabel}</p>
          ) : dishes.length === 0 ? (
            <p className="mt-3 text-base leading-snug text-neutral-500">まだありません。</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {dishes.map((dish: PlannedDish) => (
                <li
                  key={dish.id}
                  className="flex items-center justify-between gap-3 text-base leading-snug"
                >
                  <span>
                    {formatMealSourceLine(dish)}
                    {dish.sourceKind !== "eatout" &&
                    dish.sourceKind !== "procure" &&
                    dish.role === "main" &&
                    dish.proteinKind
                      ? `（${PROTEIN_LABELS[dish.proteinKind]}）`
                      : dish.role === "dessert"
                        ? "（デザート）"
                        : ""}
                  </span>
                  <button
                    type="button"
                    className="text-base text-rose-600"
                    onClick={() => {
                      onUpdate((prev) =>
                        markSlotHumanTouched(
                          {
                            ...prev,
                            meals: prev.meals.filter(
                              (item) => item.id !== dish.id,
                            ),
                          },
                          date,
                          slot,
                        ),
                      );
                      setNote("外しました。");
                    }}
                  >
                    外す
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <MealPlanQuickChoices
            state={state}
            date={date}
            slot={slot}
            onUpdate={onUpdate}
          />
        </div>
        </>
        )}

        {isCook ? (
          <>
              <div className="mt-4">
                <BoxedChoiceFrame>
                  <button
                    type="button"
                    className={boxedChoiceClass(tab === "frequent")}
                    onClick={() => switchTab("frequent")}
                  >
                    よく作る
                  </button>
                  <button
                    type="button"
                    className={boxedChoiceClass(tab === "recipes")}
                    onClick={() => switchTab("recipes")}
                  >
                    レシピ庫
                  </button>
                  {/* 外部サイトへ飛ぶリンクだが、並びの中では同じボタンに見せる */}
                  <RecipeSearchButton
                    query={searchQuery}
                    site={state.settings.recipeSite}
                    label="レシピを検索"
                    className={`${boxedChoiceClass(false)} inline-flex items-center justify-center gap-1.5`}
                  />
                </BoxedChoiceFrame>

                <div className="mt-5 flex flex-col gap-5">
                  <GenrePicker
                    selected={genreFilter}
                    onSelect={(genre) => setGenreFilter(genre)}
                  />

                  {!genreFilter ? (
                    <p className="text-base leading-relaxed text-neutral-500">
                      上のジャンルを選ぶと、候補が出ます。
                    </p>
                  ) : tab === "frequent" ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-base font-semibold leading-snug text-neutral-800">
                        ② {RECIPE_GENRE_LABELS[genreFilter]}のよく作る
                      </p>
                      {state.frequentDishes.length === 0 ? (
                        <p className="text-base leading-relaxed text-neutral-500">
                          献立タブで「よく作る」を登録できます。
                        </p>
                      ) : filteredFrequent.length === 0 ? (
                        <p className="text-base leading-relaxed text-neutral-500">
                          このジャンルのよく作るはまだありません。手入力か別ジャンルを試してください。
                        </p>
                      ) : (
                        filteredFrequent.map((dish) => (
                          <div
                            key={dish.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6e8e3] px-3 py-3"
                          >
                            <span className="text-base font-semibold leading-snug">
                              {dish.name}
                              {dish.role === "main" && dish.proteinKind
                                ? ` · ${PROTEIN_LABELS[dish.proteinKind]}`
                                : ""}
                            </span>
                            <div className="flex gap-2">
                              <SecondaryButton
                                type="button"

                                disabled={showPass}
                                onClick={() => addFrequent(dish, "add")}
                              >
                                追加
                              </SecondaryButton>
                              <PrimaryButton
                                type="button"

                                disabled={showPass}
                                onClick={() => addFrequent(dish, "replace")}
                              >
                                差し替え
                              </PrimaryButton>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-base font-semibold leading-snug text-neutral-800">
                        ② {RECIPE_GENRE_LABELS[genreFilter]}のレシピ
                        <span className="ml-1 text-xs font-normal leading-relaxed text-neutral-400">
                          （複数ジャンルでも含んでいれば表示）
                        </span>
                      </p>
                      {recipes.length === 0 ? (
                        <p className="text-base leading-relaxed text-neutral-500">
                          レシピ庫に保存すると、ここから選べます。
                        </p>
                      ) : filteredRecipes.length === 0 ? (
                        <p className="text-base leading-relaxed text-neutral-500">
                          このジャンルのレシピはまだありません。
                        </p>
                      ) : (
                        filteredRecipes.map((recipe) => {
                          const cover = recipeCover(recipe);
                          const mapped = recipeAsDish(recipe);
                          return (
                            <div
                              key={recipe.id}
                              className="flex gap-3 rounded-xl border border-[#e6e8e3] p-3"
                            >
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={cover}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-xs text-[#1B6B32]">
                                  写真なし
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-semibold leading-snug">
                                  {recipe.title}
                                </p>
                                <p className="mt-1 truncate text-xs leading-relaxed text-neutral-500">
                                  {(recipe.genres ?? [])
                                    .map((g) => RECIPE_GENRE_LABELS[g])
                                    .join("·")}
                                </p>
                                <div className="mt-3 flex gap-2">
                                  <SecondaryButton
                                    type="button"

                                    disabled={showPass && mapped.role !== "dessert"}
                                    onClick={() => applyDish(mapped, "add")}
                                  >
                                    追加
                                  </SecondaryButton>
                                  <PrimaryButton
                                    type="button"

                                    disabled={showPass && mapped.role !== "dessert"}
                                    onClick={() => applyDish(mapped, "replace")}
                                  >
                                    差し替え
                                  </PrimaryButton>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3">
                <p className="text-xs leading-relaxed text-neutral-500">
                  手入力（ジャンル選択なしでそのまま追加・差し替え）
                </p>
                <Field
                  placeholder="料理名"
                  className="text-base"
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                />
                <div className="flex gap-2">
                  <select
                    className="min-h-11 rounded-lg border border-[#e6e8e3] px-2 py-2 text-base"
                    value={manualRole}
                    onChange={(event) =>
                      setManualRole(event.target.value as "main" | "side")
                    }
                  >
                    <option value="main">主菜</option>
                    <option value="side">副菜</option>
                  </select>
                  {manualRole === "main" ? (
                    <select
                      className="min-h-11 rounded-lg border border-[#e6e8e3] px-2 py-2 text-base"
                      value={manualProtein}
                      onChange={(event) =>
                        setManualProtein(event.target.value as ProteinKind)
                      }
                    >
                      <option value="meat">肉</option>
                      <option value="fish">魚</option>
                    </select>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton
                    type="button"
                    className="flex-1"
                    disabled={!manualName.trim() || showPass}
                    onClick={() => {
                      applyDish(
                        {
                          role: manualRole,
                          name: manualName.trim(),
                          proteinKind:
                            manualRole === "main" ? manualProtein : null,
                        },
                        "add",
                      );
                      setManualName("");
                    }}
                  >
                    追加
                  </SecondaryButton>
                  <PrimaryButton
                    type="button"
                    className="flex-1"
                    disabled={!manualName.trim() || showPass}
                    onClick={() => {
                      applyDish(
                        {
                          role: manualRole,
                          name: manualName.trim(),
                          proteinKind:
                            manualRole === "main" ? manualProtein : null,
                        },
                        "replace",
                      );
                      setManualName("");
                    }}
                  >
                    差し替え
                  </PrimaryButton>
                </div>
              </div>
              </div>
          </>
        ) : null}

        {proteinNote ? (
          <p className="mt-5 text-xs leading-relaxed text-amber-800">{proteinNote}</p>
        ) : null}
        {note ? (
          <p className="mt-3 text-xs font-semibold leading-relaxed text-[#1B6B32]">
            {note}
          </p>
        ) : null}

        <PrimaryButton type="button" className="mt-6 w-full" onClick={onClose}>
          完了
        </PrimaryButton>
      </div>
    </div>
  );
}
