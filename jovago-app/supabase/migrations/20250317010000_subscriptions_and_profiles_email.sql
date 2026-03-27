-- Subscriptions table for revenue analytics (amount per subscription, grouped by month).
-- Optional email on profiles for Owner Panel display (can be synced from Clerk/auth).
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  plan text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_created_at_idx ON public.subscriptions(created_at);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_authenticated"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subscriptions_insert_authenticated"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "subscriptions_update_authenticated"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.subscriptions IS 'Subscription payments for revenue analytics. Sum amount by month for charts.';

-- Optional email on profiles (e.g. synced from Clerk); Owner Panel can display it.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS 'User email; can be synced from auth provider for Owner Panel display.';
