"use client";

import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXPLORE_LINKS = [
  { label: "Global Map", href: "/safety-map" },
  { label: "Buddy Match", href: "/explore" },
  { label: "Safety Heatmap", href: "/safety-map" },
] as const;

const SUPPORT_LINKS = [
  { label: "Help Center", href: "/help" },
  { label: "Safety Guide", href: "/trust" },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
  { label: "X (Twitter)", href: "https://x.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
] as const;

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm leading-tight text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-2"
    >
      {children}
    </Link>
  );
}

function LinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-foreground/90 leading-tight">
        {title}
      </span>
      <div className="flex flex-col gap-0.5">
        {links.map(({ label, href }) => (
          <FooterLink key={label} href={href}>
            {label}
          </FooterLink>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer
      className="mt-auto w-full border-t border-border bg-background backdrop-blur-sm"
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-8 py-4 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:py-5 lg:px-12">
        {/* Single row on desktop: items-center keeps footer slim */}
        <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Left: logo + tagline + copyright */}
          <div className="flex flex-col items-center gap-0.5 lg:items-start lg:shrink-0">
            <Link
              href="/"
              className="text-sm font-semibold leading-tight tracking-tight text-foreground transition-colors hover:text-[#0066FF]"
            >
              JovaGo
            </Link>
            <p className="max-w-[220px] text-sm leading-tight text-muted-foreground">
              Your global companion for safer, connected travel.
            </p>
            <span className="text-sm leading-tight text-muted-foreground/80">
              © 2026 JovaGo
            </span>
          </div>

          {/* Center: link groups with horizontal gaps only */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 lg:flex-1 lg:justify-around lg:gap-x-10 lg:gap-y-0 lg:px-4"
            aria-label="Footer navigation"
          >
            <LinkGroup title="Explore" links={EXPLORE_LINKS} />
            <LinkGroup title="Support" links={SUPPORT_LINKS} />
            <LinkGroup title="Legal" links={LEGAL_LINKS} />
          </nav>

          {/* Right: newsletter + social, vertically centered */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4 lg:shrink-0 lg:items-center lg:gap-4">
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="footer-email" className="sr-only">
                Email for newsletter
              </label>
              <Input
                id="footer-email"
                type="email"
                placeholder="Email"
                className="h-8 w-32 border border-input bg-transparent text-sm leading-tight text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#0066FF] focus-visible:ring-offset-0 sm:w-36"
                aria-label="Email for newsletter"
              />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 border border-input bg-transparent px-2.5 text-sm leading-tight text-muted-foreground hover:bg-muted hover:text-foreground"
                suppressHydrationWarning
              >
                Subscribe
              </Button>
            </form>
            <div className="flex items-center gap-1.5">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
