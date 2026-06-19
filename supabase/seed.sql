-- Seed data for AccomHub
-- Run this after 001_initial_schema.sql

-- Insert sample company
INSERT INTO companies (id, name, abn, address, phone, email, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Metro Student Housing Pty Ltd',
  '12 345 678 901',
  '100 Collins Street, Melbourne VIC 3000',
  '03 9000 1234',
  'admin@metrostudenthousing.com.au',
  true
);

-- Insert sample buildings
INSERT INTO buildings (id, company_id, name, address, suburb, state, postcode, total_properties, description, is_active)
VALUES
  ('b1000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Parkview Apartments', '45 Park Street', 'Southbank', 'VIC', '3006', 12, 'Modern apartments near Melbourne CBD, close to trams and RMIT', true),
  ('b1000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'University Gardens', '12 Swanston Street', 'Carlton', 'VIC', '3053', 20, 'Premium student accommodation walking distance to University of Melbourne', true),
  ('b1000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Flinders House', '88 Flinders Lane', 'Melbourne', 'VIC', '3000', 8, 'Boutique CBD apartments, heritage building conversion', true),
  ('b1000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brunswick Studios', '201 Sydney Road', 'Brunswick', 'VIC', '3056', 15, 'Affordable studios near RMIT Brunswick campus', true),
  ('b1000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fitzroy Terrace', '55 Johnston Street', 'Fitzroy', 'VIC', '3065', 10, 'Terrace-style apartments in vibrant Fitzroy', true),
  ('b1000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Monash Towers', '900 Dandenong Road', 'Caulfield East', 'VIC', '3145', 24, 'High-rise student towers adjacent to Monash Caulfield campus', true),
  ('b1000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'St Kilda Residences', '14 Acland Street', 'St Kilda', 'VIC', '3182', 6, 'Beach-side apartments in popular St Kilda', true),
  ('b1000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hawthorn Court', '72 Glenferrie Road', 'Hawthorn', 'VIC', '3122', 18, 'Premium apartments near Swinburne University', true),
  ('b1000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Docklands Point', '3 Waterfront Way', 'Docklands', 'VIC', '3008', 30, 'Waterfront apartments with harbour views', true),
  ('b1000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Footscray Heights', '120 Nicholson Street', 'Footscray', 'VIC', '3011', 16, 'Affordable apartments near Victoria University', true);

-- Insert sample properties
INSERT INTO properties (id, company_id, building_id, unit_number, property_type, bedrooms, bathrooms, floor_level, size_sqm, rent_amount, bond_amount, status, available_date, features, agent_visible, is_active)
VALUES
  -- Parkview Apartments
  ('p0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', '101', 'Studio', 0, 1.0, 1, 32.5, 1650.00, 3300.00, 'occupied', NULL, ARRAY['Air conditioning', 'Built-in robes', 'Intercom'], true, true),
  ('p0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', '102', 'Studio', 0, 1.0, 1, 32.5, 1650.00, 3300.00, 'available', '2026-07-01', ARRAY['Air conditioning', 'Built-in robes', 'Intercom'], true, true),
  ('p0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', '201', '1 Bedroom', 1, 1.0, 2, 48.0, 2100.00, 4200.00, 'occupied', NULL, ARRAY['Air conditioning', 'Built-in robes', 'Balcony', 'Dishwasher'], true, true),
  ('p0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', '202', '1 Bedroom', 1, 1.0, 2, 48.0, 2100.00, 4200.00, 'available', '2026-07-15', ARRAY['Air conditioning', 'Built-in robes', 'Balcony', 'Dishwasher'], true, true),
  ('p0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', '301', '2 Bedroom', 2, 1.0, 3, 72.0, 2800.00, 5600.00, 'maintenance_hold', NULL, ARRAY['Air conditioning', 'Built-in robes', 'Balcony', 'Dishwasher', 'Parking'], true, true),
  -- University Gardens
  ('p0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000002', '1A', 'Studio', 0, 1.0, 1, 28.0, 1450.00, 2900.00, 'occupied', NULL, ARRAY['Furnished', 'High-speed internet', 'Study desk'], true, true),
  ('p0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000002', '1B', 'Studio', 0, 1.0, 1, 28.0, 1450.00, 2900.00, 'available', '2026-07-01', ARRAY['Furnished', 'High-speed internet', 'Study desk'], true, true),
  ('p0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000002', '2A', '1 Bedroom', 1, 1.0, 2, 45.0, 1950.00, 3900.00, 'occupied', NULL, ARRAY['Furnished', 'High-speed internet', 'Study desk', 'Air conditioning'], true, true),
  ('p0000001-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000002', '2B', '1 Bedroom', 1, 1.0, 2, 45.0, 1950.00, 3900.00, 'coming_soon', '2026-08-01', ARRAY['Furnished', 'High-speed internet', 'Study desk', 'Air conditioning'], true, true),
  -- Monash Towers
  ('p0000001-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000006', '501', 'Studio', 0, 1.0, 5, 30.0, 1550.00, 3100.00, 'occupied', NULL, ARRAY['Air conditioning', 'City views', 'Gym access'], true, true),
  ('p0000001-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000006', '502', 'Studio', 0, 1.0, 5, 30.0, 1550.00, 3100.00, 'available', '2026-07-01', ARRAY['Air conditioning', 'City views', 'Gym access'], true, true),
  ('p0000001-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000006', '801', '2 Bedroom', 2, 2.0, 8, 78.0, 3200.00, 6400.00, 'occupied', NULL, ARRAY['Air conditioning', 'City views', 'Gym access', 'Parking', 'Dishwasher'], true, true),
  -- Docklands Point
  ('p0000001-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000009', '1201', '1 Bedroom', 1, 1.0, 12, 55.0, 2450.00, 4900.00, 'available', '2026-07-01', ARRAY['Harbour views', 'Air conditioning', 'Balcony', 'Gym access', 'Concierge'], true, true),
  ('p0000001-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000009', '1202', '2 Bedroom', 2, 2.0, 12, 92.0, 3600.00, 7200.00, 'occupied', NULL, ARRAY['Harbour views', 'Air conditioning', 'Balcony', 'Gym access', 'Concierge', 'Parking'], true, true),
  ('p0000001-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000009', '1501', '3 Bedroom', 3, 2.0, 15, 128.0, 4800.00, 9600.00, 'on_hold', NULL, ARRAY['Harbour views', 'Air conditioning', 'Balcony', 'Gym access', 'Concierge', 'Parking', 'Study'], true, true),
  -- Brunswick Studios
  ('p0000001-0000-0000-0000-000000000016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000004', 'G01', 'Studio', 0, 1.0, 0, 25.0, 1200.00, 2400.00, 'available', '2026-06-25', ARRAY['Courtyard access', 'Bike storage'], true, true),
  ('p0000001-0000-0000-0000-000000000017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000004', 'G02', 'Studio', 0, 1.0, 0, 25.0, 1200.00, 2400.00, 'occupied', NULL, ARRAY['Courtyard access', 'Bike storage'], true, true),
  ('p0000001-0000-0000-0000-000000000018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000004', '101', '1 Bedroom', 1, 1.0, 1, 40.0, 1650.00, 3300.00, 'occupied', NULL, ARRAY['Built-in robes', 'Courtyard access', 'Bike storage'], true, true),
  -- Hawthorn Court
  ('p0000001-0000-0000-0000-000000000019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000008', 'A01', '1 Bedroom', 1, 1.0, 1, 52.0, 2200.00, 4400.00, 'available', '2026-07-10', ARRAY['Air conditioning', 'Balcony', 'Secure parking'], true, true),
  ('p0000001-0000-0000-0000-000000000020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000008', 'A02', '2 Bedroom', 2, 2.0, 1, 75.0, 2950.00, 5900.00, 'occupied', NULL, ARRAY['Air conditioning', 'Balcony', 'Secure parking', 'Dishwasher'], true, true),
  ('p0000001-0000-0000-0000-000000000021', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000008', 'B01', 'Studio', 0, 1.0, 2, 33.0, 1750.00, 3500.00, 'available', '2026-08-01', ARRAY['Air conditioning', 'Study nook', 'Secure parking'], true, true),
  -- Footscray Heights
  ('p0000001-0000-0000-0000-000000000022', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000010', '101', 'Studio', 0, 1.0, 1, 27.0, 1100.00, 2200.00, 'available', '2026-07-01', ARRAY['Budget-friendly', 'Train access'], true, true),
  ('p0000001-0000-0000-0000-000000000023', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000010', '102', '1 Bedroom', 1, 1.0, 1, 38.0, 1400.00, 2800.00, 'occupied', NULL, ARRAY['Budget-friendly', 'Train access', 'Built-in robes'], true, true),
  ('p0000001-0000-0000-0000-000000000024', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000010', '201', '2 Bedroom', 2, 1.0, 2, 60.0, 1900.00, 3800.00, 'occupied', NULL, ARRAY['Budget-friendly', 'Train access', 'Built-in robes', 'Balcony'], true, true);

-- Insert sample tenants
INSERT INTO tenants (id, company_id, first_name, last_name, email, phone, student_id, university, course, nationality, is_active)
VALUES
  ('t0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Wei', 'Zhang', 'wei.zhang@student.unimelb.edu.au', '0412 345 678', 'S1234567', 'University of Melbourne', 'Master of Engineering', 'Chinese', true),
  ('t0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Priya', 'Sharma', 'priya.sharma@student.rmit.edu.au', '0423 456 789', 'S2345678', 'RMIT University', 'Bachelor of IT', 'Indian', true),
  ('t0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Carlos', 'Rodriguez', 'carlos.r@student.monash.edu', '0434 567 890', 'S3456789', 'Monash University', 'PhD Computer Science', 'Brazilian', true),
  ('t0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Emma', 'Wilson', 'emma.wilson@student.swin.edu.au', '0445 678 901', 'S4567890', 'Swinburne University', 'Bachelor of Design', 'Australian', true),
  ('t0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nguyen', 'Thi', 'nguyen.thi@student.vu.edu.au', '0456 789 012', 'S5678901', 'Victoria University', 'Bachelor of Business', 'Vietnamese', true),
  ('t0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'James', 'Murphy', 'james.murphy@student.unimelb.edu.au', '0467 890 123', 'S6789012', 'University of Melbourne', 'Bachelor of Commerce', 'Irish', true),
  ('t0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fatima', 'Al-Hassan', 'fatima.alhassan@student.rmit.edu.au', '0478 901 234', 'S7890123', 'RMIT University', 'Master of Architecture', 'Emirati', true),
  ('t0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Liam', 'Chen', 'liam.chen@student.monash.edu', '0489 012 345', 'S8901234', 'Monash University', 'Bachelor of Medicine', 'Singaporean', true);

-- Insert sample maintenance jobs
INSERT INTO maintenance_jobs (id, company_id, building_id, property_id, title, description, issue_type, priority, status, due_date)
VALUES
  ('m0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'Air conditioner not cooling', 'Tenant reports AC unit in bedroom making loud noise and not cooling effectively. Possibly needs regas or compressor fault.', 'HVAC', 'high', 'new', '2026-06-25'),
  ('m0000001-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000006', 'Leaking tap in bathroom', 'Cold water tap in bathroom sink dripping constantly. Needs new washer or cartridge replacement.', 'Plumbing', 'medium', 'assigned', '2026-06-27'),
  ('m0000001-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000005', 'Water damage - ceiling stain', 'Water stain appearing on bedroom ceiling, spreading. Possible leak from unit above. URGENT - unit currently in maintenance hold.', 'Plumbing', 'urgent', 'in_progress', '2026-06-22'),
  ('m0000001-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000006', 'p0000001-0000-0000-0000-000000000010', 'Broken window lock', 'Bedroom window lock mechanism broken, window cannot be secured. Security concern.', 'Security', 'high', 'scheduled', '2026-06-26'),
  ('m0000001-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000009', 'p0000001-0000-0000-0000-000000000014', 'Oven not heating', 'Electric oven not reaching temperature. Heating element likely failed. Tenant unable to cook.', 'Appliance', 'medium', 'triage', '2026-06-30'),
  ('m0000001-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000008', 'p0000001-0000-0000-0000-000000000020', 'Exhaust fan in bathroom not working', 'Bathroom exhaust fan making rattling noise then stopped working. Mould risk if not fixed promptly.', 'Electrical', 'medium', 'completed', '2026-06-20'),
  ('m0000001-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000010', 'p0000001-0000-0000-0000-000000000023', 'Light globe replacement (common area)', 'Two fluorescent tubes in common hallway on level 1 need replacement.', 'Electrical', 'low', 'completed', '2026-06-18'),
  ('m0000001-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000001-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000017', 'Dishwasher leaking', 'Front door seal on dishwasher leaking water onto kitchen floor. Could damage flooring.', 'Appliance', 'high', 'waiting_parts', '2026-06-28');
