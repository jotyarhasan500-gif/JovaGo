import { auth } from "@clerk/nextjs/server";
import { ensureProfileForCurrentUser } from "@/app/actions/profile";

/**
 * Ensures the signed-in Clerk user has a row in public.profiles.
 * Renders nothing. Profile creation is a no-op if the profile already exists.
 */
export async function EnsureProfileSync() {
  const { userId } = await auth();
  if (!userId) return null;

  await ensureProfileForCurrentUser();
  return null;
}
