-- 008: Company-scoped RLS — helper functions, write policies, owners RLS
-- Run in Supabase SQL editor after migrations 001–007.
-- All DROP POLICY IF EXISTS guards make this safe to re-run.

-- ── Helpers (SECURITY DEFINER so they bypass the RLS they support) ───────────

CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles visible to authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR company_id = public.auth_company_id());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── BUILDINGS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Buildings visible to authenticated" ON buildings;
DROP POLICY IF EXISTS "buildings_select" ON buildings;
DROP POLICY IF EXISTS "buildings_insert" ON buildings;
DROP POLICY IF EXISTS "buildings_update" ON buildings;
DROP POLICY IF EXISTS "buildings_delete" ON buildings;

CREATE POLICY "buildings_select" ON buildings
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "buildings_insert" ON buildings
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "buildings_update" ON buildings
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "buildings_delete" ON buildings
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── PROPERTIES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Properties visible to authenticated" ON properties;
DROP POLICY IF EXISTS "properties_select" ON properties;
DROP POLICY IF EXISTS "properties_insert" ON properties;
DROP POLICY IF EXISTS "properties_update" ON properties;
DROP POLICY IF EXISTS "properties_delete" ON properties;

CREATE POLICY "properties_select" ON properties
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "properties_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "properties_update" ON properties
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "properties_delete" ON properties
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── OWNERS ────────────────────────────────────────────────────────────────────
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_select" ON owners;
DROP POLICY IF EXISTS "owners_insert" ON owners;
DROP POLICY IF EXISTS "owners_update" ON owners;
DROP POLICY IF EXISTS "owners_delete" ON owners;

CREATE POLICY "owners_select" ON owners
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "owners_insert" ON owners
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "owners_update" ON owners
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "owners_delete" ON owners
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── TENANTS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenants_select" ON tenants;
DROP POLICY IF EXISTS "tenants_insert" ON tenants;
DROP POLICY IF EXISTS "tenants_update" ON tenants;
DROP POLICY IF EXISTS "tenants_delete" ON tenants;

CREATE POLICY "tenants_select" ON tenants
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "tenants_insert" ON tenants
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "tenants_delete" ON tenants
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── OCCUPANCIES ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "occupancies_select" ON occupancies;
DROP POLICY IF EXISTS "occupancies_insert" ON occupancies;
DROP POLICY IF EXISTS "occupancies_update" ON occupancies;
DROP POLICY IF EXISTS "occupancies_delete" ON occupancies;

CREATE POLICY "occupancies_select" ON occupancies
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "occupancies_insert" ON occupancies
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "occupancies_update" ON occupancies
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "occupancies_delete" ON occupancies
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── APPLICATIONS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "applications_select" ON applications;
DROP POLICY IF EXISTS "applications_insert" ON applications;
DROP POLICY IF EXISTS "applications_update" ON applications;
DROP POLICY IF EXISTS "applications_delete" ON applications;

CREATE POLICY "applications_select" ON applications
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "applications_insert" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "applications_update" ON applications
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "applications_delete" ON applications
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── MAINTENANCE JOBS ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "maintenance_jobs_select" ON maintenance_jobs;
DROP POLICY IF EXISTS "maintenance_jobs_insert" ON maintenance_jobs;
DROP POLICY IF EXISTS "maintenance_jobs_update" ON maintenance_jobs;
DROP POLICY IF EXISTS "maintenance_jobs_delete" ON maintenance_jobs;

CREATE POLICY "maintenance_jobs_select" ON maintenance_jobs
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "maintenance_jobs_insert" ON maintenance_jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager', 'maintenance_staff')
  );

CREATE POLICY "maintenance_jobs_update" ON maintenance_jobs
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager', 'maintenance_staff')
  );

CREATE POLICY "maintenance_jobs_delete" ON maintenance_jobs
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── ELECTRICITY ACCOUNTS ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "electricity_accounts_select" ON electricity_accounts;
DROP POLICY IF EXISTS "electricity_accounts_insert" ON electricity_accounts;
DROP POLICY IF EXISTS "electricity_accounts_update" ON electricity_accounts;
DROP POLICY IF EXISTS "electricity_accounts_delete" ON electricity_accounts;

CREATE POLICY "electricity_accounts_select" ON electricity_accounts
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "electricity_accounts_insert" ON electricity_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "electricity_accounts_update" ON electricity_accounts
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin', 'internal_manager')
  );

CREATE POLICY "electricity_accounts_delete" ON electricity_accounts
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin', 'admin')
  );

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
-- Immutable append log: all staff can insert, none can update, only super_admin can delete.
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON audit_logs;

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.auth_company_id());

CREATE POLICY "audit_logs_delete" ON audit_logs
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() = 'super_admin'
  );
