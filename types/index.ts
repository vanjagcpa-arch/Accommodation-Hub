// Enum Types
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'internal_manager'
  | 'external_manager'
  | 'referral_agent'
  | 'maintenance_staff'
  | 'read_only'

export type PropertyStatus =
  | 'available'
  | 'occupied'
  | 'on_hold'
  | 'maintenance_hold'
  | 'coming_soon'
  | 'unavailable'

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'

export type MaintenanceStatus =
  | 'new'
  | 'triage'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'waiting_parts'
  | 'waiting_approval'
  | 'completed'
  | 'closed'
  | 'cancelled'

export type ApplicationStatus =
  | 'new'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'moved_in'

export type ElectricityStatus =
  | 'not_required'
  | 'pending_consent'
  | 'pending_setup'
  | 'active'
  | 'closed'

export type MaintenanceFrequency =
  | 'daily'
  | 'weekly'
  | 'fortnightly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual'

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'permission_changed'
  | 'exported'
  | 'imported'

export type AgentType = 'internal' | 'external' | 'referral'

// Entity Interfaces
export interface Company {
  id: string
  name: string
  abn: string | null
  address: string | null
  phone: string | null
  email: string | null
  reapit_external_id: string | null
  myob_external_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  company_id: string | null
  phone: string | null
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Building {
  id: string
  company_id: string
  name: string
  address: string
  suburb: string | null
  state: string | null
  postcode: string | null
  country: string
  total_properties: number
  description: string | null
  notes: string | null
  primary_manager_id: string | null
  reapit_external_id: string | null
  listonce_external_id: string | null
  myob_external_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  primary_manager?: Profile | null
  company?: Company | null
  occupied_count?: number
  available_count?: number
}

export interface Property {
  id: string
  company_id: string
  building_id: string
  unit_number: string
  property_type: string | null
  bedrooms: number
  bathrooms: number
  floor_level: number | null
  size_sqm: number | null
  rent_amount: number | null
  bond_amount: number | null
  status: PropertyStatus
  available_date: string | null
  features: string[] | null
  notes: string | null
  internal_notes: string | null
  agent_visible: boolean
  assigned_manager_id: string | null
  reapit_external_id: string | null
  listonce_external_id: string | null
  ezidebit_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined fields
  building?: Building | null
  assigned_manager?: Profile | null
  current_occupancy?: Occupancy | null
}

export interface Tenant {
  id: string
  company_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  student_id: string | null
  university: string | null
  course: string | null
  nationality: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  notes: string | null
  reapit_external_id: string | null
  ezidebit_tenant_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  current_occupancy?: Occupancy | null
}

export interface Occupancy {
  id: string
  company_id: string
  property_id: string
  tenant_id: string
  lease_start: string
  lease_end: string | null
  rent_amount: number | null
  bond_amount: number | null
  is_current: boolean
  notes: string | null
  reapit_external_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  property?: Property | null
  tenant?: Tenant | null
}

export interface Agent {
  id: string
  company_id: string | null
  profile_id: string | null
  agency_name: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  agent_type: AgentType | null
  commission_rate: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  company?: Company | null
  building_count?: number
}

export interface AgentBuildingPermission {
  id: string
  agent_id: string
  building_id: string
  can_view_availability: boolean
  can_submit_applications: boolean
  can_view_tenant_data: boolean
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  is_active: boolean
  // Joined
  agent?: Agent | null
  building?: Building | null
}

export interface Application {
  id: string
  company_id: string
  building_id: string | null
  property_id: string | null
  applicant_first_name: string
  applicant_last_name: string
  applicant_email: string
  applicant_phone: string | null
  preferred_move_in: string | null
  student_status: string | null
  university: string | null
  course: string | null
  status: ApplicationStatus
  agent_id: string | null
  assigned_manager_id: string | null
  internal_notes: string | null
  rejection_reason: string | null
  electricity_setup_required: boolean
  electricity_consent_given: boolean
  electricity_consent_timestamp: string | null
  electricity_consent_version: string | null
  linked_tenant_id: string | null
  reapit_external_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  building?: Building | null
  property?: Property | null
  agent?: Agent | null
  assigned_manager?: Profile | null
}

export interface MaintenanceJob {
  id: string
  company_id: string
  building_id: string | null
  property_id: string | null
  tenant_id: string | null
  title: string
  description: string | null
  issue_type: string | null
  priority: MaintenancePriority
  status: MaintenanceStatus
  assigned_to: string | null
  due_date: string | null
  scheduled_date: string | null
  completed_at: string | null
  access_notes: string | null
  internal_notes: string | null
  completion_notes: string | null
  recurring_rule_id: string | null
  reapit_external_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  building?: Building | null
  property?: Property | null
  tenant?: Tenant | null
  assignee?: Profile | null
  photos?: MaintenancePhoto[]
  comments?: MaintenanceComment[]
}

export interface MaintenancePhoto {
  id: string
  job_id: string
  storage_path: string
  file_name: string | null
  photo_type: 'before' | 'after' | 'during' | 'other' | null
  uploaded_by: string | null
  created_at: string
  // Joined
  uploader?: Profile | null
}

export interface MaintenanceComment {
  id: string
  job_id: string
  comment: string
  is_internal: boolean
  author_id: string | null
  created_at: string
  // Joined
  author?: Profile | null
}

export interface RecurringMaintenanceRule {
  id: string
  company_id: string
  building_id: string | null
  property_id: string | null
  title: string
  description: string | null
  issue_type: string | null
  frequency: MaintenanceFrequency
  next_due_date: string | null
  default_priority: MaintenancePriority
  default_assignee_id: string | null
  auto_create_job: boolean
  last_generated_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  // Joined
  building?: Building | null
  property?: Property | null
  default_assignee?: Profile | null
}

export interface ElectricityAccount {
  id: string
  company_id: string
  property_id: string
  tenant_id: string | null
  occupancy_id: string | null
  status: ElectricityStatus
  tenant_code: string | null
  provider: string | null
  account_number: string | null
  move_in_date: string | null
  move_out_date: string | null
  consent_given: boolean
  consent_timestamp: string | null
  consent_version: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  property?: Property | null
  tenant?: Tenant | null
  occupancy?: Occupancy | null
}

export interface ElectricityCharge {
  id: string
  electricity_account_id: string
  charge_period_start: string
  charge_period_end: string
  amount: number
  units_kwh: number | null
  rate_per_kwh: number | null
  charge_description: string | null
  exported_at: string | null
  export_reference: string | null
  created_at: string
  created_by: string | null
}

export interface AuditLog {
  id: string
  company_id: string | null
  user_id: string | null
  action: AuditAction
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  description: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  // Joined
  user?: Profile | null
}

// Dashboard Stats
export interface DashboardStats {
  total_properties: number
  occupied_properties: number
  vacant_properties: number
  open_maintenance_jobs: number
  pending_applications: number
  electricity_pending: number
}
