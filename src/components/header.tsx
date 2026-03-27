"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Shield } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { SignedIn, SignedOut } from "@/lib/clerk-components";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatIcon } from "@/components/chat/chat-icon";
import { getCurrentUserProfileForHeader } from "@/app/actions/profile";

const NAV_LINKS = [
  { label: "Groups", href: "/dashboard/groups" },
  { label: "Explore", href: "/explore" },
  { label: "Safety Map", href: "/safety-map" },
  { label: "Trust", href: "/trust" },
  { label: "Pricing", href: "/pricing" },
  { label: "How it works", href: "#" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<{ role: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    function fetchProfile() {
      getCurrentUserProfileForHeader().then((p) => {
        if (!cancelled) setProfile(p ?? null);
      });
    }
    fetchProfile();
    const t1 = setTimeout(fetchProfile, 800);
    const t2 = setTimeout(fetchProfile, 2000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchProfile();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const showOwnerPanel = (() => {
    const r = profile?.role?.toLowerCase();
    return r === "admin" || r === "owner";
  })();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b-[1px] transition-[background-color,backdrop-filter,color,border-color] duration-300",
          scrolled
            ? "bg-background/95 text-foreground backdrop-blur-md border-border supports-[backdrop-filter]:bg-background/80"
            : "border-zinc-200/80 dark:border-white/10 bg-white/10 backdrop-blur-md dark:bg-transparent text-zinc-900 dark:text-white"
        )}
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "text-base font-semibold tracking-tight transition-colors",
              scrolled ? "text-foreground hover:text-foreground/90" : "text-zinc-900 hover:text-zinc-800 dark:text-white dark:hover:text-white/90"
            )}
          >
            JovaGo
          </Link>

          {/* Center: desktop nav */}
          <nav
            className="hidden items-center gap-8 lg:flex"
            aria-label="Main navigation"
          >
            <SignedIn>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-500 hover:underline underline-offset-4",
                  scrolled ? "text-foreground" : "text-zinc-900 dark:text-white"
                )}
              >
                <LayoutDashboard className="size-4 shrink-0" aria-hidden />
                Dashboard
              </Link>
            </SignedIn>
            {showOwnerPanel && (
              <Link
                href="/owner"
                suppressHydrationWarning={true}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Shield size={18} aria-hidden />
                <span>Owner Panel</span>
              </Link>
            )}
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "text-sm font-medium transition-colors hover:underline underline-offset-4",
                  scrolled ? "text-foreground hover:text-foreground/90" : "text-zinc-900 hover:text-zinc-800 dark:text-white dark:hover:text-white/90"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle overHero={!scrolled} />
            <SignedOut>
              <Link
                href="/sign-in"
                suppressHydrationWarning={true}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors",
                  scrolled
                    ? "text-foreground/90 hover:bg-foreground/10 hover:text-foreground"
                    : "text-zinc-900 hover:text-zinc-800 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                suppressHydrationWarning={true}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-all",
                  scrolled
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:bg-primary/90"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                )}
              >
                Join JovaGo
              </Link>
            </SignedOut>
            <SignedIn>
              <ChatIcon scrolled={scrolled} />
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "text-foreground",
                    userButtonTrigger: "focus:shadow-none",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Dashboard"
                    labelIcon={<LayoutDashboard className="size-4" />}
                    href="/dashboard"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle overHero={!scrolled} className="shrink-0" />
            <SignedIn>
              <ChatIcon scrolled={scrolled} />
            </SignedIn>
            <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg lg:hidden transition-colors",
              scrolled ? "text-foreground/90 hover:bg-foreground/10" : "text-zinc-900 hover:text-zinc-800 dark:text-white dark:hover:bg-white/10"
            )}
            aria-label="Open menu"
            suppressHydrationWarning={true}
          >
            <Menu className="size-5" />
          </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-full max-w-xs border-l bg-background/95 backdrop-blur-md transition-transform duration-200 ease-out border-border",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span className="text-sm font-semibold text-foreground">Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-10 items-center justify-center rounded-lg text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
              aria-label="Close menu"
              suppressHydrationWarning={true}
            >
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-0 p-4" aria-label="Mobile navigation">
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/10 hover:text-blue-500"
              >
                <LayoutDashboard className="size-4 shrink-0" aria-hidden />
                Dashboard
              </Link>
              {showOwnerPanel && (
                <Link
                  href="/owner"
                  onClick={() => setMobileOpen(false)}
                  suppressHydrationWarning={true}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Shield size={18} aria-hidden />
                  <span>Owner Panel</span>
                </Link>
              )}
              <Link
                href="/messages"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                Messages
              </Link>
            </SignedIn>
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  suppressHydrationWarning={true}
                  className="inline-flex h-9 items-center justify-center rounded-lg text-sm font-medium text-foreground/90 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  suppressHydrationWarning={true}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0066FF] text-sm font-medium text-white shadow-[0_0_20px_rgba(0,102,255,0.3)] transition-colors hover:bg-[#0052CC]"
                >
                  Join JovaGo
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center justify-center py-2">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonBox: "text-foreground",
                        userButtonTrigger: "focus:shadow-none",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Dashboard"
                        labelIcon={<LayoutDashboard className="size-4" />}
                        href="/dashboard"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              </SignedIn>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
