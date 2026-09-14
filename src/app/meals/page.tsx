"use client";

import { Moon, Sun } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DateStepper } from "@/components/DateStepper";
import { MealChoiceTags } from "@/components/MealChoiceTags";
import { MealSlotEditor } from "@/components/MealSlotEditor";
import { MealSlotSummaryCard } from "@/components/MealSlotSummaryCard";
import { MealSourcePlacePicker } from "@/components/MealSourcePlacePicker";
import { PassDaysCard } from "@/components/PassDaysCard";
import { RecipeSearchButton } from "@/components/RecipeSearchButton";
import {
  Card,
  confirmLinkClass,
  Field,
  outlineActionClass,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  SplitChoiceRow,
  StateBadge,
} from "@/components/ui";
import { useKitchenStore } from "@/hooks/use-kitchen-store";
import { tokyoDateKey } from "@/lib/dates";
import {
  addPlannedDish,
  dayHighlightGenres,
  dishesOn,
  findPass,
  formatPassLine,
  formatWeekdayLine,
  lastEveningProtein,
  mealCalendarKeys,
  slotSourceKind,
} from "@/lib/meals";
import {
  confirmSlotLabel,
  effectiveMorningDishName,
  effectiveMorningStaple,
  effectivePassHome,
  resolveSlotLabel,
  type SlotLabel,
} from "@/lib/meal-prefs";
import {
  PASS_HOME_LABEL,
  PROTEIN_LABELS,
  type DishRole,
  type FrequentDish,
  type MealSlot,
  type ProteinKind,
} from "@/lib/types";

/** 一覧の1行。確定は濃い文字、定番・提案はバッジ、未設定はグレー */
function MealListLine({
  slotName,
  label,
  className = "",
}: {
  slotName: string;
  label: SlotLabel;
  className?: string;
}) {
  const body =
    label.kind === "meal" || label.kind === "pass"
      ? "font-semibold text-neutral-900"
      : label.kind === "empty"
        ? "text-neutral-400"
        : "text-neutral-700";
  return (
    <span className={`flex items-center gap-2 text-base ${className}`}>
      <span className="shrink-0 text-neutral-500">{slotName}</span>
      <span className={`min-w-0 truncate ${body}`}>{label.text}</span>
      {label.badge ? <StateBadge>{label.badge}</StateBadge> : null}
    </span>
  );
}

