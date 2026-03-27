import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getProfileByUserId } from "@/app/actions/profile";
import { UpgradeToProCard } from "@/components/upgrade-to-pro-card";

export default async function BillingSettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getProfileByUserId(userId);
  const isPremium = profile?.is_premium === true;

  return (
    <>
      <h2 className="mb-2 text-xl font-semibold text-[#0a0a0a]">Billing</h2>
      <p className="mb-8 text-sm text-[#737373]">
        Manage your plan and payment through Stripe.
      </p>
      <UpgradeToProCard isPremium={isPremium} />
    </>
  );
}
