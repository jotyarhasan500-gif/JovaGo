-- Create safety_reports table
-- Requires: public.profiles table with id uuid PRIMARY KEY (typically referencing auth.users(id))
-- Enable PostGIS in Supabase Dashboard → Database → Extensions → postgis (required for geography type)

CREATE TABLE IF NOT EXISTS public.safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  coordinates geography(point, 4326),
  safety_rating int NOT NULL CHECK (safety_rating >= 1 AND safety_rating <= 10),
  tags text[] DEFAULT '{}',
  comment text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_safety_reports_user_id ON public.safety_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_created_at ON public.safety_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_reports_safety_rating ON public.safety_reports(safety_rating);

-- GIN index for tag array searches
CREATE INDEX IF NOT EXISTS idx_safety_reports_tags ON public.safety_reports USING GIN(tags);

-- Optional: spatial index if using geography (helps nearby queries)
-- CREATE INDEX IF NOT EXISTS idx_safety_reports_coordinates ON public.safety_reports USING GIST(coordinates);

-- Enable Row Level Security (RLS)
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

-- Policy: any authenticated user can read all rows
CREATE POLICY "safety_reports_select_authenticated"
  ON public.safety_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: authenticated users can insert their own row (user_id must match auth.uid())
CREATE POLICY "safety_reports_insert_own"
  ON public.safety_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: only the creator can update their own row
CREATE POLICY "safety_reports_update_own"
  ON public.safety_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: only the creator can delete their own row
CREATE POLICY "safety_reports_delete_own"
  ON public.safety_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Optional: grant usage to authenticated role (if not already)
-- GRANT ALL ON public.safety_reports TO authenticated;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE public.safety_reports IS 'User-submitted safety reports for locations (e.g. JovaGo safety tips).';
COMMENT ON COLUMN public.safety_reports.coordinates IS 'WGS84 point (longitude, latitude). Use ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography when inserting.';
