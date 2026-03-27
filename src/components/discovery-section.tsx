"use client";

import { useMemo, useState } from "react";
import { DiscoveryFilters } from "@/components/discovery-filters";
import { MapSection } from "@/components/map-section";
import { TravelerCard } from "@/components/traveler-card";
import { QuickConnectDrawer } from "@/components/quick-connect-drawer";
import type { QuickConnectTraveler } from "@/components/quick-connect-drawer";
import {
  calculateCompatibilityScore,
  travelerToCompatibilityInput,
  type CompatibilityInput,
} from "@/lib/compatibility-score";
import {
  MOCK_TRAVELERS,
  type AgeRange,
  type BudgetLevel,
  type GenderFilter,
} from "@/lib/discovery-data";
import { cn } from "@/lib/utils";

function filterTravelers(
  travelers: typeof MOCK_TRAVELERS,
  gender: GenderFilter,
  age: AgeRange,
  budget: BudgetLevel
) {
  return travelers.filter((t) => {
    if (gender !== "all" && t.gender !== gender) return false;
    if (age !== "any" && t.ageRange !== age) return false;
    if (budget !== "any" && t.budget !== budget) return false;
    return true;
  });
}

export function DiscoverySection({
  currentUserProfile,
}: {
  /** When provided, Match % is computed from this profile vs each traveler. */
  currentUserProfile?: CompatibilityInput | null;
}) {
  const [gender, setGender] = useState<GenderFilter>("all");
  const [age, setAge] = useState<AgeRange>("any");
  const [budget, setBudget] = useState<BudgetLevel>("any");

  const filtered = useMemo(
    () => filterTravelers(MOCK_TRAVELERS, gender, age, budget),
    [gender, age, budget]
  );

  const travelersWithScore = useMemo(() => {
    if (!currentUserProfile) return filtered;
    return filtered.map((t) => {
      const { score, reasons } = calculateCompatibilityScore(
        currentUserProfile,
        travelerToCompatibilityInput(t)
      );
      return { ...t, matchScore: score, matchReasons: reasons };
    });
  }, [filtered, currentUserProfile]);

  const [connectTraveler, setConnectTraveler] =
    useState<QuickConnectTraveler | null>(null);

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">
          Discover travel buddies
        </h2>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filter sidebar — full width on mobile, fixed width on lg */}
          <div className="w-full shrink-0 lg:w-56 xl:w-64">
            <DiscoveryFilters
              gender={gender}
              age={age}
              budget={budget}
              onGenderChange={setGender}
              onAgeChange={setAge}
              onBudgetChange={setBudget}
              className="rounded-xl border border-border bg-card px-4 shadow-sm lg:border-0 lg:bg-transparent lg:shadow-none lg:pr-6"
            />
          </div>

          {/* Cards grid + Map */}
          <div className="flex min-w-0 flex-1 flex-col gap-6 xl:flex-row">
            {/* Traveler cards grid */}
            <div
              className={cn(
                "grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2",
                filtered.length === 0 && "place-items-center py-12"
              )}
            >
              {filtered.length > 0 ? (
                travelersWithScore.map((traveler, index) => (
                  <TravelerCard
                    key={traveler.id}
                    traveler={traveler}
                    index={index}
                    onConnect={(t) => setConnectTraveler(t)}
                  />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">
                  No travelers match your filters. Try adjusting them.
                </p>
              )}
            </div>

            {/* Map — right side on xl, below grid on smaller */}
            <div className="w-full shrink-0 xl:w-80 2xl:w-96">
              <MapSection />
            </div>
          </div>
        </div>
      </div>

      <QuickConnectDrawer
        open={!!connectTraveler}
        onOpenChange={(open) => !open && setConnectTraveler(null)}
        traveler={connectTraveler}
      />
    </section>
  );
}
