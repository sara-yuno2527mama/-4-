import {
  type MiraiDashboard,
  type MiraiDomain,
  type MiraiSchedulePhase,
  type MiraiTask,
  type MiraiTrack,
} from "@/lib/mirai-schema";

export function isOpenTask(task: MiraiTask): boolean {
  return task.status !== "done";
}

export function openCountForTrack(tasks: MiraiTask[], trackId: string): number {
  return tasks.filter((t) => t.trackId === trackId && isOpenTask(t)).length;
}

export function findDomainByTrackId(
  domains: MiraiDomain[],
  trackId: string,
): MiraiDomain | undefined {
  return domains.find((d) => d.tracks.some((t) => t.id === trackId));
}

export function findTrack(
  domains: MiraiDomain[],
  trackId: string,
): MiraiTrack | undefined {
  for (const domain of domains) {
    const track = domain.tracks.find((t) => t.id === trackId);
    if (track) return track;
  }
  return undefined;
}

export type MiraiTrackTaskGroup = {
  track: MiraiTrack;
  tasks: MiraiTask[];
};

export function taskGroupsForDomain(
  dashboard: MiraiDashboard,
  domainId: string,
): MiraiTrackTaskGroup[] {
  const domain = dashboard.domains.find((d) => d.id === domainId);
  if (!domain) return [];

  return domain.tracks.map((track) => ({
    track,
    tasks: dashboard.tasks.filter((t) => t.trackId === track.id),
  }));
}

function parseDateOnly(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function resolveAsOfDate(dashboard: MiraiDashboard): string {
  if (dashboard.asOfDate) return dashboard.asOfDate;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function currentSchedulePhase(
  phases: MiraiSchedulePhase[] | undefined,
  asOfDate: string,
): MiraiSchedulePhase | null {
  if (!phases?.length) return null;
  const asOf = parseDateOnly(asOfDate);
  return (
    phases.find((phase) => {
      const start = parseDateOnly(phase.start);
      const end = parseDateOnly(phase.end);
      return asOf >= start && asOf <= end;
    }) ?? null
  );
}

export function initialMiraiSelection(dashboard: MiraiDashboard): {
  domainId: string;
  trackId: string;
  taskId: string | null;
} {
  const firstDomain =
    dashboard.domains.find((d) => d.tracks.length > 0) ?? dashboard.domains[0];
  const firstTrack = firstDomain?.tracks[0];
  const domainId = firstDomain?.id ?? "";
  const trackId = firstTrack?.id ?? "";
  const firstTask = dashboard.tasks.find((t) => t.trackId === trackId);
  return {
    domainId,
    trackId,
    taskId: firstTask?.id ?? null,
  };
}
