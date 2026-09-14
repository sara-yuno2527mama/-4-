"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HouseholdRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings");
  }, [router]);
  return <p className="p-4 text-sm text-neutral-500">設定へ移動します…</p>;
}
