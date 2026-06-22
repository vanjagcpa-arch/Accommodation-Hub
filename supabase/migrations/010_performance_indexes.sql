-- Performance indexes for common query patterns
-- Partial indexes (WHERE clause) are smaller and faster for filtered queries

-- Properties: list view filters
CREATE INDEX IF NOT EXISTS idx_properties_active_building
  ON properties (building_id, unit_number)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_active_status
  ON properties (status)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_active_type
  ON properties (property_type)
  WHERE is_active = true;

-- Maintenance jobs: status + sort is the most common query
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_active_status_created
  ON maintenance_jobs (status, created_at DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_active_priority
  ON maintenance_jobs (priority)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_active_building
  ON maintenance_jobs (building_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_active_staff
  ON maintenance_jobs (assigned_staff_id)
  WHERE is_active = true AND assigned_staff_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_open_due_date
  ON maintenance_jobs (due_date)
  WHERE is_active = true
    AND status NOT IN ('completed', 'closed', 'cancelled', 'duplicate');

-- Tenants: name search and active filter
CREATE INDEX IF NOT EXISTS idx_tenants_active_name
  ON tenants (last_name, first_name)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tenants_email
  ON tenants (email)
  WHERE email IS NOT NULL;

-- Applications: status + created_at sort
CREATE INDEX IF NOT EXISTS idx_applications_status_created
  ON applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_building
  ON applications (building_id)
  WHERE building_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_agent
  ON applications (agent_id)
  WHERE agent_id IS NOT NULL;

-- Occupancies: current-occupancy lookups are very frequent
CREATE INDEX IF NOT EXISTS idx_occupancies_current_property
  ON occupancies (property_id)
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_occupancies_current_tenant
  ON occupancies (tenant_id)
  WHERE is_current = true;

-- Buildings: active filter
CREATE INDEX IF NOT EXISTS idx_buildings_active
  ON buildings (name)
  WHERE is_active = true;
