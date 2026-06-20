// AI assistant tool functions
// Each function uses mock data today but is designed to be swapped for a live data source.
// To go live: replace the mock import and query logic inside each function.

import {
  mockBuildings,
  mockProperties,
  mockTenants,
  mockApplications,
  mockMaintenanceJobs,
  mockElectricityAccounts,
} from './mock-data'

export interface ToolResult {
  data: unknown
  dataUsed: string[]
  missingData?: string[]
}

// Resolve property code like "L127/101" or property id
function findProperty(ref: string) {
  return mockProperties.find(
    (p) => p.property_code === ref || p.id === ref || p.unit_number === ref
  )
}

export function getPropertySummary(propertyRef: string): ToolResult {
  const property = findProperty(propertyRef)
  if (!property) {
    return {
      data: null,
      dataUsed: ['Mock property records'],
      missingData: [`No property found matching "${propertyRef}"`],
    }
  }
  const building = mockBuildings.find((b) => b.id === property.building_id)
  const tenant = mockTenants.find((t) => t.property_id === property.id)
  const maintenanceJobs = mockMaintenanceJobs.filter((j) => j.property_id === property.id && j.completed_at === null)
  const electricityAccount = mockElectricityAccounts.find((e) => e.property_id === property.id)
  const applications = mockApplications.filter((a) => a.property_id === property.id && ['new', 'reviewing'].includes(a.status))

  return {
    data: { property, building, tenant, maintenanceJobs, electricityAccount, applications },
    dataUsed: [
      'Mock property record',
      building ? 'Mock building record' : null,
      tenant ? 'Mock tenant record' : null,
      maintenanceJobs.length ? `${maintenanceJobs.length} mock maintenance job(s)` : null,
      electricityAccount ? 'Mock electricity account' : null,
      applications.length ? `${applications.length} mock application(s)` : null,
    ].filter(Boolean) as string[],
    missingData: [
      !tenant && property.status === 'occupied' ? 'No tenant record linked' : null,
    ].filter(Boolean) as string[],
  }
}

export function getTenantStatus(propertyRef: string): ToolResult {
  const property = findProperty(propertyRef)
  const tenants = property
    ? mockTenants.filter((t) => t.property_id === property.id)
    : mockTenants.filter((t) => t.property_code === propertyRef)

  return {
    data: { tenants, property: property ?? null },
    dataUsed: ['Mock tenant records', 'Mock property record'],
    missingData: tenants.length === 0 ? ['No tenants found for this property'] : [],
  }
}

export function getVacancyStatus(propertyRef: string): ToolResult {
  const property = findProperty(propertyRef)
  if (!property) {
    return { data: null, dataUsed: ['Mock property records'], missingData: [`Property "${propertyRef}" not found`] }
  }
  return {
    data: {
      property_code: property.property_code,
      status: property.status,
      days_vacant: property.days_vacant,
      available_date: property.available_date,
      rent_amount: property.rent_amount,
    },
    dataUsed: ['Mock property record'],
  }
}

export function getApplicationsForProperty(propertyRef: string): ToolResult {
  const property = findProperty(propertyRef)
  const applications = property
    ? mockApplications.filter((a) => a.property_id === property.id)
    : []

  return {
    data: { applications, property: property ?? null },
    dataUsed: ['Mock application records'],
    missingData: applications.length === 0 ? ['No applications for this property'] : [],
  }
}

export function getOpenMaintenanceJobs(propertyRef?: string): ToolResult {
  const open = propertyRef
    ? mockMaintenanceJobs.filter(
        (j) => (j.property_code === propertyRef || j.property_id === findProperty(propertyRef)?.id) && !j.completed_at
      )
    : mockMaintenanceJobs.filter((j) => !j.completed_at)

  return {
    data: open,
    dataUsed: ['Mock maintenance job records'],
    missingData: open.length === 0 ? ['No open maintenance jobs found'] : [],
  }
}

export function getElectricityBillingStatus(propertyRef?: string): ToolResult {
  const accounts = propertyRef
    ? mockElectricityAccounts.filter(
        (e) => e.property_code === propertyRef || e.property_id === findProperty(propertyRef)?.id
      )
    : mockElectricityAccounts

  return {
    data: accounts,
    dataUsed: ['Mock electricity account records'],
    missingData: accounts.length === 0 ? ['No electricity accounts found'] : [],
  }
}

export function getPaymentStatus(propertyRef: string): ToolResult {
  const property = findProperty(propertyRef)
  const tenants = property ? mockTenants.filter((t) => t.property_id === property.id) : []
  const elec = property ? mockElectricityAccounts.find((e) => e.property_id === property.id) : null

  return {
    data: {
      tenants: tenants.map((t) => ({
        name: `${t.first_name} ${t.last_name}`,
        rent_payment_status: t.payment_status,
        electricity_balance_owing: t.electricity_balance_owing,
      })),
      electricity: elec
        ? {
            balance_owing: elec.current_balance_owing,
            ddr_status: elec.ddr_status,
            last_payment_date: elec.last_payment_date,
          }
        : null,
    },
    dataUsed: ['Mock tenant records', 'Mock electricity account records'],
  }
}

