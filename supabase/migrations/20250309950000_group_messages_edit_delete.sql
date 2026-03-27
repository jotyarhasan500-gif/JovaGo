-- Add edit/delete support to group_messages.
ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS is_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Backfill updated_at for existing rows.
UPDATE public.group_messages SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE public.group_messages ALTER COLUMN updated_at SET DEFAULT now();

-- Allow anon to update/delete (app verifies sender via server action or client user_id).
CREATE POLICY "group_messages_update_anon"
  ON public.group_messages FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "group_messages_delete_anon"
  ON public.group_messages FOR DELETE TO anon USING (true);

COMMENT ON COLUMN public.group_messages.is_edited IS 'True when content was edited after creation.';
COMMENT ON COLUMN public.group_messages.is_deleted IS 'Soft delete: when true, show "This message was deleted".';
