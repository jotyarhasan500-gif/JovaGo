-- Safety & Privacy: profile toggles and block/report tables

-- Profile toggles (saved in profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_approximate_location boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_only_verified_to_message boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.show_approximate_location IS 'If true, user approximate location may be shown on the global safety map.';
COMMENT ON COLUMN public.profiles.allow_only_verified_to_message IS 'If true, only Verified Travelers can send messages to this user.';

-- Blocked users: who has blocked whom
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_users_select_own"
  ON public.blocked_users FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_insert_own"
  ON public.blocked_users FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocked_users_delete_own"
  ON public.blocked_users FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

COMMENT ON TABLE public.blocked_users IS 'Users blocked by the blocker_id; blocked users cannot message and may see limited profile.';

-- User reports (reporter reports reported_id)
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id != reported_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON public.user_reports(reported_id);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reports_insert_own"
  ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "user_reports_select_own"
  ON public.user_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

COMMENT ON TABLE public.user_reports IS 'Reports submitted by users against other users (e.g. profile report).';
