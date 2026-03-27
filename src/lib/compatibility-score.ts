/**
 * Manual compatibility score between two users (no external AI).
 * Used to display Match % on traveler cards.
 */

export type BudgetLevel = "budget" | "mid" | "luxury" | "any";

/** Traveler object from Supabase (profiles table) for match scoring. */
export type SupabaseTravelerForMatch = {
  interests?: string[] | null;
  budget_level?: BudgetLevel | string | null;
  travel_style?: string | null;
  languages?: string[] | null;
};

/** Minimal profile shape needed for compatibility. */
export type CompatibilityInput = {
  interests: string[];
  budget_level?: BudgetLevel;
  travel_style?: string | null;
};

export type CompatibilityResult = {
  /** Score out of 100 (capped). */
  score: number;
  /** Human-readable reasons for the match (for tooltip). */
  reasons: string[];
};

const POINTS_PER_INTEREST_MATCH = 20;
const POINTS_BUDGET_MATCH = 30;
const POINTS_TRAVEL_STYLE_MATCH = 30;
const MAX_SCORE = 100;

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function sameTravelStyle(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return normalize(a) === normalize(b);
}

function sameBudget(a: BudgetLevel | undefined, b: BudgetLevel | undefined): boolean {
  if (!a || !b) return false;
  if (a === "any" || b === "any") return true;
  return a === b;
}

/**
 * Calculate manual compatibility score between two users.
 * - Each matching interest: +20 points.
 * - Same budget_level: +30 points.
 * - Same travel_style: +30 points.
 * Returns total capped at 100 and a list of reasons for the tooltip.
 */
export function calculateCompatibilityScore(
  me: CompatibilityInput,
  other: CompatibilityInput
): CompatibilityResult {
  const reasons: string[] = [];
  let score = 0;

  const myInterests = (me.interests ?? []).map(normalize);
  const otherInterests = new Set((other.interests ?? []).map(normalize));
  const myInterestsDisplay = new Set((me.interests ?? []).map((i) => i.trim()));

  for (const interest of myInterests) {
    if (otherInterests.has(interest)) {
      score += POINTS_PER_INTEREST_MATCH;
      const displayName = [...myInterestsDisplay].find((i) => normalize(i) === interest) ?? interest;
      reasons.push(`Both like ${displayName}`);
    }
  }

  if (sameBudget(me.budget_level, other.budget_level)) {
    score += POINTS_BUDGET_MATCH;
    const budget = me.budget_level ?? other.budget_level ?? "any";
    if (budget !== "any") {
      reasons.push(`Same budget (${budget})`);
    } else {
      reasons.push("Similar budget");
    }
  }

  if (sameTravelStyle(me.travel_style, other.travel_style)) {
    score += POINTS_TRAVEL_STYLE_MATCH;
    const style = me.travel_style ?? other.travel_style ?? "";
    reasons.push(`Same travel style (${style})`);
  }

  const cappedScore = Math.min(MAX_SCORE, score);
  return {
    score: cappedScore,
    reasons: reasons.length > 0 ? reasons : ["No strong overlap yet"],
  };
}

/**
 * Build CompatibilityInput from a traveler card object (e.g. Traveler from discovery-data).
 */
export function travelerToCompatibilityInput(t: {
  interests: string[];
  budget?: BudgetLevel;
  travel_style?: string | null;
}): CompatibilityInput {
  return {
    interests: t.interests ?? [],
    budget_level: t.budget ?? "any",
    travel_style: t.travel_style ?? null,
  };
}

/**
 * Build CompatibilityInput from a Supabase profile (e.g. ProfileRow).
 * Profile has no budget_level; use "any" so only interests and travel_style affect score.
 */
export function profileToCompatibilityInput(p: {
  interests?: string[] | null;
  travel_style?: string | null;
}): CompatibilityInput {
  return {
    interests: p.interests ?? [],
    budget_level: "any",
    travel_style: p.travel_style ?? null,
  };
}

// --- Supabase traveler match (calculateMatchScore / getMatchReason) ---

