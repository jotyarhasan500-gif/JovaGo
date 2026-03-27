import { NextRequest } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_TIMEOUT_MS = 10_000;

export type WeatherResponse = {
  temp: number;
  description: string;
  icon: string;
  main: string;
};

/**
 * Returns current weather at lat/lon (for destination overlay).
 * Keeps OpenWeather API key server-side. Proxies to OpenWeather with timeout.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!OPENWEATHER_API_KEY) {
    return Response.json({ error: "Weather not configured" }, { status: 503 });
  }
  const latNum = lat != null ? parseFloat(lat) : NaN;
  const lonNum = lon != null ? parseFloat(lon) : NaN;
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return Response.json({ error: "lat and lon required" }, { status: 400 });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&units=metric&appid=${OPENWEATHER_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENWEATHER_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 600 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      console.error("[weather] OpenWeather API error:", {
        status: res.status,
        statusText: res.statusText,
        body: text,
        url: url.replace(OPENWEATHER_API_KEY, "[REDACTED]"),
      });
      return Response.json(
        { error: "Weather fetch failed", details: res.status === 401 ? "Invalid API key" : undefined },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      main?: { temp?: number };
      weather?: Array<{ description?: string; icon?: string; main?: string }>;
    };
    const temp = data.main?.temp ?? 0;
    const w = data.weather?.[0];
    const description = w?.description ?? "";
    const icon = w?.icon ?? "01d";
    const main = w?.main ?? "";
    return Response.json({
      temp: Math.round(temp * 10) / 10,
      description,
      icon,
      main,
    } satisfies WeatherResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isAbort = e instanceof Error && e.name === "AbortError";
    console.error("[weather] OpenWeather request failed:", {
      error: message,
      timeout: isAbort,
    });
    return Response.json(
      { error: isAbort ? "Weather request timed out" : "Weather fetch failed" },
      { status: 502 }
    );
  }
}
