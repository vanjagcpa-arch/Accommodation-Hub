-- ============================================================================
-- 005_maintenance_services_and_invoicing.sql
-- Services pricing catalog, owner invoicing, and smart scheduling support
--
-- ADDITIVE + NON-DESTRUCTIVE. Only CREATEs new tables and ALTERs with
-- ADD COLUMN / ADD VALUE. Never DROPs or rewrites existing data.
-- Run after 004_owners.sql.
-- ============================================================================

-- ── 1. Extend maintenance_staff_profiles with scheduling fields ─────────────────
ALTER TABLE maintenance_staff_profiles
  ADD COLUMN IF NOT EXISTS home_base_building_id UUID REFERENCES buildings(id),
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS callout_fee NUMERIC(10,2);

-- ── 2. Travel time matrix ───────────────────────────────────────────────────────
-- Stores travel minutes between building pairs for the intelligent scheduler.
-- When a pair is absent the UI defaults to 30 minutes.
CREATE TABLE IF NOT EXISTS maintenance_building_travel_times (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID NOT NULL REFERENCES companies(id),
  from_building_id UUID NOT NULL REFERENCES buildings(id),
  to_building_id   UUID NOT NULL REFERENCES buildings(id),
  travel_minutes   INTEGER NOT NULL DEFAULT 30 CHECK (travel_minutes >= 0),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, from_building_id, to_building_id),
  CHECK (from_building_id <> to_building_id)
);

-- ── 3. Services / pricing catalog ───────────────────────────────────────────────────
-- Company-specific service line items (test & tag, gas check, etc.).
-- unit determines how each item is priced when added to an invoice.
CREATE TABLE IF NOT EXISTS maintenance_services (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id),
  category_id UUID REFERENCES maintenance_categories(id),
  name        TEXT NOT NULL,
  description TEXT,
  unit        TEXT NOT NULL DEFAULT 'flat_rate'
              CHECK (unit IN ('per_item','per_hour','flat_rate','per_visit','per_test','per_point')),
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID REFERENCES profiles(id)
);

-- ── 4. Invoice number sequence ──────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS maintenance_invoice_seq START 1;

-- ── 5. Owner invoices ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id),
  invoice_number  TEXT NOT NULL UNIQUE,
  property_id     UUID REFERENCES properties(id),
  owner_id        UUID REFERENCES owners(id),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','sent','paid','overdue','void')),
  issued_date     DATE,
  due_date        DATE,
  paid_date       DATE,
  subtotal        NUMERIC(10,2) DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 10,
  notes           TEXT,
  myob_external_id    TEXT,
  myob_sync_status    TEXT NOT NULL DEFAULT 'not_synced'
                      CHECK (myob_sync_status IN ('not_synced','pending','synced','failed')),
  myob_sync_error     TEXT,
  myob_synced_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_by      UUID REFERENCES profiles(id)
);

-- Auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION maintenance_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'RM-INV-' || LPAD(nextval('maintenance_invoice_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_invoice_number
  BEFORE INSERT ON maintenance_invoices
  FOR EACH ROW EXECUTE FUNCTION maintenance_invoice_number();

-- ── 6. Invoice line items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES maintenance_invoices(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES maintenance_jobs(id),
  service_id  UUID REFERENCES maintenance_services(id),
  description TEXT NOT NULL,
  quantity    NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Recalculate invoice subtotal whenever items change
CREATE OR REPLACE FUNCTION sync_invoice_subtotal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE maintenance_invoices
  SET subtotal = COALESCE((
    SELECT SUM(quantity * unit_price)
    FROM maintenance_invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  ), 0),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_invoice_subtotal_insert
  AFTER INSERT OR UPDATE ON maintenance_invoice_items
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_subtotal();

CREATE TRIGGER trg_invoice_subtotal_delete
  AFTER DELETE ON maintenance_invoice_items
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_subtotal();

-- ── 7. RLS ────────────────────────────────────────────────────────────────────────────
ALTER TABLE maintenance_building_travel_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_services              ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_invoice_items         ENABLE ROW LEVEL SECURITY;

-- Helper: authenticated user's company
CREATE OR REPLACE FUNCTION auth_company_id() RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- travel times
CREATE POLICY maint_travel_select ON maintenance_building_travel_times FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY maint_travel_insert ON maintenance_building_travel_times FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY maint_travel_update ON maintenance_building_travel_times FOR UPDATE USING (company_id = auth_company_id());

-- services
CREATE POLICY maint_svc_select ON maintenance_services FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY maint_svc_insert ON maintenance_services FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY maint_svc_update ON maintenance_services FOR UPDATE USING (company_id = auth_company_id());

-- invoices
CREATE POLICY maint_inv_select ON maintenance_invoices FOR SELECT USING (company_id = auth_company_id());
CREATE POLICY maint_inv_insert ON maintenance_invoices FOR INSERT WITH CHECK (company_id = auth_company_id());
CREATE POLICY maint_inv_update ON maintenance_invoices FOR UPDATE USING (company_id = auth_company_id());

-- invoice items (via parent invoice's company check)
CREATE POLICY maint_item_select ON maintenance_invoice_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM maintenance_invoices i WHERE i.id = invoice_id AND i.company_id = auth_company_id()));
CREATE POLICY maint_item_insert ON maintenance_invoice_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM maintenance_invoices i WHERE i.id = invoice_id AND i.company_id = auth_company_id()));
CREATE POLICY maint_item_update ON maintenance_invoice_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM maintenance_invoices i WHERE i.id = invoice_id AND i.company_id = auth_company_id()));
CREATE POLICY maint_item_delete ON maintenance_invoice_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM maintenance_invoices i WHERE i.id = invoice_id AND i.company_id = auth_company_id()));

-- ── 8. Performance indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_maint_services_company      ON maintenance_services(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_services_category     ON maintenance_services(category_id);
CREATE INDEX IF NOT EXISTS idx_maint_invoices_company      ON maintenance_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_invoices_status       ON maintenance_invoices(status);
CREATE INDEX IF NOT EXISTS idx_maint_invoices_owner        ON maintenance_invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_maint_invoice_items_invoice ON maintenance_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_maint_travel_company        ON maintenance_building_travel_times(company_id);
