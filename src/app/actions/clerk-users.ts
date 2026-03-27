"use server";

import { clerkClient } from "@clerk/nextjs/server";

export type ClerkUserInfo = {
  fullName: string;
  imageUrl: string | null;
};

/**
 * Fetches display info for multiple Clerk users by ID.
 * Returns a map of userId -> { fullName, imageUrl }.
 * Missing or failed users are omitted from the map.
 */
export async function getClerkUsersInfo(
  userIds: string[]
): Promise<Record<string, ClerkUserInfo>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};

  try {
    const client = await clerkClient();
    const results = await Promise.allSettled(
      unique.map((id) => client.users.getUser(id))
    );

    const map: Record<string, ClerkUserInfo> = {};
    results.forEach((result, i) => {
      if (result.status !== "fulfilled" || !result.value) return;
      const user = result.value;
      const id = unique[i];
      if (!id) return;
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      map[id] = {
        fullName: [firstName, lastName].filter(Boolean).join(" ") || "Someone",
        imageUrl: user.imageUrl ?? null,
      };
    });
    return map;
  } catch {
    return {};
  }
}
