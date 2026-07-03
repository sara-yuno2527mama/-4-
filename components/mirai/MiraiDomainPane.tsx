"use client";

import { type ReactNode } from "react";

import {
  type MiraiDashboard,
  type MiraiDomain,
} from "@/lib/mirai-schema";
import { openCountForTrack } from "@/lib/mirai/computed";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";

type MiraiDomainPaneProps = {
  workspaceName: string;
  domains: MiraiDomain[];
  tasks: MiraiDashboard["tasks"];
  selectedTrackId: string;
  onSelectTrack: (domainId: string, trackId: string) => void;
  /** ドメインナビの上に差し込むコンテンツ（すぐ入力・当月メモ。§5） */
  topSlot?: ReactNode;
};

export function MiraiDomainPane({
  workspaceName,
  domains,
  tasks,
  selectedTrackId,
  onSelectTrack,
  topSlot,
}: MiraiDomainPaneProps) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border [&_[data-slot=sidebar-container]]:bg-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex h-12 items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[state=expanded]:px-5">
          <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {workspaceName}
          </h2>
          <Pane1Toggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3 group-data-[collapsible=icon]:hidden">
        {topSlot}
        {domains.map((domain) => (
          <SidebarGroup key={domain.id} className="px-1">
            <SidebarGroupLabel className="px-2 text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
              {domain.name}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {domain.tracks.length === 0 ? (
                  <SidebarMenuItem>
                    <span className="px-2 py-1.5 text-xs text-muted-foreground">
                      トラックなし
                    </span>
                  </SidebarMenuItem>
                ) : (
                  domain.tracks.map((track) => {
                    const active = track.id === selectedTrackId;
                    const open = openCountForTrack(tasks, track.id);
                    return (
                      <SidebarMenuItem key={track.id}>
                        <SidebarMenuButton
                          tooltip={track.name}
                          isActive={active}
                          aria-current={active ? "page" : undefined}
                          onClick={() => onSelectTrack(domain.id, track.id)}
                        >
                          <span className="truncate">{track.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                            {open}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
