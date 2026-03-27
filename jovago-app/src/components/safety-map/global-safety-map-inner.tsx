"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import Map from "react-map-gl/mapbox";
import { Source, Layer, Marker, Popup } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  SAFETY_CITIES,
  LIVE_PINS,
  randomOffset2km,
  type SafetyCity,
} from "@/lib/safety-map-data";
import type { OnlineMapUser } from "@/app/actions/map";
import { MessageCircle, MapPin } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/navigation-night-v1";

function buildSafetyHeatmapGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: SAFETY_CITIES.map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
      properties: { id: c.id, safety: c.safety },
    })),
  };
}

function buildCitiesGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: SAFETY_CITIES.map((c) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
      properties: { id: c.id, safety: c.safety, name: c.name },
    })),
  };
}

const heatmapData = buildSafetyHeatmapGeoJSON();
const citiesData = buildCitiesGeoJSON();

interface GlobalSafetyMapInnerProps {
  selectedCity: SafetyCity | null;
  onCitySelect: (city: SafetyCity | null) => void;
  flyToCity: SafetyCity | null;
  /** Online users to show as markers (from DB). Excludes current user when currentUserId is set. */
  onlineUsers?: OnlineMapUser[];
  /** Current logged-in user id; their marker is excluded from the map. */
  currentUserId?: string | null;
  /** When set, map flies to this point (e.g. from Online Buddies list). */
  flyToPoint?: { lat: number; lng: number } | null;
  /** When set with flyToPoint, opens the popup for this user after flying. */
  focusUserId?: string | null;
  /** Called after flying to flyToPoint (e.g. to clear flyToPoint state). */
  onFlyToPointComplete?: () => void;
  /** Called when the user clicks on the map with the clicked point lat/lng. */
  onMapClickCoords?: (lat: number, lng: number) => void;
  /** When set (e.g. from Explore post link), show a marker + popup at this point. */
  highlightPostPoint?: { lat: number; lng: number } | null;
}

