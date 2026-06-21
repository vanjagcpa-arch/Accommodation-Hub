-- 006: Auto-create profiles for auth users and backfill company_id
-- Run in Supabase SQL editor. This fixes the "not signed in to workspace" error
-- that occurs when a user exists in auth.users but has no profile / no company_id.

-- ── 1. Trigger function: auto-create a profile on new auth user sign-up ─────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Single-tenant MVP: auto-assign the first company alphabetically.
  SELECT id INTO v_company_id FROM public.companies ORDER BY created_at LIMIT 1;

  INSERT INTO public.profiles (id, email, company_id, role, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    v_company_id,
    'internal_manager',
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      company_id = COALESCE(profiles.company_id, EXCLUDED.company_id),
      full_name  = COALESCE(profiles.full_name,  EXCLUDED.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. Backfill: give company_id to existing profiles that have none ──────────
UPDATE public.profiles
SET company_id = (SELECT id FROM public.companies ORDER BY created_at LIMIT 1)
WHERE company_id IS NULL;

-- ── 3. Backfill: create profiles for auth users that have no profile row ──────
INSERT INTO public.profiles (id, email, company_id, role, full_name, is_active)
SELECT
  au.id,
  au.email,
  (SELECT id FROM public.companies ORDER BY created_at LIMIT 1),
  'internal_manager',
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  true
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
