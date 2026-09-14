import { runDueNotifications } from "./notify";

let started = false;
let lastSlot = "";

export function startNotifyScheduler() {
  if (started) return;
  started = true;

  const tick = () => {
    const now = new Date();
    const slot = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    if (now.getMinutes() !== 0 || slot === lastSlot) return;
    lastSlot = slot;
    void runDueNotifications();
  };

  setInterval(tick, 30_000);
}
