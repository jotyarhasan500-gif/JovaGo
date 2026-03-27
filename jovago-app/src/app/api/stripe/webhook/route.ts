import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getConfiguredCheckoutPriceIds,
  planFromCheckoutPriceId,
} from "@/lib/stripe-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(key);
}

async function resolveSessionPriceId(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const fromMeta =
    session.metadata?.price_id?.trim() ||
    (typeof session.metadata?.priceId === "string" ? session.metadata.priceId.trim() : "") ||
    "";
  if (fromMeta) return fromMeta;

  const expanded = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price"],
  });
  const first = expanded.line_items?.data?.[0];
  const p = first?.price;
  if (typeof p === "string") return p;
  if (p && typeof p === "object" && "id" in p && typeof p.id === "string") return p.id;
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[stripe/webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid payload";
    console.warn("[stripe/webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId =
      session.metadata?.userId?.trim() ||
      session.metadata?.supabase_user_id?.trim() ||
      session.metadata?.clerk_user_id?.trim() ||
      session.client_reference_id?.trim() ||
      null;

    if (!userId) {
      console.warn(
        "[stripe/webhook] checkout.session.completed missing userId / supabase_user_id / clerk_user_id / client_reference_id"
      );
      return NextResponse.json({ received: true });
    }

    const c = session.customer;
    const customerId =
      typeof c === "string" ? c : c && typeof c === "object" && "id" in c ? c.id : null;

    try {
      const stripe = getStripe();
      const supabase = createAdminClient();
      const priceId = await resolveSessionPriceId(stripe, session);
      const configured = getConfiguredCheckoutPriceIds();
      const { subscription_tier, plan_type } = planFromCheckoutPriceId(priceId, configured);

      const update: Record<string, unknown> = {
        is_premium: true,
        subscription_tier,
        plan_type,
        updated_at: new Date().toISOString(),
      };
      if (customerId) {
        update.stripe_customer_id = customerId;
      }

      const { error } = await supabase.from("profiles").update(update).eq("id", userId);
      if (error) {
        console.error("[stripe/webhook] Supabase update failed:", error.message);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[stripe/webhook]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
