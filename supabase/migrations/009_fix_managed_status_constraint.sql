-- 009: Normalize managed_status column constraint
--
-- ADD COLUMN IF NOT EXISTS is a complete no-op when the column already exists,
-- so migration 007 may not have applied the correct DEFAULT or CHECK constraint.
-- This migration is safe to run even when 007 applied everything correctly:
-- the DO block discovers and drops any existing managed_status check constraints
-- (regardless of their auto-generated names) before adding the canonical one.

-- Ensure the column exists (idempotent)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS managed_status TEXT;

-- Normalise any NULL or out-of-range values before enforcing NOT NULL
UPDATE properties
  SET managed_status = 'managed'
  WHERE managed_status IS NULL
     OR managed_status NOT IN ('managed', 'external');

-- Drop every check constraint that references managed_status, however it was named
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM   pg_constraint
    WHERE  conrelid = 'public.properties'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) LIKE '%managed_status%'
  LOOP
    EXECUTE format('ALTER TABLE properties DROP CONSTRAINT %I', r.conname);
  END LOOP;
END;
$$;

-- Apply canonical DEFAULT and NOT NULL
ALTER TABLE properties
  ALTER COLUMN managed_status SET DEFAULT 'managed',
  ALTER COLUMN managed_status SET NOT NULL;

-- Add the canonical constraint
ALTER TABLE properties
  ADD CONSTRAINT properties_managed_status_check
  CHECK (managed_status IN ('managed', 'external'));
