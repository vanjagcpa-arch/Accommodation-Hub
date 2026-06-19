-- ============================================================================
-- 002_maintenance_module.sql
-- Repairs & Maintenance operations module (Phase 1)
--
-- ADDITIVE + NON-DESTRUCTIVE. This migration only CREATEs new objects and
-- ALTER ... ADD COLUMN / ADD VALUE. It never DROPs or rewrites existing data.
-- Safe to run on top of 001_initial_schema.sql.
-- ============================================================================

-- ── 1. Extend the maintenance_status enum ───────────────────────────────
-- New operational "waiting" states + duplicate. IF NOT EXISTS keeps this
-- idempotent. (Postgres commits these before they can be used by data rows;
-- no row in this migration references the new values.)
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'waiting_tenant';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'waiting_access';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'waiting_quote';
ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'duplicate';

-- ── 2. Settings / lookup tables ───────────────────────────────────

-- Maintenance categories (Plumbing, Electrical, HVAC, ...)
CREATE TABLE IF NOT EXISTS maintenance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  default_priority maintenance_priority DEFAULT 'medium',
  default_sla_hours INTEGER DEFAULT 72,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(company_id, slug)
);

-- Priority configuration (labels, colours, SLA targets) keyed to the enum
CREATE TABLE IF NOT EXISTS maintenance_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  key maintenance_priority NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  sla_hours INTEGER DEFAULT 72,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, key)
);

-- Maintenance staff / contractors. profile_id links a staff member to an app
-- login (for the future "My Jobs" view) but is optional so external trades can
-- be assigned without an account.
CREATE TABLE IF NOT EXISTS maintenance_staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  profile_id UUID REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  trade TEXT,
  skills TEXT[],
  is_internal BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3b82f6',
  max_jobs_per_day INTEGER DEFAULT 6,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Reusable checklist templates (by category) + their items
CREATE TABLE IF NOT EXISTS maintenance_checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  category_id UUID REFERENCES maintenance_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS maintenance_checklist_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES maintenance_checklist_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  requires_photo BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- ── 3. Extend maintenance_jobs with operational columns ───────────────────
ALTER TABLE maintenance_jobs
  ADD COLUMN IF NOT EXISTS job_number TEXT,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES maintenance_categories(id),
  ADD COLUMN IF NOT EXISTS occupancy_id UUID REFERENCES occupancies(id),
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES maintenance_staff_profiles(id),
  ADD COLUMN IF NOT EXISTS assigned_manager_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS external_agent_id UUID REFERENCES agents(id),
  ADD COLUMN IF NOT EXISTS reported_by_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reported_by_name TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manager',
  ADD COLUMN IF NOT EXISTS preferred_access_window TEXT,
  ADD COLUMN IF NOT EXISTS tenant_contact_visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_notes TEXT,
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS invoice_reference TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  -- existing 001 seed.sql references is_active on this table; add it so that
  -- seed remains valid and jobs can be soft-archived.
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_jobs_job_number
  ON maintenance_jobs(job_number) WHERE job_number IS NOT NULL;

-- ── 4. Extend recurring_maintenance_rules ─────────────────────────────
ALTER TABLE recurring_maintenance_rules
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES maintenance_categories(id),
  ADD COLUMN IF NOT EXISTS checklist_template_id UUID REFERENCES maintenance_checklist_templates(id),
  ADD COLUMN IF NOT EXISTS default_staff_id UUID REFERENCES maintenance_staff_profiles(id),
  ADD COLUMN IF NOT EXISTS custom_interval_days INTEGER,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;

-- ── 5. Per-job child tables ──────────────────────────────────────

-- Status change timeline
CREATE TABLE IF NOT EXISTS maintenance_job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  from_status maintenance_status,
  to_status maintenance_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment history (who was put on the job, when)
CREATE TABLE IF NOT EXISTS maintenance_job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES maintenance_staff_profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  scheduled_date TIMESTAMPTZ,
  unassigned_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist items copied onto a job (optionally from a template)
CREATE TABLE IF NOT EXISTS maintenance_job_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  requires_photo BOOLEAN DEFAULT false,
  done_by UUID REFERENCES profiles(id),
  done_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials / parts used
