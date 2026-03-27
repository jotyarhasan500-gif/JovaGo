"use client";

import { Suspense, useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShareSafetyExperienceModal } from "@/components/share-safety-experience-modal";
import { PostForm } from "@/components/PostForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getOnlineMapUsers } from "@/app/actions/map";
import {
  SAFETY_CITIES,
  getSafetyRating,
  getTopTipForCity,
  getActiveBuddiesCount,
  type SafetyCity,
} from "@/lib/safety-map-data";
import { Search, Shield, MessageSquare, Users, PenLine, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const GlobalSafetyMapInner = dynamic(
  () =>
    import("@/components/safety-map/global-safety-map-inner").then((m) => ({
      default: m.GlobalSafetyMapInner,
    })),
  { ssr: false, loading: () => <MapPlaceholder /> }
);

function MapPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0f172a] text-white/70">
      <p className="text-sm">Loading map…</p>
    </div>
  );
}

function GlobalSafetyTravelerMapPageContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const currentUserId = user?.id ?? null;
  const [selectedCity, setSelectedCity] = useState<SafetyCity | null>(null);
  const [flyToCity, setFlyToCity] = useState<SafetyCity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<Awaited<ReturnType<typeof getOnlineMapUsers>>>([]);
  const [flyToPoint, setFlyToPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [highlightPostPoint, setHighlightPostPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [focusUserId, setFocusUserId] = useState<string | null>(null);
  const [postFormCoords, setPostFormCoords] = useState<{ lat: number; lng: number } | null>(null);
  const postFormOpen = postFormCoords !== null;

  // Zoom to post coordinates when navigating from Explore (e.g. /safety-map?lat=36.86&lng=43.0)
  useEffect(() => {
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    if (latParam != null && lngParam != null) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setFlyToPoint({ lat, lng });
        setHighlightPostPoint({ lat, lng });
      }
    }
  }, [searchParams]);

  const buddyUsers = useMemo(
    () =>
      currentUserId
        ? onlineUsers.filter((u) => u.id !== currentUserId)
        : onlineUsers,
    [onlineUsers, currentUserId]
  );

  // Fetch all users from public.profiles where is_online = true (full_name, avatar_url included)
  useEffect(() => {
    const fetchUsers = () =>
      getOnlineMapUsers().then((users) => {
        setOnlineUsers(users);
        if (typeof window !== "undefined") {
          console.log("Supabase Data:", users);
        }
      });
    fetchUsers();
    const interval = setInterval(fetchUsers, 25000);
    return () => clearInterval(interval);
  }, [mapRefreshKey]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return SAFETY_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const handleSelectCityFromSearch = useCallback((city: SafetyCity) => {
    setFlyToCity(city);
    setSelectedCity(city);
    setSearchQuery("");
  }, []);

  const safetyRating = selectedCity ? getSafetyRating(selectedCity) : null;
  const topTip = selectedCity ? getTopTipForCity(selectedCity.id) : null;
  const activeBuddies = selectedCity
    ? getActiveBuddiesCount(selectedCity.id)
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a]">
      {/* Main content: no overflow-hidden so we can scroll to the section below the map */}
      <main className="relative flex flex-1 flex-col overflow-y-auto">
        {/* Map wrapper: fixed height so it cannot cover content below */}
        <div className="relative h-[70vh] w-full shrink-0">
          {/* Floating search - top center */}
          <div className="absolute left-1/2 top-4 z-20 w-full max-w-md -translate-x-1/2 px-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city..."
                  className="h-11 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/50 focus-visible:ring-[#0066FF]"
                />
                <AnimatePresence>
                  {searchQuery && filteredCities.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 z-30 mt-2 max-h-64 overflow-auto rounded-lg border border-white/20 bg-[#1e293b] shadow-xl"
                    >
                      {filteredCities.map((city) => (
                        <li key={city.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectCityFromSearch(city)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                          >
                            <span className="font-medium">{city.name}</span>
                            <span className="text-white/60">{city.country}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShareModalOpen(true)}
                className="shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <PenLine className="size-4" />
                Share experience
              </Button>
            </div>
          </div>

          {/* Map - fills the 70vh wrapper only */}
          <div className="absolute inset-0 top-14">
            <GlobalSafetyMapInner
              key={mapRefreshKey}
              selectedCity={selectedCity}
              onCitySelect={setSelectedCity}
              flyToCity={flyToCity}
              onlineUsers={onlineUsers}
              currentUserId={currentUserId}
              flyToPoint={flyToPoint}
              focusUserId={focusUserId}
              highlightPostPoint={highlightPostPoint}
              onFlyToPointComplete={() => {
                setFlyToPoint(null);
                setFocusUserId(null);
              }}
              onMapClickCoords={(lat, lng) => setPostFormCoords({ lat, lng })}
            />
          </div>
        </div>

        {/* Active Travelers: standard div below map, relative z-10, horizontal scroll */}
        <section
          aria-label="Active Travelers"
          className="relative z-10 shrink-0 border-t border-white/10 bg-slate-900/95 px-3 py-4 pb-20"
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Active Travelers
          </h2>
          {onlineUsers.length === 0 ? (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-4 text-center text-sm font-medium text-amber-200">
              No Online Users Found in Database
            </div>
          ) : buddyUsers.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {buddyUsers.map((u) => (
                <article
                  key={u.id}
                  className="flex min-w-[200px] shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-slate-800/80 p-3"
                >
                  <div className="relative shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-full border-2 border-green-500 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.svg";
                        }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-500 bg-slate-700 text-sm font-semibold text-white">
                        {(u.full_name || "T").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-green-500"
                      title="Online"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {u.full_name || "Traveler"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="mt-1.5 h-8 w-full border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      onClick={() => {
                        setFlyToPoint({ lat: u.last_lat, lng: u.last_lng });
                        setFocusUserId(u.id);
                      }}
                    >
                      <MapPin className="mr-1.5 size-3.5" />
                      Locate on Map
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-slate-800/50 px-4 py-6 text-center text-sm text-white/70">
              No other travelers online (only you). Be the first to go online!
            </p>
          )}
        </section>
      </main>

        {/* Desktop: semi-transparent floating sidebar (left) */}
        <AnimatePresence>
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "tween", duration: 0.25 }}
            className={cn(
              "absolute left-4 top-24 z-20 hidden w-72 rounded-xl border border-white/10 bg-slate-900/90 backdrop-blur-md shadow-xl sm:block",
              !selectedCity && "pointer-events-none"
            )}
          >
            <div className="p-4">
              {selectedCity ? (
                <>
                  <h2 className="mb-1 text-lg font-semibold text-white">
                    {selectedCity.name}, {selectedCity.country}
                  </h2>
                  <p className="mb-4 text-xs text-white/60">
                    Click on the map to clear selection
                  </p>

                  {/* Safety Rating 0-100 */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/20">
                      <Shield className="size-5 text-[#0066FF]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                        Safety Rating
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {safetyRating ?? 0}
                        <span className="ml-1 text-base font-normal text-white/60">
                          / 100
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Top Safety Tip */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                      <MessageSquare className="size-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                        Top Safety Tip
                      </p>
                      <p className="mt-1 text-sm text-white/90">
                        {topTip?.text ?? "No tips yet for this city."}
                      </p>
                      {topTip?.author && (
                        <p className="mt-1 text-xs text-white/50">
                          — {topTip.author}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Buddies */}
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                      <Users className="size-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                        Active Buddies
                      </p>
                      <p className="text-xl font-bold text-white">
                        {activeBuddies} JovaGo{" "}
                        {activeBuddies === 1 ? "user" : "users"}{" "}
                        in this area
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-6 text-center text-sm text-white/60">
                  Click a city on the map or search above to see safety details.
                </p>
              )}
            </div>
          </motion.aside>
        </AnimatePresence>

        {/* Mobile: bottom drawer for city details */}
        <AnimatePresence>
          {selectedCity && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-x-0 bottom-0 z-20 block max-h-[50vh] overflow-auto rounded-t-2xl border-t border-white/10 bg-slate-900/95 backdrop-blur-md sm:hidden"
            >
              <div className="sticky top-0 flex justify-center py-2">
                <div className="h-1 w-12 rounded-full bg-white/30" />
              </div>
              <div className="p-4 pb-8">
                <h2 className="mb-1 text-lg font-semibold text-white">
                  {selectedCity.name}, {selectedCity.country}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedCity(null)}
                  className="mb-4 text-xs text-white/60 underline"
                >
                  Close
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/20">
                    <Shield className="size-5 text-[#0066FF]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                      Safety Rating
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {safetyRating ?? 0}
                      <span className="ml-1 text-base font-normal text-white/60">
                        / 100
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                    <MessageSquare className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                      Top Safety Tip
                    </p>
                    <p className="mt-1 text-sm text-white/90">
                      {topTip?.text ?? "No tips yet for this city."}
                    </p>
                    {topTip?.author && (
                      <p className="mt-1 text-xs text-white/50">
                        — {topTip.author}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                    <Users className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                      Active Buddies
                    </p>
                    <p className="text-xl font-bold text-white">
                      {activeBuddies} JovaGo{" "}
                      {activeBuddies === 1 ? "user" : "users"}{" "}
                      in this area
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <ShareSafetyExperienceModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        onSuccess={() => setMapRefreshKey((k) => k + 1)}
      />

      <Dialog
        open={postFormOpen}
        onOpenChange={(open) => !open && setPostFormCoords(null)}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Create New Post</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a photo at this location. Lat: {postFormCoords?.lat.toFixed(5)}, Lng:{" "}
              {postFormCoords?.lng.toFixed(5)}
            </DialogDescription>
          </DialogHeader>
          {postFormCoords && (
            <PostForm
              lat={postFormCoords.lat}
              lng={postFormCoords.lng}
              onSuccess={() => setPostFormCoords(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GlobalSafetyTravelerMapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#0f172a] text-white/70">
          Loading map…
        </div>
      }
    >
      <GlobalSafetyTravelerMapPageContent />
    </Suspense>
  );
}
