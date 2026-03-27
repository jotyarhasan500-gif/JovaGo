"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import Map from "react-map-gl/mapbox";
import { Marker, Popup } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
} as const;

const TRAVEL_MARKERS = [
  { id: "erbil", name: "Erbil", longitude: 44.0, latitude: 36.2 },
  { id: "paris", name: "Paris", longitude: 2.3522, latitude: 48.8566 },
  { id: "tokyo", name: "Tokyo", longitude: 139.6503, latitude: 35.6762 },
] as const;

export function MapSection() {
  const { resolvedTheme } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapStyle = useMemo(
    () =>
      resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light,
    [resolvedTheme]
  );

  const selected = useMemo(
    () => TRAVEL_MARKERS.find((m) => m.id === selectedId) ?? null,
    [selectedId]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
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

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border border-border">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 20,
          latitude: 25,
          zoom: 1.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
      >
        {TRAVEL_MARKERS.map((loc) => (
          <Marker
            key={loc.id}
            longitude={loc.longitude}
            latitude={loc.latitude}
            anchor="bottom"
            onClick={() => setSelectedId(selectedId === loc.id ? null : loc.id)}
            style={{ cursor: "pointer" }}
          >
            <div
              className="flex flex-col items-center transition-transform hover:scale-110"
              aria-label={`Show ${loc.name}`}
            >
              <MapPin
                className="size-8 text-primary drop-shadow-md"
                strokeWidth={2}
                fill="currentColor"
              />
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            onClose={() => setSelectedId(null)}
            closeButton
            closeOnClick={false}
            anchor="top"
            className="map-section-popup"
          >
            <div className="px-1 py-0.5 text-sm font-medium text-foreground">
              {selected.name}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
