import { describe, expect, it } from "vitest";

import dashboardData from "@/data/mirai/dashboard.json";
import {
  miraiDashboardSchema,
  miraiDelegatedToPairSchema,
} from "@/lib/mirai-schema";
import { crossCutSnapshot } from "@/lib/mirai/crosscut";
import {
  addDelegatedItem,
  buildDelegatedAlerts,
  removeDelegatedItem,
  sortDelegatedByDeadline,
  updateDelegatedItemStatus,
} from "@/lib/mirai/delegated";
import { MIRAI_ROSTER_DEFAULT } from "@/lib/mirai/roster-state";

const dashboard = miraiDashboardSchema.parse(dashboardData);
const AS_OF = "2026-05-23";

describe("mirai ペア振り（§9）", () => {
  it("追加時に id/status/delegatedOn を自動付与し期限順に並べる", () => {
    const items = addDelegatedItem([], {
      title: "後で",
      deadline: "2026-05-30",
      delegatedOn: "2026-05-23",
      createdBy: "主",
    });
    const items2 = addDelegatedItem(items, {
      title: "急ぎ",
      deadline: "2026-05-25",
      delegatedOn: "2026-05-22",
      createdBy: "主",
    });
    expect(items2).toHaveLength(2);
    expect(items2[0]?.title).toBe("急ぎ");
    expect(items2[0]?.status).toBe("todo");
    expect(items2[0]?.delegatedOn).toBe("2026-05-22");
    expect(items2[0]?.id).toMatch(/^deleg-/);
  });

  it("旧データに delegatedOn が無いとき parse で deadline を補完する", () => {
    const parsed = miraiDelegatedToPairSchema.parse({
      id: "legacy",
      title: "旧データ",
      deadline: "2026-05-26",
      status: "todo",
      createdBy: "主",
    });
    expect(parsed.delegatedOn).toBe("2026-05-26");
  });

  it("完了（振った側）でリストから削除する", () => {
    const items = addDelegatedItem([], {
      title: "確認",
      deadline: "2026-05-26",
      delegatedOn: "2026-05-23",
      createdBy: "ペア",
    });
    const id = items[0]!.id;
    const updated = updateDelegatedItemStatus(items, id, "doing");
    expect(updated[0]?.status).toBe("doing");
    const removed = removeDelegatedItem(updated, id);
    expect(removed).toHaveLength(0);
  });

  it("sortDelegatedByDeadline は期限昇順", () => {
    const sorted = sortDelegatedByDeadline([
      {
        id: "b",
        title: "B",
        deadline: "2026-06-01",
        delegatedOn: "2026-05-20",
        status: "todo",
        createdBy: "主",
      },
      {
        id: "a",
        title: "A",
        deadline: "2026-05-20",
        delegatedOn: "2026-05-18",
        status: "todo",
        createdBy: "主",
      },
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("横断帯アラート: 3日以内・本日・超過", () => {
    const alerts = buildDelegatedAlerts(
      [
        {
          id: "soon",
          title: "近い",
          deadline: "2026-05-26",
          delegatedOn: "2026-05-20",
          status: "todo",
          createdBy: "主",
        },
        {
          id: "today",
          title: "今日",
          deadline: AS_OF,
          delegatedOn: "2026-05-20",
          status: "doing",
          createdBy: "主",
        },
        {
          id: "over",
          title: "遅れ",
          deadline: "2026-05-20",
          delegatedOn: "2026-05-15",
          status: "todo",
          createdBy: "主",
        },
        {
          id: "far",
          title: "余裕",
          deadline: "2026-06-10",
          delegatedOn: "2026-05-23",
          status: "todo",
          createdBy: "主",
        },
      ],
      AS_OF,
    );
    expect(alerts.some((a) => a.id === "delegated-soon")).toBe(true);
    expect(alerts.some((a) => a.message.includes("本日期限"))).toBe(true);
    expect(alerts.some((a) => a.tone === "danger")).toBe(true);
    expect(alerts.some((a) => a.id === "delegated-far")).toBe(false);
  });

  it("crossCutSnapshot にペア振り期限アラートを merge する", () => {
    const roster = {
      ...MIRAI_ROSTER_DEFAULT,
      delegatedToPair: [
        {
          id: "d1",
          title: "ETC確認",
          deadline: "2026-05-26",
          delegatedOn: "2026-05-23",
          status: "todo" as const,
          createdBy: "主",
        },
      ],
    };
    const snapshot = crossCutSnapshot(dashboard, AS_OF, roster);
    expect(snapshot.alerts.some((a) => a.id === "delegated-d1")).toBe(true);
  });
});
