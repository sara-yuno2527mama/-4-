"use client";

import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DateStepper } from "@/components/DateStepper";
import { DeliveryName } from "@/components/DeliveryMark";
import { HomeRecipePreview } from "@/components/HomeRecipePreview";
import { MealSlotEditor } from "@/components/MealSlotEditor";
import { RecipePhotoImport } from "@/components/RecipePhotoImport";
import { RecipeSearchButton } from "@/components/RecipeSearchButton";
import { actionLinkClass, Card, confirmLinkClass, Field, SectionTitle, StateBadge } from "@/components/ui";
import { useCurrentMember } from "@/hooks/use-current-member";
import { homeDeliveries, patchDelivery } from "@/lib/delivery";
import { tokyoDateKey } from "@/lib/dates";
import { activeInventory, markInventoryUsedUp } from "@/lib/inventory";
import { recipeCover } from "@/lib/kitchen-state";
import { confirmSlotLabel, resolveSlotLabel, type SlotLabel } from "@/lib/meal-prefs";
import { isBreadReminderDay } from "@/lib/meals";
import { visibleRecipes } from "@/lib/recipe-library";
import { matchRecipesToInventory } from "@/lib/recipe-match";
import {
  INVENTORY_KIND_LABELS,
  type InventoryItem,
  type MealSlot,
  type RecipeMark,
  type RecipeSiteId,
  type SavedRecipe,
} from "@/lib/types";

/** レシピ庫カードの近道。マークで絞った状態で開く */
const RECIPE_HOME_SHORTCUTS: { mark: RecipeMark; label: string }[] = [
  { mark: "child", label: "子ども向け" },
  { mark: "favorite", label: "お気に入り" },
];

