-- ============================================================================
-- seed_maintenance.sql
-- Demo data for the Repairs & Maintenance module.
-- Run order:  001_initial_schema.sql -> 002_maintenance_module.sql -> seed.sql
--             -> seed_maintenance.sql
-- Safe to re-run: uses ON CONFLICT / WHERE guards where practical.
-- ============================================================================

-- Company id reused from seed.sql
-- a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- ── Priority configuration ──────────────────────────────────────
INSERT INTO maintenance_priorities (company_id, key, label, color, sla_hours, sort_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'urgent', 'Urgent', '#dc2626', 4,   1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'high',   'High',   '#ea580c', 24,  2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'medium', 'Medium', '#d97706', 72,  3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'low',    'Low',    '#2563eb', 168, 4)
ON CONFLICT (company_id, key) DO NOTHING;

-- ── Categories ─────────────────────────────────────────────
INSERT INTO maintenance_categories (id, company_id, name, slug, color, default_priority, default_sla_hours, sort_order) VALUES
  ('ca000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Plumbing',              'plumbing',   '#2563eb', 'high',   24,  1),
  ('ca000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Electrical',            'electrical', '#d97706', 'high',   24,  2),
  ('ca000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'HVAC',                  'hvac',       '#0891b2', 'medium', 48,  3),
  ('ca000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Appliance',             'appliance',  '#7c3aed', 'medium', 72,  4),
  ('ca000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Security',              'security',   '#dc2626', 'urgent', 8,   5),
  ('ca000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Structural',            'structural', '#525252', 'medium', 96,  6),
  ('ca000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'General Repairs',       'general',    '#16a34a', 'low',    120, 7),
  ('ca000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cleaning',              'cleaning',   '#0d9488', 'low',    120, 8),
  ('ca000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Furniture',             'furniture',  '#a16207', 'low',    120, 9),
  ('ca000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Locks & Keys',          'locks',      '#b91c1c', 'high',   12,  10),
  ('ca000001-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Grounds & Common Area', 'grounds',    '#65a30d', 'low',    168, 11)
ON CONFLICT (company_id, slug) DO NOTHING;

-- ── Maintenance staff ────────────────────────────────────────
INSERT INTO maintenance_staff_profiles (id, company_id, full_name, email, phone, trade, skills, is_internal, color, max_jobs_per_day) VALUES
  ('5a000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bob Fielding',  'bob@metrostudenthousing.com.au',  '0411 222 333', 'Plumbing',   ARRAY['Plumbing','Drainage','Hot water'],        true, '#2563eb', 6),
  ('5a000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Jake Morrow',   'jake@metrostudenthousing.com.au', '0422 333 444', 'General',    ARRAY['Carpentry','Locks','Appliances','Doors'], true, '#16a34a', 7),
  ('5a000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mike Sutton',   'mike@metrostudenthousing.com.au', '0433 444 555', 'Electrical', ARRAY['Electrical','HVAC','Air conditioning'],   true, '#d97706', 6)
ON CONFLICT (id) DO NOTHING;

-- ── Checklist templates ──────────────────────────────────────
INSERT INTO maintenance_checklist_templates (id, company_id, category_id, name, description) VALUES
  ('7c000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ca000001-0000-0000-0000-000000000002', 'Smoke Alarm Check', 'Annual smoke alarm compliance check'),
  ('7c000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ca000001-0000-0000-0000-000000000003', 'Air Conditioning Service', 'Routine split-system service'),
  ('7c000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ca000001-0000-0000-0000-000000000007', 'General Inspection', 'Routine property condition inspection')
ON CONFLICT (id) DO NOTHING;

INSERT INTO maintenance_checklist_template_items (template_id, label, requires_photo, sort_order) VALUES
  ('7c000001-0000-0000-0000-000000000001', 'Test each smoke alarm with test button', false, 1),
  ('7c000001-0000-0000-0000-000000000001', 'Replace backup batteries', false, 2),
  ('7c000001-0000-0000-0000-000000000001', 'Confirm expiry date within compliance', true, 3),
  ('7c000001-0000-0000-0000-000000000002', 'Clean or replace filters', true, 1),
  ('7c000001-0000-0000-0000-000000000002', 'Check refrigerant and operation', false, 2),
  ('7c000001-0000-0000-0000-000000000002', 'Clear condensate drain', false, 3),
  ('7c000001-0000-0000-0000-000000000007', 'Check walls, ceilings and floors', true, 1),
  ('7c000001-0000-0000-0000-000000000007', 'Test taps, toilets and drainage', false, 2),
  ('7c000001-0000-0000-0000-000000000007', 'Confirm smoke alarms operational', false, 3),
  ('7c000001-0000-0000-0000-000000000007', 'Note any wear or damage', true, 4)
ON CONFLICT DO NOTHING;

-- ── Back-fill the 8 jobs seeded in seed.sql ───────────────────────────
-- Assign job numbers (those rows pre-date the job_number column/trigger)
UPDATE maintenance_jobs
SET job_number = 'MJ-' || LPAD(nextval('maintenance_job_number_seq')::text, 6, '0')
WHERE job_number IS NULL;

-- Category + staff + reporter + cost estimates
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000003', assigned_staff_id='5a000001-0000-0000-0000-000000000003', reported_by_name='Wei Zhang (tenant)',   source='tenant',  estimated_cost=320 WHERE id='m0000001-0000-0000-0000-000000000001';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000001', assigned_staff_id='5a000001-0000-0000-0000-000000000001', reported_by_name='Priya Sharma (tenant)', source='tenant',  estimated_cost=140 WHERE id='m0000001-0000-0000-0000-000000000002';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000001', assigned_staff_id='5a000001-0000-0000-0000-000000000001', reported_by_name='Building Manager',     source='manager', estimated_cost=1800, preferred_access_window='Weekdays 8am-4pm' WHERE id='m0000001-0000-0000-0000-000000000003';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000005', assigned_staff_id='5a000001-0000-0000-0000-000000000002', reported_by_name='Carlos Rodriguez (tenant)', source='tenant', estimated_cost=180 WHERE id='m0000001-0000-0000-0000-000000000004';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000004', assigned_staff_id='5a000001-0000-0000-0000-000000000002', reported_by_name='Emma Wilson (tenant)',  source='tenant',  estimated_cost=260 WHERE id='m0000001-0000-0000-0000-000000000005';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000002', assigned_staff_id='5a000001-0000-0000-0000-000000000003', reported_by_name='Liam Chen (tenant)',    source='tenant',  estimated_cost=150, actual_cost=135 WHERE id='m0000001-0000-0000-0000-000000000006';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000002', assigned_staff_id='5a000001-0000-0000-0000-000000000003', reported_by_name='Cleaner',               source='inspection', estimated_cost=60, actual_cost=48 WHERE id='m0000001-0000-0000-0000-000000000007';
UPDATE maintenance_jobs SET category_id='ca000001-0000-0000-0000-000000000004', assigned_staff_id='5a000001-0000-0000-0000-000000000002', reported_by_name='Nguyen Thi (tenant)',   source='tenant',  estimated_cost=210 WHERE id='m0000001-0000-0000-0000-000000000008';

-- A couple of demo comments on the urgent job
INSERT INTO maintenance_job_comments (job_id, comment, is_internal) VALUES
  ('m0000001-0000-0000-0000-000000000003', 'Assigned to Bob. Notified strata of possible source leak from the unit above.', true),
  ('m0000001-0000-0000-0000-000000000003', 'Attended on site. Confirmed leak from cracked shower grout in the unit above; applied temporary barrier to stop further damage.', false)
ON CONFLICT DO NOTHING;

-- Demo checklist on the AC job
INSERT INTO maintenance_job_checklist_items (job_id, label, requires_photo, sort_order) VALUES
  ('m0000001-0000-0000-0000-000000000001', 'Clean or replace filters', true, 1),
  ('m0000001-0000-0000-0000-000000000001', 'Check refrigerant and operation', false, 2),
  ('m0000001-0000-0000-0000-000000000001', 'Clear condensate drain', false, 3)
ON CONFLICT DO NOTHING;
