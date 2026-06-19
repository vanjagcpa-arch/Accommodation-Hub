-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'internal_manager', 'external_manager', 'referral_agent', 'maintenance_staff', 'read_only');
CREATE TYPE property_status AS ENUM ('available', 'occupied', 'on_hold', 'maintenance_hold', 'coming_soon', 'unavailable');
CREATE TYPE maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE maintenance_status AS ENUM ('new', 'triage', 'assigned', 'scheduled', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'closed', 'cancelled');
CREATE TYPE application_status AS ENUM ('new', 'reviewing', 'approved', 'rejected', 'withdrawn', 'moved_in');
CREATE TYPE electricity_status AS ENUM ('not_required', 'pending_consent', 'pending_setup', 'active', 'closed');
CREATE TYPE maintenance_frequency AS ENUM ('daily', 'weekly', 'fortnightly', 'monthly', 'quarterly', 'biannual', 'annual');
CREATE TYPE audit_action AS ENUM ('created', 'updated', 'deleted', 'status_changed', 'permission_changed', 'exported', 'imported');

-- COMPANIES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  abn TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  reapit_external_id TEXT,
  myob_external_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'read_only',
  company_id UUID REFERENCES companies(id),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUILDINGS
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT DEFAULT 'Australia',
  total_properties INTEGER DEFAULT 0,
  description TEXT,
  notes TEXT,
  primary_manager_id UUID REFERENCES profiles(id),
  reapit_external_id TEXT,
  listonce_external_id TEXT,
  myob_external_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- PROPERTIES
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  building_id UUID NOT NULL REFERENCES buildings(id),
  unit_number TEXT NOT NULL,
  property_type TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms NUMERIC(3,1) DEFAULT 1,
  floor_level INTEGER,
  size_sqm NUMERIC(8,2),
  rent_amount NUMERIC(10,2),
  bond_amount NUMERIC(10,2),
  status property_status DEFAULT 'available',
  available_date DATE,
  features TEXT[],
  notes TEXT,
  internal_notes TEXT,
  agent_visible BOOLEAN DEFAULT true,
  assigned_manager_id UUID REFERENCES profiles(id),
  reapit_external_id TEXT,
  listonce_external_id TEXT,
  ezidebit_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- TENANTS
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  student_id TEXT,
  university TEXT,
  course TEXT,
  nationality TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  notes TEXT,
  reapit_external_id TEXT,
  ezidebit_tenant_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- OCCUPANCIES
CREATE TABLE occupancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lease_start DATE NOT NULL,
  lease_end DATE,
  rent_amount NUMERIC(10,2),
  bond_amount NUMERIC(10,2),
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  reapit_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- AGENTS
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  profile_id UUID REFERENCES profiles(id),
  agency_name TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  agent_type TEXT CHECK (agent_type IN ('internal', 'external', 'referral')),
  commission_rate NUMERIC(5,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- AGENT BUILDING PERMISSIONS
CREATE TABLE agent_building_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  building_id UUID NOT NULL REFERENCES buildings(id),
  can_view_availability BOOLEAN DEFAULT true,
  can_submit_applications BOOLEAN DEFAULT true,
  can_view_tenant_data BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(agent_id, building_id)
);

-- APPLICATIONS
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  building_id UUID REFERENCES buildings(id),
  property_id UUID REFERENCES properties(id),
  applicant_first_name TEXT NOT NULL,
  applicant_last_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  preferred_move_in DATE,
  student_status TEXT,
  university TEXT,
  course TEXT,
  status application_status DEFAULT 'new',
  agent_id UUID REFERENCES agents(id),
  assigned_manager_id UUID REFERENCES profiles(id),
  internal_notes TEXT,
  rejection_reason TEXT,
  electricity_setup_required BOOLEAN DEFAULT false,
  electricity_consent_given BOOLEAN DEFAULT false,
  electricity_consent_timestamp TIMESTAMPTZ,
  electricity_consent_version TEXT,
  linked_tenant_id UUID REFERENCES tenants(id),
  reapit_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- MAINTENANCE JOBS
CREATE TABLE maintenance_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  building_id UUID REFERENCES buildings(id),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT,
  priority maintenance_priority DEFAULT 'medium',
  status maintenance_status DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  scheduled_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  access_notes TEXT,
  internal_notes TEXT,
  completion_notes TEXT,
  recurring_rule_id UUID,
  reapit_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- MAINTENANCE JOB PHOTOS
CREATE TABLE maintenance_job_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'after', 'during', 'other')),
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAINTENANCE JOB COMMENTS
CREATE TABLE maintenance_job_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT true,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECURRING MAINTENANCE RULES
CREATE TABLE recurring_maintenance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  building_id UUID REFERENCES buildings(id),
  property_id UUID REFERENCES properties(id),
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT,
  frequency maintenance_frequency NOT NULL,
  next_due_date DATE,
  default_priority maintenance_priority DEFAULT 'low',
  default_assignee_id UUID REFERENCES profiles(id),
  auto_create_job BOOLEAN DEFAULT false,
  last_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- ELECTRICITY ACCOUNTS
CREATE TABLE electricity_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id),
  occupancy_id UUID REFERENCES occupancies(id),
  status electricity_status DEFAULT 'pending_consent',
  tenant_code TEXT,
  provider TEXT,
  account_number TEXT,
  move_in_date DATE,
  move_out_date DATE,
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  consent_version TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- ELECTRICITY CHARGES
CREATE TABLE electricity_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  electricity_account_id UUID NOT NULL REFERENCES electricity_accounts(id),
  charge_period_start DATE NOT NULL,
  charge_period_end DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  units_kwh NUMERIC(10,3),
  rate_per_kwh NUMERIC(8,6),
  charge_description TEXT,
  exported_at TIMESTAMPTZ,
  export_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- INTEGRATIONS EXTERNAL IDS
CREATE TABLE integrations_external_ids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  system_name TEXT NOT NULL CHECK (system_name IN ('reapit', 'listonce', 'myob', 'ezidebit')),
  external_id TEXT NOT NULL,
  external_ref TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, system_name)
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_properties_building ON properties(building_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_occupancies_property ON occupancies(property_id);
CREATE INDEX idx_occupancies_tenant ON occupancies(tenant_id);
CREATE INDEX idx_maintenance_building ON maintenance_jobs(building_id);
CREATE INDEX idx_maintenance_property ON maintenance_jobs(property_id);
CREATE INDEX idx_maintenance_status ON maintenance_jobs(status);
CREATE INDEX idx_maintenance_assigned ON maintenance_jobs(assigned_to);
CREATE INDEX idx_applications_building ON applications(building_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- TRIGGERS: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER occupancies_updated_at BEFORE UPDATE ON occupancies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER maintenance_jobs_updated_at BEFORE UPDATE ON maintenance_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER electricity_accounts_updated_at BEFORE UPDATE ON electricity_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admins see all, others restricted)
CREATE POLICY "Profiles visible to authenticated" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Buildings visible to authenticated" ON buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Properties visible to authenticated" ON properties FOR SELECT TO authenticated USING (true);