export default function MealsPage() {
  const { state, ready, update } = useKitchenStore();
  const todayKey = tokyoDateKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("evening");
  const [listOpen, setListOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [dessertName, setDessertName] = useState("");
  const [addNote, setAddNote] = useState("");
  const [proteinNote, setProteinNote] = useState("");
  const [newFrequent, setNewFrequent] = useState("");
  const [newFrequentRole, setNewFrequentRole] = useState<"main" | "side">("side");
  const [newFrequentProtein, setNewFrequentProtein] = useState<ProteinKind>("meat");
  const [registerOpen, setRegisterOpen] = useState(false);
  const todayRowRef = useRef<HTMLButtonElement>(null);

  const calendarKeys = useMemo(
    () => mealCalendarKeys(state, todayKey),
    [state, todayKey],
  );

  if (!ready) {
    return (
      <AppShell title="献立">
        <p className="text-base text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  const dishes = dishesOn(state, selectedDate, selectedSlot);
  const pass = findPass(state, selectedDate, selectedSlot);
  const nonDessert = dishes.filter((d) => d.role !== "dessert");
  const passHome = effectivePassHome(state, selectedDate, selectedSlot);
  const showPass = passHome === "pass" && nonDessert.length === 0;
  const sourceKind = slotSourceKind(dishes);
  const isCook = passHome === "home" && sourceKind === "cook";
  const passLabel = formatPassLine(pass?.reason ?? PASS_HOME_LABEL);
  const slotLabel = selectedSlot === "morning" ? "朝" : "夕";
  const resolved = resolveSlotLabel(state, selectedDate, selectedSlot);
  const searchQuery =
    nonDessert.find((dish) => dish.role === "main")?.name.trim() ||
    nonDessert[0]?.name.trim() ||
    (selectedSlot === "morning" &&
    passHome === "home" &&
    effectiveMorningStaple(state, selectedDate) !== "unset"
      ? effectiveMorningDishName(state, selectedDate)
      : "");

  function addFrequent(dish: FrequentDish) {
    if (showPass || !isCook) {
      setAddNote(
        showPass
          ? "パスの日はそのままです。パスをやめるか、別の日を選んでください。"
          : "家で作るを選んでから追加してください。",
      );
      return;
    }
    if (dish.role === "main" && selectedSlot === "evening" && dish.proteinKind) {
      const previous = lastEveningProtein(state, selectedDate);
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
    update((prev) => ({
      ...prev,
      meals: addPlannedDish(prev.meals, {
        date: selectedDate,
        slot: selectedSlot,
        role: dish.role,
        name: dish.name,
        proteinKind: dish.proteinKind,
      }),
    }));
    setAddNote(
      `「${dish.name}」を ${formatWeekdayLine(selectedDate)} の${slotLabel}に追加しました。`,
    );
  }

  function openList() {
    setListOpen(true);
    window.requestAnimationFrame(() => {
      todayRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <AppShell title="献立">
      <Card>
        <DateStepper
          dateKey={selectedDate}
          todayKey={todayKey}
          onChange={(next) => {
            setSelectedDate(next);
            setAddNote("");
          }}
        />
        <div className="mt-3 space-y-1.5">
          <SplitChoiceRow
            items={[
              { id: "morning", label: "朝", icon: Sun },
              { id: "evening", label: "夕", icon: Moon },
            ]}
            value={selectedSlot}
            onChange={(slot) => {
              setSelectedSlot(slot);
              setAddNote("");
            }}
          />
          <MealChoiceTags
            state={state}
            date={selectedDate}
            slot={selectedSlot}
            onUpdate={update}
          />
        </div>
        {passHome === "pass" ? (
          <div className="mt-3">
            <MealSlotSummaryCard
              state={state}
              dishes={dishes}
              showPass
              passLabel={passLabel}
            />
          </div>
        ) : isCook ? (
          <>
            <div className="mt-3">
              <MealSlotSummaryCard
                state={state}
                dishes={dishes}
                showPass={false}
                passLabel={passLabel}
              />
            </div>
            {proteinNote ? (
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                {proteinNote}
              </p>
            ) : null}
            {resolved.canConfirm || resolved.badge ? (
              <div className="mt-3">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 leading-snug">
                  <span className="text-xl font-bold text-neutral-900">
                    {resolved.text}
                  </span>
                  {resolved.badge ? (
                    <StateBadge>{resolved.badge}</StateBadge>
                  ) : null}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4">
                  {resolved.canConfirm ? (
                    <button
                      type="button"
                      className={confirmLinkClass}
                      onClick={() =>
                        update((prev) =>
                          confirmSlotLabel(prev, selectedDate, selectedSlot),
                        )
                      }
                    >
                      これにする
                    </button>
                  ) : null}
                  {resolved.searchQuery ? (
                    <RecipeSearchButton
                      query={resolved.searchQuery}
                      site={state.settings.recipeSite}
                      label="レシピを検索"
                      variant="text"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className={`mt-3 ${outlineActionClass}`}
              onClick={() => setEditOpen(true)}
            >
              メニューを選び直す
            </button>
          </>
        ) : (
          <div className="mt-3">
            <MealSourcePlacePicker
              key={`${selectedDate}-${selectedSlot}-${sourceKind}`}
              state={state}
              date={selectedDate}
              slot={selectedSlot}
              kind={sourceKind === "procure" ? "procure" : "eatout"}
              onUpdate={update}
            />
          </div>
        )}
      </Card>

      {isCook ? (
      <Card>
        <SectionTitle>よく作る</SectionTitle>
        <p className="mb-3 text-xs leading-relaxed text-neutral-500">
          上で選んだ{" "}
          <span className="font-semibold text-neutral-800">
            {formatWeekdayLine(selectedDate)} の{slotLabel}
          </span>{" "}
          に、タップで追加します。家で作るときだけ使えます。
        </p>
        <div className="flex flex-wrap gap-2">
          {state.frequentDishes.map((dish) => (
            <button
              key={dish.id}
              type="button"
              disabled={!isCook}
              onClick={() => addFrequent(dish)}
              className="min-h-11 rounded-full border border-[#1B6B32]/40 bg-white px-4 py-2 text-base font-semibold text-neutral-900 disabled:opacity-40"
            >
              {dish.name}
              {dish.role === "main" && dish.proteinKind
                ? ` · ${PROTEIN_LABELS[dish.proteinKind]}`
                : ""}
            </button>
          ))}
        </div>
        {addNote ? (
          <p className="mt-3 text-xs font-semibold leading-relaxed text-[#1B6B32]">
            {addNote}
          </p>
        ) : null}
        <div className="mt-4 border-t border-[#e6e8e3] pt-3">
          {registerOpen ? (
            <>
              <p className="mb-2 text-base font-semibold text-neutral-800">
                よく作るを登録
              </p>
              <Field
                placeholder="料理名"

                value={newFrequent}
                onChange={(event) => setNewFrequent(event.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <select
                  className="min-h-11 rounded-lg border border-[#e6e8e3] px-2 py-2 text-base"
                  value={newFrequentRole}
                  onChange={(event) =>
                    setNewFrequentRole(event.target.value as "main" | "side")
                  }
                >
                  <option value="main">主菜</option>
                  <option value="side">副菜</option>
                </select>
                {newFrequentRole === "main" ? (
                  <select
                    className="min-h-11 rounded-lg border border-[#e6e8e3] px-2 py-2 text-base"
                    value={newFrequentProtein}
                    onChange={(event) =>
                      setNewFrequentProtein(event.target.value as ProteinKind)
                    }
                  >
                    <option value="meat">肉</option>
                    <option value="fish">魚（エビ含む）</option>
                  </select>
                ) : null}
                <PrimaryButton
                  type="button"

                  disabled={!newFrequent.trim()}
                  onClick={() => {
                    const name = newFrequent.trim();
                    update((prev) => ({
                      ...prev,
                      frequentDishes: [
                        ...prev.frequentDishes,
                        {
                          id: crypto.randomUUID(),
                          name,
                          role: newFrequentRole,
                          proteinKind:
                            newFrequentRole === "main"
                              ? newFrequentProtein
                              : null,
                        },
                      ],
                    }));
                    setNewFrequent("");
                    setNewFrequentRole("side");
                    setRegisterOpen(false);
                    setAddNote("「よく作る」に登録しました。");
                  }}
                >
                  登録
                </PrimaryButton>
              </div>
              <button
                type="button"
                className="mt-2 min-h-11 text-base font-semibold text-neutral-500"
                onClick={() => {
                  setRegisterOpen(false);
                  setNewFrequent("");
                }}
              >
                やめる
              </button>
            </>
          ) : (
            <SecondaryButton
              type="button"

              onClick={() => setRegisterOpen(true)}
            >
              よく作るを登録
            </SecondaryButton>
          )}
        </div>
      </Card>
      ) : null}

      <Card>
        <SectionTitle>デザート（任意）</SectionTitle>
        <div className="flex gap-2">
          <Field
            placeholder="例: プリン"

            value={dessertName}
            onChange={(event) => setDessertName(event.target.value)}
          />
          <PrimaryButton
            type="button"
            className="shrink-0"
            disabled={!dessertName.trim()}
            onClick={() => {
              const name = dessertName.trim();
              update((prev) => ({
                ...prev,
                meals: addPlannedDish(prev.meals, {
                  date: selectedDate,
                  slot: selectedSlot,
                  role: "dessert" as DishRole,
                  name,
                  proteinKind: null,
                }),
              }));
              setDessertName("");
            }}
          >
            追加
          </PrimaryButton>
        </div>
      </Card>

      <PassDaysCard
        state={state}
        selectedDate={selectedDate}
        onUpdate={update}
      />

      <Card>
        <SectionTitle
          action={
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-lg bg-[#1B6B32] px-3 text-base font-semibold text-white"
              onClick={() => (listOpen ? setListOpen(false) : openList())}
            >
              {listOpen ? "閉じる" : "一覧を見る"}
            </button>
          }
        >
          献立一覧
        </SectionTitle>
        <p className="text-xs leading-relaxed text-neutral-500">
          今日〜14日と、保存済みの過去。肉・魚の傾向を見られます。
        </p>

        {listOpen ? (
          <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-xl border border-[#e6e8e3]">
            <div className="flex flex-col divide-y divide-[#e6e8e3]">
              {calendarKeys.map((dateKey) => {
                const eveningLabel = resolveSlotLabel(state, dateKey, "evening");
                const morningLabel = resolveSlotLabel(state, dateKey, "morning");
                const selected = dateKey === selectedDate;
                const isToday = dateKey === todayKey;
                const isPast = dateKey < todayKey;
                const genres = dayHighlightGenres(state, dateKey);
                const showMorning = morningLabel.kind !== "empty";
                return (
                  <button
                    key={dateKey}
                    ref={isToday ? todayRowRef : undefined}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateKey);
                      setAddNote("");
                    }}
                    className={`px-3 py-3 text-left ${
                      selected ? "bg-[#EDEDED]" : isPast ? "bg-[#fafaf8]" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-bold">
                        {formatWeekdayLine(dateKey)}
                        {isToday ? (
                          <span className="ml-2 text-xs font-semibold text-[#1B6B32]">
                            今日
                          </span>
                        ) : null}
                        {isPast ? (
                          <span className="ml-2 text-xs font-normal text-neutral-400">
                            過去
                          </span>
                        ) : null}
                      </p>
                      <div className="flex gap-1">
                        {genres.length === 0 ? (
                          <span className="text-xs text-neutral-400">—</span>
                        ) : (
                          genres.map((genre) => (
                            <span
                              key={genre}
                              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                genre === "meat"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}
                            >
                              {PROTEIN_LABELS[genre]}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    {showMorning ? (
                      <MealListLine
                        slotName="朝"
                        label={morningLabel}
                        className="mt-1.5"
                      />
                    ) : null}
                    <MealListLine
                      slotName="夕"
                      label={eveningLabel}
                      className="mt-1"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-neutral-500">
            普段はしまっておけます。「一覧を見る」で縦にスクロールできます。
          </p>
        )}
      </Card>

      <Card>
        <RecipeSearchButton
          query={searchQuery}
          site={state.settings.recipeSite}
        />
      </Card>

      <MealSlotEditor
        open={editOpen}
        onClose={() => setEditOpen(false)}
        state={state}
        date={selectedDate}
        slot={selectedSlot}
        onUpdate={update}
        pickOnly
      />
    </AppShell>
  );
}
