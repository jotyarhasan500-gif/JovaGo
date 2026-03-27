/**
 * Order and labels for hero rotating continent text and background sync.
 * Same order used by TypewriterDestinations and HeroBackground.
 * Image mapping is by index: CONTINENTS[i] → HERO_BG_IMAGES[CONTINENTS[i]].
 * If display names are localized, keep this array order and
 * map images by index so the correct image always matches the visible name.
 */

export const CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

/** High-quality Unsplash URLs per continent for hero background. */
export const HERO_BG_IMAGES: Record<(typeof CONTINENTS)[number], string> = {
  Africa:
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1920&q=80",
  Antarctica:
    "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?auto=format&fit=crop&w=1920&q=80",
  Asia:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80",
  Europe:
    "https://images.unsplash.com/photo-1511739001826-68bbe6d14736?auto=format&fit=crop&w=1920&q=80",
  "North America":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=80",
  Oceania:
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1920&q=80",
  "South America":
    "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1920&q=80",
};

/** Fallback background (world map) so the hero never shows a black screen if a continent image fails or is loading. */
export const HERO_BG_FALLBACK =
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1920&q=80";

export const ROTATE_INTERVAL_MS = 2000;

/** Typewriter: delay between revealing each character (ms). */
export const TYPEWRITER_CHAR_DELAY_MS = 85;

/** After typewriter finishes, hold the text visible before advancing (ms). Total time per continent ≈ (chars × TYPEWRITER_CHAR_DELAY_MS) + this. */
export const HOLD_AFTER_TYPEWRITER_MS = 5000;
