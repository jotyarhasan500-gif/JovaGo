"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type CreatePostResult = { success: true } | { success: false; error: string };

export type PostRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

/**
 * Fetches all posts for the Explore feed.
 * Ordered by created_at descending.
 */
export async function getPosts(): Promise<PostRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, user_id, image_url, caption, location_name, latitude, longitude, created_at")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as PostRow[];
  } catch {
    return [];
  }
}

type CreatePostFromClientPayload = {
  image_url: string;
  caption: string;
  location_name: string;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Inserts a post using the given image URL and metadata. Call this after
 * uploading the image client-side to avoid Server Action body size limits.
 */
export async function createPostFromClient(
  payload: CreatePostFromClientPayload
): Promise<CreatePostResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Please sign in to create a post." };

  const imageUrl = (payload.image_url ?? "").trim();
  if (!imageUrl) return { success: false, error: "Image URL is required." };

  try {
    const supabase = await createClient();
    const { error: insertError } = await supabase.from("posts").insert({
      user_id: userId,
      image_url: imageUrl,
      caption: (payload.caption ?? "").trim() || null,
      location_name: (payload.location_name ?? "").trim() || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      created_at: new Date().toISOString(),
    });

    if (insertError) return { success: false, error: insertError.message };
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create post.";
    return { success: false, error: message };
  }
}
