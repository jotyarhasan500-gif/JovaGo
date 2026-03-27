"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { unstable_noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  computeTrustMilestones,
  computeTrustScore,
  isVerifiedTraveler,
  type TrustMilestone,
} from "@/lib/trust-score";

/** If the current user already has a profile in Supabase, do nothing (or update full_name/avatar_url from Clerk if missing).
 * If not, create a row with id = userId, role = 'user', subscription_tier = 'free', and Clerk full_name/avatar_url.
 * Timestamps are stored in UTC. */
export async function ensureProfileForCurrentUser(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const clerkUser = await currentUser();
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser?.fullName?.trim() ||
    null;
  const avatarUrl = clerkUser?.imageUrl?.trim() || null;
  const now = new Date().toISOString(); // UTC

  const existing = await getProfileByUserId(userId);
  const supabase = await createClient();

  if (existing) {
    const needsUpdate =
      (!existing.full_name?.trim() && fullName != null) ||
      (!existing.avatar_url?.trim() && avatarUrl != null);
    if (!needsUpdate) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...(fullName != null && { full_name: fullName }),
        ...(avatarUrl != null && { avatar_url: avatarUrl }),
        updated_at: now,
        last_seen: now,
      })
      .eq("id", userId);

    if (error) console.warn("[ensureProfileForCurrentUser] update", error.message);
    return;
  }

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    full_name: fullName ?? "Traveler",
    bio: null,
    home_country: null,
    travel_style: null,
    interests: [],
    avatar_url: avatarUrl,
    linked_social_media: false,
    trust_score: 0,
    verified_traveler: false,
    show_approximate_location: false,
    allow_only_verified_to_message: false,
    budget_level: null,
    languages: null,
    subscription_tier: "free",
    role: "user",
    created_at: now,
    updated_at: now,
    last_seen: now,
  });

  if (error) {
    if (error.code === "23505") return;
    console.warn("[ensureProfileForCurrentUser]", error.message);
  }
}

export type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  home_country: string | null;
  travel_style: string | null;
  interests: string[];
  avatar_url: string | null;
  linked_social_media?: boolean;
  trust_score?: number;
  verified_traveler?: boolean;
  show_approximate_location?: boolean;
  allow_only_verified_to_message?: boolean;
  budget_level?: string | null;
  languages?: string[] | null;
  subscription_tier?: string | null;
  role?: string | null;
  last_seen?: string | null;
  is_premium?: boolean;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFormData = {
  full_name: string;
  bio: string;
  home_country: string;
  travel_style: string;
  interests: string[];
  linked_social_media?: boolean;
};

export async function getProfileByUserId(
  userId: string
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
}

/** Current user subscription tier from profiles. Fresh fetch from Supabase every time. Returns raw tier; use .toLowerCase() === 'ultimate' for case-insensitive check. */
export async function getSubscriptionTier(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  console.log("Database Tier:", data?.subscription_tier);

  if (error) {
    console.warn("[getSubscriptionTier]", error.message);
    return null;
  }
  return data?.subscription_tier ?? null;
}

/** Current user role from profiles. Returns 'admin' or 'user' or null if not signed in / no profile. Admins bypass subscription checks. */
export async function getCurrentUserRole(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data?.role) return null;
  const role = String(data.role).toLowerCase();
  return role === "admin" ? "admin" : "user";
}

/** Force-fetch current user profile slice for header (role only). Uses unstable_noStore() so the result is never cached. Fetches from Supabase profiles table by Clerk userId. Use for Owner Panel visibility and /owner access. Caller should check role === 'owner' or role === 'admin' (case-insensitive). */
export async function getCurrentUserProfileForHeader(): Promise<{ role: string | null } | null> {
  unstable_noStore();
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("[getCurrentUserProfileForHeader]", error.message);
    return null;
  }
  return { role: data?.role ?? null };
}

export async function getProfileByIdForPublic(
  id: string
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, bio, home_country, travel_style, interests, avatar_url, linked_social_media, trust_score, verified_traveler, show_approximate_location, allow_only_verified_to_message, budget_level, languages, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
}

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProfile(
  input: ProfileFormData
): Promise<UpdateProfileResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to update your profile." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: input.full_name || null,
          bio: input.bio || null,
          home_country: input.home_country || null,
          travel_style: input.travel_style || null,
          interests: input.interests ?? [],
          linked_social_media: input.linked_social_media ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) return { success: false, error: error.message };
    await updateTrustScore(userId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}

export type TrustDataResult = {
  milestones: TrustMilestone[];
  totalScore: number;
  verified: boolean;
};

/** Compute trust milestones and score for the current user. Call from settings/profile only. */
export async function getTrustData(
  userId: string
): Promise<TrustDataResult | null> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId || clerkUserId !== userId) return null;

  const profile = await getProfileByUserId(userId);
  if (!profile) return null;

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("safety_reports")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const safetyTipCount = countError ? 0 : count ?? 0;
  const profilePhotoAdded = !!(
    profile.avatar_url && profile.avatar_url.trim().length > 0
  );
  const linkedSocialMedia = !!profile.linked_social_media;
  const firstSafetyTipContributed = safetyTipCount >= 1;
  const profileComplete = !!(
    profile.full_name?.trim() &&
    profile.bio?.trim() &&
    profile.home_country?.trim()
  );
  const emailVerified = true;

  const milestones = computeTrustMilestones({
    emailVerified,
    profilePhotoAdded,
    linkedSocialMedia,
    firstSafetyTipContributed,
    profileComplete,
  });
  const totalScore = computeTrustScore(milestones);
  const verified = isVerifiedTraveler(totalScore);

  return { milestones, totalScore, verified };
}

/** Recompute and persist trust_score and verified_traveler for the current user. */
export async function updateTrustScore(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const data = await getTrustData(userId);
  if (!data) return { success: false, error: "Unauthorized or profile not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      trust_score: data.totalScore,
      verified_traveler: data.verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
