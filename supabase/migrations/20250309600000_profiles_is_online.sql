-- is_online: true when user is currently visible on the map (Show me on the Map is ON).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_online IS 'True when user has "Show me on the Map" ON and has shared location; used to list online travelers on the map.';
