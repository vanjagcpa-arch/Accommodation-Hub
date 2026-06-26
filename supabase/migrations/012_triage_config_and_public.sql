-- ════════════════════════════════════════════════════════════════════════════
-- 012_triage_config_and_public.sql
--
-- Builds on 011_triage_agent.sql. Three concerns, all ADDITIVE
-- (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / CREATE POLICY).
-- Never DROPs or rewrites existing data.
--
--   1. Fix: maintenance_jobs.blocking_leasing — finalize_triage() writes this
--      column but it never existed, so every finalize INSERT failed in prod.
--   2. Editable triage config — triage_slots table + maintenance_categories
--      .triage_routing, so the per-category question checklist can be managed
--      from Settings → Triage instead of being hard-coded in slot-config.ts.
--   3. Public tenant access — properties.triage_token, a per-property
--      hard-to-guess token that powers the /r/<token> QR/link intake page.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Fix the missing finalize column ───────────────────────────────────────
ALTER TABLE maintenance_jobs
  ADD COLUMN IF NOT EXISTS blocking_leasing BOOLEAN NOT NULL DEFAULT false;

-- ── 2a. Routing target for triage (priority + SLA already live on the table) ──
ALTER TABLE maintenance_categories
  ADD COLUMN IF NOT EXISTS triage_routing TEXT;

-- ── 2b. Per-category question checklist (editable copy of slot-config.ts) ─────
CREATE TABLE IF NOT EXISTS triage_slots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES companies(id),
  category_id UUID        NOT NULL REFERENCES maintenance_categories(id) ON DELETE CASCADE,
  slot_key    TEXT        NOT NULL,
  question    TEXT        NOT NULL,
  input       TEXT        NOT NULL CHECK (input IN ('chips','dropdown','toggle','text','photo')),
  options     TEXT[],
  sort_order  INT         NOT NULL DEFAULT 0,
  conditional BOOLEAN     NOT NULL DEFAULT false,  -- shown to the model as advisory [conditional]
  show_when   JSONB,                                -- optional serialisable hint, e.g. {"slot":"is_active_leak","equals":true}
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, slot_key)
);

CREATE INDEX IF NOT EXISTS idx_triage_slots_category
  ON triage_slots(company_id, category_id, sort_order);

DROP TRIGGER IF EXISTS trg_triage_slots_updated_at ON triage_slots;
CREATE TRIGGER trg_triage_slots_updated_at
  BEFORE UPDATE ON triage_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. Public per-property intake token ──────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS triage_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_triage_token
  ON properties(triage_token) WHERE triage_token IS NOT NULL;

-- ── 4. RLS — triage_slots ────────────────────────────────────────────────────
-- Any staff member in the company may read the config (the agent reads it on
-- the staff path; the public path reads it via the service role, bypassing RLS).
-- Only managers/admins may edit it.
ALTER TABLE triage_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "triage_slots_select" ON triage_slots;
DROP POLICY IF EXISTS "triage_slots_insert" ON triage_slots;
DROP POLICY IF EXISTS "triage_slots_update" ON triage_slots;
DROP POLICY IF EXISTS "triage_slots_delete" ON triage_slots;

CREATE POLICY "triage_slots_select" ON triage_slots
  FOR SELECT TO authenticated
  USING (company_id = public.auth_company_id());

CREATE POLICY "triage_slots_insert" ON triage_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager')
  );

CREATE POLICY "triage_slots_update" ON triage_slots
  FOR UPDATE TO authenticated
  USING (company_id = public.auth_company_id())
  WITH CHECK (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin','internal_manager')
  );

CREATE POLICY "triage_slots_delete" ON triage_slots
  FOR DELETE TO authenticated
  USING (
    company_id = public.auth_company_id() AND
    public.auth_role() IN ('super_admin','admin')
  );

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Seed defaults — idempotent. Mirrors lib/maintenance/slot-config.ts so the
--    agent and Settings UI have data to work with out of the box. Re-running is
--    safe (ON CONFLICT DO NOTHING / guarded inserts).
-- ════════════════════════════════════════════════════════════════════════════

-- 5a. Categories for every company. Existing rows keep their values; we only
--     backfill triage_routing when it is still null.
INSERT INTO maintenance_categories (company_id, name, slug, default_priority, default_sla_hours, triage_routing, sort_order, is_active)
SELECT c.id, v.name, v.slug, v.priority::maintenance_priority, v.sla, v.routing, v.sort_order, true
FROM companies c
CROSS JOIN (VALUES
  ('Plumbing',          'plumbing',   'high',   24, 'internal_plumber',     10),
  ('Electrical',        'electrical', 'high',   24, 'internal_electrician', 20),
  ('Heating & Cooling', 'heating',    'medium', 48, 'hvac_contractor',      30),
  ('Appliance',         'appliance',  'medium', 72, 'appliance_tech',       40),
  ('General / Other',   'other',      'medium', 72, 'internal_manager',     50)
) AS v(name, slug, priority, sla, routing, sort_order)
ON CONFLICT (company_id, slug) DO UPDATE
  SET triage_routing = COALESCE(maintenance_categories.triage_routing, EXCLUDED.triage_routing);

