"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unstable_noStore } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfileForHeader } from "@/app/actions/profile";

export type OwnerGroup = {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
};

export type OwnerUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  subscription_tier: string | null;
  created_at: string;
};

/** Returns groups from Supabase. Users are loaded by the dashboard from /api/admin/users. Admin only. */
export async function getOwnerData(): Promise<{
  groups: OwnerGroup[];
  users: OwnerUser[];
}> {
  unstable_noStore();
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "owner";
  if (!profile || !isAdmin) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, name, description, user_id, created_at")
    .order("created_at", { ascending: false });

  const groups = (data ?? []) as OwnerGroup[];
  return { groups, users: [] };
}

/** Project owner only. Total groups created by this user (Supabase groups where user_id = clerkId). */
export async function getGroupsCountByUserId(clerkUserId: string): Promise<number> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) return 0;
  if (!clerkUserId?.trim()) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", clerkUserId.trim());
  return count ?? 0;
}

/** Project owner only. Ban user via Clerk API. Refreshes required on client after success. */
export async function banUserClerk(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!targetUserId?.trim()) return { success: false, error: "User ID is required." };
  try {
    const client = await clerkClient();
    await client.users.banUser(targetUserId.trim());
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/** Project owner only. Unban user via Clerk API. Refreshes required on client after success. */
export async function unbanUserClerk(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!targetUserId?.trim()) return { success: false, error: "User ID is required." };
  try {
    const client = await clerkClient();
    await client.users.unbanUser(targetUserId.trim());
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/** Revenue/subscription analytics for Owner Panel. All data from DB: profiles and subscriptions. No mock data. */
export type RevenueAnalytics = {
  totalRevenue: number;
  mrr: number;
  activeSubscriptions: number;
  churnRate: number;
  revenueGrowthLast6Months: { month: string; revenue: number }[];
  signupsVsSubscriptionsPerWeek: { week: string; signups: number; subscriptions: number }[];
  planDistribution: { name: string; value: number }[];
};

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getRevenueAnalytics(): Promise<RevenueAnalytics> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return {
      totalRevenue: 0,
      mrr: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      revenueGrowthLast6Months: [],
      signupsVsSubscriptionsPerWeek: [],
      planDistribution: [],
    };
  }

  const supabase = await createClient();
  const now = new Date();

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("subscription_tier, created_at");

  const list = (profilesData ?? []) as { subscription_tier: string | null; created_at: string }[];
  const free = list.filter((p) => !p.subscription_tier || p.subscription_tier.toLowerCase() === "free").length;
  const pro = list.filter((p) => (p.subscription_tier?.toLowerCase() ?? "") === "ultimate").length;
  const enterprise = list.filter((p) => (p.subscription_tier?.toLowerCase() ?? "") === "enterprise").length;
  const activeSubscriptions = pro + enterprise;

  let subscriptionsList: { amount: number; created_at: string }[] = [];
  const { data: subsData, error: subsError } = await supabase
    .from("subscriptions")
    .select("amount, created_at");
  if (!subsError && subsData) {
    subscriptionsList = subsData as { amount: number; created_at: string }[];
  }

  const totalRevenue = subscriptionsList.reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const currentMonthKey = getMonthKey(now);
  const mrr = subscriptionsList
    .filter((r) => getMonthKey(new Date(r.created_at)) === currentMonthKey)
    .reduce((s, r) => s + Number(r.amount ?? 0), 0);
  const churnRate = 0;

  const revenueByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueByMonth[getMonthKey(d)] = 0;
  }
  for (const r of subscriptionsList) {
    const key = getMonthKey(new Date(r.created_at));
    if (key in revenueByMonth) revenueByMonth[key] += Number(r.amount ?? 0);
  }
  const revenueGrowthLast6Months = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, revenue]) => {
      const [y, m] = key.split("-").map(Number);
      const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      return { month: monthLabel, revenue: Math.round(revenue * 100) / 100 };
    });

  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 6 * 7);
  const signupsByWeek: Record<string, number> = {};
  const subsByWeek: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const start = new Date(sixWeeksAgo);
    start.setDate(start.getDate() + i * 7);
    const k = getWeekKey(start);
    signupsByWeek[k] = 0;
    subsByWeek[k] = 0;
  }
  for (const p of list) {
    const t = new Date(p.created_at);
    if (t >= sixWeeksAgo) {
      const k = getWeekKey(t);
      if (k in signupsByWeek) signupsByWeek[k]++;
    }
  }
  for (const r of subscriptionsList) {
    const t = new Date(r.created_at);
    if (t >= sixWeeksAgo) {
      const k = getWeekKey(t);
      if (k in subsByWeek) subsByWeek[k]++;
    }
  }
  const weekKeys = Object.keys(signupsByWeek).sort();
  const signupsVsSubscriptionsPerWeek = weekKeys.map((k) => {
    const d = new Date(k);
    const weekLabel = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
    return {
      week: weekLabel,
      signups: signupsByWeek[k] ?? 0,
      subscriptions: subsByWeek[k] ?? 0,
    };
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    mrr: Math.round(mrr * 100) / 100,
    activeSubscriptions,
    churnRate,
    revenueGrowthLast6Months,
    signupsVsSubscriptionsPerWeek,
    planDistribution: [
      { name: "Free", value: free },
      { name: "Pro", value: pro },
      { name: "Enterprise", value: enterprise },
    ].filter((p) => p.value > 0),
  };
}

