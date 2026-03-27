"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/app/actions/profile";

export type SafetyPrivacySettings = {
  show_approximate_location: boolean;
  allow_only_verified_to_message: boolean;
};

export type UpdateSafetyPrivacyResult =
  | { success: true }
  | { success: false; error: string };

export async function updateSafetyPrivacy(
  input: SafetyPrivacySettings
): Promise<UpdateSafetyPrivacyResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to update settings." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        show_approximate_location: input.show_approximate_location,
        allow_only_verified_to_message: input.allow_only_verified_to_message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

/** Ids of users that the current user has blocked. */
export async function getBlockedUserIds(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId);

  if (error || !data) return [];
  return data.map((r) => r.blocked_id);
}

export type BlockedUserEntry = {
  blocked_id: string;
  full_name: string | null;
  created_at: string;
};

/** Blocked users with profile names for the Block list UI. */
export async function getBlockedUsersWithProfiles(): Promise<BlockedUserEntry[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return [];

  const ids = data.map((r) => r.blocked_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const nameMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? null])
  );
  return data.map((r) => ({
    blocked_id: r.blocked_id,
    full_name: nameMap.get(r.blocked_id) ?? "Unknown",
    created_at: r.created_at,
  }));
}

export type BlockUserResult =
  | { success: true }
  | { success: false; error: string };

export async function blockUser(
  blockedId: string
): Promise<BlockUserResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to block users." };
    }
    if (userId === blockedId) {
      return { success: false, error: "You cannot block yourself." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: userId,
      blocked_id: blockedId,
    });

    if (error) {
      if (error.code === "23505") return { success: true }; // already blocked
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

export async function unblockUser(
  blockedId: string
): Promise<BlockUserResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in." };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

export type ReportUserResult =
  | { success: true }
  | { success: false; error: string };

export async function reportUser(
  reportedId: string,
  reason?: string | null
): Promise<ReportUserResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to report." };
    }
    if (userId === reportedId) {
      return { success: false, error: "You cannot report yourself." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: userId,
      reported_id: reportedId,
      reason: reason ?? null,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

/** True if the current user has blocked the given profile id. */
export async function isBlockedByMe(profileId: string): Promise<boolean> {
  const ids = await getBlockedUserIds();
  return ids.includes(profileId);
}

/** True if the given user (profile owner) has blocked the current user. */
export async function isBlockedByThem(ownerId: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", ownerId)
    .eq("blocked_id", userId)
    .maybeSingle();
  return !error && !!data;
}

/** True if the profile owner allows messaging from the viewer. When owner has allow_only_verified_to_message, viewer must be verified. */
export async function canMessageOwner(
  ownerProfile: Pick<ProfileRow, "allow_only_verified_to_message"> | null,
  viewerVerified: boolean
): Promise<boolean> {
  if (!ownerProfile) return false;
  if (!ownerProfile.allow_only_verified_to_message) return true;
  return viewerVerified;
}
