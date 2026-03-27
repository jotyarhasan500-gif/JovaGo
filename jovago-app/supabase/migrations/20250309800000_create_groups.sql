-- Groups table: id, name, description, user_id (Clerk user id of creator)
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS groups_updated_at ON public.groups;
CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_select_authenticated"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "groups_insert_authenticated"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "groups_update_authenticated"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "groups_delete_authenticated"
  ON public.groups FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.groups IS 'Travel groups created by users. user_id is the creator Clerk user id.';