-- 5b. Slots for those categories.
INSERT INTO triage_slots (company_id, category_id, slot_key, question, input, options, sort_order, conditional)
SELECT mc.company_id, mc.id, s.slot_key, s.question, s.input, s.options, s.sort_order, s.conditional
FROM maintenance_categories mc
JOIN (VALUES
  -- plumbing
  ('plumbing',   'issue_type',        'What type of plumbing issue is this?',                   'chips',  ARRAY['Leaking / dripping','Blocked drain','No hot water','Low water pressure','Toilet problem','Other'], 10, false),
  ('plumbing',   'is_active_leak',    'Is water actively leaking right now?',                   'toggle', NULL::text[], 20, true),
  ('plumbing',   'leak_rate',         'How fast is the leak?',                                  'chips',  ARRAY['Drip / trickle','Steady stream','Gushing'], 30, true),
  ('plumbing',   'location',          'Which area of the property?',                            'chips',  ARRAY['Bathroom','Kitchen','Laundry','Toilet','Hallway / other'], 40, false),
  ('plumbing',   'photo',             'Can you share a photo? (tap Skip to continue without one)', 'photo', NULL::text[], 50, false),
  -- electrical
  ('electrical', 'issue_type',        'What is the electrical issue?',                          'chips',  ARRAY['No power / outage','Tripped circuit / RCD','Faulty outlet or switch','Light fitting issue','Appliance wiring','Other'], 10, false),
  ('electrical', 'scope',             'How much of the property is affected?',                  'chips',  ARRAY['Single outlet or light','One room','Multiple rooms','Whole flat'], 20, false),
  ('electrical', 'has_safety_concern','Is there any burning smell, sparks, or visible damage?', 'toggle', NULL::text[], 30, false),
  ('electrical', 'photo',             'Can you share a photo of the affected area?',            'photo',  NULL::text[], 40, true),
  -- heating
  ('heating',    'issue_type',        'What is the heating / cooling issue?',                   'chips',  ARRAY['No heating','No cooling','Unit making noise','Leaking unit','Remote / controls not working','Other'], 10, false),
  ('heating',    'scope',             'Which areas are affected?',                              'chips',  ARRAY['One room','Multiple rooms','Whole flat'], 20, false),
  ('heating',    'has_error_code',    'Is there an error code showing on the unit?',            'toggle', NULL::text[], 30, false),
  ('heating',    'error_code',        'What error code is displayed?',                          'text',   NULL::text[], 40, true),
  ('heating',    'photo',             'Photo of the unit or display? (tap Skip to continue)',   'photo',  NULL::text[], 50, false),
  -- appliance
  ('appliance',  'appliance_type',    'Which appliance has the issue?',                         'chips',  ARRAY['Oven / cooktop','Dishwasher','Washing machine','Dryer','Fridge / freezer','Range hood','Other'], 10, false),
  ('appliance',  'issue_type',        'What is wrong with the appliance?',                      'chips',  ARRAY['Not working / no power','Not heating / cooling','Making unusual noise','Leaking','Error code / fault light','Other'], 20, false),
  ('appliance',  'error_code',        'What error code or fault light is showing?',             'text',   NULL::text[], 30, true),
  ('appliance',  'photo',             'Photo of the appliance or error display? (tap Skip)',    'photo',  NULL::text[], 40, false),
  -- other
  ('other',      'issue_type',        'What area does the issue relate to?',                    'chips',  ARRAY['Doors / locks','Windows','Flooring','Walls / ceiling','Pest / vermin','Rubbish / cleaning','Other'], 10, false),
  ('other',      'description',       'Please describe the issue in a few words.',              'text',   NULL::text[], 20, false),
  ('other',      'photo',             'Do you have a photo? (tap Skip to continue)',            'photo',  NULL::text[], 30, false)
) AS s(slug, slot_key, question, input, options, sort_order, conditional)
  ON mc.slug = s.slug
WHERE mc.slug IN ('plumbing','electrical','heating','appliance','other')
ON CONFLICT (category_id, slot_key) DO NOTHING;

-- 5c. A couple of starter self-help articles (deflection examples).
INSERT INTO maintenance_kb_articles (company_id, category_id, title, symptoms, steps)
SELECT mc.company_id, mc.id, 'Reset a tripped RCD / safety switch',
       ARRAY['tripped','rcd','safety switch','circuit','breaker','no power','power'],
       ARRAY[
         'Locate your switchboard (usually near the front door or in a hallway cupboard).',
         'Find the switch that has flipped to the middle / off position — this is the RCD.',
         'Push it fully DOWN (off), then firmly back UP (on).',
         'If it trips again immediately, unplug all appliances and try once more.',
         'If it keeps tripping with everything unplugged, submit a maintenance request.'
       ]
FROM maintenance_categories mc
WHERE mc.slug = 'electrical'
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_kb_articles k
    WHERE k.company_id = mc.company_id AND k.title = 'Reset a tripped RCD / safety switch'
  );

INSERT INTO maintenance_kb_articles (company_id, category_id, title, symptoms, steps)
SELECT mc.company_id, mc.id, 'Radiator cold at the top — bleed it',
       ARRAY['radiator','cold','top','heating','air','gurgling'],
       ARRAY[
         'Turn the heating off and let the radiator cool completely.',
         'Hold a cloth under the bleed valve at the top corner of the radiator.',
         'Turn the valve anticlockwise a quarter turn with a radiator key until you hear air hiss out.',
         'When water starts to dribble out, close the valve again.',
         'If the radiator is still cold after bleeding, submit a maintenance request.'
       ]
FROM maintenance_categories mc
WHERE mc.slug = 'heating'
  AND NOT EXISTS (
    SELECT 1 FROM maintenance_kb_articles k
    WHERE k.company_id = mc.company_id AND k.title = 'Radiator cold at the top — bleed it'
  );
