import { redirect } from "next/navigation";
import { getCurrentUserProfileForHeader } from "@/app/actions/profile";
import { getOwnerData } from "@/app/actions/owner";
import { OwnerDashboard } from "@/app/owner/owner-dashboard";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const profile = await getCurrentUserProfileForHeader();

  const isProjectOwner =
    profile?.role?.toLowerCase() === "admin" ||
    profile?.role?.toLowerCase() === "owner";
  if (!profile || !isProjectOwner) {
    redirect("/");
  }

  const { groups, users } = await getOwnerData();

  return <OwnerDashboard groups={groups} users={users} />;
}
