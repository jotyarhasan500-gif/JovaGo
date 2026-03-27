-- Add invite_code to groups for "Join Group" by code.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- group_members: links users to groups (owner or member).
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members(user_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select_anon"
  ON public.group_members FOR SELECT TO anon USING (true);
CREATE POLICY "group_members_insert_anon"
  ON public.group_members FOR INSERT TO anon WITH CHECK (true);

COMMENT ON TABLE public.group_members IS 'Group membership: user_id is Clerk user id; role is owner or member.';
