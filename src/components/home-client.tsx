"use client";

import dynamic from "next/dynamic";
import { Footer } from "@/components/footer";
import { PricingSection } from "@/components/pricing-section";
import { TrustBar } from "@/components/trust-bar";
import { SafetyFirstSection } from "@/components/safety-first-section";
import type { CompatibilityInput } from "@/lib/compatibility-score";

const HeroSection = dynamic(
  () => import("@/components/hero-section").then((m) => ({ default: m.HeroSection })),
  { ssr: false, loading: () => <div className="min-h-[90vh] -mt-14 pt-14" /> }
);

const DiscoverySection = dynamic(
  () => import("@/components/discovery-section").then((m) => ({ default: m.DiscoverySection })),
  { ssr: false, loading: () => <div className="min-h-[400px] bg-background" /> }
);

export function HomeClient({
  currentUserProfile,
}: {
  currentUserProfile?: CompatibilityInput | null;
} = {}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <SafetyFirstSection />
        <DiscoverySection currentUserProfile={currentUserProfile} />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