/** Revalidate main routes. Admin only. */
export async function resetAllCache(): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  try {
    revalidatePath("/", "layout");
    revalidatePath("/explore");
    revalidatePath("/dashboard");
    revalidatePath("/owner");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to reset cache.";
    return { success: false, error: message };
  }
}

/** Set a user's subscription_tier to ultimate. Admin only. */
export async function upgradeUserToUltimate(
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!targetUserId?.trim()) {
    return { success: false, error: "User ID is required." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_tier: "ultimate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId.trim());

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Project owner only. Check database connection. */
export async function checkDatabaseHealth(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { ok: false, error: "Forbidden." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return { ok: !error, error: error?.message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

/** Project owner only. Usage analytics (counts). API hits are placeholders unless you track them. */
export async function getUsageAnalytics(): Promise<{
  totalGroups: number;
  activeUsers: number;
  mapApiHits: string;
  weatherApiHits: string;
}> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { totalGroups: 0, activeUsers: 0, mapApiHits: "—", weatherApiHits: "—" };
  }
  const supabase = await createClient();
  const [groupsRes, usersRes] = await Promise.all([
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  return {
    totalGroups: groupsRes.count ?? 0,
    activeUsers: usersRes.count ?? 0,
    mapApiHits: "Track in Mapbox dashboard",
    weatherApiHits: "Track in OpenWeather dashboard",
  };
}

/** Project owner only. Set a user's role (e.g. user, admin, owner, banned). */
export async function setUserRole(
  targetUserId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!targetUserId?.trim()) return { success: false, error: "User ID is required." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: role.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", targetUserId.trim());
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Project owner only. Force delete any group (moderation). */
export async function forceDeleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!groupId?.trim()) return { success: false, error: "Group ID is required." };
  const supabase = await createClient();
  const { error: membersError } = await supabase.from("group_members").delete().eq("group_id", groupId);
  if (membersError) return { success: false, error: membersError.message };
  const { error: groupError } = await supabase.from("groups").delete().eq("id", groupId);
  if (groupError) return { success: false, error: groupError.message };
  return { success: true };
}

/** Project owner only. Get current broadcast message (placeholder: no persistence by default). */
export async function getBroadcastMessage(): Promise<string> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) return "";
  return "";
}

/** Project owner only. Set platform-wide broadcast message (placeholder: no persistence by default). */
export async function setBroadcastMessage(message: string): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  return { success: true };
}

/** Project owner only. Delete a user's profile from the database. Does not remove from Clerk. */
export async function deleteUserProfile(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfileForHeader();
  const roleLower = profile?.role?.toLowerCase();
  if (!profile || (roleLower !== "admin" && roleLower !== "owner")) {
    return { success: false, error: "Forbidden." };
  }
  if (!targetUserId?.trim()) return { success: false, error: "User ID is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", targetUserId.trim());
  if (error) return { success: false, error: error.message };
  return { success: true };
}
