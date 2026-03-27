-- Connection requests: when a user clicks a template in Quick Connect, we store the request.
-- to_user_id references profiles (Supabase users). For mock discovery travelers without a profile, we could add to_user_external_id later.

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_template_type text NOT NULL CHECK (message_template_type IN ('destination', 'interest', 'coffee')),
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_from ON public.connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to ON public.connection_requests(to_user_id);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connection_requests_insert_own"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "connection_requests_select_own_sent"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id);

CREATE POLICY "connection_requests_select_own_received"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = to_user_id);

COMMENT ON TABLE public.connection_requests IS 'Quick Connect message requests sent from one user to another.';
