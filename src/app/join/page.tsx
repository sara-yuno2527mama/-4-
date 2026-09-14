"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { useCurrentMember } from "@/hooks/use-current-member";
import { isValidEmail } from "@/lib/session";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const { state, update, ready, signIn } = useCurrentMember();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const tokenOk = Boolean(token && state.inviteToken && token === state.inviteToken);

  useEffect(() => {
    if (!ready) return;
    if (!token) setError("招待リンクが無効です。");
    else if (!state.inviteToken || token !== state.inviteToken) {
      setError(
        "この端末に対象の家庭データがありません。同じ家庭の端末で招待リンクを開いてください。",
      );
    }
  }, [ready, token, state.inviteToken]);

  if (!ready) {
    return (
      <PublicShell title="家庭に参加">
        <p className="text-sm text-neutral-500">読み込み中…</p>
      </PublicShell>
    );
  }

  return (
    <PublicShell title="家庭に参加">
      <section className="rounded-2xl border border-[#e6e8e3] bg-white p-4">
        <p className="mb-1 text-sm font-semibold text-neutral-900">
          {state.householdName}
        </p>
        <p className="mb-4 text-xs text-neutral-500">
          招待リンクからメンバーとして参加します。家庭の献立・今ある一覧はメンバーで共有します。
        </p>
        {tokenOk ? (
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

              const existing = state.members.find(
                (member) => member.email === nextEmail,
              );
              if (existing) {
                signIn({ memberId: existing.id, email: nextEmail });
                router.replace("/");
                return;
              }

              const memberId = crypto.randomUUID();
              update((prev) => ({
                ...prev,
                members: [
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
              className="w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
            />
            <label className="text-xs text-neutral-500">表示名</label>
            <input
              className="w-full rounded-lg border border-[#e6e8e3] px-3 py-2 text-sm"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
            <button
              type="submit"
              className="mt-2 rounded-xl bg-[#1B6B32] px-3 py-2 text-sm font-semibold text-white hover:bg-[#155828]"
            >
              参加する
            </button>
          </form>
        ) : (
          <p className="text-sm leading-relaxed text-rose-700">{error}</p>
        )}
      </section>
    </PublicShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <PublicShell title="家庭に参加">
          <p className="text-sm text-neutral-500">読み込み中…</p>
        </PublicShell>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
