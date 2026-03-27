"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId, getTrustData } from "@/app/actions/profile";

export type DashboardData = {
  name: string;
  trustScore: number;
  /** Raw profile data for UI-derived logic (e.g. bucket list locations, travel badges). */
  homeCountry: string | null;
  interests: string[];
  /** When true, user is visible on the map (Online); when false, hidden (Offline). */
  showOnMap: boolean;
};

/** Fetches dashboard data from DB/API only. UI logic (locationsFromHomeCountry, travel badges) lives in the component. */
export async function getDashboardData(): Promise<DashboardData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await getProfileByUserId(userId);
  const trustData = await getTrustData(userId);
  const name = profile?.full_name?.trim() || "Traveler";

  return {
    name,
    trustScore: trustData?.totalScore ?? 0,
    homeCountry: profile?.home_country ?? null,
    interests: profile?.interests ?? [],
    showOnMap: profile?.show_approximate_location ?? false,
  };
}

export type UpdateMapVisibilityResult =
  | { success: true }
  | { success: false; error: string };

/** Set map visibility (Online = show on map with optional coords, Offline = hidden).
 * Uses upsert; syncs full_name and avatar_url from Clerk so map markers show correctly.
 * Sets is_online so getOnlineMapUsers() can fetch all visible travelers. */
export async function updateMapVisibility(
  visible: boolean,
  lat?: number,
  lng?: number
): Promise<UpdateMapVisibilityResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Please sign in to update visibility." };
    }

    const clerkUser = await currentUser();
    const fullName = clerkUser?.fullName?.trim() || null;
    const avatarUrl = clerkUser?.imageUrl?.trim() || null;

    const supabase = await createClient();
    const updatedAt = new Date().toISOString();

      if (visible) {
      const payload = {
        id: userId,
        show_approximate_location: true,
        is_online: true,
        ...(fullName != null && { full_name: fullName }),
        ...(avatarUrl != null && { avatar_url: avatarUrl }),
        updated_at: updatedAt,
        ...(lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
          ? { last_lat: lat, last_lng: lng }
          : { last_lat: null, last_lng: null }),
      };
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) return { success: false, error: error.message };
    } else {
      const payload = {
        id: userId,
        show_approximate_location: false,
        is_online: false,
        last_lat: null,
        last_lng: null,
        updated_at: updatedAt,
      };
      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { success: false, error: message };
  }
}
