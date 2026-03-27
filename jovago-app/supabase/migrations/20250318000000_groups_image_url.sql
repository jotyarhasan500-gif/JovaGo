-- Group avatar/image for group chat header and sidebar.
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.groups.image_url IS 'Optional group image URL (e.g. from Supabase Storage group-attachments/{id}/avatar).';
