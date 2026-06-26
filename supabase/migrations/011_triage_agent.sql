-- ============================================================================
-- 011_triage_agent.sql
-- Maintenance Intake Triage Agent — additive tables and RLS
--
-- ADDITIVE + NON-DESTRUCTIVE. Only CREATEs new objects. Never DROPs or
-- rewrites existing data. Safe to run on top of 001–010 migrations.
-- ============================================================================

-- ── 1. maintenance_intake_threads ────────────────────────────────────────────
-- One conversation thread per (eventual) job. Accumulates slot values as the
-- agent asks questions, then links to maintenance_jobs on finalize.
CREATE TABLE IF NOT EXISTS maintenance_intake_threads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES companies(id),
  occupancy_id  UUID        REFERENCES occupancies(id),
  tenant_id     UUID        REFERENCES tenants(id),
  source        TEXT        NOT NULL DEFAULT 'web',    -- web | qr | sms | whatsapp | email
  category_id   UUID        REFERENCES maintenance_categories(id),
  status        TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','finalized','deflected','emergency','abandoned')),
  slots         JSONB       NOT NULL DEFAULT '{}',     -- accumulated slot values
  confidence    NUMERIC,
  question_count INT        NOT NULL DEFAULT 0,
  job_id        UUID        REFERENCES maintenance_jobs(id),  -- set on finalize
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. maintenance_intake_messages ───────────────────────────────────────────
-- Individual turns in the conversation (tenant utterances + agent questions).
CREATE TABLE IF NOT EXISTS maintenance_intake_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID        NOT NULL REFERENCES maintenance_intake_threads(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('tenant','agent')),
  content    JSONB       NOT NULL,  -- {text} | {input,options,slot} | {image_ref}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. maintenance_kb_articles ───────────────────────────────────────────────
-- Self-help knowledge base for deflecting issues tenants can fix themselves.
-- Seed with ~10 rows; extends without schema changes.
CREATE TABLE IF NOT EXISTS maintenance_kb_articles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id),
  category_id UUID        REFERENCES maintenance_categories(id),
  title       TEXT        NOT NULL,
  symptoms    TEXT[],     -- keyword matching for deflection
  steps       TEXT[]      NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_threads_company     ON maintenance_intake_threads(company_id);
CREATE INDEX IF NOT EXISTS idx_intake_threads_occupancy   ON maintenance_intake_threads(occupancy_id) WHERE occupancy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_intake_threads_status      ON maintenance_intake_threads(company_id, status);
CREATE INDEX IF NOT EXISTS idx_intake_messages_thread     ON maintenance_intake_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_company_cat    ON maintenance_kb_articles(company_id, category_id);

-- ── 5. updated_at auto-stamp for threads ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_intake_thread_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_intake_threads_updated_at ON maintenance_intake_threads;
CREATE TRIGGER trg_intake_threads_updated_at
  BEFORE UPDATE ON maintenance_intake_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_intake_thread_updated_at();

-- ── 6. Enable RLS ────────────────────────────────────────────────────────────
ALTER TABLE maintenance_intake_threads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_intake_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_kb_articles      ENABLE ROW LEVEL SECURITY;

-- ── 7. RLS policies — maintenance_intake_threads ─────────────────────────────
-- Tenants may only see threads where they are the tenant.
-- Staff/PM roles may see all threads in their company.
-- Only the system route (service role) creates threads; tenants cannot insert directly.

DROP POLICY IF EXISTS "intake_threads_select"  ON maintenance_intake_threads;
DROP POLICY IF EXISTS "intake_threads_insert"  ON maintenance_intake_threads;
DROP POLICY IF EXISTS "intake_threads_update"  ON maintenance_intake_threads;
DROP POLICY IF EXISTS "intake_threads_delete"  ON maintenance_intake_threads;

-- Staff/PM: all threads in their company
CREATE POLICY "intake_threads_select" ON maintenance_intake_threads
  FOR SELECT TO authenticated
  USING (
    company_id = public.auth_company_id()
    AND (
      public.auth_role() IN ('super_admin','admin','internal_manager','maintenance_staff')
      OR tenant_id = auth.uid()
    )
  );

-- Only backend service role inserts; authenticated users cannot insert via client
CREATE POLICY "intake_threads_insert" ON maintenance_intake_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager','maintenance_staff')
  );

CREATE POLICY "intake_threads_update" ON maintenance_intake_threads
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager','maintenance_staff')
  );

CREATE POLICY "intake_threads_delete" ON maintenance_intake_threads
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin')
  );

-- ── 8. RLS policies — maintenance_intake_messages ────────────────────────────
-- Messages inherit thread-level access: readable if you can see the thread.

DROP POLICY IF EXISTS "intake_messages_select"  ON maintenance_intake_messages;
DROP POLICY IF EXISTS "intake_messages_insert"  ON maintenance_intake_messages;
DROP POLICY IF EXISTS "intake_messages_delete"  ON maintenance_intake_messages;

CREATE POLICY "intake_messages_select" ON maintenance_intake_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_intake_threads t
      WHERE t.id = thread_id
        AND t.company_id = public.auth_company_id()
        AND (
          public.auth_role() IN ('super_admin','admin','internal_manager','maintenance_staff')
          OR t.tenant_id = auth.uid()
        )
    )
  );

CREATE POLICY "intake_messages_insert" ON maintenance_intake_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_intake_threads t
      WHERE t.id = thread_id
        AND t.company_id = public.auth_company_id()
        AND public.auth_role() IN ('super_admin','admin','internal_manager','maintenance_staff')
    )
  );

CREATE POLICY "intake_messages_delete" ON maintenance_intake_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_intake_threads t
      WHERE t.id = thread_id
        AND t.company_id = public.auth_company_id()
        AND public.auth_role() IN ('super_admin','admin')
    )
  );

-- ── 9. RLS policies — maintenance_kb_articles ────────────────────────────────
-- Anyone in the company can read KB articles (staff + tenants via the triage route).
-- Only managers/admins may write them.

DROP POLICY IF EXISTS "kb_articles_select"  ON maintenance_kb_articles;
DROP POLICY IF EXISTS "kb_articles_insert"  ON maintenance_kb_articles;
DROP POLICY IF EXISTS "kb_articles_update"  ON maintenance_kb_articles;
DROP POLICY IF EXISTS "kb_articles_delete"  ON maintenance_kb_articles;

CREATE POLICY "kb_articles_select" ON maintenance_kb_articles
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "kb_articles_insert" ON maintenance_kb_articles
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager')
  );

CREATE POLICY "kb_articles_update" ON maintenance_kb_articles
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager')
  );

CREATE POLICY "kb_articles_delete" ON maintenance_kb_articles
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin')
  );
