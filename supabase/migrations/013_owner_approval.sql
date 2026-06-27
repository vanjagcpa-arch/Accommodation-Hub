-- ════════════════════════════════════════════════════════════════════════════
-- 013_owner_approval.sql
--
-- Owner approval flow for maintenance jobs. Staff send a job to the property's
-- owner for approval; the owner gets an email with a one-click link to a public
-- /approve/<token> page and approves or declines. All ADDITIVE.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE maintenance_jobs
  ADD COLUMN IF NOT EXISTS owner_approval_token     TEXT,
  ADD COLUMN IF NOT EXISTS owner_approval_status    TEXT
    CHECK (owner_approval_status IN ('pending','approved','declined')),
  ADD COLUMN IF NOT EXISTS owner_approval_sent_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_approval_decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_approval_note      TEXT;

-- The token is the owner's (login-free) credential for /approve/<token>, so it
-- must be unique and looked up directly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_jobs_owner_approval_token
  ON maintenance_jobs(owner_approval_token) WHERE owner_approval_token IS NOT NULL;
