"use client";

import { cn } from "@/lib/utils";
import { type MiraiTask, type MiraiTaskStatus } from "@/lib/mirai-schema";
import {
  type MiraiClosingTimingGroup,
  type MiraiTrackTaskGroup,
} from "@/lib/mirai/computed";
import { MIRAI_TASK_STATUS_LABELS } from "@/lib/mirai-labels";
import { miraiPane2ClassName } from "@/lib/mirai/layout";
import { type MiraiSchedulePhase } from "@/lib/mirai-schema";
import { MiraiSchedulePhaseStrip } from "@/components/mirai/MiraiSchedulePhaseStrip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const DOMAIN_EMPTY_MESSAGES: Record<string, string> = {};

type MiraiTaskListPaneProps = {
  domainId: string;
  domainName: string;
  trackName?: string;
  schedulePhases: MiraiSchedulePhase[] | undefined;
  scheduleStripTitle?: string;
  currentPhaseId: string | null;
  asOfDate: string;
  groups: MiraiTrackTaskGroup[];
  closingTimingGroups: MiraiClosingTimingGroup[] | null;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
};

const statusBadgeVariant: Record<
  MiraiTaskStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  todo: "secondary",
  doing: "default",
  done: "outline",
  blocked: "destructive",
};

export function MiraiTaskListPane({
  domainId,
  domainName,
  trackName,
  schedulePhases,
  scheduleStripTitle,
  currentPhaseId,
  asOfDate,
  groups,
  closingTimingGroups,
  selectedTaskId,
  onSelectTask,
}: MiraiTaskListPaneProps) {
  const useTimingGroups = closingTimingGroups !== null;
  const hasAnyTask = useTimingGroups
    ? closingTimingGroups.some((g) => g.tasks.length > 0)
    : groups.some((g) => g.tasks.length > 0);
  const hasTracks = groups.length > 0;
  const emptyMessage =
    DOMAIN_EMPTY_MESSAGES[domainId] ??
    "この領域にはトラックがありません。";

  return (
    <section aria-label="ペイン2" className={miraiPane2ClassName}>
      <header className="flex h-12 shrink-0 flex-col justify-center border-b border-border px-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {domainName}
        </h2>
        {trackName && useTimingGroups ? (
          <p className="truncate text-xs text-muted-foreground">{trackName}</p>
        ) : null}
      </header>
      {schedulePhases && schedulePhases.length > 0 ? (
        <MiraiSchedulePhaseStrip
          phases={schedulePhases}
          currentPhaseId={currentPhaseId}
          asOfDate={asOfDate}
          title={scheduleStripTitle}
        />
      ) : null}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-3 py-4">
          {!hasTracks ? (
            <MiraiTaskListEmpty message={emptyMessage} />
          ) : !hasAnyTask ? (
            <MiraiTaskListEmpty message="この仕事の締め作業はまだありません。" />
          ) : useTimingGroups ? (
            closingTimingGroups.map((group) => (
              <TimingTaskGroup
                key={group.phase.id}
                label={group.phase.label}
                tasks={group.tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={onSelectTask}
              />
            ))
          ) : (
            groups.map((group) => (
              <TrackTaskGroup
                key={group.track.id}
                label={group.track.name}
                tasks={group.tasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={onSelectTask}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </section>
  );
}

function MiraiTaskListEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
      {message}
    </p>
  );
}

function TimingTaskGroup({
  label,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  label: string;
  tasks: MiraiTask[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}) {
  const openCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-3 mb-2 flex items-center gap-1.5 bg-background px-5 py-1.5">
        <h3 className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </h3>
        <Badge variant="secondary" size="xs">
          {openCount}
        </Badge>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
          このタイミングの作業なし
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <MiraiTaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onSelect={onSelectTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TrackTaskGroup({
  label,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  label: string;
  tasks: MiraiTask[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}) {
  const openCount = tasks.filter((t) => t.status !== "done").length;

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-3 mb-2 flex items-center gap-1.5 bg-background px-5 py-1.5">
        <h3 className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </h3>
        <Badge variant="secondary" size="xs">
          {openCount}
        </Badge>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
          タスクなし
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tasks.map((task) => (
            <MiraiTaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onSelect={onSelectTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MiraiTaskRow({
  task,
  selected,
  onSelect,
}: {
  task: MiraiTask;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        className={cn(
          "flex w-full flex-col gap-1 rounded-md px-2.5 py-2.5 text-left transition-colors",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          selected
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-muted",
        )}
      >
        <span className="line-clamp-2 text-sm leading-snug">{task.title}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant={statusBadgeVariant[task.status]} size="xs">
            {MIRAI_TASK_STATUS_LABELS[task.status]}
          </Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {task.dueDate}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {task.owner}
          </span>
        </span>
      </button>
    </li>
  );
}
