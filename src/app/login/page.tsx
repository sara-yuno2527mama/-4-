"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { useCurrentMember } from "@/hooks/use-current-member";
import { createInviteToken, isValidEmail } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { state, update, session, ready, signIn } = useCurrentMember();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && session) router.replace("/");
  }, [ready, session, router]);

  useEffect(() => {
    if (ready) setHouseholdName((prev) => prev || state.householdName);
  }, [ready, state.householdName]);

  if (!ready || session) {
    return (
      <PublicShell title="ログイン">
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </PublicShell>
    );
  }

  return (
    <PublicShell title="ログイン">
      <section className="rounded-2xl border border-[#e6e8e3] bg-white p-4">
        <p className="mb-4 text-sm leading-relaxed text-neutral-600">
          メールでこの端末の家庭に入ります。
        </p>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const nextEmail = email.trim().toLowerCase();
            const nextName = displayName.trim() || nextEmail.split("@")[0];
            if (!isValidEmail(nextEmail)) {
              setError("メールアドレスの形式を確認してください。");
              return;
            }

            const existing = state.members.find((member) => member.email === nextEmail);
            if (existing) {
              update((prev) => ({
                ...prev,
                householdName: householdName.trim() || prev.householdName,
                inviteToken: prev.inviteToken ?? createInviteToken(),
              }));
              signIn({ memberId: existing.id, email: nextEmail });
              router.replace("/");
              return;
            }

            const self = state.members.find((member) => member.id === "member-self");
            const claimingSelf = Boolean(self && !self.email);
            const memberId = claimingSelf ? "member-self" : crypto.randomUUID();

            update((prev) => ({
              ...prev,
              householdName: householdName.trim() || prev.householdName,
              inviteToken: prev.inviteToken ?? createInviteToken(),
              members: claimingSelf
                ? prev.members.map((member) =>
                    member.id === "member-self"
                      ? {
                          ...member,
                          displayName: nextName,
                          email: nextEmail,
                        }
                      : member,
                  )
                : [
                    ...prev.members,
                    {
                      id: memberId,
                      displayName: nextName,
                      email: nextEmail,
                      lineUserId: null,
                      lineLinked: false,
                    },
                  ],
            }));
            signIn({ memberId, email: nextEmail });
            router.replace("/");
          }}
        >
          <label className="text-xs text-neutral-500">メールアドレス</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
            placeholder="メールアドレス"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
          <label className="text-xs text-neutral-500">表示名</label>
          <input
            className="w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
            placeholder="自分の名前"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <label className="text-xs text-neutral-500">家庭名</label>
          <input
            className="w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
            placeholder="わが家"
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
          />
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <button
            type="submit"
            className="mt-2 rounded-xl bg-[#1B6B32] px-3 py-2 text-sm font-semibold text-white hover:bg-[#155828]"
          >
            メールで続ける
          </button>
        </form>
        <button
          type="button"
          disabled
          className="mt-2 w-full rounded-xl border border-[#e6e8e3] bg-[#EDEDED] px-3 py-2 text-sm font-semibold text-neutral-400"
        >
          Googleで続ける
        </button>
      </section>
    </PublicShell>
  );
}
