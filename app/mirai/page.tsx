import { MiraiWorkspace } from "@/components/mirai/MiraiWorkspace";
import dashboardData from "@/data/mirai/dashboard.json";
import { miraiDashboardSchema } from "@/lib/mirai-schema";

export default function MiraiPage() {
  const result = miraiDashboardSchema.safeParse(dashboardData);

  if (!result.success) {
    throw new Error(
      `data/mirai/dashboard.json: ${result.error.issues[0]?.message}`,
    );
  }

  return <MiraiWorkspace initialDashboard={result.data} />;
}
