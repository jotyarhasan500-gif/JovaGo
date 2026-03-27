-- Add trip-specific fields to groups table.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS trip_date timestamptz,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS meeting_point text;

COMMENT ON COLUMN public.groups.max_members IS 'Maximum number of members (default 10).';
COMMENT ON COLUMN public.groups.category IS 'Trip category: Mountains, Forests, Deserts, City, Camping, Hiking.';
COMMENT ON COLUMN public.groups.trip_date IS 'Planned departure/trip date.';
COMMENT ON COLUMN public.groups.difficulty IS 'Difficulty level: Easy, Moderate, Challenging.';
COMMENT ON COLUMN public.groups.meeting_point IS 'Where the group will meet.';
