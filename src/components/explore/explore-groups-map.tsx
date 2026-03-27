"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MapPin, UsersRound, CalendarDays } from "lucide-react";
import type { MapRef } from "react-map-gl/mapbox";
import type { GroupRow } from "@/app/actions/groups";
import { MAPBOX_3D_STYLE, addMapbox3DTerrainAndSky, DEFAULT_3D_VIEW } from "@/lib/mapbox-3d";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const Map = dynamic(
  () => import("react-map-gl/mapbox").then((m) => m.default),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-map-gl/mapbox").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-map-gl/mapbox").then((m) => m.Popup),
  { ssr: false }
);

function formatTripDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

interface ExploreGroupsMapProps {
  groups: GroupRow[];
}

export function ExploreGroupsMap({ groups }: ExploreGroupsMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const groupsWithCoords = useMemo(
    () =>
      groups.filter(
        (g) =>
          typeof g.destination_lat === "number" && typeof g.destination_lng === "number"
      ),
    [groups]
  );

  const selectedGroup = useMemo(
    () => groupsWithCoords.find((g) => g.id === selectedId) ?? null,
    [groupsWithCoords, selectedId]
  );

  const initialViewState = useMemo(() => {
    const base =
      groupsWithCoords.length === 0
        ? { longitude: 20, latitude: 25, zoom: 1.5 }
        : groupsWithCoords.length === 1
          ? {
              longitude: groupsWithCoords[0].destination_lng!,
              latitude: groupsWithCoords[0].destination_lat!,
              zoom: 6,
            }
          : (() => {
              const lngs = groupsWithCoords.map((g) => g.destination_lng!);
              const lats = groupsWithCoords.map((g) => g.destination_lat!);
              return {
                longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                zoom: 3,
              };
            })();
    return { ...base, pitch: DEFAULT_3D_VIEW.pitch, bearing: DEFAULT_3D_VIEW.bearing };
  }, [groupsWithCoords]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) addMapbox3DTerrainAndSky(map);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm font-medium">Map unavailable</p>
          <p className="mt-1 text-xs">
            Add <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to{" "}
            <code className="rounded bg-muted px-1">.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  if (groupsWithCoords.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground">
        <p className="text-sm">No groups with location to show on map. Create a group with a destination to see them here.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[50vh] w-full overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAPBOX_3D_STYLE}
        onLoad={handleMapLoad}
      >
        {groupsWithCoords.map((group) => (
          <Marker
            key={group.id}
            longitude={group.destination_lng!}
            latitude={group.destination_lat!}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedId(selectedId === group.id ? null : group.id);
            }}
            style={{ cursor: "pointer" }}
          >
            <div
              className="flex flex-col items-center transition-transform hover:scale-110"
              aria-label={`Show ${group.name}`}
            >
              <MapPin
                className="size-8 text-[#0066FF] drop-shadow-md"
                strokeWidth={2}
                fill="currentColor"
              />
            </div>
          </Marker>
        ))}
        {selectedGroup && (
          <Popup
            longitude={selectedGroup.destination_lng!}
            latitude={selectedGroup.destination_lat!}
            onClose={() => setSelectedId(null)}
            closeButton
            closeOnClick={false}
            anchor="top"
            className="explore-groups-popup"
          >
            <div className="min-w-[200px] max-w-[280px] text-left">
              <h3 className="font-semibold text-foreground">{selectedGroup.name}</h3>
              {selectedGroup.country_name ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{selectedGroup.country_name}</p>
              ) : null}
              {selectedGroup.trip_date ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                  {formatTripDate(selectedGroup.trip_date)}
                </p>
              ) : null}
              {selectedGroup.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {selectedGroup.description}
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <UsersRound className="size-3.5" aria-hidden />
                  {(selectedGroup.member_count ?? 0)} / {selectedGroup.max_members ?? 10} members
                </span>
                {(selectedGroup.member_count ?? 0) >= (selectedGroup.max_members ?? 10) ? (
                  <span className="text-xs font-medium text-muted-foreground">Full</span>
                ) : selectedGroup.invite_code ? (
                  <Link
                    href={`/dashboard/groups/join?code=${encodeURIComponent(selectedGroup.invite_code)}`}
                    className="text-xs font-medium text-[#0066FF] hover:underline"
                  >
                    Join
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/groups"
                    className="text-xs font-medium text-[#0066FF] hover:underline"
                  >
                    Go to My Groups
                  </Link>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
