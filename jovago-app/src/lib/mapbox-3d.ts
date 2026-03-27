/**
 * Shared 3D terrain and sky setup for Mapbox GL maps.
 * Use in onLoad: onLoad={(e) => addMapbox3DTerrainAndSky(e.target)}
 */

import type { Map as MapboxMap } from "mapbox-gl";

export const MAPBOX_3D_STYLE = "mapbox://styles/mapbox/outdoors-v12";

/** High-res satellite with streets for dashboard and bucket list (houses, streets, terrain). */
export const MAPBOX_SATELLITE_STREETS_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

export const DEFAULT_3D_VIEW = {
  pitch: 50,
  bearing: 0,
} as const;

/**
 * Adds Mapbox DEM terrain and a sky layer for a tilted 3D look.
 * Call once after map load.
 */
export function addMapbox3DTerrainAndSky(map: MapboxMap): void {
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({
      source: "mapbox-dem",
      exaggeration: 1.5,
    });
  }

  if (map.getLayer("mapbox-3d-sky")) return;
  map.addLayer({
    id: "mapbox-3d-sky",
    type: "sky",
    paint: {
      "sky-type": "atmosphere",
      "sky-atmosphere-sun": [0, 90],
      "sky-atmosphere-sun-intensity": 8,
    },
  });
}
