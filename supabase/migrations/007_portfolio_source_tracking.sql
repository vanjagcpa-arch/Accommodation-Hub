-- Portfolio source tracking migration
-- Adds managed_status, per-field source tracking, manual override flag, and sync reference tables.
-- Safe to run on existing data: uses ADD COLUMN IF NOT EXISTS and INSERT ... ON CONFLICT DO NOTHING.

-- ── 1. New columns on properties ─────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS managed_status TEXT NOT NULL DEFAULT 'managed'
    CHECK (managed_status IN ('managed', 'external')),
  ADD COLUMN IF NOT EXISTS owner_source TEXT DEFAULT 'manual'
    CHECK (owner_source IN ('reapit', 'listonce', 'manual', 'external')),
  ADD COLUMN IF NOT EXISTS tenant_source TEXT DEFAULT 'manual'
    CHECK (tenant_source IN ('reapit', 'listonce', 'manual', 'external')),
  ADD COLUMN IF NOT EXISTS pm_source TEXT DEFAULT 'manual'
    CHECK (pm_source IN ('reapit', 'listonce', 'manual', 'external')),
  ADD COLUMN IF NOT EXISTS availability_source TEXT DEFAULT 'manual'
    CHECK (availability_source IN ('reapit', 'listonce', 'manual', 'external')),
  ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark Reapit as the preferred source for properties already linked to Reapit
UPDATE properties
SET
  owner_source        = 'reapit',
  tenant_source       = 'reapit',
  pm_source           = 'reapit',
  availability_source = 'reapit'
WHERE reapit_external_id IS NOT NULL AND reapit_external_id <> '';

-- ── 2. property_source_refs ───────────────────────────────────────────────
-- Maps each internal property to its external system IDs and tracks per-source sync state.
-- One row per (property_id, source) pair; use safe upsert on this unique constraint.

CREATE TABLE IF NOT EXISTS property_source_refs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source          TEXT        NOT NULL CHECK (source IN ('reapit', 'listonce', 'external', 'manual')),
  external_id     TEXT,
  external_code   TEXT,
  external_url    TEXT,
  sync_status     TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (sync_status IN ('synced', 'needs_review', 'pending', 'error', 'not_connected')),
  last_synced_at  TIMESTAMPTZ,
  last_sync_error TEXT,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, source)
);

-- Backfill Reapit refs from existing reapit_external_id
INSERT INTO property_source_refs (property_id, source, external_id, sync_status)
SELECT id, 'reapit', reapit_external_id, 'needs_review'
FROM   properties
WHERE  reapit_external_id IS NOT NULL AND reapit_external_id <> ''
ON CONFLICT (property_id, source) DO NOTHING;

-- Backfill ListOnce refs from existing listonce_external_id
INSERT INTO property_source_refs (property_id, source, external_id, sync_status)
SELECT id, 'listonce', listonce_external_id, 'needs_review'
FROM   properties
WHERE  listonce_external_id IS NOT NULL AND listonce_external_id <> ''
ON CONFLICT (property_id, source) DO NOTHING;

-- ── 3. property_sync_logs ─────────────────────────────────────────────────
-- Append-only audit trail of every sync operation.

CREATE TABLE IF NOT EXISTS property_sync_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID        REFERENCES properties(id) ON DELETE SET NULL,
  source          TEXT        NOT NULL CHECK (source IN ('reapit', 'listonce', 'external', 'manual', 'system')),
  status          TEXT        NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  message         TEXT,
  fields_updated  TEXT[],
  triggered_by    TEXT        NOT NULL DEFAULT 'system',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE property_source_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sync_logs   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_source_refs_company_isolation"
  ON property_source_refs FOR ALL
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      WHERE p.company_id IN (
        SELECT pr.company_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

CREATE POLICY "property_sync_logs_company_isolation"
  ON property_sync_logs FOR ALL
  USING (
    property_id IN (
      SELECT p.id FROM properties p
      WHERE p.company_id IN (
        SELECT pr.company_id FROM profiles pr WHERE pr.id = auth.uid()
      )
    )
  );

-- ── 5. Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_property_source_refs_property_id ON property_source_refs (property_id);
CREATE INDEX IF NOT EXISTS idx_property_source_refs_source       ON property_source_refs (source);
CREATE INDEX IF NOT EXISTS idx_property_sync_logs_property_id   ON property_sync_logs   (property_id);
CREATE INDEX IF NOT EXISTS idx_properties_managed_status        ON properties            (managed_status);

-- ── 6. updated_at trigger for property_source_refs ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_property_source_refs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS property_source_refs_updated_at ON property_source_refs;
CREATE TRIGGER property_source_refs_updated_at
  BEFORE UPDATE ON property_source_refs
  FOR EACH ROW EXECUTE FUNCTION update_property_source_refs_updated_at();
