-- Subscription tier on profiles: free, pro, ultimate. Ultimate is required to create groups.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro', 'ultimate'));

COMMENT ON COLUMN public.profiles.subscription_tier IS 'User subscription: free, pro, or ultimate. Ultimate required to create groups.';
