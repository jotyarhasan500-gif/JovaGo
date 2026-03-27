-- Budget and languages on profiles for match scoring

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS budget_level text CHECK (budget_level IS NULL OR budget_level IN ('budget', 'mid', 'luxury', 'any')),
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.budget_level IS 'Travel budget preference for compatibility: budget, mid, luxury, any.';
COMMENT ON COLUMN public.profiles.languages IS 'Languages the user speaks (e.g. English, Spanish) for match scoring.';
