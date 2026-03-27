import { NextRequest } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const ALLOWED_LAYERS = new Set(["precipitation_new", "clouds_new"]);
const TILE_TIMEOUT_MS = 8_000;

/**
 * Proxies OpenWeatherMap map tiles (precipitation, clouds) so the API key stays server-side.
 * Client uses: /api/weather-tiles/clouds_new/{z}/{x}/{y}
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ layer: string; z: string; x: string; y: string }> }
) {
  const { layer, z, x, y } = await params;
  if (!OPENWEATHER_API_KEY) {
    return new Response("Weather tiles not configured", { status: 503 });
  }
  if (!ALLOWED_LAYERS.has(layer)) {
    return new Response("Invalid layer", { status: 400 });
  }
  const zNum = parseInt(z, 10);
  const xNum = parseInt(x, 10);
  const yNum = parseInt(y, 10);
  if (Number.isNaN(zNum) || Number.isNaN(xNum) || Number.isNaN(yNum)) {
    return new Response("Invalid tile coordinates", { status: 400 });
  }

  const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${OPENWEATHER_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TILE_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      console.error("[weather-tiles] OpenWeather tile error:", {
        layer,
        z,
        x,
        y,
        status: res.status,
        statusText: res.statusText,
        body: text.slice(0, 200),
      });
      return new Response("Upstream tile error", { status: 502 });
    }

    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isAbort = e instanceof Error && e.name === "AbortError";
    console.error("[weather-tiles] Tile fetch failed:", {
      layer,
      z,
      x,
      y,
      error: message,
      timeout: isAbort,
    });
    return new Response("Tile fetch failed", { status: 502 });
  }
}