/** 新着を優先しつつ、在庫マッチ情報があれば添える（保存直後もおすすめに出る） */
function homeRecommendations(
  recipes: SavedRecipe[],
  inventory: InventoryItem[],
  leftoverNames: string[],
) {
  const matched = matchRecipesToInventory(recipes, inventory, leftoverNames);
  const byId = new Map(matched.map((item) => [item.recipe.id, item]));
  const recent = [...recipes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const result: {
    recipe: SavedRecipe;
    leftoverMatched: string[];
    matched: string[];
    score: number;
  }[] = [];

  for (const recipe of recent) {
    if (result.length >= 4) break;
    const hit = byId.get(recipe.id);
    result.push(
      hit ?? {
        recipe,
        leftoverMatched: [],
        matched: [],
        score: 0,
      },
    );
  }
  return result;
}

/** 主役は献立名。未設定だけグレー */
function slotNameClass(kind: SlotLabel["kind"]): string {
  if (kind === "empty") return "text-xl font-bold text-neutral-400";
  return "text-xl font-bold text-neutral-900";
}

/** パス日は名前だけ。検索の透明スペーサーは置かない */
function isPassHomeRow(label: SlotLabel): boolean {
  return (
    label.kind === "pass" || (label.kind === "default" && !label.searchQuery)
  );
}

/** 1行目は名前だけ（切らない）。ボタンは2行目以降 */
function HomeSlotRow({
  icon: Icon,
  slotName,
  label,
  site,
  onConfirm,
  onEdit,
}: {
  icon: typeof Sun;
  slotName: string;
  label: SlotLabel;
  site: RecipeSiteId;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const passRow = isPassHomeRow(label);

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-snug">
        <span className="inline-flex shrink-0 items-center gap-1 text-base font-bold text-[#1B6B32]">
          <Icon className="size-[1em] shrink-0" strokeWidth={1.6} />
          {slotName}
        </span>
        <span className={`min-w-0 whitespace-normal break-words ${slotNameClass(label.kind)}`}>
          {label.text}
        </span>
        {label.badge ? <StateBadge>{label.badge}</StateBadge> : null}
      </p>
      {passRow ? null : (
        <div className="mt-1 flex flex-wrap items-center gap-x-4">
          <button type="button" className={actionLinkClass} onClick={onEdit}>
            編集
          </button>
          {label.canConfirm ? (
            <button type="button" className={confirmLinkClass} onClick={onConfirm}>
              これにする
            </button>
          ) : null}
          {label.searchQuery ? (
            <RecipeSearchButton
              query={label.searchQuery}
              site={site}
              label="レシピを検索"
              variant="text"
              className={`${actionLinkClass} ml-auto gap-1`}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { state, ready, update, member } = useCurrentMember();
  const todayKey = tokyoDateKey();
  const [viewDate, setViewDate] = useState(todayKey);
  const [editSlot, setEditSlot] = useState<MealSlot | null>(null);

  if (!ready) {
    return (
      <AppShell title="ホーム">
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  const morningLabel = resolveSlotLabel(state, viewDate, "morning");
  const eveningLabel = resolveSlotLabel(state, viewDate, "evening");
  const inventory = activeInventory(state.inventory);
  const leftovers = inventory.filter(
    (item) => item.useByDate && item.useByDate <= todayKey,
  );
  const missingUseBy = inventory.filter((item) => !item.useByDate);
  const desserts = state.meals.filter(
    (dish) => dish.date === todayKey && dish.role === "dessert" && !dish.eaten,
  );
  const forgetItems = [
    ...leftovers.slice(0, 2).map((item) => ({
      key: item.id,
      label: `${item.name} · 今日まで`,
      kind: INVENTORY_KIND_LABELS[item.kind] as string | null,
    })),
    ...missingUseBy.slice(0, 2).map((item) => ({
      key: item.id,
      label: `${item.name} · 期限未設定`,
      kind: null as string | null,
    })),
  ].slice(0, 3);
  const recommendations = homeRecommendations(
    visibleRecipes(state.recipes ?? [], member?.id || "member-self"),
    inventory,
    leftovers.map((item) => item.name),
  );
  const familySrc = state.familyPhotoDataUrl || "/family-hero.png";
  const memos = [...state.memos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const shownDeliveries = homeDeliveries(state);

  return (
    <AppShell title="ホーム">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <DateStepper
              dateKey={viewDate}
              todayKey={todayKey}
              onChange={(next) => {
                setEditSlot(null);
                setViewDate(next);
              }}
            />
            {isBreadReminderDay(viewDate) ? (
              <p className="mt-1 text-xs text-amber-800">
                土曜サンド用食パン買い忘れ注意
              </p>
            ) : null}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={familySrc}
            alt="家族写真"
            className="-mt-1 size-24 shrink-0 rounded-2xl object-cover object-top sm:size-28"
          />
        </div>
        <div className="mt-4 space-y-4">
          <HomeSlotRow
            icon={Sun}
            slotName="朝"
            label={morningLabel}
            site={state.settings.recipeSite}
            onConfirm={() =>
              update((prev) => confirmSlotLabel(prev, viewDate, "morning"))
            }
            onEdit={() => setEditSlot("morning")}
          />
          <HomeSlotRow
            icon={Moon}
            slotName="夕"
            label={eveningLabel}
            site={state.settings.recipeSite}
            onConfirm={() =>
              update((prev) => confirmSlotLabel(prev, viewDate, "evening"))
            }
            onEdit={() => setEditSlot("evening")}
          />
        </div>
        <Link
          href="/meals"
          className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]"
        >
          献立を見る
        </Link>
      </Card>

      <Card>
        <SectionTitle
          action={
            <Link href="/bought" className={actionLinkClass}>
              追加する
            </Link>
          }
        >
          食べ忘れ注意
        </SectionTitle>
        {forgetItems.length === 0 && desserts.length === 0 ? (
          <p className="text-base text-neutral-500">いま気になるものはありません。</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {forgetItems.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 text-base"
              >
                <span className="min-w-0 font-semibold text-neutral-900">
                  {item.label}
                  {item.kind ? (
                    <span className="ml-1 text-xs font-normal text-neutral-500">
                      {item.kind}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="min-h-11 shrink-0 px-2 text-base font-semibold text-[#1B6B32]"
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      inventory: markInventoryUsedUp(prev.inventory, item.key),
                    }))
                  }
                >
                  使い切った
                </button>
              </li>
            ))}
            {desserts.slice(0, 2).map((dish) => (
              <li
                key={dish.id}
                className="flex items-center justify-between gap-2 text-base"
              >
                <span className="font-semibold">{dish.name}（デザート）</span>
                <button
                  type="button"
                  className="min-h-11 shrink-0 px-2 text-base font-semibold text-[#1B6B32]"
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      meals: prev.meals.map((item) =>
                        item.id === dish.id ? { ...item, eaten: true } : item,
                      ),
                    }))
                  }
                >
                  食べた
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle>忘れないメモ</SectionTitle>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("memo") as HTMLInputElement;
            const text = input.value.trim();
            if (!text) return;
            update((prev) => ({
              ...prev,
              memos: [
                {
                  id: crypto.randomUUID(),
                  text,
                  createdAt: new Date().toISOString(),
                },
                ...prev.memos,
              ],
            }));
            input.value = "";
          }}
        >
          <input
            name="memo"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#e6e8e3] px-3 py-2 text-base"
            placeholder="例: 牛乳を出す"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-lg bg-[#1B6B32] px-3 text-base font-semibold text-white"
          >
            追加
          </button>
        </form>
        {memos.length === 0 ? (
          <p className="mt-2 text-base text-neutral-500">直近のメモはありません。</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {memos.map((memo) => (
              <li
                key={memo.id}
                className="flex items-center justify-between gap-2 text-base"
              >
                <span className="min-w-0">{memo.text}</span>
                <button
                  type="button"
                  className="min-h-11 shrink-0 px-2 text-base font-semibold text-rose-600"
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      memos: prev.memos.filter((item) => item.id !== memo.id),
                    }))
                  }
                >
                  済
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <RecipePhotoImport variant="home" embedded />
        <div
          id="home-recommendations"
          className="mt-4 scroll-mt-4 border-t border-[#e6e8e3] pt-3"
        >
          <SectionTitle>おすすめ</SectionTitle>
          {recommendations.length === 0 ? (
            <p className="text-base text-neutral-500">
              上でレシピを保存すると、ここに候補が出ます。
            </p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recommendations.map(({ recipe, leftoverMatched }) => {
                  const cover = recipeCover(recipe);
                  return (
                    <div key={recipe.id} className="w-24 shrink-0">
                      <HomeRecipePreview src={cover} title={recipe.title} />
                      <p className="mt-1 truncate text-xs font-semibold">{recipe.title}</p>
                      {leftoverMatched.length > 0 ? (
                        <p className="truncate text-xs text-rose-700">
                          食べ残し {leftoverMatched[0]}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {recommendations.some(({ recipe }) => recipeCover(recipe)) ? (
                <p className="mt-2 text-xs text-neutral-500">
                  長押しで大きく見る
                </p>
              ) : null}
            </>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          action={
            <Link href="/recipes" className={actionLinkClass}>
              開く
            </Link>
          }
        >
          レシピ庫
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {RECIPE_HOME_SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.mark}
              href={`/recipes?mark=${shortcut.mark}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#1B6B32] bg-white px-3 text-base font-semibold text-[#1B6B32]"
            >
              {shortcut.label}
            </Link>
          ))}
        </div>
      </Card>

      {shownDeliveries.length > 0 ? (
        <Card className="bg-[#f4f1ea]">
          <SectionTitle>宅配</SectionTitle>
          <div className="flex flex-col gap-4">
            {shownDeliveries.map((service) => (
              <div key={service.id}>
                <p className="mb-2 text-sm font-bold text-neutral-900">
                  <DeliveryName service={service} />
                </p>
                <label className="mb-1 block text-xs text-neutral-500">
                  お届け日
                </label>
                <Field
                  type="date"
                  className="mb-2 bg-white"
                  value={service.deliveryDate ?? ""}
                  onChange={(event) =>
                    update((prev) =>
                      patchDelivery(prev, service.id, {
                        deliveryDate: event.target.value || null,
                      }),
                    )
                  }
                />
                <label className="mb-1 block text-xs text-neutral-500">
                  変更期限
                </label>
                <Field
                  type="datetime-local"
                  className="bg-white"
                  value={service.changeDeadlineAt ?? ""}
                  onChange={(event) =>
                    update((prev) =>
                      patchDelivery(prev, service.id, {
                        changeDeadlineAt: event.target.value || null,
                      }),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {editSlot ? (
        <MealSlotEditor
          key={`${viewDate}-${editSlot}`}
          open
          onClose={() => setEditSlot(null)}
          state={state}
          date={viewDate}
          slot={editSlot}
          onUpdate={update}
        />
      ) : null}
    </AppShell>
  );
}
