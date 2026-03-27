-- Trust score and verified traveler on profiles
-- trust_score and verified_traveler are derived from milestones; linked_social_media is user-set

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linked_social_media boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trust_score smallint NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS verified_traveler boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.linked_social_media IS 'User has linked a social account (e.g. Google, Instagram).';
COMMENT ON COLUMN public.profiles.trust_score IS 'Computed 0-100 from trust milestones; used for public display.';
COMMENT ON COLUMN public.profiles.verified_traveler IS 'True when trust_score >= 70; shows blue Verified Traveler badge.';
