"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { type MiraiDashboard, type MiraiShidaiDraft } from "@/lib/mirai-schema";
import {
  annualMonthIdFromDate,
  currentYearPriorShidai,
  priorYearMonthWindow,
  shidaiGroupsForWindow,
  yearMonthLabel,
} from "@/lib/mirai/committee";
import { MIRAI_COMMITTEE_DOMAIN_ID } from "@/lib/mirai/constants";
import { miraiPanesRowClassName } from "@/lib/mirai/layout";
import {
  currentSchedulePhase,
  findDomainByTrackId,
  findTrack,
  initialMiraiSelection,
  resolveAsOfDate,
  taskGroupsForDomain,
} from "@/lib/mirai/computed";
import { MiraiDomainPane } from "@/components/mirai/MiraiDomainPane";
import { MiraiTaskListPane } from "@/components/mirai/MiraiTaskListPane";
import { MiraiTaskDetailPane } from "@/components/mirai/MiraiTaskDetailPane";
import { MiraiTaskChecklistPane } from "@/components/mirai/MiraiTaskChecklistPane";
import { MiraiCommitteeShidaiPane } from "@/components/mirai/MiraiCommitteeShidaiPane";
import { MiraiCommitteeDraftPane } from "@/components/mirai/MiraiCommitteeDraftPane";
import { MiraiShidaiDocumentPane } from "@/components/mirai/MiraiShidaiDocumentPane";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type MiraiWorkspaceProps = {
  initialDashboard: MiraiDashboard;
};

