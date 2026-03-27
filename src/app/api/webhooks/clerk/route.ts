import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Clerk Webhook] Missing CLERK_WEBHOOK_SECRET");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn("[Clerk Webhook] Missing Svix headers");
    return new Response("Missing Svix headers", { status: 400 });
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    console.warn("[Clerk Webhook] Failed to read body");
    return new Response("Invalid body", { status: 400 });
  }

  let payload: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.warn("[Clerk Webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = payload.type;
  if (eventType !== "user.created" && eventType !== "user.updated") {
    return new Response("OK", { status: 200 });
  }

  const data = payload.data as {
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
  };
  const id = data?.id;
  if (!id || typeof id !== "string") {
    console.warn("[Clerk Webhook] Missing user id in payload");
    return new Response("Missing user id", { status: 400 });
  }

  const first = data.first_name ?? null;
  const last = data.last_name ?? null;
  const fullName =
    [first, last].filter(Boolean).join(" ").trim() || null;
  const avatarUrl =
    typeof data.image_url === "string" && data.image_url.trim()
      ? data.image_url.trim()
      : null;

  const now = new Date().toISOString();

  try {
    const supabase = createAdminClient();

    if (eventType === "user.created") {
      const { error: insertError } = await supabase.from("profiles").insert({
        id,
        full_name: fullName ?? "Traveler",
        avatar_url: avatarUrl,
        role: "user",
        subscription_tier: "free",
        created_at: now,
        updated_at: now,
        last_seen: now,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              full_name: fullName ?? "Traveler",
              avatar_url: avatarUrl,
              updated_at: now,
              last_seen: now,
            })
            .eq("id", id);
          if (updateError) {
            console.error("[Clerk Webhook] Update after conflict error:", updateError.message);
            return new Response("Database error", { status: 500 });
          }
        } else {
          console.error("[Clerk Webhook] Insert error:", insertError.message);
          return new Response("Database error", { status: 500 });
        }
      }
    } else {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName ?? "Traveler",
          avatar_url: avatarUrl,
          updated_at: now,
          last_seen: now,
        })
        .eq("id", id);
      if (error) {
        console.error("[Clerk Webhook] Update error:", error.message);
        return new Response("Database error", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[Clerk Webhook] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
}
