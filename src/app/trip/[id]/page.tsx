import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TrustTimeline } from "@/components/trip/trust-timeline";
import { ItineraryUploadSection } from "@/components/trip/itinerary-upload-section";
import { RequestToJoinSection } from "@/components/trip/request-to-join-section";
import { getTripById } from "@/lib/trips-data";
import { BadgeCheck, MapPin, Users, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = getTripById(id);
  if (!trip) return { title: "Trip not found" };
  return {
    title: `${trip.destination}, ${trip.country} — Verified Trip | JovaGo`,
    description: `Join ${trip.organizerName}'s trip to ${trip.destination}. ${trip.peopleJoined}/${trip.maxPeople} spots filled.`,
  };
}

export default async function TripPage({ params }: PageProps) {
  const { id } = await params;
  const trip = getTripById(id);
  if (!trip) notFound();

  const gradientByRegion: Record<string, string> = {
    asia: "from-amber-400/80 to-teal-600/80",
    europe: "from-sky-400/80 to-indigo-600/80",
    africa: "from-orange-500/80 to-amber-700/80",
    oceania: "from-cyan-400/80 to-blue-600/80",
    "north-america": "from-emerald-400/80 to-green-700/80",
    "south-america": "from-lime-400/80 to-green-600/80",
  };
  const gradient = gradientByRegion[trip.continent] ?? "from-[#0066FF]/60 to-[#0066FF]/90";

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className={cn(
          "relative h-56 w-full bg-gradient-to-br sm:h-64",
          gradient
        )}
      >
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            {trip.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                <BadgeCheck className="size-4" aria-hidden />
                Verified trip
              </span>
            )}
            <span className="rounded-full bg-black/30 px-3 py-1 text-sm backdrop-blur-sm">
              {trip.travelStyle}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            {trip.destination}, {trip.country}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-4 text-sm opacity-90">
            <span className="flex items-center gap-1">
              <Calendar className="size-4" aria-hidden />
              {trip.startDate}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-4" aria-hidden />
              {trip.peopleJoined}
              {trip.maxPeople != null ? ` / ${trip.maxPeople}` : ""} joined
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-current" aria-hidden />
              Organizer {trip.organizerTrustRating}%
            </span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* Trust Timeline — for verified trips */}
        {trip.verified && (
          <section className="mb-8">
            <TrustTimeline />
          </section>
        )}

        {/* Upload itinerary */}
        <section className="mb-8">
          <ItineraryUploadSection />
        </section>

        {/* Request to join */}
        <section>
          <RequestToJoinSection />
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/explore"
            className="text-sm font-medium text-[#0066FF] hover:underline"
          >
            ← Back to explore trips
          </Link>
        </div>
      </div>
    </div>
  );
}