export function MiraiWorkspace({ initialDashboard }: MiraiWorkspaceProps) {
  const initial = initialMiraiSelection(initialDashboard);
  const asOfDate = resolveAsOfDate(initialDashboard);
  const defaultAnnualMonthId =
    initialDashboard.annualMonths?.find(
      (m) => m.id === annualMonthIdFromDate(asOfDate),
    )?.id ??
    initialDashboard.annualMonths?.[0]?.id ??
    annualMonthIdFromDate(asOfDate);

  const [selectedDomainId, setSelectedDomainId] = useState(initial.domainId);
  const [selectedTrackId, setSelectedTrackId] = useState(initial.trackId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initial.taskId,
  );
  const [selectedAnnualMonthId, setSelectedAnnualMonthId] = useState(
    defaultAnnualMonthId,
  );
  const [selectedShidaiId, setSelectedShidaiId] = useState<string | null>(null);

  const isCommitteeMode = selectedDomainId === MIRAI_COMMITTEE_DOMAIN_ID;
  const shidaiRecords = initialDashboard.shidaiRecords ?? [];
  const shidaiDrafts = initialDashboard.shidaiDrafts ?? [];
  const annualMonths = initialDashboard.annualMonths ?? [];

  const selectedDomain = initialDashboard.domains.find(
    (d) => d.id === selectedDomainId,
  );
  const selectedTrack = findTrack(initialDashboard.domains, selectedTrackId);
  const selectedTask =
    initialDashboard.tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedShidai =
    shidaiRecords.find((r) => r.id === selectedShidaiId) ?? null;

  const taskGroups = useMemo(
    () => taskGroupsForDomain(initialDashboard, selectedDomainId),
    [initialDashboard, selectedDomainId],
  );

  const priorYearWindow = useMemo(
    () => priorYearMonthWindow(selectedAnnualMonthId),
    [selectedAnnualMonthId],
  );

  const shidaiGroups = useMemo(
    () => shidaiGroupsForWindow(shidaiRecords, priorYearWindow),
    [shidaiRecords, priorYearWindow],
  );

  const currentYearPrior = useMemo(
    () => currentYearPriorShidai(shidaiRecords, selectedAnnualMonthId),
    [shidaiRecords, selectedAnnualMonthId],
  );

  const monthDraftFromJson = useMemo(
    () =>
      shidaiDrafts.find((d) => d.targetMonthId === selectedAnnualMonthId) ??
      null,
    [shidaiDrafts, selectedAnnualMonthId],
  );

  const [workingDraft, setWorkingDraft] = useState<MiraiShidaiDraft | null>(null);

  useEffect(() => {
    setWorkingDraft(
      monthDraftFromJson ? { ...monthDraftFromJson } : null,
    );
  }, [selectedAnnualMonthId, monthDraftFromJson]);

  const monthDraft = workingDraft;

  const selectTrack = useCallback(
    (domainId: string, trackId: string) => {
      setSelectedDomainId(domainId);
      setSelectedTrackId(trackId);
      if (domainId === MIRAI_COMMITTEE_DOMAIN_ID) {
        setSelectedTaskId(null);
        setSelectedShidaiId(null);
      } else {
        const firstInTrack = initialDashboard.tasks.find(
          (t) => t.trackId === trackId,
        );
        setSelectedTaskId(firstInTrack?.id ?? null);
        setSelectedShidaiId(null);
      }
    },
    [initialDashboard.tasks],
  );

  const selectTask = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
      setSelectedShidaiId(null);
      const task = initialDashboard.tasks.find((t) => t.id === taskId);
      if (task) {
        const domain = findDomainByTrackId(
          initialDashboard.domains,
          task.trackId,
        );
        if (domain) {
          setSelectedDomainId(domain.id);
          setSelectedTrackId(task.trackId);
        }
      }
    },
    [initialDashboard.domains, initialDashboard.tasks],
  );

  const selectAnnualMonth = useCallback((monthId: string) => {
    setSelectedAnnualMonthId(monthId);
    setSelectedShidaiId(null);
  }, []);

  const selectShidai = useCallback((id: string) => {
    setSelectedShidaiId(id);
    setSelectedTaskId(null);
  }, []);

  const currentPhase = currentSchedulePhase(
    selectedDomain?.schedulePhases,
    asOfDate,
  );

  const selectedAnnualMonth = annualMonths.find(
    (m) => m.id === selectedAnnualMonthId,
  );
  const windowSubtitle = selectedAnnualMonth
    ? `${selectedAnnualMonth.label}を選択中 → 昨年は ${priorYearWindow.map(yearMonthLabel).join("・")} の次第を表示`
    : "月を選択してください";

  const breadcrumbLeaf = isCommitteeMode
    ? (monthDraft?.title ?? selectedShidai?.title ?? "次第案")
    : (selectedTask?.title ?? "（未選択）");

  const breadcrumbMiddle = isCommitteeMode
    ? (selectedAnnualMonth?.label ?? "月")
    : (selectedTrack?.name ?? "トラック");

  const checklistKey = selectedTask?.id ?? "none";

  return (
    <SidebarProvider
      defaultOpen
      className="h-screen w-full overflow-hidden bg-background text-foreground"
    >
      <MiraiDomainPane
        workspaceName={initialDashboard.workspace.name}
        domains={initialDashboard.domains}
        tasks={initialDashboard.tasks}
        selectedTrackId={selectedTrackId}
        onSelectTrack={selectTrack}
      />

      <SidebarInset className="flex min-w-0 flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
          <Breadcrumb
            className="min-w-0 flex-1 overflow-hidden"
            aria-label="パンくず"
          >
            <BreadcrumbList className="flex-nowrap text-[11px]">
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink>
                  {selectedDomain?.name ?? "領域"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbLink>{breadcrumbMiddle}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate font-medium">
                  {breadcrumbLeaf}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className={miraiPanesRowClassName}>
          {isCommitteeMode && annualMonths.length > 0 ? (
            <MiraiCommitteeShidaiPane
              domainName={selectedDomain?.name ?? ""}
              annualMonths={annualMonths}
              selectedMonthId={selectedAnnualMonthId}
              onSelectMonth={selectAnnualMonth}
              windowSubtitle={windowSubtitle}
              groups={shidaiGroups}
              selectedShidaiId={selectedShidaiId}
              onSelectShidai={selectShidai}
            />
          ) : (
            <MiraiTaskListPane
              domainId={selectedDomainId}
              domainName={selectedDomain?.name ?? ""}
              schedulePhases={selectedDomain?.schedulePhases}
              currentPhaseId={currentPhase?.id ?? null}
              asOfDate={asOfDate}
              groups={taskGroups}
              selectedTaskId={selectedTaskId}
              onSelectTask={selectTask}
            />
          )}

          {isCommitteeMode ? (
            <>
              <MiraiCommitteeDraftPane
                selectedMonthLabel={selectedAnnualMonth?.label ?? ""}
                priorYearGroups={shidaiGroups}
                currentYearPrior={currentYearPrior}
                draft={monthDraft}
                focusedRecord={selectedShidai}
                onFocusRecord={selectShidai}
              />
              <MiraiShidaiDocumentPane
                monthLabel={selectedAnnualMonth?.label ?? ""}
                draft={monthDraft}
                record={selectedShidai}
                onUpdateDraft={setWorkingDraft}
              />
            </>
          ) : (
            <>
              <MiraiTaskDetailPane
                task={selectedTask}
                domainName={selectedDomain?.name ?? ""}
                trackName={selectedTrack?.name ?? ""}
              />
              <MiraiTaskChecklistPane
                key={checklistKey}
                taskTitle={selectedTask?.title ?? null}
                items={selectedTask?.checklists ?? []}
              />
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
