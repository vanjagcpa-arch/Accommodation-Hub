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
  | 'waiting_tenant'
  | 'waiting_access'
  | 'waiting_parts'
  | 'waiting_quote'
  | 'waiting_approval'
  | 'completed'
  | 'closed'
  | 'cancelled'
  | 'duplicate'

export type MaintenanceCostType = 'labour' | 'callout' | 'parts' | 'contractor' | 'other'

export type MaintenanceJobSource = 'manager' | 'tenant' | 'recurring' | 'inspection' | 'agent'

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

export interface Owner {
  id: string
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  notes: string | null
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
  manages_electricity: boolean
  manages_maintenance: boolean
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
  owner_id?: string | null
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
  owner?: Owner | null
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
  occupancy_id: string | null
  job_number: string | null
  title: string
  description: string | null
  issue_type: string | null
  category_id: string | null
  priority: MaintenancePriority
  status: MaintenanceStatus
  source: MaintenanceJobSource | string | null
  assigned_to: string | null
  assigned_staff_id: string | null
  assigned_manager_id: string | null
  external_agent_id: string | null
  reported_by_id: string | null
  reported_by_name: string | null
  due_date: string | null
  scheduled_date: string | null
  completed_at: string | null
  closed_at: string | null
  preferred_access_window: string | null
  access_notes: string | null
  tenant_contact_visible: boolean
  internal_notes: string | null
  external_notes: string | null
  completion_notes: string | null
  estimated_cost: number | null
  actual_cost: number | null
  invoice_reference: string | null
  recurring_rule_id: string | null
  reapit_external_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined
  building?: Building | null
  property?: Property | null
  tenant?: Tenant | null
  category?: MaintenanceCategory | null
  assignee?: Profile | null
  assigned_staff?: MaintenanceStaffProfile | null
  assigned_manager?: Profile | null
  photos?: MaintenancePhoto[]
  comments?: MaintenanceComment[]
  status_history?: MaintenanceStatusHistory[]
  checklist_items?: MaintenanceChecklistItem[]
  materials?: MaintenanceMaterial[]
  costs?: MaintenanceCost[]
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

// ── Maintenance module entities ───────────────────────────────────────────────
export interface MaintenanceCategory {
  id: string
  company_id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  default_priority: MaintenancePriority
  default_sla_hours: number | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MaintenancePriorityConfig {
  id: string
  company_id: string
  key: MaintenancePriority
  label: string
  color: string | null
  sla_hours: number | null
  sort_order: number
  is_active: boolean
}

export interface MaintenanceStaffProfile {
  id: string
  company_id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  trade: string | null
  skills: string[] | null
  is_internal: boolean
  color: string | null
  max_jobs_per_day: number | null
  notes: string | null
  is_active: boolean
  home_base_building_id: string | null
  hourly_rate: number | null
  callout_fee: number | null
  created_at: string
  updated_at: string
  // Joined / computed
  open_jobs?: number
  home_base_building?: Pick<Building, 'id' | 'name'> | null
}

export interface MaintenanceStatusHistory {
  id: string
  job_id: string
  from_status: MaintenanceStatus | null
  to_status: MaintenanceStatus
  note: string | null
  changed_by: string | null
  created_at: string
  // Joined
  changed_by_profile?: Profile | null
}

export interface MaintenanceAssignment {
  id: string
  job_id: string
  staff_id: string | null
  assigned_by: string | null
  scheduled_date: string | null
  unassigned_at: string | null
  note: string | null
  created_at: string
  // Joined
  staff?: MaintenanceStaffProfile | null
}

export interface MaintenanceChecklistItem {
  id: string
  job_id: string
  label: string
  is_done: boolean
  requires_photo: boolean
  done_by: string | null
  done_at: string | null
  sort_order: number
  created_at: string
}

export interface MaintenanceChecklistTemplate {
  id: string
  company_id: string
  category_id: string | null
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  items?: MaintenanceChecklistTemplateItem[]
}

export interface MaintenanceChecklistTemplateItem {
  id: string
  template_id: string
  label: string
  requires_photo: boolean
  sort_order: number
}

export interface MaintenanceMaterial {
  id: string
  job_id: string
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  supplier: string | null
  created_by: string | null
  created_at: string
}

export interface MaintenanceCost {
  id: string
  job_id: string
  cost_type: MaintenanceCostType | string
  description: string | null
  amount: number
  is_billable: boolean
  invoice_reference: string | null
  incurred_on: string | null
  created_by: string | null
  created_at: string
}

export interface MaintenanceAttachment {
  id: string
  job_id: string
  storage_path: string
  file_name: string | null
  content_type: string | null
  file_size: number | null
  attachment_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface MaintenanceNotification {
  id: string
  company_id: string
  recipient_id: string | null
  job_id: string | null
  type: string
  title: string
  body: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface RecurringMaintenanceOccurrence {
  id: string
  rule_id: string
  job_id: string | null
  due_date: string
  generated_at: string
  status: string
}

// ── Services & Invoicing ────────────────────────────────────────────────────────────

export type MaintenanceServiceUnit =
  | 'per_item'
  | 'per_hour'
  | 'flat_rate'
  | 'per_visit'
  | 'per_test'
  | 'per_point'

export interface MaintenanceService {
  id: string
  company_id: string
  category_id: string | null
  name: string
  description: string | null
  unit: MaintenanceServiceUnit
  base_price: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Joined
  category?: Pick<MaintenanceCategory, 'id' | 'name' | 'color'> | null
}

export type MaintenanceInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
export type MyobSyncStatus = 'not_synced' | 'pending' | 'synced' | 'failed'

export interface MaintenanceInvoice {
  id: string
  company_id: string
  invoice_number: string
  property_id: string | null
  owner_id: string | null
  status: MaintenanceInvoiceStatus
  issued_date: string | null
  due_date: string | null
  paid_date: string | null
  subtotal: number
  tax_rate: number
  notes: string | null
  myob_external_id: string | null
  myob_sync_status: MyobSyncStatus
  myob_sync_error: string | null
  myob_synced_at: string | null
  created_at: string
  updated_at: string
  // Joined
  property?: Pick<Property, 'id' | 'unit_number'> | null
  owner?: Pick<Owner, 'id' | 'first_name' | 'last_name' | 'company_name'> | null
  items?: MaintenanceInvoiceItem[]
}

export interface MaintenanceInvoiceItem {
  id: string
  invoice_id: string
  job_id: string | null
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  created_at: string
  // Joined
  service?: Pick<MaintenanceService, 'id' | 'name' | 'unit'> | null
  job?: Pick<MaintenanceJob, 'id' | 'job_number' | 'title'> | null
}

export interface MaintenanceTravelTime {
  id: string
  company_id: string
  from_building_id: string
  to_building_id: string
  travel_minutes: number
  // Joined
  from_building?: Pick<Building, 'id' | 'name'> | null
  to_building?: Pick<Building, 'id' | 'name'> | null
}

// Filters for the All Jobs view (typically sourced from URL searchParams)
export interface MaintenanceJobFilters {
  q?: string
  building?: string
  status?: string
  priority?: string
  category?: string
  staff?: string
  due?: 'overdue' | 'today' | 'week' | string
  tab?: string
}

// Options used to populate the New Request / filter dropdowns
export interface MaintenanceFormOptions {
  buildings: Pick<Building, 'id' | 'name'>[]
  properties: Pick<Property, 'id' | 'unit_number' | 'building_id'>[]
  tenants: Pick<Tenant, 'id' | 'first_name' | 'last_name'>[]
  categories: Pick<MaintenanceCategory, 'id' | 'name' | 'default_priority'>[]
  staff: Pick<MaintenanceStaffProfile, 'id' | 'full_name' | 'trade'>[]
}

export interface MaintenanceDashboardStats {
  open_jobs: number
  urgent_jobs: number
  overdue_jobs: number
  due_this_week: number
  completed_this_month: number
  avg_days_to_complete: number | null
}
