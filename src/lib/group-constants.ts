/**
 * Shared values for Create Group form and Explore filters.
 * Matches DB schema: category, difficulty_level.
 */

export const GROUP_CATEGORIES = [
  "Mountains",
  "Forest",
  "Desert",
  "City",
  "Camping",
] as const;

export type GroupCategory = (typeof GROUP_CATEGORIES)[number];

export const GROUP_DIFFICULTIES = ["Easy", "Moderate", "Hard"] as const;

export type GroupDifficulty = (typeof GROUP_DIFFICULTIES)[number];
