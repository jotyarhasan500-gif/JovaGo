export type GenderFilter = "all" | "female" | "male";
export type BudgetLevel = "budget" | "mid" | "luxury" | "any";
export type AgeRange = "any" | "18-25" | "26-35" | "36-45" | "46+";
export type TravelStyle = "Backpacker" | "Luxury" | "Adventure" | "Solo" | "Group";

export interface Traveler {
  id: string;
  name: string;
  destination: string;
  travelDates: string;
  bio: string;
  interests: string[];
  gender: "female" | "male";
  ageRange: AgeRange;
  budget: BudgetLevel;
  travel_style: TravelStyle;
  avatarInitials: string;
  /** Compatibility match score 0-100 (for discovery cards) */
  matchScore?: number;
  /** Reasons shown in tooltip when hovering match score */
  matchReasons?: string[];
}

export const MOCK_TRAVELERS: Traveler[] = [
  {
    id: "1",
    name: "Priya Sharma",
    destination: "Phuket, Thailand",
    travelDates: "Mar 15 – Mar 28, 2025",
    bio: "Solo traveler looking for a buddy to explore beaches and temples. Love sunrise yoga and street food.",
    interests: ["Hiking", "Photography", "Foodie", "Yoga"],
    gender: "female",
    ageRange: "26-35",
    budget: "mid",
    travel_style: "Solo",
    avatarInitials: "PS",
    matchScore: 92,
    matchReasons: ["Both love hiking", "Both prefer budget stays", "Similar morning routines"],
  },
  {
    id: "2",
    name: "Alex Chen",
    destination: "Tokyo, Japan",
    travelDates: "Apr 2 – Apr 12, 2025",
    bio: "First time in Japan. Want to hit shrines, ramen spots, and maybe a day trip to Fuji.",
    interests: ["Foodie", "Photography", "Cultural"],
    gender: "male",
    ageRange: "26-35",
    budget: "mid",
    travel_style: "Adventure",
    avatarInitials: "AC",
    matchScore: 88,
    matchReasons: ["Both love photography", "Similar food interests", "Same travel dates overlap"],
  },
  {
    id: "3",
    name: "Emma Wilson",
    destination: "Bali, Indonesia",
    travelDates: "Mar 20 – Apr 5, 2025",
    bio: "Digital nomad seeking a travel buddy for co-working cafés and weekend adventures.",
    interests: ["Adventure", "Wellness", "Foodie"],
    gender: "female",
    ageRange: "26-35",
    budget: "budget",
    travel_style: "Adventure",
    avatarInitials: "EW",
    matchScore: 85,
    matchReasons: ["Both prefer budget travel", "Adventure & wellness", "Flexible schedules"],
  },
  {
    id: "4",
    name: "Marcus Okonkwo",
    destination: "Cape Town, South Africa",
    travelDates: "May 10 – May 24, 2025",
    bio: "Into wildlife safaris, wine tours, and hiking Table Mountain. Prefer small groups.",
    interests: ["Hiking", "Adventure", "Photography"],
    gender: "male",
    ageRange: "36-45",
    budget: "luxury",
    travel_style: "Adventure",
    avatarInitials: "MO",
    matchScore: 79,
    matchReasons: ["Both love hiking & adventure", "Photography in common"],
  },
  {
    id: "5",
    name: "Yuki Tanaka",
    destination: "Seoul, South Korea",
    travelDates: "Apr 8 – Apr 18, 2025",
    bio: "K-pop and K-drama fan. Looking for someone to explore cafés, palaces, and night markets.",
    interests: ["Foodie", "Cultural", "Photography"],
    gender: "female",
    ageRange: "18-25",
    budget: "mid",
    travel_style: "Solo",
    avatarInitials: "YT",
    matchScore: 91,
    matchReasons: ["Both love food & cultural spots", "Similar budget", "Photography"],
  },
  {
    id: "6",
    name: "James Liu",
    destination: "Barcelona, Spain",
    travelDates: "Jun 1 – Jun 14, 2025",
    bio: "Architecture and tapas. Happy to walk all day and end with wine by the sea.",
    interests: ["Cultural", "Foodie", "Photography"],
    gender: "male",
    ageRange: "36-45",
    budget: "luxury",
    travel_style: "Luxury",
    avatarInitials: "JL",
    matchScore: 87,
    matchReasons: ["Both prefer cultural travel", "Foodie match", "Similar pace"],
  },
];
