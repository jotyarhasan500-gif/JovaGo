"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { getDashboardData, updateMapVisibility } from "@/app/actions/dashboard";
import { getGroupsByOwnerId, type GroupRow } from "@/app/actions/groups";
import { TrustScoreGauge } from "@/components/dashboard/trust-score-gauge";
import { TravelStatsGrid } from "@/components/travel-stats-grid";
import { ProfileTravelMap, locationsFromHomeCountry } from "@/components/profile-travel-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function deriveTravelBadges(interests: string[]): string[] {
  if (!interests.length) return ["Mountain Climber", "City Explorer"];
  const badges: string[] = [];
  if (interests.some((i) => /hiking|adventure|nature/i.test(i))) badges.push("Mountain Climber");
  if (interests.some((i) => /cultural|photography|history/i.test(i))) badges.push("City Explorer");
  if (interests.some((i) => /foodie|food/i.test(i))) badges.push("Foodie Explorer");
  return badges.length > 0 ? badges : ["Mountain Climber", "City Explorer"];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardData>>>(null);
  const [loading, setLoading] = useState(true);
  const [showOnMap, setShowOnMap] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);

  useEffect(() => {
    getDashboardData().then((d) => {
      setData(d);
      if (d) setShowOnMap(d.showOnMap);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getGroupsByOwnerId().then((list) => setGroups(list ?? []));
  }, []);

  const bucketListLocations = useMemo(
    () => (data ? locationsFromHomeCountry(data.homeCountry) : []),
    [data?.homeCountry]
  );
  const travelBadges = useMemo(
    () => (data ? deriveTravelBadges(data.interests) : []),
    [data?.interests]
  );

  async function handleVisibilityChange(checked: boolean) {
    setVisibilitySaving(true);
    if (checked) {
      if (!navigator.geolocation) {
        toast.error("Location is not supported by your browser.");
        setVisibilitySaving(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              toast.error("Could not get a valid location.");
              return;
            }
            const result = await updateMapVisibility(true, lat, lng);
            if (result.success) {
              setShowOnMap(true);
              toast.success("You're now visible on the map.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          } catch (err) {
            toast.error("Network error. Please try again.");
          } finally {
            setVisibilitySaving(false);
          }
        },
        async () => {
          try {
            const result = await updateMapVisibility(true);
            if (result.success) {
              setShowOnMap(true);
              toast.success("You're visible on the map. Enable location for exact position.");
              router.refresh();
            } else {
              toast.error(result.error);
            }
          } catch (err) {
            toast.error("Network error. Please try again.");
          } finally {
            setVisibilitySaving(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      try {
        const result = await updateMapVisibility(false);
        if (result.success) {
          setShowOnMap(false);
          toast.success("You're now hidden from the map.");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error("Network error. Please try again.");
      } finally {
        setVisibilitySaving(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-slate-400">Loading your dashboard…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-slate-400">Please sign in to view your dashboard.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-[#0066FF] hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const { name, trustScore } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Header - dark theme */}
      <header className="mb-10">
        <h1 className="text-2xl font-semibold text-slate-100 sm:text-3xl">
          Welcome back, {name}!
        </h1>
        <p className="mt-1 text-slate-400">
          Ready for your next adventure?
        </p>
      </header>

      {/* Trust Score Widget */}
      <section className="mb-10">
        <TrustScoreGauge
          score={trustScore}
          className="mx-auto max-w-[200px] sm:max-w-none"
        />
      </section>

      {/* Visibility Settings */}
      <section className="mb-10">
        <Card className="border-slate-700/50 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Visibility Settings</CardTitle>
            <CardDescription className="text-slate-400">
              Control whether other travelers can see you on the map.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-200">
                Show me on the Map
              </span>
              <Switch
                checked={showOnMap}
                onCheckedChange={handleVisibilityChange}
                disabled={visibilitySaving}
                aria-label="Show me on the map"
                aria-describedby="visibility-status"
              />
            </label>
            <p
              id="visibility-status"
              className="text-sm text-slate-400"
              role="status"
              aria-live="polite"
            >
              {showOnMap ? (
                <span className="inline-flex items-center gap-2 font-medium text-emerald-400">
                  <span
                    className="size-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"
                    aria-hidden
                  />
                  Online — Currently visible to other travelers
                </span>
              ) : (
                "Hidden — Not visible on the map"
              )}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Travel Stats - Countries visited, Total distance, Travel badges */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          Travel Stats
        </h2>
        <TravelStatsGrid
          countriesVisited={0}
          totalDistanceKm={0}
          travelBadges={travelBadges}
        />
      </section>

      {/* My Bucket List - travel cards based on locationsFromHomeCountry */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">
          My Bucket List
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Saved locations and places you want to visit.
        </p>
        <ProfileTravelMap
          locations={bucketListLocations}
          groups={groups}
          className="mb-4"
        />
        {bucketListLocations.length > 0 || groups.length > 0 ? (
          <ul className="space-y-2">
            {bucketListLocations.map((loc) => (
              <li
                key={loc.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <MapPin className="size-4 text-[#0066FF]" aria-hidden />
                <span className="font-medium text-slate-100">{loc.name}</span>
              </li>
            ))}
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <MapPin className="size-4 text-[#0066FF]" aria-hidden />
                <span className="font-medium text-slate-100">{g.name}</span>
                {g.country_name && (
                  <span className="text-sm text-slate-400">— {g.country_name}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-4 py-6 text-center text-sm text-slate-400">
            No saved locations yet. Join or create groups with a destination, or set a home country to see them here.
          </p>
        )}
      </section>
    </div>
  );
}
