"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

const TIER_DEFS = [
  {
    name: "Free",
    price: 0,
    period: "/month",
    key: null as null,
    description: "Basic features to get started.",
    features: [
      "Browse trips and destinations",
      "Basic safety map access",
      "Trust score visibility",
      "Community guidelines access",
    ],
    highlighted: false,
    badge: null,
    canCreateGroups: false,
  },
  {
    name: "Basic",
    price: 19,
    period: "/month",
    key: "basic" as const,
    description: "Advanced features for serious travelers.",
    features: [
      "Everything in Free",
      "Priority support",
      "Advanced map filters",
      "Export trip plans",
    ],
    highlighted: false,
    badge: null,
    canCreateGroups: false,
  },
  {
    name: "Pro",
    price: 49,
    period: "/month",
    key: "pro" as const,
    description: "Full power. The only tier that includes creating groups.",
    features: [
      "Everything in Basic",
      "Create and manage groups",
      "Group chat and coordination",
      "Unlimited group members",
    ],
    highlighted: true,
    badge: "Creating Groups",
    canCreateGroups: true,
  },
] as const;

const btnOutline =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50";
const btnPrimary =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50";

export function PricingSection() {
  const pathname = usePathname();
  const [priceIds, setPriceIds] = useState<{ basic: string | null; pro: string | null } | null>(
    null
  );
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/prices")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load plan prices");
        return r.json() as Promise<{ basic: string | null; pro: string | null }>;
      })
      .then((data) => {
        if (!cancelled) {
          setPriceIds({ basic: data.basic, pro: data.pro });
          if (!data.basic && !data.pro) {
            setPricesError(
              "Set STRIPE_PRICE_ID_BASIC_PLAN and STRIPE_PRICE_ID_PRO_PLAN in .env.local (Stripe Price ids starting with price_). Restart the dev server after saving."
            );
          } else {
            setPricesError(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceIds({ basic: null, pro: null });
          setPricesError("Could not load Stripe prices from the server.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiers = useMemo(() => {
    return TIER_DEFS.map((t) => ({
      ...t,
      stripePriceId:
        t.key === "basic"
          ? priceIds?.basic ?? null
          : t.key === "pro"
            ? priceIds?.pro ?? null
            : null,
    }));
  }, [priceIds]);

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(pathname || "/pricing")}`;

  /** Uses price ids from server env (STRIPE_PRICE_ID_BASIC_PLAN / STRIPE_PRICE_ID_PRO_PLAN) via /api/stripe/prices. */
  const handleSubscription = async (priceId: string) => {
    setError(null);
    setLoadingPriceId(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ priceId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (res.status === 401) {
        setError(
          "You need to be signed in to pay. Use Sign in in the header, then try Subscribe again."
        );
        setLoadingPriceId(null);
        return;
      }

      console.error("Stripe failed:", data);
      setError(data.error ?? "Checkout did not return a payment link.");
      setLoadingPriceId(null);
    } catch (e) {
      console.error("Stripe failed:", e);
      setError("Network error while starting checkout.");
      setLoadingPriceId(null);
    }
  };

  const pricesReady = priceIds !== null;

  return (
    <section id="pricing" className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that fits your travel style.
          </p>
        </div>

        {pricesError && (
          <p
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
            role="alert"
          >
            {pricesError}
          </p>
        )}

        {error && (
          <p
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
            role="alert"
          >
            {error}{" "}
            {error.includes("signed in") ? (
              <Link href={signInHref} className="font-medium underline underline-offset-2">
                Sign in
              </Link>
            ) : null}
          </p>
        )}

        {!pricesReady && !pricesError && (
          <p className="mb-6 text-center text-sm text-muted-foreground">Loading plans…</p>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={cn(
                tier.highlighted ? "relative border-primary/50 ring-2 ring-primary" : ""
              )}
              suppressHydrationWarning
            >
              {tier.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  suppressHydrationWarning
                >
                  {tier.badge}
                </div>
              )}
              <CardHeader suppressHydrationWarning>
                <CardTitle className="text-xl" suppressHydrationWarning>
                  {tier.name}
                </CardTitle>
                <CardDescription suppressHydrationWarning>
                  {tier.description}
                </CardDescription>
                <div className="pt-2" suppressHydrationWarning>
                  <span className="text-3xl font-bold text-foreground">${tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent suppressHydrationWarning>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-foreground"
                      suppressHydrationWarning
                    >
                      <Check className="size-4 shrink-0 text-primary" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter suppressHydrationWarning>
                {tier.stripePriceId == null ? (
                  <button
                    type="button"
                    className={btnOutline}
                    disabled={tier.key !== null && pricesReady && !tier.stripePriceId}
                    onClick={() => {
                      if (tier.key === null) {
                        window.location.href = "/sign-up";
                        return;
                      }
                      if (!pricesReady) return;
                      setError(
                        "Set STRIPE_PRICE_ID_BASIC_PLAN and STRIPE_PRICE_ID_PRO_PLAN in .env.local (Stripe → Products → Pricing)."
                      );
                    }}
                  >
                    {tier.key === null
                      ? "Get started"
                      : !pricesReady
                        ? "…"
                        : !tier.stripePriceId
                          ? "Unavailable"
                          : "Subscribe"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(tier.highlighted ? btnPrimary : btnOutline)}
                    disabled={!tier.stripePriceId || loadingPriceId !== null || !pricesReady}
                    onClick={() => {
                      if (!tier.stripePriceId) return;
                      void handleSubscription(tier.stripePriceId);
                    }}
                  >
                    {loadingPriceId === tier.stripePriceId ? (
                      <>
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                        Loading...
                      </>
                    ) : !tier.stripePriceId ? (
                      "Unavailable"
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
