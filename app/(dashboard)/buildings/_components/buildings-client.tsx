'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, MapPin, Zap, Wrench, Eye, Pencil, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BuildingRow } from '@/lib/buildings/queries'
import { toggleBuildingElectricity, toggleBuildingMaintenance } from '@/lib/buildings/actions'

interface Props {
  buildings: BuildingRow[]
  error: string | null
}

function ServiceToggle({
  enabled,
  onChange,
  isPending,
}: {
  enabled: boolean
  onChange: () => void
  isPending: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={isPending}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50',
        enabled ? 'bg-primary' : 'bg-slate-200'
      )}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export default function BuildingsClient({ buildings: initial, error }: Props) {
  const [buildings, setBuildings] = useState(initial)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const electricityCount = buildings.filter((b) => b.manages_electricity).length
  const maintenanceCount = buildings.filter((b) => b.manages_maintenance).length
  const totalProperties = buildings.reduce((s, b) => s + b.total_properties, 0)
  const totalOccupied = buildings.reduce((s, b) => s + b.occupied_count, 0)

  const filtered = buildings.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  )

  function handleToggleElectricity(id: string, current: boolean) {
    const next = !current
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, manages_electricity: next } : b)))
    startTransition(async () => {
      const res = await toggleBuildingElectricity(id, next)
      if (res.error) {
        setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, manages_electricity: current } : b)))
        alert(res.error)
      }
    })
  }

  function handleToggleMaintenance(id: string, current: boolean) {
    const next = !current
    setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, manages_maintenance: next } : b)))
    startTransition(async () => {
      const res = await toggleBuildingMaintenance(id, next)
      if (res.error) {
        setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, manages_maintenance: current } : b)))
        alert(res.error)
      }
    })
  }

  const isDbError =
    !!error &&
    (error.includes('connect') ||
      error.includes('relation') ||
      error.includes('supabase') ||
      error.includes('NEXT_PUBLIC'))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Buildings</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {buildings.length} buildings · {totalProperties} properties ·{' '}
            {totalProperties > 0 ? Math.round((totalOccupied / totalProperties) * 100) : 0}% occupied ·{' '}
            {electricityCount} electricity · {maintenanceCount} maintenance
          </p>
        </div>
        <Link
          href="/buildings/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Building
        </Link>
      </div>

      {/* Error banner */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Buildings', value: buildings.length },
          { label: 'Total Properties', value: totalProperties },
          { label: 'Occupied', value: totalOccupied },
          { label: 'Electricity', value: electricityCount },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-surface shadow-sm p-4">
            <p className="text-xs text-ink-subtle font-medium">{card.label}</p>
            <p className="text-2xl font-bold mt-1 text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Info banners */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink-muted">
            Enable <span className="font-semibold text-ink">Electricity</span> to include this building&apos;s
            properties in the{' '}
            <Link href="/electricity" className="text-primary hover:underline font-medium">
              Electricity Billing
            </Link>{' '}
            module.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3">
          <Wrench className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink-muted">
            Enable <span className="font-semibold text-ink">Maintenance</span> to include this building in the{' '}
            <Link href="/maintenance" className="text-primary hover:underline font-medium">
              Maintenance
            </Link>{' '}
            module.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buildings..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder:text-ink-subtle"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
            <p className="text-sm text-ink-muted">
              {search ? 'No buildings match your search.' : 'No buildings yet. Add your first building to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  {['Building', 'Address', 'Properties', 'Occupancy', 'Manager', 'Electricity', 'Maintenance', ''].map(
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
                {filtered.map((b) => {
                  const rate =
                    b.total_properties > 0 ? Math.round((b.occupied_count / b.total_properties) * 100) : 0
                  const managerName = (b.primary_manager as { full_name: string | null } | null)?.full_name
                  return (
                    <tr key={b.id} className="hover:bg-canvas/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-shrink-0 w-7 h-7 bg-primary-soft rounded-lg flex items-center justify-center">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="font-medium text-ink">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-ink-subtle mt-0.5 shrink-0" />
                          <span className="text-ink-muted text-xs">
                            {b.address}
                            {b.suburb ? `, ${b.suburb}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink">{b.total_properties}</span>
                        <span className="text-ink-subtle text-xs ml-1">units</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs gap-3">
                            <span className="text-ink-muted">
                              {b.occupied_count}/{b.total_properties}
                            </span>
                            <span className="font-semibold text-ink">{rate}%</span>
                          </div>
                          <div className="w-16 h-1.5 bg-line rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs">{managerName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ServiceToggle
                            enabled={b.manages_electricity}
                            onChange={() => handleToggleElectricity(b.id, b.manages_electricity)}
                            isPending={isPending}
                          />
                          {b.manages_electricity && <Zap className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ServiceToggle
                            enabled={b.manages_maintenance}
                            onChange={() => handleToggleMaintenance(b.id, b.manages_maintenance)}
                            isPending={isPending}
                          />
                          {b.manages_maintenance && <Wrench className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Link href={`/buildings/${b.id}`}>
                            <button
                              className="p-1.5 rounded-md text-ink-subtle hover:text-ink-muted hover:bg-canvas"
                              title="View"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/buildings/${b.id}/edit`}>
                            <button
                              className="p-1.5 rounded-md text-ink-subtle hover:text-ink-muted hover:bg-canvas"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/properties?building=${b.id}`}>
                            <button
                              className="p-1.5 rounded-md text-ink-subtle hover:text-ink-muted hover:bg-canvas"
                              title="Properties"
                            >
                              <Users className="h-3.5 w-3.5" />
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
    </div>
  )
}
