import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@clerk/nextjs/server";
import { getProfileByIdForPublic, getProfileByUserId } from "@/app/actions/profile";
import { isBlockedByMe, isBlockedByThem, canMessageOwner } from "@/app/actions/safety-privacy";
import { getCompatibilityBreakdown } from "@/lib/compatibility-score";
import { TrustScoreMeter } from "@/components/trust-score-meter";
import { ProfileActions } from "@/components/profile-actions";
import { CompatibilityDeepDive } from "@/components/compatibility-deep-dive";
import { ProfileTravelMap, locationsFromHomeCountry } from "@/components/profile-travel-map";
import { TravelStatsGrid } from "@/components/travel-stats-grid";
import { DreamDestinations, DEFAULT_DREAM_DESTINATIONS } from "@/components/dream-destinations";
import { MapPin, Compass, Heart, BadgeCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileByIdForPublic(id);
  if (!profile) return { title: "Profile not found" };
  const name = profile.full_name || "Traveler";
  return {
    title: `${name} — Profile | JovaGo`,
    description: profile.bio ?? undefined,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getProfileByIdForPublic(id);
  if (!profile) notFound();

  const { userId: currentUserId } = await auth();
  const viewerProfile =
    currentUserId ? await getProfileByUserId(currentUserId) : null;
  const isOwner = !!currentUserId && currentUserId === id;
  const [blockedByMe, blockedByThem] = await Promise.all([
    currentUserId ? isBlockedByMe(id) : Promise.resolve(false),
    currentUserId ? isBlockedByThem(id) : Promise.resolve(false),
  ]);

  const canMessage =
    !blockedByMe &&
    !blockedByThem &&
    (await canMessageOwner(profile, viewerProfile?.verified_traveler ?? false));

  const compatibilityBreakdown =
    currentUserId && viewerProfile && !isOwner
      ? getCompatibilityBreakdown(viewerProfile, profile)
      : null;

  const name = profile.full_name || "Traveler";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const travelBadgesFromInterests = (profile.interests ?? []).length > 0
    ? [
        ...(profile.interests.some((i) => /hiking|adventure|nature/i.test(i))
          ? ["Mountain Climber"]
          : []),
        ...(profile.interests.some((i) => /cultural|photography|history/i.test(i))
          ? ["City Explorer"]
          : []),
        ...(profile.interests.some((i) => /foodie|food/i.test(i))
          ? ["Foodie Explorer"]
          : []),
      ]
    : ["Mountain Climber", "City Explorer"];
  const travelBadges =
    travelBadgesFromInterests.length > 0
      ? travelBadgesFromInterests
      : ["Mountain Climber", "City Explorer"];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cover */}
        <div
          className="h-40 w-full rounded-t-2xl bg-gradient-to-br from-[#0066FF]/20 via-[#0066FF]/10 to-[#0066FF]/5 sm:h-48"
          aria-hidden
        />

        {/* Avatar + name + bio */}
        <div className="-mt-20 px-2 sm:-mt-24">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
            <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-[#0066FF]/15 text-2xl font-semibold text-[#0066FF] shadow-lg sm:size-28">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h1 className="text-2xl font-semibold text-[#0a0a0a] sm:text-3xl">
                  {name}
                </h1>
                {profile.verified_traveler && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/10 px-2 py-0.5 text-sm font-medium text-[#0066FF]"
                    title="Verified Traveler"
                  >
                    <BadgeCheck className="size-4" aria-hidden />
                    Verified Traveler
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-2 max-w-xl text-[#525252]">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Trust Score (public view: bar + badge only) */}
        <Card className="mt-8 border-[#0066FF]/10">
          <CardContent className="pt-6">
            <TrustScoreMeter
              score={profile.trust_score ?? 0}
              milestones={[]}
              verified={profile.verified_traveler ?? false}
              showMilestones={false}
            />
          </CardContent>
        </Card>

        {/* Travel Stats */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#737373]">
            Travel Stats
          </h2>
          <TravelStatsGrid
            countriesVisited={0}
            totalDistanceKm={0}
            travelBadges={travelBadges}
          />
        </div>

        {/* Compatibility Deep-Dive (only when viewer is logged in and not viewing own profile) */}
        {compatibilityBreakdown && (
          <CompatibilityDeepDive
            breakdown={compatibilityBreakdown}
            className="mt-8"
          />
        )}

        {/* Location & travel style */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {profile.home_country && (
            <Card className="border-[#0066FF]/10">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
                  <MapPin className="size-5 text-[#0066FF]" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#737373]">
                    Home country
                  </p>
                  <p className="font-medium text-[#0a0a0a]">
                    {profile.home_country}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {profile.travel_style && (
            <Card className="border-[#0066FF]/10">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
                  <Compass className="size-5 text-[#0066FF]" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#737373]">
                    Travel style
                  </p>
                  <p className="font-medium text-[#0a0a0a]">
                    {profile.travel_style}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <Card className="mt-6 border-[#0066FF]/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a]">
                <Heart className="size-5 text-[#0066FF]" />
                Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="border-[#0066FF]/20 bg-[#0066FF]/10 text-[#0066FF]"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Travel Map */}
        <Card className="mt-6 border-[#0066FF]/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a]">
              <MapPin className="size-5 text-[#0066FF]" />
              My Travel Map
            </CardTitle>
            <p className="text-sm text-[#737373]">
              Saved locations and places you&apos;ve been or plan to go.
            </p>
          </CardHeader>
          <CardContent>
            <ProfileTravelMap locations={locationsFromHomeCountry(profile.home_country)} />
          </CardContent>
        </Card>

        {/* Dream Destinations */}
        <DreamDestinations
          destinations={DEFAULT_DREAM_DESTINATIONS}
          className="mt-8"
        />

        {currentUserId ? (
          <ProfileActions
            profileId={id}
            isOwner={isOwner}
            canMessage={canMessage}
            allowOnlyVerifiedToMessage={profile.allow_only_verified_to_message ?? false}
            viewerVerified={viewerProfile?.verified_traveler ?? false}
            isBlockedByMe={blockedByMe}
            isBlockedByThem={blockedByThem}
          />
        ) : (
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/explore"
              className="text-sm font-medium text-[#0066FF] hover:underline"
            >
              Explore trips
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-[#0066FF] hover:underline"
            >
              Sign in to message or report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
