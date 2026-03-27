export interface FutureTrip {
  destination: string;
  dates: string;
  note?: string;
}

export interface TravelerProfile {
  id: string;
  name: string;
  avatarInitials: string;
  bio: string;
  interests: string[];
  travelDna: string[]; // e.g. "Early Bird", "Slow Traveler", "Foodie Explorer"
  coverImageUrl?: string | null;
  profileImageUrl?: string | null;
  verified: boolean;
  stats: {
    tripsCompleted: number;
    countriesVisited: number;
    trustScore: number; // 0-100
  };
  futureTrips: FutureTrip[];
}

const FUTURE_TRIPS_PRIYA: FutureTrip[] = [
  { destination: "Phuket, Thailand", dates: "Mar 15 – Mar 28, 2025", note: "Beaches & temples" },
  { destination: "Kyoto, Japan", dates: "Sep 2025", note: "Cherry blossom season" },
];

const FUTURE_TRIPS_ALEX: FutureTrip[] = [
  { destination: "Tokyo, Japan", dates: "Apr 2 – Apr 12, 2025" },
  { destination: "Seoul, South Korea", dates: "Jun 2025" },
];

export const MOCK_PROFILES: Record<string, TravelerProfile> = {
  "1": {
    id: "1",
    name: "Priya Sharma",
    avatarInitials: "PS",
    bio: "Solo traveler looking for a buddy to explore beaches and temples. Love sunrise yoga and street food. I’ve been to 12 countries and prefer slow travel with a mix of nature and culture.",
    interests: ["Hiking", "Photography", "Foodie", "Yoga", "History", "Wellness"],
    travelDna: ["Early Bird", "Slow Traveler", "Wellness Seeker", "Foodie Explorer"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 18, countriesVisited: 12, trustScore: 98 },
    futureTrips: FUTURE_TRIPS_PRIYA,
  },
  "2": {
    id: "2",
    name: "Alex Chen",
    avatarInitials: "AC",
    bio: "First time in Japan. Want to hit shrines, ramen spots, and maybe a day trip to Fuji. Always up for food tours and street photography.",
    interests: ["Foodie", "Photography", "Cultural"],
    travelDna: ["Foodie Explorer", "Culture Buff", "Night Owl"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 8, countriesVisited: 6, trustScore: 95 },
    futureTrips: FUTURE_TRIPS_ALEX,
  },
  "3": {
    id: "3",
    name: "Emma Wilson",
    avatarInitials: "EW",
    bio: "Digital nomad seeking a travel buddy for co-working cafés and weekend adventures. Bali-based for the next few months.",
    interests: ["Adventure", "Wellness", "Foodie"],
    travelDna: ["Slow Traveler", "Adventure Seeker", "Digital Nomad"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 24, countriesVisited: 15, trustScore: 97 },
    futureTrips: [
      { destination: "Bali, Indonesia", dates: "Mar 20 – Apr 5, 2025" },
      { destination: "Vietnam", dates: "May 2025" },
    ],
  },
  "4": {
    id: "4",
    name: "Marcus Okonkwo",
    avatarInitials: "MO",
    bio: "Into wildlife safaris, wine tours, and hiking Table Mountain. Prefer small groups. Love connecting with fellow adventurers.",
    interests: ["Hiking", "Adventure", "Photography", "Wildlife"],
    travelDna: ["Adventure Seeker", "Early Bird", "Splurge Traveler"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 14, countriesVisited: 9, trustScore: 96 },
    futureTrips: [
      { destination: "Cape Town, South Africa", dates: "May 10 – May 24, 2025", note: "Safari & wine" },
      { destination: "Namibia", dates: "Aug 2025" },
    ],
  },
  "5": {
    id: "5",
    name: "Yuki Tanaka",
    avatarInitials: "YT",
    bio: "K-pop and K-drama fan. Looking for someone to explore cafés, palaces, and night markets. Always up for food adventures.",
    interests: ["Foodie", "Cultural", "Photography"],
    travelDna: ["Foodie Explorer", "Culture Buff", "Night Owl"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 6, countriesVisited: 4, trustScore: 94 },
    futureTrips: [
      { destination: "Seoul, South Korea", dates: "Apr 8 – Apr 18, 2025" },
      { destination: "Osaka, Japan", dates: "Jul 2025" },
    ],
  },
  "6": {
    id: "6",
    name: "James Liu",
    avatarInitials: "JL",
    bio: "Architecture and tapas. Happy to walk all day and end with wine by the sea. Prefer cultural deep-dives over checklist travel.",
    interests: ["Cultural", "Foodie", "Photography", "History"],
    travelDna: ["Slow Traveler", "Culture Buff", "Foodie Explorer"],
    coverImageUrl: null,
    profileImageUrl: null,
    verified: true,
    stats: { tripsCompleted: 11, countriesVisited: 8, trustScore: 97 },
    futureTrips: [
      { destination: "Barcelona, Spain", dates: "Jun 1 – Jun 14, 2025" },
      { destination: "Lisbon, Portugal", dates: "Sep 2025" },
    ],
  },
};

export function getProfileById(id: string): TravelerProfile | null {
  return MOCK_PROFILES[id] ?? null;
}
