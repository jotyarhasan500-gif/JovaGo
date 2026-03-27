"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Map from "react-map-gl/mapbox";
import { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import { MapPin, Cloud, CloudRain, Navigation, Loader2 } from "lucide-react";
import {
  MAPBOX_SATELLITE_STREETS_STYLE,
  addMapbox3DTerrainAndSky,
  DEFAULT_3D_VIEW,
} from "@/lib/mapbox-3d";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/** Zoom level when focusing on a bucket list item (houses, streets). */
const FOCUS_ZOOM = 15;

const WEATHER_LAYER_IDS = { clouds: "weather-clouds-layer", precipitation: "weather-precip-layer" };
const WEATHER_SOURCE_IDS = { clouds: "weather-clouds", precipitation: "weather-precip" };

function getWeatherTileUrl(layer: "clouds_new" | "precipitation_new"): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/weather-tiles/${layer}/{z}/{x}/{y}`;
}

export type SavedLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

/** Group with destination coords for map markers (from group_members + groups). */
export type GroupDestination = {
  id: string;
  name: string;
  destination_lat: number | null;
  destination_lng: number | null;
  country_name: string | null;
};

type ProfileTravelMapProps = {
  locations: SavedLocation[];
  /** Groups the user joined or created; markers for those with destination_lat/lng. */
  groups?: GroupDestination[] | null;
  className?: string;
};

type MapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country_name?: string | null;
  type: "location" | "group";
};

type RouteState = {
  geojson: GeoJSON.Feature<GeoJSON.LineString>;
  distanceKm: number;
  durationMinutes: number;
  /** [lng, lat] of route start for Navigate link */
  origin: [number, number];
} | null;

type DestinationWeather = {
  temp: number;
  description: string;
  icon: string;
  main: string;
} | null;

export function ProfileTravelMap({
  locations,
  groups = null,
  className = "",
}: ProfileTravelMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showClouds, setShowClouds] = useState(false);
  const [showPrecipitation, setShowPrecipitation] = useState(false);
  const [route, setRoute] = useState<RouteState>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [destinationWeather, setDestinationWeather] = useState<DestinationWeather>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);

  const points = useMemo((): MapPoint[] => {
    const locs: MapPoint[] = locations.map((l) => ({
      id: l.id,
      name: l.name,
      latitude: l.latitude,
      longitude: l.longitude,
      type: "location" as const,
    }));
    const withCoords = (groups ?? []).filter(
      (g) =>
        typeof g.destination_lat === "number" && typeof g.destination_lng === "number"
    );
    const grps: MapPoint[] = withCoords.map((g) => ({
      id: `group-${g.id}`,
      name: g.name,
      latitude: g.destination_lat!,
      longitude: g.destination_lng!,
      country_name: g.country_name,
      type: "group" as const,
    }));
    return [...locs, ...grps];
  }, [locations, groups]);

  const hasPoints = points.length > 0;
  const centerLng = hasPoints
    ? points.reduce((s, p) => s + p.longitude, 0) / points.length
    : 20;
  const centerLat = hasPoints
    ? points.reduce((s, p) => s + p.latitude, 0) / points.length
    : 25;
  const defaultZoom = hasPoints ? (points.length === 1 ? 4 : 3) : 1.5;

  const selected = points.find((p) => p.id === selectedId) ?? null;
  const selectedIsGroup = selected?.type === "group";

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      addMapbox3DTerrainAndSky(map);
      setMapReady(true);
    }
  }, []);

  // Fly to selected point
  useEffect(() => {
    if (!selected) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: FOCUS_ZOOM,
      pitch: DEFAULT_3D_VIEW.pitch,
      bearing: DEFAULT_3D_VIEW.bearing,
      duration: 800,
    });
  }, [selected?.id]);

  // Weather overlay layers: add/remove based on toggles (only when map is ready)
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const addWeatherLayer = (layerKey: "clouds" | "precipitation") => {
      const layerName = layerKey === "clouds" ? "clouds_new" : "precipitation_new";
      const sourceId = WEATHER_SOURCE_IDS[layerKey];
      const layerId = WEATHER_LAYER_IDS[layerKey];
      if (map.getSource(sourceId)) return;
      const url = getWeatherTileUrl(layerName);
      map.addSource(sourceId, {
        type: "raster",
        tiles: [url],
        tileSize: 256,
      });
      map.addLayer(
        {
          id: layerId,
          type: "raster",
          source: sourceId,
          minzoom: 0,
          maxzoom: 22,
          paint: { "raster-opacity": 0.55 },
        },
        "mapbox-3d-sky"
      );
    };

    const removeWeatherLayer = (layerKey: "clouds" | "precipitation") => {
      const sourceId = WEATHER_SOURCE_IDS[layerKey];
      const layerId = WEATHER_LAYER_IDS[layerKey];
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };

    if (showClouds) addWeatherLayer("clouds");
    else removeWeatherLayer("clouds");
    if (showPrecipitation) addWeatherLayer("precipitation");
    else removeWeatherLayer("precipitation");

    return () => {
      removeWeatherLayer("clouds");
      removeWeatherLayer("precipitation");
    };
  }, [mapReady, showClouds, showPrecipitation]);

  // When selected is a group: fetch route (origin = user location or map center) and destination weather
  useEffect(() => {
    if (!selectedIsGroup || !selected) {
      setRoute(null);
      setDestinationWeather(null);
      setWeatherError(null);
      return;
    }
    const destLng = selected.longitude;
    const destLat = selected.latitude;

    let cancelled = false;

    const getOrigin = (): Promise<[number, number]> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          const map = mapRef.current?.getMap();
          const c = map?.getCenter();
          if (c) resolve([c.lng, c.lat]);
          else resolve([centerLng, centerLat]);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
          () => {
            const map = mapRef.current?.getMap();
            const c = map?.getCenter();
            if (c) resolve([c.lng, c.lat]);
            else resolve([centerLng, centerLat]);
          },
          { timeout: 3000, maximumAge: 60000 }
        );
      });
    };

    setRouteLoading(true);
    setWeatherLoading(true);
    setWeatherError(null);
    setRoute(null);
    setDestinationWeather(null);

    getOrigin().then(([origLng, origLat]) => {
      if (cancelled) return;
      const coords = `${origLng},${origLat};${destLng},${destLat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      fetch(url)
        .then((r) => r.json())
        .then((data: { routes?: Array<{ distance: number; duration: number; geometry: { coordinates: number[][] } }> }) => {
          if (cancelled || !data.routes?.[0]) {
            setRoute(null);
            return;
          }
          const r = data.routes[0];
          const coords = r.geometry.coordinates;
          const start = coords[0];
          setRoute({
            geojson: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
            distanceKm: Math.round((r.distance / 1000) * 10) / 10,
            durationMinutes: Math.round(r.duration / 60),
            origin: [start[0], start[1]],
          });
        })
        .catch(() => setRoute(null))
        .finally(() => setRouteLoading(false));
    });

    fetch(`/api/weather?lat=${destLat}&lon=${destLng}`)
      .then((r) => {
        if (cancelled) return null;
        if (!r.ok) {
          return r.json().then((body: { error?: string }) => {
            if (!cancelled) setWeatherError(body?.error ?? "Weather unavailable");
            return null;
          }).catch(() => {
            if (!cancelled) setWeatherError("Weather unavailable");
            return null;
          });
        }
        return r.json();
      })
      .then((data: DestinationWeather | null) => {
        if (!cancelled && data) {
          setDestinationWeather(data);
          setWeatherError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDestinationWeather(null);
          setWeatherError("Weather unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedIsGroup, selected?.id, selected?.latitude, selected?.longitude, centerLng, centerLat]);

  const navigateUrl = useMemo(() => {
    if (!selected) return null;
    const dest = `${selected.latitude},${selected.longitude}`;
    const orig = route?.origin
      ? `${route.origin[1]},${route.origin[0]}`
      : `${centerLat},${centerLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}&travelmode=driving`;
  }, [selected, route?.origin, centerLat, centerLng]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex h-[280px] w-full items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground ${className}`}
      >
        <p className="text-center text-sm">Map unavailable</p>
      </div>
    );
  }

  return (
    <div
      className={`relative h-[280px] w-full overflow-hidden rounded-xl border border-border bg-card ${className}`}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: defaultZoom,
          pitch: DEFAULT_3D_VIEW.pitch,
          bearing: DEFAULT_3D_VIEW.bearing,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAPBOX_SATELLITE_STREETS_STYLE}
        onLoad={handleMapLoad}
        interactive={true}
      >
        {route?.geojson && (
          <Source id="route-source" type="geojson" data={route.geojson}>
            <Layer
              id="route-glow"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 10,
                "line-blur": 4,
                "line-opacity": 0.25,
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#2563eb",
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
          </Source>
        )}
        {points.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
            onClick={() => setSelectedId(selectedId === point.id ? null : point.id)}
            style={{ cursor: "pointer" }}
          >
            <MapPin
              className="size-6 text-primary drop-shadow-md"
              strokeWidth={2}
              fill="currentColor"
              aria-label={point.name}
            />
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
          >
            <div className="px-1 py-0.5 text-sm">
              <span className="font-medium text-foreground">{selected.name}</span>
              {selected.country_name && (
                <span className="block text-xs text-muted-foreground">
                  {selected.country_name}
                </span>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Weather layer toggles */}
      <div className="absolute left-2 top-2 flex flex-col gap-1 rounded-lg border border-border/80 bg-card/95 p-1.5 shadow-sm backdrop-blur-sm">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Live weather
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={showClouds}
            onChange={(e) => setShowClouds(e.target.checked)}
            className="size-3.5 rounded border-border"
          />
          <Cloud className="size-3.5" aria-hidden />
          Clouds
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
          <input
            type="checkbox"
            checked={showPrecipitation}
            onChange={(e) => setShowPrecipitation(e.target.checked)}
            className="size-3.5 rounded border-border"
          />
          <CloudRain className="size-3.5" aria-hidden />
          Rain
        </label>
      </div>

      {/* Route + weather overlay when a group destination is selected */}
      {selectedIsGroup && selected && (
        <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-border/80 bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {routeLoading ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Route…
                </span>
              ) : route ? (
                <>
                  <span className="text-sm font-medium text-foreground">
                    {route.distanceKm} km
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ~{route.durationMinutes} min
                  </span>
                </>
              ) : null}
              <div className="flex items-center gap-1.5 text-sm">
                {weatherLoading ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading…
                  </span>
                ) : weatherError ? (
                  <span className="text-muted-foreground" title={weatherError}>
                    Weather unavailable
                  </span>
                ) : destinationWeather ? (
                  <>
                    <img
                      src={`https://openweathermap.org/img/wn/${destinationWeather.icon}@2x.png`}
                      alt=""
                      className="size-8"
                    />
                    <span className="font-medium text-foreground">
                      {destinationWeather.temp}°C
                    </span>
                    <span className="text-muted-foreground">
                      {destinationWeather.description}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            {navigateUrl && (
              <a
                href={navigateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Navigation className="size-4" aria-hidden />
                Navigate
              </a>
            )}
          </div>
        </div>
      )}

      {!hasPoints && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">
          <MapPin className="size-8 text-muted-foreground/60" aria-hidden />
          <p className="mt-2 text-sm font-medium text-foreground">No saved locations yet</p>
          <p className="text-xs text-muted-foreground">
            Join or create groups with a destination to see them here
          </p>
        </div>
      )}
    </div>
  );
}

/** Resolve a small set of coordinates for display from home_country (placeholder until we have saved_locations in DB). */
export function locationsFromHomeCountry(homeCountry: string | null): SavedLocation[] {
  if (!homeCountry || !homeCountry.trim()) return [];
  const country = homeCountry.trim().toLowerCase();
  const known: Record<string, [number, number]> = {
    france: [2.3522, 48.8566],
    japan: [139.6503, 35.6762],
    spain: [2.1734, 41.3851],
    italy: [12.4964, 41.9028],
    germany: [8.6821, 50.1109],
    uk: [-0.1276, 51.5074],
    "united kingdom": [-0.1276, 51.5074],
    usa: [-74.006, 40.7128],
    "united states": [-74.006, 40.7128],
    thailand: [100.5018, 13.7563],
    india: [77.209, 28.6139],
    australia: [151.2093, -33.8688],
    brazil: [-46.6339, -23.5505],
    iraq: [44.0, 36.2],
    "south korea": [126.978, 37.5665],
    indonesia: [106.8456, -6.2088],
    vietnam: [108.2772, 14.0583],
    "south africa": [18.4241, -33.9249],
    portugal: [-9.1393, 38.7223],
  };
  const coords = known[country];
  if (!coords) return [];
  const [lng, lat] = coords;
  return [{ id: "home", name: homeCountry.trim(), latitude: lat, longitude: lng }];
}
