-- Map visibility: store last known coordinates when user opts in to "Show me on the Map".
-- show_approximate_location (existing) = visible on map (online); when false = hidden (offline).
-- last_lat/last_lng updated when user turns visibility ON and we have geolocation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_lat double precision,
  ADD COLUMN IF NOT EXISTS last_lng double precision;

COMMENT ON COLUMN public.profiles.last_lat IS 'Last known latitude when user is visible on the map (privacy-offset can be applied when displaying).';
COMMENT ON COLUMN public.profiles.last_lng IS 'Last known longitude when user is visible on the map.';