const MATCH_POINTS_INTERESTS_3 = 30;
const MATCH_POINTS_BUDGET = 25;
const MATCH_POINTS_TRAVEL_STYLE = 25;
const MATCH_POINTS_COMMON_LANGUAGE = 20;
const MATCH_MAX_SCORE = 100;

function normalizeStr(s: string): string {
  return s.trim().toLowerCase();
}

function sharedInterestsCount(a: string[] | null | undefined, b: string[] | null | undefined): number {
  const setA = new Set((a ?? []).map(normalizeStr));
  let count = 0;
  for (const x of b ?? []) {
    if (setA.has(normalizeStr(x))) count++;
  }
  return count;
}

function hasAtLeastThreeSharedInterests(
  a: string[] | null | undefined,
  b: string[] | null | undefined
): boolean {
  return sharedInterestsCount(a, b) >= 3;
}

function sameBudgetLevel(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  const na = normalizeStr(a);
  const nb = normalizeStr(b);
  if (na === "any" || nb === "any") return true;
  return na === nb;
}

function sameTravelStyleMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) return false;
  return normalizeStr(a) === normalizeStr(b);
}

function hasCommonLanguage(
  a: string[] | null | undefined,
  b: string[] | null | undefined
): boolean {
  const setA = new Set((a ?? []).map(normalizeStr));
  for (const lang of b ?? []) {
    if (setA.has(normalizeStr(lang))) return true;
  }
  return false;
}

/**
 * Compare two traveler objects from Supabase and return a total score out of 100.
 * - +30 points if they have at least 3 shared interests.
 * - +25 points if budget level is the same.
 * - +25 points if travel style matches.
 * - +20 points if they speak at least one common language.
 */
export function calculateMatchScore(
  userA: SupabaseTravelerForMatch,
  userB: SupabaseTravelerForMatch
): number {
  let score = 0;

  if (hasAtLeastThreeSharedInterests(userA.interests, userB.interests)) {
    score += MATCH_POINTS_INTERESTS_3;
  }
  if (sameBudgetLevel(userA.budget_level as string, userB.budget_level as string)) {
    score += MATCH_POINTS_BUDGET;
  }
  if (sameTravelStyleMatch(userA.travel_style, userB.travel_style)) {
    score += MATCH_POINTS_TRAVEL_STYLE;
  }
  if (hasCommonLanguage(userA.languages, userB.languages)) {
    score += MATCH_POINTS_COMMON_LANGUAGE;
  }

  return Math.min(MATCH_MAX_SCORE, score);
}

type MatchCategory = "interests" | "budget" | "travel_style" | "languages";

function getCategoryScore(
  category: MatchCategory,
  userA: SupabaseTravelerForMatch,
  userB: SupabaseTravelerForMatch
): number {
  switch (category) {
    case "interests":
      return hasAtLeastThreeSharedInterests(userA.interests, userB.interests)
        ? MATCH_POINTS_INTERESTS_3
        : 0;
    case "budget":
      return sameBudgetLevel(userA.budget_level as string, userB.budget_level as string)
        ? MATCH_POINTS_BUDGET
        : 0;
    case "travel_style":
      return sameTravelStyleMatch(userA.travel_style, userB.travel_style)
        ? MATCH_POINTS_TRAVEL_STYLE
        : 0;
    case "languages":
      return hasCommonLanguage(userA.languages, userB.languages)
        ? MATCH_POINTS_COMMON_LANGUAGE
        : 0;
  }
}

function formatBudget(b: string | null | undefined): string {
  if (!b) return "budget";
  const n = normalizeStr(b);
  if (n === "mid") return "mid-range";
  if (n === "luxury") return "Luxury";
  if (n === "any") return "similar budget";
  return b.trim().charAt(0).toUpperCase() + b.trim().slice(1).toLowerCase();
}

function getInterestPreview(userA: SupabaseTravelerForMatch, userB: SupabaseTravelerForMatch): string {
  const setA = new Set((userA.interests ?? []).map(normalizeStr));
  const shared: string[] = [];
  for (const x of userB.interests ?? []) {
    if (setA.has(normalizeStr(x))) {
      const display = (userB.interests ?? []).find((i) => normalizeStr(i) === normalizeStr(x)) ?? x;
      shared.push(display.trim());
    }
  }
  if (shared.length === 0) return "";
  if (shared.length === 1) return shared[0];
  if (shared.length === 2) return `${shared[0]} and ${shared[1]}`;
  return `${shared.slice(0, -1).join(", ")} and ${shared[shared.length - 1]}`;
}

