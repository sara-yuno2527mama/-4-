import { describe, expect, it } from "vitest";

import dashboardData from "@/data/mirai/dashboard.json";
import { miraiDashboardSchema } from "@/lib/mirai-schema";
import { crossCutSnapshot } from "@/lib/mirai/crosscut";
import { MIRAI_ROSTER_DEFAULT } from "@/lib/mirai/roster-state";

const dashboard = miraiDashboardSchema.parse(dashboardData);
const AS_OF = "2026-05-23";

describe("mirai 横断スナップショット（Phase 1）", () => {
  it("お弁当3日前アラートを表示する（asOf 5/23・お弁当 5/26）", () => {
    const snapshot = crossCutSnapshot(dashboard, AS_OF, MIRAI_ROSTER_DEFAULT);
    const bento = snapshot.alerts.find((a) => a.id.startsWith("bento-"));
    expect(bento).toBeDefined();
    expect(bento?.message).toContain("お弁当まであと3日");
  });

  it("各ドメインの現在フェーズ名を返す（既存 currentSchedulePhase 流用）", () => {
    const snapshot = crossCutSnapshot(dashboard, AS_OF, MIRAI_ROSTER_DEFAULT);
    expect(snapshot.domains.length).toBe(dashboard.domains.length);
    const program = snapshot.domains.find((d) => d.domainId === "mirai-program");
    expect(program?.currentPhaseLabel).toBe("5月・募集");
  });

  it("業務月は請求締め日ベースで解決する（5月度・締め 6/3）", () => {
    const snapshot = crossCutSnapshot(dashboard, AS_OF, MIRAI_ROSTER_DEFAULT);
    expect(snapshot.businessMonth.label).toBe("5月度");
    expect(snapshot.businessMonth.closeDate).toBe("2026-06-03");
    expect(snapshot.businessMonth.needsCloseDate).toBe(false);
  });
});
