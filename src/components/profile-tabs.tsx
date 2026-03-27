"use client";

import { LayoutDashboard, MapPin, FileLock, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustScoreMeter } from "@/components/trust-score-meter";
import { TravelStatsGrid } from "@/components/travel-stats-grid";
import { ProfileTravelMap, locationsFromHomeCountry, type SavedLocation, type GroupDestination } from "@/components/profile-travel-map";
import { VaultSection } from "@/components/vault-section";
import { UserProfile } from "@clerk/nextjs";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import type { ProfileRow } from "@/app/actions/profile";
import type { TrustDataResult } from "@/app/actions/profile";

type ProfileTabsProps = {
  profile: ProfileRow | null;
  trustData: TrustDataResult | null;
  userId: string;
  /** Groups the user joined or created (for bucket list map and list). */
  groups?: GroupDestination[] | null;
};

function travelBadgesFromInterests(interests: string[] | null | undefined): string[] {
  if (!interests?.length) return ["Mountain Climber", "City Explorer"];
  const badges: string[] = [];
  if (interests.some((i) => /hiking|adventure|nature/i.test(i))) badges.push("Mountain Climber");
  if (interests.some((i) => /cultural|photography|history/i.test(i))) badges.push("City Explorer");
  if (interests.some((i) => /foodie|food/i.test(i))) badges.push("Foodie Explorer");
  return badges.length > 0 ? badges : ["Mountain Climber", "City Explorer"];
}

export function ProfileTabs({ profile, trustData, userId, groups = null }: ProfileTabsProps) {
  const locations: SavedLocation[] = profile?.home_country
    ? locationsFromHomeCountry(profile.home_country)
    : [];
  const travelBadges = travelBadgesFromInterests(profile?.interests);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList
        orientation="horizontal"
        className="w-full flex-nowrap overflow-x-auto border-b border-border bg-transparent p-0 h-auto gap-0 sm:overflow-visible"
      >
        <TabsTrigger
          value="overview"
          className="flex-1 shrink-0 rounded-none border-b-2 border-transparent data-[active]:border-[#0066FF] sm:flex-initial sm:px-4"
          aria-label="Overview"
        >
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger
          value="bucket-list"
          className="flex-1 shrink-0 rounded-none border-b-2 border-transparent data-[active]:border-[#0066FF] sm:flex-initial sm:px-4"
          aria-label="My Bucket List"
        >
          <MapPin className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">My Bucket List</span>
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="flex-1 shrink-0 rounded-none border-b-2 border-transparent data-[active]:border-[#0066FF] sm:flex-initial sm:px-4"
          aria-label="Documents"
        >
          <FileLock className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Documents</span>
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="flex-1 shrink-0 rounded-none border-b-2 border-transparent data-[active]:border-[#0066FF] sm:flex-initial sm:px-4"
          aria-label="Account Settings"
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Account Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 transition-opacity duration-200">
        <div className="space-y-6">
          {trustData && (
            <Card className="border-[#0066FF]/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0a0a0a]">
                  Trust Score
                </CardTitle>
                <CardDescription>
                  Build trust with other travelers. Reach 70+ for the Verified Traveler badge.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrustScoreMeter
                  score={trustData.totalScore}
                  milestones={trustData.milestones}
                  verified={trustData.verified}
                  showMilestones
                />
              </CardContent>
            </Card>
          )}
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Travel Stats
            </h3>
            <TravelStatsGrid
              countriesVisited={0}
              totalDistanceKm={0}
              travelBadges={travelBadges}
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              My Travel Map
            </h3>
            <ProfileTravelMap locations={locations} groups={groups} />
          </div>
          {profile && (
            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Profile details
              </h3>
              <ProfileSettingsForm initialProfile={profile} userId={userId} />
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="bucket-list" className="mt-6 transition-opacity duration-200">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your saved locations and places you want to visit. They appear on your map and here.
          </p>
          <ProfileTravelMap locations={locations} groups={groups} className="mb-4" />
          {locations.length > 0 || (groups?.length ?? 0) > 0 ? (
            <ul className="space-y-2">
              {locations.map((loc) => (
                <li
                  key={loc.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <MapPin className="size-4 text-[#0066FF]" aria-hidden />
                  <span className="font-medium text-foreground">{loc.name}</span>
                </li>
              ))}
              {(groups ?? []).map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <MapPin className="size-4 text-[#0066FF]" aria-hidden />
                  <span className="font-medium text-foreground">{g.name}</span>
                  {g.country_name && (
                    <span className="text-sm text-muted-foreground">— {g.country_name}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              No saved locations yet. Join or create groups with a destination, or add your home country to see them here.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-6 transition-opacity duration-200">
        <VaultSection />
      </TabsContent>

      <TabsContent value="account" className="mt-6 transition-opacity duration-200">
        <div className="min-h-[400px] [&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:border [&_.cl-card]:border-border [&_.cl-card]:rounded-xl">
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full",
              },
            }}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
