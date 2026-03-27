import { HomeClient } from "@/components/home-client";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/app/actions/profile";
import { profileToCompatibilityInput } from "@/lib/compatibility-score";

export default async function Home() {
  const { userId } = await auth();
  const profile = userId ? await getProfileByUserId(userId) : null;
  const currentUserProfile = profile ? profileToCompatibilityInput(profile) : null;

  return (
    <>
      <HomeClient currentUserProfile={currentUserProfile} />
    </>
  );
}
