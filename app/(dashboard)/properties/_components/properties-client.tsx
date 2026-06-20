'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Home, Eye, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { PropertyStatusBadge } from '@/components/ui/badge'
import type { PropertyRow } from '@/lib/properties/queries'
import type { BuildingRow } from '@/lib/buildings/queries'

interface Props {
  properties: PropertyRow[]
  buildings: BuildingRow[]
  error: string | null
  activeFilters: {
    q?: string
    buildingId?: string
    status?: string
    type?: string
  }
}

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'maintenance_hold', label: 'Maintenance Hold' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'unavailable', label: 'Unavailable' },
]

const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Studio', label: 'Studio' },
  { value: '1 Bedroom', label: '1 Bedroom' },
  { value: '2 Bedroom', label: '2 Bedroom' },
  { value: '3 Bedroom', label: '3 Bedroom' },
]

export default function PropertiesClient({ properties, buildings, error, activeFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const sp = new URLSearchParams()
    if (activeFilters.q) sp.set('q', activeFilters.q)
    if (activeFilters.buildingId) sp.set('building', activeFilters.buildingId)
    if (activeFilters.status) sp.set('status', activeFilters.status)
    if (activeFilters.type) sp.set('type', activeFilters.type)
    if (value) sp.set(key, value)
    else sp.delete(key)
    const qs = sp.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const occupied = properties.filter((p) => p.status === 'occupied').length
  const available = properties.filter((p) => p.status === 'available').length
  const withTenant = properties.filter((p) => !!p.current_occupancy?.tenant).length
  const withOwner = properties.filter((p) => !!p.owner).length

  const isDbError =
    !!error &&
    (error.includes('connect') ||
      error.includes('relation') ||
      error.includes('supabase') ||
      error.includes('NEXT_PUBLIC'))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Portfolio</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {properties.length} properties · {occupied} occupied · {available} available
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {error && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            isDbError
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          {isDbError
            ? 'Database not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to see live data.'
            : error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: properties.length },
          { label: 'Occupied', value: occupied },
          { label: 'Available', value: available },
          { label: 'With Owner', value: withOwner },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-surface shadow-sm p-4">
            <p className="text-xs text-ink-subtle font-medium">{card.label}</p>
            <p className="text-2xl font-bold mt-1 text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
              <input
                defaultValue={activeFilters.q ?? ''}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="Search unit number..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder:text-ink-subtle"
              />
            </div>
            <select
              value={activeFilters.buildingId ?? ''}
              onChange={(e) => updateFilter('building', e.target.value)}
              className="text-sm border border-line rounded-lg px-3 py-2 bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={activeFilters.status ?? ''}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="text-sm border border-line rounded-lg px-3 py-2 bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={activeFilters.type ?? ''}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="text-sm border border-line rounded-lg px-3 py-2 bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="p-12 text-center">
            <Home className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
            <p className="text-sm text-ink-muted">
              {Object.values(activeFilters).some(Boolean)
                ? 'No properties match these filters.'
                : 'No properties yet. Add your first property to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  {['Unit', 'Building', 'Owner', 'Tenant', 'Type', 'Rent/wk', 'Status', 'Manager', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {properties.map((p) => {
                  const tenant = p.current_occupancy?.tenant
                  const owner = p.owner
                  const ownerDisplay = owner
                    ? (owner.company_name ?? `${owner.first_name} ${owner.last_name}`)
                    : null

                  return (
                    <tr key={p.id} className="hover:bg-canvas/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/properties/${p.id}`}
                          className="font-semibold text-ink hover:text-primary"
                        >
                          {p.unit_number}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-ink text-xs font-medium max-w-[160px] truncate">
                          {p.building?.name ?? '—'}
                        </p>
                        {p.building?.suburb && (
                          <p className="text-ink-faint text-[11px]">{p.building.suburb}</p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {ownerDisplay ? (
                          <div>
                            <p className="text-ink text-xs font-medium">{ownerDisplay}</p>
                            {owner?.email && (
                              <p className="text-ink-faint text-[11px]">{owner.email}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-ink-faint text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {tenant ? (
                          <div>
                            <Link
                              href={`/tenants/${tenant.id}`}
                              className="text-ink text-xs font-medium hover:text-primary"
                            >
                              {tenant.first_name} {tenant.last_name}
                            </Link>
                            {p.current_occupancy?.lease_end && (
                              <p className="text-ink-faint text-[11px]">
                                Ends {p.current_occupancy.lease_end}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span
                            className={cn(
                              'text-xs',
                              p.status === 'occupied' ? 'text-ink-muted' : 'text-ink-faint'
                            )}
                          >
                            {p.status === 'occupied' ? 'No tenant linked' : '—'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap">
                        {p.property_type ?? '—'}
                      </td>

                      <td className="px-4 py-3 font-medium text-ink text-xs whitespace-nowrap">
                        {p.rent_amount ? formatCurrency(p.rent_amount) : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <PropertyStatusBadge status={p.status} />
                      </td>

                      <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap">
                        {p.assigned_manager?.full_name ?? '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Link href={`/properties/${p.id}`}>
                            <button
                              className="p-1.5 rounded-md text-ink-subtle hover:text-ink-muted hover:bg-canvas"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/properties/${p.id}/edit`}>
                            <button
                              className="p-1.5 rounded-md text-ink-subtle hover:text-ink-muted hover:bg-canvas"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {withTenant < occupied && occupied > 0 && (
        <p className="text-[12px] text-ink-faint">
          {occupied - withTenant} occupied {occupied - withTenant === 1 ? 'unit has' : 'units have'} no
          tenant linked — link tenants via the{' '}
          <Link href="/tenants" className="text-primary hover:underline">
            Tenants
          </Link>{' '}
          module.
        </p>
      )}
    </div>
  )
}
