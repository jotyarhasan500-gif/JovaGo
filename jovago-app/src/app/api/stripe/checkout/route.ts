import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { allowedCheckoutPriceIdSet, CHECKOUT_PRICE_ID_RE } from "@/lib/stripe-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

export async function POST(req: Request) {
  try {
    let body: { priceId?: unknown };
    try {
      body = (await req.json()) as { priceId?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const priceId = typeof body.priceId === "string" ? body.priceId.trim() : "";

    if (!priceId || !CHECKOUT_PRICE_ID_RE.test(priceId)) {
      return NextResponse.json(
        { error: "Missing or invalid priceId (expected a Stripe price_… id)." },
        { status: 400 }
      );
    }

    const allowed = allowedCheckoutPriceIdSet();
    if (allowed.size > 0 && !allowed.has(priceId)) {
      return NextResponse.json(
        { error: "That plan price is not configured for checkout on this app." },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() ?? "";
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Set NEXT_PUBLIC_APP_URL (e.g. http://localhost:3000 for local dev)." },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      client_reference_id: userId,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId,
        price_id: priceId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout error";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
