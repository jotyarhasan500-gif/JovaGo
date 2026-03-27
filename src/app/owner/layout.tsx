import { redirect } from "next/navigation";
import { getCurrentUserProfileForHeader } from "@/app/actions/profile";

/** Protects /owner: only allow users with role 'owner' or 'admin' from Supabase profiles table. No cache (fresh fetch). Do NOT redirect if role is owner or admin. */
export const dynamic = "force-dynamic";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfileForHeader();
  console.log("Current user role:", profile?.role ?? "none");
  const role = profile?.role != null ? String(profile.role).toLowerCase() : "";
  const isOwnerOrAdmin = role === "owner" || role === "admin";
  if (!profile || !isOwnerOrAdmin) {
    redirect("/");
  }
  return <>{children}</>;
}
