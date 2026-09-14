"use client";

import { useKitchenStore } from "@/hooks/use-kitchen-store";
import { useSession } from "@/hooks/use-session";

export function useCurrentMember() {
  const { state, ready: kitchenReady, update } = useKitchenStore();
  const { session, ready: sessionReady, signIn, signOut } = useSession();
  const member =
    state.members.find((item) => item.id === session?.memberId) ??
    state.members.find((item) => item.id === "member-self") ??
    state.members[0] ??
    null;

  return {
    state,
    update,
    session,
    member,
    ready: kitchenReady && sessionReady,
    signIn,
    signOut,
  };
}
