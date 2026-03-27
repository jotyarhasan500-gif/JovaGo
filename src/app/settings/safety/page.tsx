import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/app/actions/profile";
import { getBlockedUsersWithProfiles } from "@/app/actions/safety-privacy";
import { SafetyPrivacyForm } from "@/components/safety-privacy-form";
import { BlockList } from "@/components/block-list";
import { MapPin, MessageCircle, UserX } from "lucide-react";

export default async function SafetyPrivacyPage() {
  const { userId } = await auth();
  if (!userId) {
    console.log("Redirecting because...", "Settings safety: no userId");
    redirect("/sign-in");
  }

  const profile = await getProfileByUserId(userId);
  const blockedUsers = await getBlockedUsersWithProfiles();

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold text-[#0a0a0a]">
        Safety & Privacy
      </h2>
      <p className="mb-8 text-sm text-[#737373]">
        Control your location visibility and who can message you.
      </p>

      <SafetyPrivacyForm
        showApproximateLocation={profile?.show_approximate_location ?? true}
        allowOnlyVerifiedToMessage={profile?.allow_only_verified_to_message ?? false}
      />

      <BlockList blockedUsers={blockedUsers} className="mt-8" />
    </>
  );
}
