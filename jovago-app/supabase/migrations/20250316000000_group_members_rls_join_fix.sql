-- Fix join group: upsert uses ON CONFLICT DO UPDATE, so anon role needs UPDATE on group_members.
-- Without this, "Could not join the group. Please try again." can occur.
CREATE POLICY "group_members_update_anon"
  ON public.group_members FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
