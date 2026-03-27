-- Add destination and country fields for group cards and map display.
-- All country names stored and displayed in English (e.g. Iraq, Turkey, Norway).
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS destination_lat double precision,
  ADD COLUMN IF NOT EXISTS destination_lng double precision,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS country_code text;

COMMENT ON COLUMN public.groups.destination_lat IS 'Destination latitude for map display.';
COMMENT ON COLUMN public.groups.destination_lng IS 'Destination longitude for map display.';
COMMENT ON COLUMN public.groups.country_name IS 'Country name in English (e.g. Iraq, Turkey, Norway).';
COMMENT ON COLUMN public.groups.country_code IS 'ISO 3166-1 alpha-2 country code (e.g. IQ, TR, NO).';
