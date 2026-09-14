import { describe, expect, it } from "vitest";

import dashboardData from "@/data/mirai/dashboard.json";
import {
  type MiraiDailyBlock,
  miraiDashboardSchema,
} from "@/lib/mirai-schema";
import {
  MIRAI_ROSTER_DEFAULT,
  type MiraiRosterState,
} from "@/lib/mirai/roster-state";
import {
  MIRAI_DEFAULT_WORK_DAY,
  blockDiffMin,
  carryoverBlocks,
  dayActualSummary,
  dayHalfOf,
  dayWorkloadSummary,
  dutyBlocksForDate,
  isCarryoverEligible,
  isDailyBlockDone,
  minutesOf,
  normalizeAssignee,
  placeCarryoverTimes,
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

describe("mirai 番組表のタイマー実績・予実差・繰越（Phase 3 後半）", () => {
  const block = (over: Partial<MiraiDailyBlock>): MiraiDailyBlock => ({
    id: "b",
    date: "2026-05-23",
    columnId: "soumu-travel",
    plannedStart: "09:00",
    plannedEnd: "10:00",
    title: "テスト予定",
    ...over,
  });

  it("完了は明示 done=true のみ（actual があっても未完了のまま）", () => {
    expect(isDailyBlockDone(block({}))).toBe(false);
    expect(isDailyBlockDone(block({ done: false }))).toBe(false);
    expect(
      isDailyBlockDone(block({ actualStart: "09:00", actualEnd: "10:00" })),
    ).toBe(false);
    expect(isDailyBlockDone(block({ done: true }))).toBe(true);
    expect(
      isDailyBlockDone(
        block({ done: true, actualStart: "09:00", actualEnd: "10:00" }),
      ),
    ).toBe(true);
  });

  it("actual があっても予実差は出せるが、日次サマリの完了件数は done=true のみ", () => {
    const withActual = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      [block({ id: "actual-only", actualStart: "09:05", actualEnd: "10:20" })],
    ).blocks.find((b) => b.id === "actual-only")!;
    expect(blockDiffMin(withActual)).toBe(15);

    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      [
        block({ id: "done", done: true, actualStart: "09:05", actualEnd: "10:20" }),
        block({ id: "actual-only", actualStart: "09:05", actualEnd: "10:20" }),
        block({ id: "todo", plannedStart: "13:00", plannedEnd: "13:30" }),
      ],
    );
    const summary = dayActualSummary(model, "主");
    expect(summary.plannedMin).toBe(150);
    expect(summary.actualMin).toBe(75);
    expect(summary.diffMin).toBe(15);
    expect(summary.doneCount).toBe(1);
    expect(summary.totalCount).toBe(3);
  });

  it("予実差は 実績 − 予定（超過は正・短縮は負・未記録は null）", () => {
    const done = programDayModel(MIRAI_ROSTER_DEFAULT, MIRAI_DEFAULT_WORK_DAY, "2026-05-23", [
      block({ id: "over", done: true, actualStart: "09:05", actualEnd: "10:20" }),
    ]).blocks.find((b) => b.id === "over")!;
    expect(blockDiffMin(done)).toBe(15);

    const fast = programDayModel(MIRAI_ROSTER_DEFAULT, MIRAI_DEFAULT_WORK_DAY, "2026-05-23", [
      block({ id: "fast", done: true, actualStart: "09:00", actualEnd: "09:45" }),
    ]).blocks.find((b) => b.id === "fast")!;
    expect(blockDiffMin(fast)).toBe(-15);

    const notDone = programDayModel(MIRAI_ROSTER_DEFAULT, MIRAI_DEFAULT_WORK_DAY, "2026-05-23", [
      block({ id: "todo" }),
    ]).blocks.find((b) => b.id === "todo")!;
    expect(blockDiffMin(notDone)).toBeNull();
  });

  it("日次サマリは done=true かつ実績ありのブロックだけ集計する（主）", () => {
    const model = programDayModel(MIRAI_ROSTER_DEFAULT, MIRAI_DEFAULT_WORK_DAY, "2026-05-23", [
      block({ id: "done", done: true, actualStart: "09:05", actualEnd: "10:20" }),
      block({ id: "todo", plannedStart: "13:00", plannedEnd: "13:30" }),
    ]);
    const summary = dayActualSummary(model, "主");
    expect(summary.plannedMin).toBe(90);
    expect(summary.actualMin).toBe(75);
    expect(summary.diffMin).toBe(15);
    expect(summary.doneCount).toBe(1);
    expect(summary.totalCount).toBe(2);
  });

  it("繰越は表示日より前の未完了（done=false・dismissed=false）だけを担当・日付順で返す", () => {
    const blocks: MiraiDailyBlock[] = [
      block({ id: "y1", date: "2026-05-22", plannedStart: "11:00", plannedEnd: "12:00" }),
      block({ id: "y0", date: "2026-05-22", plannedStart: "09:00", plannedEnd: "10:00" }),
      block({ id: "done", date: "2026-05-22", done: true }),
      block({
        id: "actual-not-done",
        date: "2026-05-22",
        actualStart: "09:00",
        actualEnd: "10:00",
      }),
      block({ id: "dismissed", date: "2026-05-22", dismissed: true }),
      block({ id: "today", date: "2026-05-23" }),
      block({ id: "pair", date: "2026-05-21", assignee: "ペア" }),
    ];
    const result = carryoverBlocks(blocks, "2026-05-23", "主");
    expect(result.map((b) => b.id)).toEqual(["y0", "actual-not-done", "y1"]);
  });

  it("dismissed または done のブロックは繰越対象外", () => {
    expect(isCarryoverEligible(block({ dismissed: true }))).toBe(false);
    expect(isCarryoverEligible(block({ done: true }))).toBe(false);
    expect(isCarryoverEligible(block({}))).toBe(true);
  });

  it("今日に載せるは勤務開始直後の空き枠に置く（5/23・主）", () => {
    // 5/23 の seed 予定は 9:35 開始 → 9:00–9:35 が空く。30 分は収まる。
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      dailyBlocks,
    );
    const slot = placeCarryoverTimes(model, 30, "主");
    expect(slot.startMin).toBe(minutesOf("09:00"));
    expect(slot.endMin).toBe(minutesOf("09:30"));
  });

  it("収まる空きが無い繰越は末尾（占有の後ろ）に置き、昼休みに食い込まない（5/23・主）", () => {
    // 5/23 は 9:00–9:35 の 35 分しか空きがなく、60 分は収まらない → 末尾（16:00 以降）。
    const model = programDayModel(
      MIRAI_ROSTER_DEFAULT,
      MIRAI_DEFAULT_WORK_DAY,
      "2026-05-23",
      dailyBlocks,
    );
    const slot = placeCarryoverTimes(model, 60, "主");
    const overlapLunch =
      slot.startMin < minutesOf("13:00") && slot.endMin > minutesOf("12:00");
    expect(overlapLunch).toBe(false);
    expect(slot.startMin).toBeGreaterThanOrEqual(minutesOf("16:00"));
  });
});
