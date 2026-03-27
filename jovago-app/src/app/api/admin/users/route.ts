import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

/**
 * GET /api/admin/users
 * Returns the list of all Clerk users with subscription status from Supabase.
 * Only allowed when auth().userId matches ADMIN_USER_ID.
 * Subscription status is resolved from public.subscriptions by user_id (clerk id).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!ADMIN_USER_ID?.trim()) {
      console.error("[admin/users] ADMIN_USER_ID is not set");
      return NextResponse.json(
        { error: "Admin access not configured" },
        { status: 500 }
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userId !== ADMIN_USER_ID.trim()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      limit: 500,
      orderBy: "-created_at",
    });

    const clerkIds = (users ?? []).map((u) => u.id);
    let profileMap = new Map<string, { role: string | null; subscription_tier: string | null }>();
    let subscriptionMap = new Map<string, string>();

    if (clerkIds.length > 0) {
      const supabase = await createClient();
      const [profilesRes, subsRes] = await Promise.all([
        supabase.from("profiles").select("id, role, subscription_tier").in("id", clerkIds),
        supabase.from("subscriptions").select("user_id, status").in("user_id", clerkIds),
      ]);
      profileMap = new Map(
        (profilesRes.data ?? []).map((p: { id: string; role: string | null; subscription_tier: string | null }) => [
          p.id,
          { role: p.role ?? null, subscription_tier: p.subscription_tier ?? null },
        ])
      );
      const subs = (subsRes.data ?? []) as { user_id: string; status: string }[];
      subs.forEach((s) => {
        if (!subscriptionMap.has(s.user_id)) subscriptionMap.set(s.user_id, s.status);
      });
    }

    const list = (users ?? []).map((u) => {
      const profile = profileMap.get(u.id);
      const subscriptionStatus = subscriptionMap.get(u.id) ?? null;
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        emailAddresses: u.emailAddresses ?? [],
        imageUrl: u.imageUrl,
        createdAt: u.createdAt,
        lastSignInAt: u.lastSignInAt ?? null,
        banned: u.banned ?? false,
        role: profile?.role ?? null,
        subscription_tier: profile?.subscription_tier ?? null,
        subscriptionStatus,
      };
    });

    return NextResponse.json(list);
  } catch (err) {
    console.error("[admin/users] Failed to fetch user list:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