export function getVacantApartments(buildingRef?: string): ToolResult {
  const vacantStatuses = ['available', 'maintenance_hold', 'coming_soon', 'on_hold']
  let vacant = mockProperties.filter((p) => vacantStatuses.includes(p.status))

  if (buildingRef) {
    const building = mockBuildings.find(
      (b) => b.code === buildingRef || b.id === buildingRef || b.name.toLowerCase().includes(buildingRef.toLowerCase())
    )
    if (building) vacant = vacant.filter((p) => p.building_id === building.id)
  }

  const enriched = vacant.map((p) => {
    const blockingJobs = mockMaintenanceJobs.filter((j) => j.property_id === p.id && j.is_blocking_leasing && !j.completed_at)
    return { ...p, blocking_maintenance_jobs: blockingJobs }
  })

  // Sort: truly available first, then by days_vacant descending
  enriched.sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1
    if (b.status === 'available' && a.status !== 'available') return 1
    return b.days_vacant - a.days_vacant
  })

  return {
    data: enriched,
    dataUsed: ['Mock property records', 'Mock maintenance job records'],
  }
}

export function getApplicationsNeedingReview(): ToolResult {
  const needsReview = mockApplications.filter((a) => ['new', 'reviewing'].includes(a.status))

  const enriched = needsReview.map((a) => {
    const missing = Object.entries(a.documents)
      .filter(([, received]) => !received)
      .map(([doc]) => doc.replace(/_/g, ' '))

    return {
      ...a,
      missing_documents: missing,
      is_complete: missing.length === 0,
    }
  })

  // Sort: complete (ready to approve) first
  enriched.sort((a, b) => (b.is_complete ? 1 : 0) - (a.is_complete ? 1 : 0))

  return {
    data: enriched,
    dataUsed: ['Mock application records'],
  }
}

export function getMaintenanceBlockingLeasing(): ToolResult {
  const blocking = mockMaintenanceJobs.filter((j) => j.is_blocking_leasing && !j.completed_at)
  const enriched = blocking.map((j) => {
    const property = j.property_id ? mockProperties.find((p) => p.id === j.property_id) : null
    return { ...j, property }
  })

  return {
    data: enriched,
    dataUsed: ['Mock maintenance job records', 'Mock property records'],
  }
}

export function getOverdueElectricityAccounts(): ToolResult {
  const overdue = mockElectricityAccounts.filter(
    (e) => e.current_balance_owing > 0 || e.ddr_status === 'failed'
  )

  return {
    data: overdue,
    dataUsed: ['Mock electricity account records'],
    missingData: overdue.length === 0 ? ['No overdue electricity accounts found'] : [],
  }
}

export function getDailyOperationsSummary(): ToolResult {
  const openJobs = mockMaintenanceJobs.filter((j) => !j.completed_at)
  const urgentJobs = openJobs.filter((j) => j.priority === 'urgent')
  const overdueElectricity = mockElectricityAccounts.filter((e) => e.current_balance_owing > 0)
  const applicationsNeedingAction = mockApplications.filter((a) => ['new', 'reviewing'].includes(a.status))
  const vacantUnits = mockProperties.filter((p) => p.status === 'available')
  const maintenanceHolds = mockProperties.filter((p) => p.status === 'maintenance_hold')
  const blockingJobs = mockMaintenanceJobs.filter((j) => j.is_blocking_leasing && !j.completed_at)
  const unassignedJobs = openJobs.filter((j) => !j.assigned_to)

  return {
    data: {
      summary: {
        open_maintenance_jobs: openJobs.length,
        urgent_jobs: urgentJobs.length,
        unassigned_jobs: unassignedJobs.length,
        maintenance_blocking_leasing: blockingJobs.length,
        vacant_units: vacantUnits.length,
        maintenance_hold_units: maintenanceHolds.length,
        applications_needing_review: applicationsNeedingAction.length,
        overdue_electricity_accounts: overdueElectricity.length,
      },
      urgent_jobs: urgentJobs,
      blocking_jobs: blockingJobs,
      vacant_units: vacantUnits,
      overdue_electricity: overdueElectricity,
      applications_needing_review: applicationsNeedingAction,
    },
    dataUsed: [
      'Mock maintenance job records',
      'Mock property records',
      'Mock application records',
      'Mock electricity account records',
    ],
  }
}

// Tool registry for the AI to call
export const AI_TOOLS = {
  getPropertySummary,
  getTenantStatus,
  getVacancyStatus,
  getApplicationsForProperty,
  getOpenMaintenanceJobs,
  getElectricityBillingStatus,
  getPaymentStatus,
  getVacantApartments,
  getApplicationsNeedingReview,
  getMaintenanceBlockingLeasing,
  getOverdueElectricityAccounts,
  getDailyOperationsSummary,
} as const

export type ToolName = keyof typeof AI_TOOLS
