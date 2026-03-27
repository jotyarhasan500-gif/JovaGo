import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelDnaSection } from "@/components/travel-dna-section";
import { getProfileById } from "@/lib/profile-data";
import { BadgeCheck, MapPin, Calendar, Briefcase, Star } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = getProfileById(id);
  if (!profile) return { title: "Traveler not found" };
  return {
    title: `${profile.name} — Traveler Profile | JovaGo`,
    description: profile.bio,
  };
}

export default async function TravelerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = getProfileById(id);
  if (!profile) notFound();

  const { name, avatarInitials, bio, interests, travelDna, verified, stats, futureTrips } =
    profile;

  return (
    <div className="min-h-screen">
      {/* Cover photo */}
      <div
        className="h-48 w-full bg-gradient-to-br from-[#0066FF]/20 via-[#0066FF]/10 to-[#0066FF]/5 sm:h-56 md:h-64"
        aria-hidden
      />

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Profile header: avatar + name + verified */}
        <div className="-mt-16 sm:-mt-20">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative shrink-0">
              <div className="flex size-28 items-center justify-center rounded-2xl border-4 border-white bg-[#0066FF]/15 text-3xl font-semibold text-[#0066FF] shadow-lg sm:size-32">
                {avatarInitials}
              </div>
              {verified && (
                <span
                  className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-[#0066FF] text-white shadow"
                  title="Verified traveler"
                >
                  <BadgeCheck className="size-5" strokeWidth={2.5} />
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-semibold text-[#0a0a0a] sm:justify-start sm:text-3xl">
                {name}
                {verified && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#0066FF]">
                    <BadgeCheck className="size-5" aria-hidden />
                    Verified
                  </span>
                )}
              </h1>
              <p className="mt-2 max-w-xl text-[#525252]">{bio}</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <Briefcase className="mx-auto size-8 text-[#0066FF]" aria-hidden />
            <p className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              {stats.tripsCompleted}
            </p>
            <p className="text-sm text-[#737373]">Trips completed</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <MapPin className="mx-auto size-8 text-[#0066FF]" aria-hidden />
            <p className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              {stats.countriesVisited}
            </p>
            <p className="text-sm text-[#737373]">Countries visited</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
            <Star className="mx-auto size-8 text-[#0066FF]" aria-hidden />
            <p className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              {stats.trustScore}%
            </p>
            <p className="text-sm text-[#737373]">Trust score</p>
          </div>
        </div>

        {/* Travel DNA */}
        {travelDna?.length > 0 && (
          <TravelDnaSection traits={travelDna} className="mt-8" />
        )}

        {/* Interests */}
        <Card className="mt-8 border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#0a0a0a]">Interests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-[#0066FF]/10 px-3 py-1.5 text-sm font-medium text-[#0066FF]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Future trips */}
        <Card className="mt-6 border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#0a0a0a]">
              <Calendar className="size-5 text-[#0066FF]" />
              Future trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {futureTrips.map((trip, index) => (
                <li
                  key={`${trip.destination}-${index}`}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[#0a0a0a]">
                      {trip.destination}
                    </p>
                    <p className="text-sm text-[#737373]">{trip.dates}</p>
                    {trip.note && (
                      <p className="mt-1 text-sm text-[#525252]">{trip.note}</p>
                    )}
                  </div>
                  <Link
                    href="#"
                    className="mt-2 shrink-0 text-sm font-medium text-[#0066FF] hover:underline sm:mt-0"
                  >
                    Message to join
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[#0066FF] hover:underline"
          >
            ← Back to discover travelers
          </Link>
        </div>
      </div>
    </div>
  );
}
