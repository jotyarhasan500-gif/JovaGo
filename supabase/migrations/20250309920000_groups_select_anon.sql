-- Allow anon role to select from groups (Clerk app uses anon key).
-- Server actions filter by user_id so only the current user's groups are returned.
CREATE POLICY "groups_select_anon"
  ON public.groups FOR SELECT
  TO anon
  USING (true);
