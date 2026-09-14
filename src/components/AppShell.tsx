"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  Plus,
  Refrigerator,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/meals", label: "献立", icon: CalendarDays },
  { href: "/inventory", label: "今ある", icon: Refrigerator },
  { href: "/bought", label: "追加", icon: Plus },
  { href: "/settings", label: "設定", icon: Settings },
] as const;

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-[#EDEDED] text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-[#e6e8e3] bg-white px-4 py-3">
        <p className="text-xs font-medium text-[#1B6B32]">AIキッチン秘書</p>
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          {title}
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-3 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#e6e8e3] bg-white">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-base ${
                  active
                    ? "font-semibold text-[#1B6B32]"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