/**
 * Returns a short match reason string based on the highest-scoring category,
 * e.g. "You both love Hiking and have a similar budget".
 */
export function getMatchReason(
  userA: SupabaseTravelerForMatch,
  userB: SupabaseTravelerForMatch
): string {
  const categories: MatchCategory[] = ["interests", "budget", "travel_style", "languages"];
  let bestCategory: MatchCategory | null = null;
  let bestScore = 0;

  for (const cat of categories) {
    const s = getCategoryScore(cat, userA, userB);
    if (s > bestScore) {
      bestScore = s;
      bestCategory = cat;
    }
  }

  if (!bestCategory || bestScore === 0) {
    return "You might be a good travel match.";
  }

  switch (bestCategory) {
    case "interests": {
      const preview = getInterestPreview(userA, userB);
      if (preview) {
        return `You both love ${preview}.`;
      }
      return "You share several interests.";
    }
    case "budget":
      return `You have a similar budget (${formatBudget(userA.budget_level ?? userB.budget_level)}).`;
    case "travel_style": {
      const style = userA.travel_style ?? userB.travel_style ?? "travel";
      const display = style.trim().charAt(0).toUpperCase() + style.trim().slice(1).toLowerCase();
      return `You both prefer ${display} travel.`;
    }
    case "languages":
      return "You speak at least one common language.";
    default:
      return "You might be a good travel match.";
  }
}

// --- Compatibility Deep-Dive (breakdown for profile page) ---

export type CompatibilityBreakdown = {
  /** 0–100: overlap of interests */
  interestAlignment: number;
  /** 0 or 100: same budget level */
  budgetSync: number;
  /** 0 or 100: same travel style */
  styleMatch: number;
  /** Short summary for the verdict box */
  verdict: string;
};

/**
 * Get per-category scores (0–100) and a verdict for the Compatibility Deep-Dive section.
 * Interest alignment = % of overlapping interests (relative to smaller list); budget and style are all-or-nothing.
 */
export function getCompatibilityBreakdown(
  viewer: SupabaseTravelerForMatch,
  profile: SupabaseTravelerForMatch
): CompatibilityBreakdown {
  const ai = viewer.interests ?? [];
  const bi = profile.interests ?? [];
  const setA = new Set(ai.map(normalizeStr));
  let shared = 0;
  for (const x of bi) {
    if (setA.has(normalizeStr(x))) shared++;
  }
  const minLen = Math.min(ai.length, bi.length) || 1;
  const interestAlignment = Math.round((shared / minLen) * 100);

  const budgetSync = sameBudgetLevel(
    viewer.budget_level as string,
    profile.budget_level as string
  )
    ? 100
    : 0;

  const styleMatch = sameTravelStyleMatch(viewer.travel_style, profile.travel_style)
    ? 100
    : 0;

  const parts: string[] = [];
  if (interestAlignment >= 50) {
    const preview = getInterestPreview(viewer, profile);
    if (preview) parts.push(`shared interests like ${preview}`);
    else parts.push("strong interest overlap");
  }
  if (budgetSync === 100)
    parts.push(`similar budget (${formatBudget(profile.budget_level ?? viewer.budget_level)})`);
  if (styleMatch === 100) {
    const style = profile.travel_style ?? viewer.travel_style ?? "travel";
    const display = style.trim().charAt(0).toUpperCase() + style.trim().slice(1).toLowerCase();
    parts.push(`${display} travel style`);
  }
  const verdict =
    parts.length > 0
      ? `You and this traveler could be a great fit: ${parts.join(", ")}. Consider reaching out for a trip together.`
      : "You have different preferences—still worth a chat to see if your travel styles could complement each other.";

  return {
    interestAlignment: Math.min(100, interestAlignment),
    budgetSync,
    styleMatch,
    verdict,
  };
}
