-- Last seen timestamp (UTC) for activity tracking and display in user's local time if needed.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen timestamptz;

COMMENT ON COLUMN public.profiles.last_seen IS 'Last time the user was seen (UTC). Application can display in user local time.';
