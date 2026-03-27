"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Star, BadgeCheck } from "lucide-react";
import type { Trip } from "@/lib/trips-data";
import { cn } from "@/lib/utils";

const TRAVEL_STYLE_LABELS: Record<string, string> = {
  solo: "Solo",
  group: "Group",
  adventure: "Adventure",
  cultural: "Cultural",
  relaxation: "Relaxation",
};

interface TripCardProps {
  trip: Trip;
}

function DestinationImage({ trip }: { trip: Trip }) {
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
    <div
      className={cn(
        "relative h-40 w-full bg-gradient-to-br rounded-t-xl",
        gradient
      )}
    >
      <div className="absolute inset-0 flex items-end justify-between p-3">
        <span className="rounded-md bg-black/40 px-2 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {trip.destination}, {trip.country}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-black/40 px-2 py-1 text-sm text-white backdrop-blur-sm">
          <Users className="size-4" aria-hidden />
          {trip.peopleJoined}
          {trip.maxPeople != null ? `/${trip.maxPeople}` : ""}
        </span>
      </div>
      {trip.verified && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          <BadgeCheck className="size-3.5" aria-hidden />
          Verified
        </span>
      )}
    </div>
  );
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link href={`/trip/${trip.id}`} className="block h-full">
      <Card
        className={cn(
          "h-full overflow-hidden bg-card transition-shadow hover:shadow-lg",
          trip.verified
            ? "ring-2 ring-amber-400 shadow-lg shadow-amber-400/20 hover:shadow-amber-400/25"
            : "border-[#0066FF]/10 hover:shadow-[#0066FF]/5"
        )}
      >
        <DestinationImage trip={trip} />
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[#737373]">
              {TRAVEL_STYLE_LABELS[trip.travelStyle] ?? trip.travelStyle}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-[#0066FF]">
              <Star className="size-4 fill-[#0066FF]" aria-hidden />
              {trip.organizerTrustRating}%
            </span>
          </div>
          <p className="text-xs text-[#737373]">
            Organizer: {trip.organizerName} · {trip.startDate}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
