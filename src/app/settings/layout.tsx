import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureProfileForCurrentUser } from "@/app/actions/profile";
import { SettingsTabs } from "@/components/settings-tabs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    console.log("Redirecting because...", "Settings layout: no userId");
    redirect("/sign-in");
  }
  await ensureProfileForCurrentUser();

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold text-[#0a0a0a]">
          Settings
        </h1>
        <p className="mb-6 text-sm text-[#737373]">
          Manage your profile and privacy.
        </p>
        <SettingsTabs />
        {children}
      </main>
    </div>
  );
}
