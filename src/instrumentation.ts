export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (process.env.VERCEL) return;
  const { startNotifyScheduler } = await import("./lib/notify-scheduler");
  startNotifyScheduler();
}
