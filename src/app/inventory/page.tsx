"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { useKitchenStore } from "@/hooks/use-kitchen-store";
import { formatJaDate } from "@/lib/dates";
import { activeInventory, markInventoryUsedUp } from "@/lib/inventory";
import { INVENTORY_KIND_LABELS } from "@/lib/types";

export default function InventoryPage() {
  const { state, ready, update } = useKitchenStore();

  if (!ready) {
    return (
      <AppShell title="今ある">
        <p className="text-base text-neutral-500">読み込み中…</p>
      </AppShell>
    );
  }

  const items = activeInventory(state.inventory);

  return (
    <AppShell title="今ある">
      <Card>
        <p className="text-base leading-relaxed text-neutral-700">
          いま家にあるものの一覧です。新しいものは「追加」から入れます。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          使い切ったものは「使い切った」で一覧から外れます（消えるだけで、記録は残ります）。間違えて入れたものは「削除」です。
        </p>
        <Link
          href="/bought"
          className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-[#1B6B32] px-4 text-base font-semibold text-white"
        >
          追加する
        </Link>
      </Card>
      {items.length === 0 ? (
        <Card>
          <p className="text-base text-neutral-600">
            まだ一覧がありません。「追加する」から入れてください。
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-bold">
                      {item.name}
                      <span className="ml-1 text-xs font-normal text-neutral-500">
                        （{INVENTORY_KIND_LABELS[item.kind]}）
                      </span>
                    </p>
                    <p className="mt-1 text-base">
                      使用期限{" "}
                      {item.useByDate ? formatJaDate(item.useByDate) : "未設定"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="min-h-11 shrink-0 px-2 text-base font-semibold text-neutral-500"
                    onClick={() =>
                      update((prev) => ({
                        ...prev,
                        inventory: prev.inventory.filter(
                          (row) => row.id !== item.id,
                        ),
                      }))
                    }
                  >
                    削除
                  </button>
                </div>
                <input
                  type="date"
                  className="mt-2 min-h-11 w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-base"
                  value={item.useByDate ?? ""}
                  onChange={(event) =>
                    update((prev) => ({
                      ...prev,
                      inventory: prev.inventory.map((row) =>
                        row.id === item.id
                          ? { ...row, useByDate: event.target.value || null }
                          : row,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="mt-2 min-h-11 w-full rounded-lg border border-[#1B6B32] bg-white text-base font-semibold text-[#1B6B32]"
                  onClick={() =>
                    update((prev) => ({
                      ...prev,
                      inventory: markInventoryUsedUp(prev.inventory, item.id),
                    }))
                  }
                >
                  使い切った
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
