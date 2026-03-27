-- Allow anon role to insert into groups when using Clerk (no Supabase Auth).
-- The app server verifies the user via Clerk and sets user_id before calling insert.
CREATE POLICY "groups_insert_anon"
  ON public.groups FOR INSERT
  TO anon
  WITH CHECK (true);
