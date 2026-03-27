import { NextResponse } from "next/server";
import { getConfiguredCheckoutPriceIds } from "@/lib/stripe-env";

export const dynamic = "force-dynamic";

/**
 * Basic plan ← STRIPE_PRICE_ID_BASIC_PLAN (or NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_PLAN)
 * Pro plan ← STRIPE_PRICE_ID_PRO_PLAN (or NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_PLAN)
 */
export async function GET() {
  const { basic, pro } = getConfiguredCheckoutPriceIds();

  return NextResponse.json({
    basic: basic || null,
    pro: pro || null,
  });
}
