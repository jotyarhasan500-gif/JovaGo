"use client";

import { useCallback, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { MapRef } from "react-map-gl/mapbox";
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

export interface PickedLocation {
  lat: number;
  lng: number;
  country_name: string;
  country_code: string;
}

interface LocationPickerMapProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation | null) => void;
  className?: string;
}

/**
 * Reverse geocode coordinates to get English country name and ISO code.
 * Uses Mapbox Geocoding API v5 (reverse).
 */
async function reverseGeocode(
  lng: number,
  lat: number,
  token: string
): Promise<{ country_name: string; country_code: string } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&language=en&types=country&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature) return null;
  const countryName = feature.text ?? feature.place_name ?? "";
  const countryCode = (feature.properties?.short_code ?? feature.properties?.iso_3166_1 ?? "").toUpperCase();
  return { country_name: countryName, country_code: countryCode };
}

export function LocationPickerMap({ value, onChange, className }: LocationPickerMapProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(
    async (ev: { lngLat: { lng: number; lat: number } }) => {
      if (!MAPBOX_TOKEN) {
        setError("Mapbox token missing");
        return;
      }
      const { lng, lat } = ev.lngLat;
      setLoading(true);
      setError(null);
      try {
        const result = await reverseGeocode(lng, lat, MAPBOX_TOKEN);
        if (result) {
          onChange({
            lat,
            lng,
            country_name: result.country_name,
            country_code: result.country_code,
          });
        } else {
          onChange({ lat, lng, country_name: "Unknown", country_code: "" });
        }
      } catch (_e) {
        setError("Could not get country. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex h-[200px] items-center justify-center rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground ${className ?? ""}`}>
        Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local to pick a location.
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-1 text-xs text-muted-foreground">
        Click on the map to set the group destination. Country will be detected in English.
      </p>
      <div className="relative h-[200px] w-full overflow-hidden rounded-lg border border-border">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: 20,
            latitude: 25,
            zoom: 1.5,
            pitch: DEFAULT_3D_VIEW.pitch,
            bearing: DEFAULT_3D_VIEW.bearing,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAPBOX_3D_STYLE}
          onClick={handleMapClick}
          onLoad={() => {
            const map = mapRef.current?.getMap();
            if (map) addMapbox3DTerrainAndSky(map);
          }}
          cursor={loading ? "wait" : "crosshair"}
        >
          {value && (
            <Marker longitude={value.lng} latitude={value.lat} anchor="bottom">
              <MapPin
                className="size-7 text-[#0066FF] drop-shadow-md"
                strokeWidth={2}
                fill="currentColor"
              />
            </Marker>
          )}
        </Map>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-sm">
            Getting location…
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      {value && !loading && (
        <p className="mt-1 text-xs text-muted-foreground">
          Destination: {value.country_name}
          {value.country_code ? ` (${value.country_code})` : ""}
        </p>
      )}
    </div>
  );
}
