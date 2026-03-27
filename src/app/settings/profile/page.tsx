import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId, getTrustData, updateTrustScore } from "@/app/actions/profile";
import { getGroupsByOwnerId } from "@/app/actions/groups";
import { ProfileTabs } from "@/components/profile-tabs";

export default async function ProfileSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    console.log("Redirecting because...", "Settings profile: no userId");
    redirect("/sign-in");
  }

  const [profile, trustData, groups] = await Promise.all([
    getProfileByUserId(userId),
    getTrustData(userId),
    getGroupsByOwnerId(),
  ]);
  if (trustData) await updateTrustScore(userId);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold text-[#0a0a0a]">
          Profile
        </h1>
        <p className="mb-6 text-sm text-[#737373]">
          Overview, saved places, documents, and account settings.
        </p>
        <ProfileTabs profile={profile} trustData={trustData} userId={userId} groups={groups ?? undefined} />
      </main>
    </div>
  );
}
