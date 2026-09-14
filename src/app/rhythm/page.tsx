"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RhythmRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/meals");
  }, [router]);
  return <p className="p-4 text-sm text-neutral-500">献立へ移動します…</p>;
}
