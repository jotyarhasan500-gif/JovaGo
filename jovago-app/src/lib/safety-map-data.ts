export type SafetyLevel = "green" | "yellow" | "orange" | "red";

export interface SafetyCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  safety: SafetyLevel;
}

export interface LivePin {
  id: string;
  cityId: string;
  /** Slightly offset for privacy (general area) */
  lat: number;
  lng: number;
}

export interface LocalTip {
  id: string;
  cityId: string;
  text: string;
  author?: string;
}

export const SAFETY_CITIES: SafetyCity[] = [
  { id: "tokyo", name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, safety: "green" },
  { id: "singapore", name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, safety: "green" },
  { id: "seoul", name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, safety: "green" },
  { id: "barcelona", name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, safety: "green" },
  { id: "lisbon", name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, safety: "green" },
  { id: "bali", name: "Bali", country: "Indonesia", lat: -8.4095, lng: 115.1889, safety: "yellow" },
  { id: "bangkok", name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, safety: "yellow" },
  { id: "phuket", name: "Phuket", country: "Thailand", lat: 7.8804, lng: 98.3923, safety: "yellow" },
  { id: "cape-town", name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, safety: "yellow" },
  { id: "sydney", name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, safety: "green" },
  { id: "new-york", name: "New York", country: "USA", lat: 40.7128, lng: -74.006, safety: "yellow" },
  { id: "london", name: "London", country: "UK", lat: 51.5074, lng: -0.1278, safety: "green" },
];

/** Live users in area (general coords for privacy) */
export const LIVE_PINS: LivePin[] = [
  { id: "u1", cityId: "tokyo", lat: 35.68, lng: 139.69 },
  { id: "u2", cityId: "tokyo", lat: 35.67, lng: 139.66 },
  { id: "u3", cityId: "bali", lat: -8.41, lng: 115.19 },
  { id: "u4", cityId: "barcelona", lat: 41.39, lng: 2.17 },
  { id: "u5", cityId: "seoul", lat: 37.57, lng: 127.0 },
];

export const LOCAL_TIPS: LocalTip[] = [
  { id: "t1", cityId: "tokyo", text: "Very friendly for solo women. Trains stop around midnight—plan accordingly.", author: "Priya S." },
  { id: "t2", cityId: "bali", text: "Avoid unlicensed drivers. Stick to Gojek/Grab for rides.", author: "Emma W." },
  { id: "t3", cityId: "barcelona", text: "Watch bags on metro and in crowds. Pickpockets are common.", author: "James L." },
  { id: "t4", cityId: "phuket", text: "Patong beach area is busy at night—well lit and generally safe in groups.", author: "Alex C." },
  { id: "t5", cityId: "cape-town", text: "Avoid this street at night: Long Street after 10pm can get rowdy.", author: "Marcus O." },
];

export const SAFETY_COLORS: Record<SafetyLevel, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export function getTipsForCity(cityId: string): LocalTip[] {
  return LOCAL_TIPS.filter((t) => t.cityId === cityId);
}

/** Safety rating 0-100 for display (derived from safety level) */
export function getSafetyRating(city: SafetyCity): number {
  const ratings: Record<SafetyLevel, number> = {
    green: 92,
    yellow: 62,
    orange: 45,
    red: 28,
  };
  return ratings[city.safety];
}

/** Top safety tip for a city (first from LOCAL_TIPS) */
export function getTopTipForCity(cityId: string): LocalTip | undefined {
  return LOCAL_TIPS.find((t) => t.cityId === cityId);
}

/** Count of active JovaGo users (live pins) in a city */
export function getActiveBuddiesCount(cityId: string): number {
  return LIVE_PINS.filter((p) => p.cityId === cityId).length;
}

/** Random offset in degrees for ~2km at given latitude (for privacy) */
export function randomOffset2km(lat: number): { lat: number; lng: number } {
  const deg = 0.018;
  const latOffset = (Math.random() - 0.5) * 2 * deg;
  const lngOffset = ((Math.random() - 0.5) * 2 * deg) / Math.cos((lat * Math.PI) / 180);
  return { lat: latOffset, lng: lngOffset };
}
