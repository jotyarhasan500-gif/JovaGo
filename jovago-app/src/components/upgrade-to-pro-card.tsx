"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

type UpgradeToProCardProps = {
  isPremium: boolean;
};

export function UpgradeToProCard({ isPremium }: UpgradeToProCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "pro" }),
      });
      const data = (await res.json()) as { sessionId?: string; url?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not start checkout");
        return;
      }

      if (publishableKey) {
        await loadStripe(publishableKey);
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      setError("Invalid checkout response");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <Card className="border-[#e5e5e5] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-[#0066FF]" aria-hidden />
            JovaGO Pro
          </CardTitle>
          <CardDescription>You have an active Pro subscription.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-[#e5e5e5] shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-[#0066FF]" aria-hidden />
          Upgrade to Pro
        </CardTitle>
        <CardDescription>
          Unlock premium features and support the platform. Secure payment via Stripe Checkout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-inside list-disc space-y-1 text-sm text-[#525252]">
          <li>Priority placement and Pro badge (where applicable)</li>
          <li>Help us build more travel tools for the community</li>
        </ul>
        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="bg-[#0066FF] hover:bg-[#0052CC]"
          disabled={loading}
          onClick={() => void startCheckout()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Redirecting…
            </>
          ) : (
            "Continue to checkout"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
