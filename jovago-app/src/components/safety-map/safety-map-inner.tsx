"use client";

import { useRef, useEffect, useMemo } from "react";
import Map from "react-map-gl/mapbox";
import { Source, Layer } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import type { CircleLayer } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  SAFETY_CITIES,
  LIVE_PINS,
  SAFETY_COLORS,
  type SafetyCity,
} from "@/lib/safety-map-data";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface SafetyMapInnerProps {
  selectedCity: SafetyCity | null;
  onSelectCity: (city: SafetyCity | null) => void;
  onFlyTo: (city: SafetyCity) => void;
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

function buildLivePinsGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: LIVE_PINS.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
      properties: { id: p.id },
    })),
  };
}

const citiesData = buildCitiesGeoJSON();
const livePinsData = buildLivePinsGeoJSON();

const livePinsPaint: CircleLayer["paint"] = {
  "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 12, 4, 20, 6, 32],
  "circle-color": "#0066FF",
  "circle-opacity": 0.35,
  "circle-blur": 0.6,
  "circle-stroke-width": 1,
  "circle-stroke-color": "#0066FF",
};

export function SafetyMapInner({
  selectedCity,
  onSelectCity,
  onFlyTo,
}: SafetyMapInnerProps) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!selectedCity || !mapRef.current?.getMap()) return;
    const map = mapRef.current.getMap();
    map.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: 10,
      duration: 1500,
    });
  }, [selectedCity?.id]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#e5e7eb] p-8 text-center">
        <div>
          <p className="font-medium text-[#0a0a0a]">Mapbox token required</p>
          <p className="mt-2 text-sm text-[#737373]">
            Add <code className="rounded bg-[#f0f0f0] px-1">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to{" "}
            <code className="rounded bg-[#f0f0f0] px-1">.env.local</code> to show the safety map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 139.65,
        latitude: 35.68,
        zoom: 2,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <Source
        id="safety-cities"
        type="geojson"
        data={citiesData}
      >
        <Layer
          id="safety-cities-layer"
          source="safety-cities"
          type="circle"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 8, 4, 14, 6, 18],
            "circle-color": [
              "match",
              ["get", "safety"],
              "green",
              SAFETY_COLORS.green,
              "yellow",
              SAFETY_COLORS.yellow,
              "orange",
              SAFETY_COLORS.orange,
              "red",
              SAFETY_COLORS.red,
              "#94a3b8",
            ],
            "circle-opacity": 0.85,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          }}
        />
      </Source>
      <Source id="live-pins" type="geojson" data={livePinsData}>
        <Layer
          id="live-pins-layer"
          source="live-pins"
          type="circle"
          paint={livePinsPaint}
        />
      </Source>
    </Map>
  );
}
