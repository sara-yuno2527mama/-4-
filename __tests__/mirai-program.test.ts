import { describe, expect, it } from "vitest";

import dashboardData from "@/data/mirai/dashboard.json";
import { miraiDashboardSchema } from "@/lib/mirai-schema";
import {
  MIRAI_ROSTER_DEFAULT,
  type MiraiRosterState,
} from "@/lib/mirai/roster-state";
import {
  MIRAI_DEFAULT_WORK_DAY,
  dayHalfOf,
  dayWorkloadSummary,
  dutyBlocksForDate,
  minutesOf,
  normalizeAssignee,
  programDayModel,
} from "@/lib/mirai/program";

const dashboard = miraiDashboardSchema.parse(dashboardData);
const dailyBlocks = dashboard.dailyBlocks ?? [];

describe("mirai 番組表の当番自動ブロック（Phase 2）", () => {
  it("郵便当番日は 9:05 の朝仕分けブロックを総務全体列に生成する（5/17）", () => {
    const blocks = dutyBlocksForDate(MIRAI_ROSTER_DEFAULT, "2026-05-17");
    const morning = blocks.find((b) => b.kind === "mail-am");
    expect(morning).toBeDefined();
    expect(morning?.plannedStart).toBe("09:05");
    expect(morning?.plannedEnd).toBe("09:35");
    expect(morning?.columnId).toBe("soumu-general");
    expect(morning?.locked).toBe(true);
  });

  it("郵便+定期便日は 15:45–16:15 の定期便ブロックを追加する（5/17）", () => {
    const blocks = dutyBlocksForDate(MIRAI_ROSTER_DEFAULT, "2026-05-17");
    const regular = blocks.find((b) => b.kind === "regular-pm");
    expect(regular).toBeDefined();
    expect(regular?.plannedStart).toBe("15:45");
    expect(regular?.plannedEnd).toBe("16:15");
  });

  it("昼当番日は電話番ブロックを生成する（5/7）", () => {
    const blocks = dutyBlocksForDate(MIRAI_ROSTER_DEFAULT, "2026-05-07");
    expect(blocks.some((b) => b.kind === "lunch-phone")).toBe(true);
  });

  it("お弁当日はプライベート列にブロックを生成する（5/15）", () => {
    const blocks = dutyBlocksForDate(MIRAI_ROSTER_DEFAULT, "2026-05-15");
    const bento = blocks.find((b) => b.kind === "bento");
    expect(bento?.columnId).toBe("private");
  });

  it("当番のない通常日は当番ブロックを生成しない（5/23）", () => {
    const blocks = dutyBlocksForDate(MIRAI_ROSTER_DEFAULT, "2026-05-23");
    expect(blocks.length).toBe(0);
  });
});

describe("mirai 番組表の日次モデル（Phase 2）", () => {
  it("定期便日は時間軸を 16:15 まで延長する（5/17）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-17",
      dailyBlocks,
    );
    expect(model.dayEndMin).toBe(minutesOf("16:15"));
    expect(model.flags.isRegularMail).toBe(true);
  });

  it("通常日は 16:00 までで昼休みバンドを持つ（5/23）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      dailyBlocks,
    );
    expect(model.dayEndMin).toBe(minutesOf("16:00"));
    expect(model.bands.some((b) => b.kind === "lunch")).toBe(true);
  });

  it("dashboard.json の予定ブロックを当日分だけ載せる（5/23）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      dailyBlocks,
    );
    const planned = model.blocks.filter((b) => !b.locked);
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((b) => b.timeLabel.includes("–"))).toBe(true);
  });
});

describe("mirai 番組表の担当・半休・業務時間バー（Phase 3）", () => {
  const rosterWithAm: MiraiRosterState = {
    ...MIRAI_ROSTER_DEFAULT,
    rosters: MIRAI_ROSTER_DEFAULT.rosters.map((r) =>
      r.yearMonth === "2026-05"
        ? {
            ...r,
            holidays: [...r.holidays, { start: "2026-05-19", kind: "am" }],
          }
        : r,
    ),
  };

  it("未設定の担当は「主」に寄せ、ペアはそのまま返す", () => {
    expect(normalizeAssignee(undefined)).toBe("主");
    expect(normalizeAssignee("")).toBe("主");
    expect(normalizeAssignee("ペア")).toBe("ペア");
  });

  it("すべての予定/当番ブロックに担当が付く（5/17）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-17",
      dailyBlocks,
    );
    expect(model.blocks.length).toBeGreaterThan(0);
    expect(
      model.blocks.every((b) => b.assignee === "主" || b.assignee === "ペア"),
    ).toBe(true);
    expect(model.scheduleEndMin).toBe(minutesOf("15:30"));
  });

  it("半休は AM/PM を返し、当番のない通常日は null（5/19・5/23）", () => {
    expect(dayHalfOf(rosterWithAm, "2026-05-19")).toBe("am");
    expect(dayHalfOf(MIRAI_ROSTER_DEFAULT, "2026-05-23")).toBeNull();
  });

  it("通常日は昼休みを引いた 330 分が可能時間（5/23・主）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      dailyBlocks,
    );
    const summary = dayWorkloadSummary(model, "主");
    expect(summary.availableMin).toBe(330);
    expect(summary.overMin).toBeGreaterThanOrEqual(0);
  });

  it("郵便当番日は仕分け 60 分ぶん可能時間が減る（5/17・主）", () => {
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-17",
      dailyBlocks,
    );
    const summary = dayWorkloadSummary(model, "主");
    expect(summary.dutyMin).toBe(60);
    expect(summary.availableMin).toBe(270);
  });

  it("AM 半休の日は午前ぶん可能時間が減る（5/19・主）", () => {
    const model = programDayModel(
      rosterWithAm,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-19",
      dailyBlocks,
    );
    const summary = dayWorkloadSummary(model, "主");
    expect(summary.availableMin).toBe(150);
  });
});