export function GlobalSafetyMapInner({
  selectedCity,
  onCitySelect,
  flyToCity,
  onlineUsers = [],
  currentUserId = null,
  flyToPoint = null,
  focusUserId = null,
  onFlyToPointComplete,
  onMapClickCoords,
  highlightPostPoint = null,
}: GlobalSafetyMapInnerProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OnlineMapUser | null>(null);
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const { openChat } = useChatStore();

  // Buddy markers: only other online users (exclude self). Use real data when available.
  const buddyUsers = useMemo(
    () =>
      currentUserId
        ? onlineUsers.filter((u) => u.id !== currentUserId)
        : onlineUsers,
    [onlineUsers, currentUserId]
  );

  useEffect(() => {
    console.log("Supabase Data:", onlineUsers);
    if (onlineUsers.length > 0) {
      console.log("First profile (full_name, avatar_url):", {
        full_name: onlineUsers[0].full_name,
        avatar_url: onlineUsers[0].avatar_url,
      });
    }
  }, [onlineUsers]);

  const travelerPins = useMemo(() => {
    type Pin = { id: string; lat: number; lng: number; name: string; avatarUrl: string | null };
    if (buddyUsers.length > 0) {
      return buddyUsers.map((u): Pin => ({
        id: u.id,
        lat: u.last_lat,
        lng: u.last_lng,
        name: u.full_name || "Traveler",
        avatarUrl: u.avatar_url,
      }));
    }
    const cityMap = new globalThis.Map<string, SafetyCity>(
      SAFETY_CITIES.map((c) => [c.id, c])
    );
    return LIVE_PINS.map((p): Pin | null => {
      const city = cityMap.get(p.cityId);
      if (!city) return null;
      const offset = randomOffset2km(city.lat);
      return {
        id: p.id,
        lat: city.lat + offset.lat,
        lng: city.lng + offset.lng,
        name: "Traveler",
        avatarUrl: null,
      };
    }).filter((p): p is Pin => p !== null);
  }, [buddyUsers]);

  useEffect(() => {
    if (!flyToCity || !mapRef.current?.getMap()) return;
    const map = mapRef.current.getMap();
    map.flyTo({
      center: [flyToCity.lng, flyToCity.lat],
      zoom: 14,
      pitch: 55,
      duration: 2000,
    });
  }, [flyToCity?.id]);

  useEffect(() => {
    if (!flyToPoint || !mapRef.current?.getMap()) return;
    const map = mapRef.current.getMap();
    map.flyTo({
      center: [flyToPoint.lng, flyToPoint.lat],
      zoom: 12,
      duration: 1500,
    });
    // Open chat popup for the focused user (e.g. from sidebar click)
    if (focusUserId) {
      const user = buddyUsers.find((u) => u.id === focusUserId) ?? null;
      setSelectedUser(user);
    }
    onFlyToPointComplete?.();
  }, [flyToPoint, focusUserId, buddyUsers, onFlyToPointComplete]);

  // Fit map bounds once to include all buddy markers when we have real online buddies
  const hasFittedBuddyBounds = useRef(false);
  useEffect(() => {
    if (buddyUsers.length === 0 || hasFittedBuddyBounds.current) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const fit = () => {
      const lngs = buddyUsers.map((u) => u.last_lng);
      const lats = buddyUsers.map((u) => u.last_lat);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const padding = 0.02;
      map.fitBounds(
        [
          [minLng - padding, minLat - padding],
          [maxLng + padding, maxLat + padding],
        ],
        { padding: 60, maxZoom: 12, duration: 1000 }
      );
      hasFittedBuddyBounds.current = true;
    };
    if (map.loaded()) fit();
    else map.once("load", fit);
  }, [buddyUsers]);

  const onMapClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      setSelectedUser(null);
      const { lat, lng } = e.lngLat;
      onMapClickCoords?.(lat, lng);
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["safety-cities-layer"],
      });
      if (features.length > 0) {
        const id = features[0].properties?.id;
        const city = SAFETY_CITIES.find((c) => c.id === id) ?? null;
        onCitySelect(city);
      } else {
        onCitySelect(null);
      }
    },
    [onCitySelect, onMapClickCoords]
  );

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const setup = () => {
      map.on("click", onMapClick);
    };
    if (map.loaded()) {
      setup();
    } else {
      map.once("load", setup);
    }
    return () => {
      map.off("click", onMapClick);
    };
  }, [onMapClick]);

  // 3D terrain and buildings (after style has loaded)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const addTerrainAndBuildings = () => {
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({
          source: "mapbox-dem",
          exaggeration: 1.25,
        });
      }

      if (map.getLayer("add-3d-buildings")) return;
      const style = map.getStyle();
      if (!style?.layers) return;
      // Only add buildings if the style has the composite source (Mapbox Streets)
      if (!map.getSource("composite")) return;
      const labelLayerId = style.layers.find(
        (layer) =>
          layer.type === "symbol" &&
          "layout" in layer &&
          layer.layout &&
          typeof layer.layout === "object" &&
          "text-field" in (layer.layout as Record<string, unknown>)
      )?.id;
      map.addLayer(
        {
          id: "add-3d-buildings",
          source: "composite",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#374151",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.85,
          },
        },
        labelLayerId
      );
    };

    if (map.loaded()) {
      addTerrainAndBuildings();
    } else {
      map.once("load", addTerrainAndBuildings);
    }
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0f172a] p-8 text-center text-white">
        <p>Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local to load the map.</p>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 20,
        latitude: 30,
        zoom: 2,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      cursor={selectedCity ? "pointer" : "grab"}
      onLoad={() => setMapReady(true)}
    >
      {/* Safe zones heatmap glow: large blurred circles */}
      <Source id="safety-heatmap" type="geojson" data={heatmapData}>
        <Layer
          id="safety-heatmap-layer"
          source="safety-heatmap"
          type="circle"
          paint={{
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              2, 80,
              4, 120,
              6, 180,
              8, 220,
              10, 280,
            ],
            "circle-color": [
              "match",
              ["get", "safety"],
              "green",
              "#22c55e",
              "yellow",
              "#f97316",
              "orange",
              "#f97316",
              "red",
              "#ea580c",
              "#94a3b8",
            ],
            "circle-opacity": 0.35,
            "circle-blur": 0.75,
          }}
        />
      </Source>

      {/* City markers (clickable) */}
      <Source id="safety-cities" type="geojson" data={citiesData}>
        <Layer
          id="safety-cities-layer"
          source="safety-cities"
          type="circle"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 6, 4, 10, 6, 14],
            "circle-color": [
              "match",
              ["get", "safety"],
              "green",
              "#22c55e",
              "yellow",
              "#eab308",
              "orange",
              "#f97316",
              "red",
              "#ef4444",
              "#94a3b8",
            ],
            "circle-opacity": 0.95,
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(255,255,255,0.8)",
          }}
        />
      </Source>

      {/* Buddy markers: use avatar_url; fallback to first letter of full_name if image blank/fails — only after map DOM is ready */}
      {mapReady && travelerPins.map((pin) => {
        const user = buddyUsers.find((u) => u.id === pin.id);
        const isRealBuddy = !!user;
        const showAvatar =
          pin.avatarUrl && !avatarErrors.has(pin.id);
        const initial = (pin.name.trim() || "?").charAt(0).toUpperCase();
        return (
          <Marker
            key={pin.id}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (user) setSelectedUser(user);
            }}
            style={{ cursor: isRealBuddy ? "pointer" : "default", zIndex: 20 }}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-700 ${
                isRealBuddy
                  ? "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                  : "border-white/80 shadow-lg"
              }`}
              title={pin.name}
            >
              {showAvatar ? (
                <img
                  src={pin.avatarUrl!}
                  alt=""
                  className="h-full w-full rounded-full object-cover border-2 border-green-500"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setAvatarErrors((prev) => new Set(prev).add(pin.id));
                  }}
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {initial}
                </span>
              )}
            </div>
          </Marker>
        );
      })}

      {/* Popup when an online user marker is clicked */}
      {mapReady && selectedUser && (
        <Popup
          longitude={selectedUser.last_lng}
          latitude={selectedUser.last_lat}
          anchor="bottom"
          onClose={() => setSelectedUser(null)}
          closeButton
          closeOnClick={false}
          className="jovago-user-popup"
        >
          <div className="min-w-[160px] p-1">
            <p className="font-semibold text-slate-900">
              {selectedUser.full_name || "Traveler"}
            </p>
            <button
              type="button"
              onClick={() => openChat(selectedUser.id)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-3 py-2 text-sm font-medium text-white hover:bg-[#0052CC]"
            >
              <MessageCircle className="size-4" />
              Message Buddy
            </button>
          </div>
        </Popup>
      )}

      {/* Highlight marker + popup when navigating from Explore post (e.g. ?lat=&lng=) */}
      {mapReady && highlightPostPoint && (
        <>
          <Marker
            longitude={highlightPostPoint.lng}
            latitude={highlightPostPoint.lat}
            anchor="bottom"
            style={{ zIndex: 30 }}
          >
            <div className="flex size-10 items-center justify-center rounded-full border-2 border-[#0066FF] bg-[#0066FF]/20 shadow-lg">
              <MapPin className="size-5 text-[#0066FF]" />
            </div>
          </Marker>
          <Popup
            longitude={highlightPostPoint.lng}
            latitude={highlightPostPoint.lat}
            anchor="top"
            closeButton
            closeOnClick={false}
            className="jovago-post-location-popup"
          >
            <div className="min-w-[140px] p-2">
              <p className="text-sm font-medium text-slate-900">Post location</p>
            </div>
          </Popup>
        </>
      )}
    </Map>
  );
}
