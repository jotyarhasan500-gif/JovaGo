-- Stripe: premium flag and customer id for Checkout / webhooks
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

COMMENT ON COLUMN public.profiles.is_premium IS 'True after successful Stripe Checkout (webhook).';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer ID for returning Checkout sessions.';
