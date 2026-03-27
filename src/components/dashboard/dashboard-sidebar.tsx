"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bookmark,
  Home,
  UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/matches", label: "My Matches", icon: Users },
  { href: "/dashboard/groups", label: "My Groups", icon: UsersRound },
  { href: "/dashboard/saved-trips", label: "Saved Trips", icon: Bookmark },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-slate-900/80 lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-slate-800 px-4">
        <Link href="/" className="text-lg font-semibold text-[#0066FF] transition-colors hover:text-[#3385FF]">
          JovaGo
        </Link>
      </div>
      <nav className="flex flex-1 flex-col p-3" aria-label="Dashboard">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#0066FF]/20 text-[#0066FF]"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
        <Link
          href="/"
          className="mt-auto flex items-center gap-3 rounded-lg border border-slate-700 px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          title="Back to Home"
        >
          <Home className="size-5 shrink-0" aria-hidden />
          Back to Home
        </Link>
      </nav>
    </aside>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-800 bg-slate-900/95 backdrop-blur safe-area-pb lg:hidden"
      aria-label="Dashboard navigation"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-3 text-xs font-medium transition-colors",
              isActive ? "text-[#0066FF]" : "text-slate-400"
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="truncate max-w-[4rem]">{label}</span>
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex flex-col items-center gap-1 py-2.5 px-3 text-xs font-medium text-slate-400 transition-colors hover:text-slate-100"
        aria-label="Back to Home"
      >
        <Home className="size-5 shrink-0" aria-hidden />
        <span className="truncate max-w-[4rem]">Home</span>
      </Link>
    </nav>
  );
}
