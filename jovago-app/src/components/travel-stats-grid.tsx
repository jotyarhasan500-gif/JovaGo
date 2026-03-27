"use client";

import { Globe, Plane, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export type TravelStatsGridProps = {
  countriesVisited: number;
  totalDistanceKm: number;
  travelBadges: string[];
  className?: string;
};

const cardBase =
  "rounded-xl border border-[#0066FF]/15 bg-card/80 px-4 py-5 text-card-foreground transition-all duration-300 hover:border-[#0066FF]/30 hover:shadow-[0_0_24px_rgba(0,102,255,0.12)] dark:hover:shadow-[0_0_24px_rgba(0,102,255,0.18)]";

function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km} km`;
}

export function TravelStatsGrid({
  countriesVisited,
  totalDistanceKm,
  travelBadges,
  className = "",
}: TravelStatsGridProps) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-3", className)}
      aria-label="Travel statistics"
    >
      {/* Countries Visited */}
      <div className={cn(cardBase, "flex flex-col gap-2")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
          <Globe className="size-5 text-[#0066FF]" aria-hidden />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Countries Visited
        </p>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {countriesVisited}
        </p>
      </div>

      {/* Total Distance */}
      <div className={cn(cardBase, "flex flex-col gap-2")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
          <Plane className="size-5 text-[#0066FF]" aria-hidden />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total Distance
        </p>
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {formatDistance(totalDistanceKm)}
        </p>
      </div>

      {/* Travel Badges */}
      <div className={cn(cardBase, "flex flex-col gap-2")}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10">
          <Award className="size-5 text-[#0066FF]" aria-hidden />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Travel Badges
        </p>
        <div className="flex flex-wrap gap-1.5">
          {travelBadges.length > 0 ? (
            travelBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex rounded-full border border-[#0066FF]/25 bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-medium text-[#0066FF]"
              >
                {badge}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No badges yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
