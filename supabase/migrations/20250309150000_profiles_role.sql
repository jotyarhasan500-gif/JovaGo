-- Role on profiles: 'user' or 'admin'. Admin bypasses subscription checks and can access Owner Panel.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'User role: user or admin. Admin has full access and bypasses pricing checks.';
