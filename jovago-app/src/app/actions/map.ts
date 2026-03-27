"use server";

import { createClient } from "@/lib/supabase/server";

export type OnlineMapUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_lat: number;
  last_lng: number;
};

/** Fetch ALL profiles visible on the map (is_online = true with valid coords).
 * Uses is_online = true and non-null last_lat/last_lng.
 * Returns id, last_lat, last_lng, avatar_url, full_name for custom markers. */
export async function getOnlineMapUsers(): Promise<OnlineMapUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, last_lat, last_lng")
    .eq("is_online", true)
    .not("last_lat", "is", null)
    .not("last_lng", "is", null);

  if (error) {
    console.warn("[getOnlineMapUsers]", error.message);
    return [];
  }

  const users = (data ?? []).filter(
    (row): row is OnlineMapUser =>
      typeof row.last_lat === "number" &&
      typeof row.last_lng === "number" &&
      Number.isFinite(row.last_lat) &&
      Number.isFinite(row.last_lng)
  );
  return users;
}
