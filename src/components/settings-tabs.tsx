"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Shield, CreditCard } from "lucide-react";

const TABS = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/safety", label: "Safety & Privacy", icon: Shield },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-8 flex gap-1 border-b border-[#e5e5e5]"
      aria-label="Settings tabs"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors -mb-px",
              isActive
                ? "border-[#0066FF] text-[#0066FF]"
                : "border-transparent text-[#737373] hover:text-[#0a0a0a] hover:border-[#d4d4d4]"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
