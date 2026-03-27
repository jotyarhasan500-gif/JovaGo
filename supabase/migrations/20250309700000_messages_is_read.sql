-- Add is_read to messages for notification badge (unread = receiver_id = me AND is_read = false).
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.messages.is_read IS 'When false and receiver_id = current user, show as unread in navbar inbox.';
