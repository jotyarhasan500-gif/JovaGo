/** Stripe Checkout `line_items[].price` must be a Price API id (`price_…`). */
export const CHECKOUT_PRICE_ID_RE = /^price_[a-zA-Z0-9]+$/;

/** Trim and strip optional surrounding quotes from .env values. */
export function readEnvTrimQuotes(envKey: string): string {
  const v = process.env[envKey];
  if (v == null) return "";
  return v.trim().replace(/^["']|["']$/g, "").trim();
}

function firstValidCheckoutPriceId(label: string, keys: readonly string[]): string | null {
  for (const key of keys) {
    const s = readEnvTrimQuotes(key);
    if (!s) continue;
    if (CHECKOUT_PRICE_ID_RE.test(s)) return s;
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[stripe] ${key} (${label}): expected a Price id (price_…) from Products → Pricing. "${s.slice(0, 22)}…" is invalid for Checkout.`
      );
    }
  }
  return null;
}

/** Reads STRIPE_PRICE_ID_BASIC_PLAN / PRO and NEXT_PUBLIC_* mirrors. */
export function getConfiguredCheckoutPriceIds(): { basic: string | null; pro: string | null } {
  return {
    basic: firstValidCheckoutPriceId("Basic plan", [
      "STRIPE_PRICE_ID_BASIC_PLAN",
      "NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_PLAN",
    ]),
    pro: firstValidCheckoutPriceId("Pro plan", [
      "STRIPE_PRICE_ID_PRO_PLAN",
      "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_PLAN",
    ]),
  };
}

export function allowedCheckoutPriceIdSet(): Set<string> {
  const { basic, pro } = getConfiguredCheckoutPriceIds();
  const set = new Set<string>();
  if (basic) set.add(basic);
  if (pro) set.add(pro);
  return set;
}

/** Maps Stripe Price id to `profiles.subscription_tier` and `profiles.plan_type`. */
export function planFromCheckoutPriceId(
  priceId: string | null | undefined,
  configured: { basic: string | null; pro: string | null }
): { subscription_tier: string; plan_type: string } {
  const id = (priceId ?? "").trim();
  if (configured.pro && id === configured.pro) {
    return { subscription_tier: "ultimate", plan_type: "pro" };
  }
  if (configured.basic && id === configured.basic) {
    return { subscription_tier: "basic", plan_type: "basic" };
  }
  return { subscription_tier: "pro", plan_type: "pro" };
}
