import type { UserRole } from '@/types'

export type Module =
  | 'overview'
  | 'portfolio'
  | 'leasing'
  | 'maintenance'
  | 'electricity'
  | 'system'

const ROLE_MODULES: Partial<Record<UserRole, Module[]>> = {
  super_admin:      ['overview', 'portfolio', 'leasing', 'maintenance', 'electricity', 'system'],
  admin:            ['overview', 'portfolio', 'leasing', 'maintenance', 'electricity', 'system'],
  internal_manager: ['overview', 'portfolio', 'leasing', 'maintenance', 'electricity'],
  maintenance_staff: ['maintenance'],
  read_only:        ['overview', 'portfolio'],
  external_manager: ['portfolio', 'leasing'],
  referral_agent:   ['leasing'],
}

export function canAccessModule(role: string, module: Module): boolean {
  return (ROLE_MODULES[role as UserRole] ?? []).includes(module)
}

export function getAccessibleModules(role: string): Module[] {
  return ROLE_MODULES[role as UserRole] ?? []
}

// Maps the first URL path segment to a module for layout-level access guard.
export const SEGMENT_TO_MODULE: Record<string, Module> = {
  dashboard:    'overview',
  reporting:    'overview',
  portfolio:    'portfolio',
  buildings:    'portfolio',
  properties:   'portfolio',
  owners:       'portfolio',
  availability: 'portfolio',
  applications: 'leasing',
  tenants:      'leasing',
  agents:       'leasing',
  maintenance:  'maintenance',
  electricity:  'electricity',
  integrations: 'system',
  settings:     'system',
  users:        'system',
}

// Default landing route for each module.
export const MODULE_DEFAULT_ROUTE: Record<Module, string> = {
  overview:     '/dashboard',
  portfolio:    '/portfolio',
  leasing:      '/applications',
  maintenance:  '/maintenance',
  electricity:  '/electricity',
  system:       '/settings',
}
