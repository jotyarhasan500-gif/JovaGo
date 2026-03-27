export type TripContinent =
  | "all"
  | "europe"
  | "asia"
  | "north-america"
  | "south-america"
  | "africa"
  | "oceania";

export type TripBudget = "all" | "low" | "high";

export type TripStyle =
  | "all"
  | "solo"
  | "group"
  | "adventure"
  | "cultural"
  | "relaxation";

export type TripStyleValue = Exclude<TripStyle, "all">;

export interface Trip {
  id: string;
  destination: string;
  country: string;
  imageUrl: string | null; // placeholder: use gradient if null
  peopleJoined: number;
  maxPeople?: number;
  organizerName: string;
  organizerTrustRating: number; // 0-100
  continent: TripContinent;
  budget: "low" | "high";
  travelStyle: TripStyleValue;
  startDate: string;
  /** When true, trip card shows gold border and trip has Trust Timeline */
  verified?: boolean;
}

export const MOCK_TRIPS: Trip[] = [
  {
    id: "1",
    destination: "Phuket",
    country: "Thailand",
    imageUrl: null,
    peopleJoined: 3,
    maxPeople: 6,
    organizerName: "Priya S.",
    organizerTrustRating: 98,
    continent: "asia",
    budget: "low",
    travelStyle: "group",
    startDate: "Mar 15, 2025",
    verified: true,
  },
  {
    id: "2",
    destination: "Tokyo",
    country: "Japan",
    imageUrl: null,
    peopleJoined: 2,
    maxPeople: 4,
    organizerName: "Alex C.",
    organizerTrustRating: 95,
    continent: "asia",
    budget: "high",
    travelStyle: "cultural",
    startDate: "Apr 2, 2025",
    verified: true,
  },
  {
    id: "3",
    destination: "Bali",
    country: "Indonesia",
    imageUrl: null,
    peopleJoined: 5,
    maxPeople: 8,
    organizerName: "Emma W.",
    organizerTrustRating: 97,
    continent: "asia",
    budget: "low",
    travelStyle: "adventure",
    startDate: "Mar 20, 2025",
  },
  {
    id: "4",
    destination: "Barcelona",
    country: "Spain",
    imageUrl: null,
    peopleJoined: 1,
    maxPeople: 4,
    organizerName: "James L.",
    organizerTrustRating: 97,
    continent: "europe",
    budget: "high",
    travelStyle: "cultural",
    startDate: "Jun 1, 2025",
    verified: true,
  },
  {
    id: "5",
    destination: "Cape Town",
    country: "South Africa",
    imageUrl: null,
    peopleJoined: 4,
    maxPeople: 6,
    organizerName: "Marcus O.",
    organizerTrustRating: 96,
    continent: "africa",
    budget: "high",
    travelStyle: "adventure",
    startDate: "May 10, 2025",
  },
  {
    id: "6",
    destination: "Seoul",
    country: "South Korea",
    imageUrl: null,
    peopleJoined: 2,
    maxPeople: 5,
    organizerName: "Yuki T.",
    organizerTrustRating: 94,
    continent: "asia",
    budget: "low",
    travelStyle: "cultural",
    startDate: "Apr 8, 2025",
  },
  {
    id: "7",
    destination: "Lisbon",
    country: "Portugal",
    imageUrl: null,
    peopleJoined: 0,
    maxPeople: 4,
    organizerName: "Sofia M.",
    organizerTrustRating: 99,
    continent: "europe",
    budget: "low",
    travelStyle: "solo",
    startDate: "Jul 12, 2025",
  },
  {
    id: "8",
    destination: "Sydney",
    country: "Australia",
    imageUrl: null,
    peopleJoined: 3,
    maxPeople: 6,
    organizerName: "Jack R.",
    organizerTrustRating: 93,
    continent: "oceania",
    budget: "high",
    travelStyle: "adventure",
    startDate: "Aug 1, 2025",
  },
];

const CONTINENT_MAP: Record<Exclude<TripContinent, "all">, string> = {
  europe: "Europe",
  asia: "Asia",
  "north-america": "North America",
  "south-america": "South America",
  africa: "Africa",
  oceania: "Oceania",
};

export function getContinentLabel(c: TripContinent): string {
  return c === "all" ? "All continents" : CONTINENT_MAP[c];
}

export function filterTrips(
  trips: Trip[],
  continent: TripContinent,
  budget: TripBudget,
  travelStyle: TripStyle
): Trip[] {
  return trips.filter((t) => {
    if (continent !== "all" && t.continent !== continent) return false;
    if (budget !== "all" && t.budget !== budget) return false;
    if (travelStyle !== "all" && t.travelStyle !== travelStyle) return false;
    return true;
  });
}

export function getTripById(id: string): Trip | null {
  return MOCK_TRIPS.find((t) => t.id === id) ?? null;
}