CREATE TABLE IF NOT EXISTS maintenance_job_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost line items (labour, callout, parts subtotal, etc.)
CREATE TABLE IF NOT EXISTS maintenance_job_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL DEFAULT 'labour',
  description TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_billable BOOLEAN DEFAULT true,
  invoice_reference TEXT,
  incurred_on DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generic attachments (quotes, invoices, documents). Photos use the dedicated
-- maintenance_job_photos table from 001.
CREATE TABLE IF NOT EXISTS maintenance_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  file_size INTEGER,
  attachment_type TEXT DEFAULT 'document',
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS maintenance_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  recipient_id UUID REFERENCES profiles(id),
  job_id UUID REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Occurrences generated from recurring rules (foundation for Phase 3)
CREATE TABLE IF NOT EXISTS recurring_maintenance_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES recurring_maintenance_rules(id) ON DELETE CASCADE,
  job_id UUID REFERENCES maintenance_jobs(id),
  due_date DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'generated'
);

-- ── 6. Job number generation ────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS maintenance_job_number_seq START 1001;

CREATE OR REPLACE FUNCTION set_maintenance_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL THEN
    NEW.job_number := 'MJ-' || LPAD(nextval('maintenance_job_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_jobs_set_number ON maintenance_jobs;
CREATE TRIGGER maintenance_jobs_set_number
  BEFORE INSERT ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION set_maintenance_job_number();

-- ── 7. Auto status-history + completion timestamps ──────────────────────
CREATE OR REPLACE FUNCTION log_maintenance_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO maintenance_job_status_history (job_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO maintenance_job_status_history (job_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by);

    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := NOW();
    END IF;
    IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
      NEW.closed_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_jobs_status_history_ins ON maintenance_jobs;
CREATE TRIGGER maintenance_jobs_status_history_ins
  AFTER INSERT ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION log_maintenance_status_change();

DROP TRIGGER IF EXISTS maintenance_jobs_status_history_upd ON maintenance_jobs;
CREATE TRIGGER maintenance_jobs_status_history_upd
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION log_maintenance_status_change();

-- ── 8. updated_at triggers for new tables ────────────────────────────
CREATE TRIGGER maintenance_categories_updated_at BEFORE UPDATE ON maintenance_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER maintenance_staff_profiles_updated_at BEFORE UPDATE ON maintenance_staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER maintenance_checklist_templates_updated_at BEFORE UPDATE ON maintenance_checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 9. Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_category ON maintenance_jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_staff ON maintenance_jobs(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_due ON maintenance_jobs(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_priority ON maintenance_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_mj_status_history_job ON maintenance_job_status_history(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_assignments_job ON maintenance_job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_assignments_staff ON maintenance_job_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_mj_checklist_job ON maintenance_job_checklist_items(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_materials_job ON maintenance_job_materials(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_costs_job ON maintenance_job_costs(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_attachments_job ON maintenance_attachments(job_id);
CREATE INDEX IF NOT EXISTS idx_mj_notifications_recipient ON maintenance_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_mj_categories_company ON maintenance_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_mj_staff_company ON maintenance_staff_profiles(company_id);

-- ── 10. Permission helper functions (SECURITY DEFINER to avoid RLS recursion) ─
CREATE OR REPLACE FUNCTION maintenance_current_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION maintenance_current_company()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- True if the current user is an admin-level role
CREATE OR REPLACE FUNCTION maintenance_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT maintenance_current_role() IN ('super_admin', 'admin', 'internal_manager');
$$;

-- ── 11. Row Level Security ──────────────────────────────────────
ALTER TABLE maintenance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_checklist_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_maintenance_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_job_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_maintenance_rules ENABLE ROW LEVEL SECURITY;

-- Helper: a job is visible to the current user
-- Admin/internal managers -> whole company. Maintenance staff -> jobs assigned
-- to them. Everyone else in the company -> jobs they created/manage.
CREATE OR REPLACE FUNCTION maintenance_can_see_job(j maintenance_jobs)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    j.company_id = maintenance_current_company()
    AND (
      maintenance_is_admin()
      OR j.created_by = auth.uid()
      OR j.assigned_to = auth.uid()
      OR j.assigned_manager_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM maintenance_staff_profiles s
        WHERE s.id = j.assigned_staff_id AND s.profile_id = auth.uid()
      )
    );
$$;

-- maintenance_jobs (001 enabled RLS but added no policy -> currently locked).
DROP POLICY IF EXISTS "jobs_select" ON maintenance_jobs;
CREATE POLICY "jobs_select" ON maintenance_jobs FOR SELECT TO authenticated
  USING (maintenance_can_see_job(maintenance_jobs));

DROP POLICY IF EXISTS "jobs_insert" ON maintenance_jobs;
CREATE POLICY "jobs_insert" ON maintenance_jobs FOR INSERT TO authenticated
  WITH CHECK (
    company_id = maintenance_current_company()
    AND maintenance_current_role() <> 'read_only'
  );

DROP POLICY IF EXISTS "jobs_update" ON maintenance_jobs;
CREATE POLICY "jobs_update" ON maintenance_jobs FOR UPDATE TO authenticated
  USING (maintenance_can_see_job(maintenance_jobs))
  WITH CHECK (company_id = maintenance_current_company());

-- Company-scoped read for settings/lookup tables; admins manage.
CREATE POLICY "cats_select" ON maintenance_categories FOR SELECT TO authenticated USING (company_id = maintenance_current_company());
CREATE POLICY "cats_write"  ON maintenance_categories FOR ALL TO authenticated USING (company_id = maintenance_current_company() AND maintenance_is_admin()) WITH CHECK (company_id = maintenance_current_company());
CREATE POLICY "prio_select" ON maintenance_priorities FOR SELECT TO authenticated USING (company_id = maintenance_current_company());
CREATE POLICY "staff_select" ON maintenance_staff_profiles FOR SELECT TO authenticated USING (company_id = maintenance_current_company());
CREATE POLICY "staff_write"  ON maintenance_staff_profiles FOR ALL TO authenticated USING (company_id = maintenance_current_company() AND maintenance_is_admin()) WITH CHECK (company_id = maintenance_current_company());
CREATE POLICY "tmpl_select" ON maintenance_checklist_templates FOR SELECT TO authenticated USING (company_id = maintenance_current_company());
CREATE POLICY "tmpl_item_select" ON maintenance_checklist_template_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM maintenance_checklist_templates t WHERE t.id = template_id AND t.company_id = maintenance_current_company())
);

-- Child tables inherit visibility from the parent job.
CREATE POLICY "history_rw"  ON maintenance_job_status_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "assign_rw"   ON maintenance_job_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "checklist_rw" ON maintenance_job_checklist_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "materials_rw" ON maintenance_job_materials FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "costs_rw"     ON maintenance_job_costs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "attach_rw"    ON maintenance_attachments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j)));
CREATE POLICY "occ_rw"       ON recurring_maintenance_occurrences FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM recurring_maintenance_rules r WHERE r.id = rule_id AND r.company_id = maintenance_current_company()));
CREATE POLICY "rules_rw"     ON recurring_maintenance_rules FOR ALL TO authenticated USING (company_id = maintenance_current_company()) WITH CHECK (company_id = maintenance_current_company());

-- Comments: internal comments hidden from referral agents.
CREATE POLICY "comments_select" ON maintenance_job_comments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j))
  AND (is_internal = false OR maintenance_current_role() <> 'referral_agent')
);
CREATE POLICY "comments_insert" ON maintenance_job_comments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j))
);
CREATE POLICY "photos_rw" ON maintenance_job_photos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM maintenance_jobs j WHERE j.id = job_id AND maintenance_can_see_job(j))
);

-- Notifications: only the recipient (or admins) can read.
CREATE POLICY "notif_select" ON maintenance_notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR maintenance_is_admin());
CREATE POLICY "notif_update" ON maintenance_notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid());

-- ── 12. Private storage bucket for maintenance photos/attachments ───────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('maintenance-photos', 'maintenance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users may read/write within the maintenance-photos bucket.
-- (Object paths should be namespaced by job id; finer rules can be added later.)
DROP POLICY IF EXISTS "maint_photos_read" ON storage.objects;
CREATE POLICY "maint_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-photos');
DROP POLICY IF EXISTS "maint_photos_write" ON storage.objects;
CREATE POLICY "maint_photos_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos');
