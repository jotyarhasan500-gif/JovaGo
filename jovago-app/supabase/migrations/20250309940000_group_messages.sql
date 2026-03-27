-- Group chat messages. user_id is Clerk user id; user_name and user_image from Clerk at send time.
CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  user_name text,
  user_image text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS group_messages_group_id_created_at_idx
  ON public.group_messages(group_id, created_at);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_messages_select_anon"
  ON public.group_messages FOR SELECT TO anon USING (true);
CREATE POLICY "group_messages_insert_anon"
  ON public.group_messages FOR INSERT TO anon WITH CHECK (true);

COMMENT ON TABLE public.group_messages IS 'Group chat messages. user_id is Clerk user id.';
