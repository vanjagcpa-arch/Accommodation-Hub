'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, X, Pencil, ExternalLink, ChevronLeft, ChevronRight,
  MoreHorizontal, FileText, Building2, Download, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, PropertyStatusBadge } from '@/components/ui/badge'
import type { PortfolioRow, SourceRef } from '../page'
import type { PropertyStatus } from '@/types'

// ── Badge helpers ─────────────────────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-xs text-ink-faint">—</span>
  const cfg: Record<string, { label: string; variant: 'info' | 'purple' | 'gray' | 'warning' }> = {
    reapit:   { label: 'Reapit',    variant: 'info' },
    listonce: { label: 'ListOnce',  variant: 'purple' },
    manual:   { label: 'Manual',    variant: 'gray' },
    external: { label: 'External',  variant: 'warning' },
  }
  const c = cfg[source] ?? { label: source, variant: 'gray' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

function SyncBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-ink-faint">—</span>
  const cfg: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'gray' }> = {
    synced:        { label: 'Synced',         variant: 'success' },
    needs_review:  { label: 'Needs review',   variant: 'warning' },
    pending:       { label: 'Pending',         variant: 'gray' },
    error:         { label: 'Error',           variant: 'danger' },
    not_connected: { label: 'Not connected',   variant: 'gray' },
  }
  const c = cfg[status] ?? { label: status, variant: 'gray' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

function ManagedBadge({ status }: { status: string }) {
  return status === 'external'
    ? <Badge variant="gray">External</Badge>
    : <Badge variant="success">Managed by Us</Badge>
}

// ── Date helpers ────────────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtLastUpdated(iso: string) {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) {
    return `Today, ${d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  }
  return fmtDate(iso)
}

// ── Source ref helpers ──────────────────────────────────────────────────────────────────────

function getRef(refs: SourceRef[], source: 'reapit' | 'listonce') {
  return refs.find(r => r.source === source) ?? null
}

// ── Property Drawer ─────────────────────────────────────────────────────────────────────

type DrawerTab = 'summary' | 'tenancy' | 'activity' | 'services'

function PropertyDrawer({
  property,
  onClose,
}: {
  property: PortfolioRow
  onClose: () => void
}) {
  const [tab, setTab] = useState<DrawerTab>('summary')
  const [manualOverride, setManualOverride] = useState(property.manual_override)

  useEffect(() => {
    setTab('summary')
    setManualOverride(property.manual_override)
  }, [property.id, property.manual_override])

  const ownerName = property.owner
    ? (property.owner.company_name ?? `${property.owner.first_name} ${property.owner.last_name}`)
    : null
  const tenantName = property.current_tenant
    ? `${property.current_tenant.first_name} ${property.current_tenant.last_name}`
    : null
  const pmName = property.assigned_manager?.full_name ?? null

  const reapitRef = getRef(property.source_refs, 'reapit')
  const listonceRef = getRef(property.source_refs, 'listonce')
  const syncStatus = reapitRef?.sync_status ?? listonceRef?.sync_status ?? null

  const TABS: { id: DrawerTab; label: string }[] = [
    { id: 'summary',   label: 'Summary' },
    { id: 'tenancy',   label: 'Tenancy' },
    { id: 'activity',  label: 'Activity' },
    { id: 'services',  label: 'Services' },
  ]

  function ExternalRefRow({
    label, ref, fallbackId,
  }: {
    label: string
    ref: SourceRef | null
    fallbackId: string | null
  }) {
    if (ref) {
      return (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted shrink-0 w-24">{label}</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-ink font-mono text-xs truncate">{ref.external_id ?? fallbackId ?? '—'}</span>
            <SyncBadge status={ref.sync_status} />
            <button className="text-ink-faint hover:text-ink-muted shrink-0" title="Open in external system">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )
    }
    if (fallbackId) {
      return (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted shrink-0 w-24">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-ink font-mono text-xs">{fallbackId}</span>
            <Badge variant="gray">Not synced</Badge>
          </div>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted shrink-0 w-24">{label}</span>
        <span className="text-xs text-ink-faint">Not mapped</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-ink leading-tight">
              {property.building.name}, {property.unit_number}
            </h2>
            {syncStatus && <SyncBadge status={syncStatus} />}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-ink-subtle hover:bg-surface-muted hover:text-ink shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-line px-4 shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5 min-h-0">
        {tab === 'summary' && (
          <>
            <section>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Property Overview
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Building',  value: property.building.name },
                  { label: 'Apartment', value: property.unit_number },
                  {
                    label: 'Address',
                    value: [property.building.address, property.building.suburb].filter(Boolean).join(', '),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-ink-muted shrink-0 w-24">{label}</span>
                    <span className="text-ink text-right">{value || '—'}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink-muted shrink-0 w-24">Availability</span>
                  <PropertyStatusBadge status={property.status as PropertyStatus} />
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-ink-muted shrink-0 w-24">Managed Status</span>
                  <ManagedBadge status={property.managed_status} />
                </div>
              </div>
            </section>

            <div className="border-t border-line" />

            <section>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Canonical (Master) Records
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Owner (Canonical)',  value: ownerName },
                  { label: 'Property Manager',   value: pmName },
                  { label: 'Tenant (Canonical)', value: tenantName },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-ink-muted shrink-0 w-36">{label}</span>
                    <span className="text-ink font-medium text-right">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="border-t border-line" />

            <section>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
                External Source Mappings
              </h3>
              <div className="space-y-2.5">
                <ExternalRefRow label="Reapit ID"   ref={reapitRef}   fallbackId={property.reapit_external_id} />
                <ExternalRefRow label="ListOnce ID" ref={listonceRef} fallbackId={property.listonce_external_id} />
              </div>
            </section>

            <div className="border-t border-line" />

            <section>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Manual Override
              </h3>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-ink">Override canonical values for this apartment</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    When enabled, changes here will not be overwritten by source updates.
                  </p>
                </div>
                <button
                  onClick={() => setManualOverride(v => !v)}
                  role="switch"
                  aria-checked={manualOverride}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    manualOverride ? 'bg-primary' : 'bg-line-strong'
                  )}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                      manualOverride ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              {manualOverride && (
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Manual override is active — sync will not update this property.
                </p>
              )}
            </section>

            <div className="border-t border-line" />

            <section>
              <h3 className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-3">
                Additional Details
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Created',         value: fmtDate(property.created_at) },
                  { label: 'Last Updated',    value: fmtLastUpdated(property.updated_at) },
                  {
                    label: 'Last Updated By',
                    value: reapitRef?.sync_status === 'synced'
                      ? 'System (Reapit Sync)'
                      : listonceRef?.sync_status === 'synced'
                        ? 'System (ListOnce Sync)'
                        : 'System',
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-ink-muted shrink-0 w-32">{label}</span>
                    <span className="text-ink text-right">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'tenancy' && (
          <div>
            {tenantName ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-line bg-surface-muted">
                  <p className="text-sm font-semibold text-ink">{tenantName}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Current tenant</p>
                </div>
                <Link
                  href={`/tenants/${property.current_tenant?.id}`}
                  className="inline-flex text-sm font-medium text-primary hover:text-primary-hover"
                >
                  View tenant profile →
                </Link>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-ink-muted">No active tenant for this property.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted">Sync activity log coming soon.</p>
          </div>
        )}

        {tab === 'services' && (
          <div className="py-10 text-center">
            <p className="text-sm text-ink-muted">Linked services coming soon.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-line px-5 py-3 flex items-center justify-between gap-3 shrink-0">
        <Link
          href={`/properties/${property.id}`}
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          View full details →
        </Link>
        <Link
          href={`/properties/${property.id}/edit`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>
    </div>
  )
}

// ── Main Portfolio Client ───────────────────────────────────────────────────────────────────────────

const PER_PAGE = 25

const SELECT_CLS =
  'text-sm border border-line rounded-lg px-3 py-2 bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/50'

const TABLE_HEADERS = [
  'Building', 'Apartment', 'Address', 'Managed', 'Tenant',
  'Owner', 'Property Manager', 'Availability',
  'Owner Source', 'PM Source', 'Tenant Source',
  'Reapit Sync', 'ListOnce Sync', 'Services',
]

export default function PortfolioClient({
  rows: allRows,
  buildings,
  error,
}: {
  rows: PortfolioRow[]
  buildings: { id: string; name: string }[]
  error: string | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [managedFilter, setManagedFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)

  const selectedProperty = useMemo(
    () => allRows.find(r => r.id === selectedId) ?? null,
    [allRows, selectedId]
  )

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allRows.filter(row => {
      if (q) {
        const addr = `${row.building.address} ${row.building.suburb ?? ''}`.toLowerCase()
        const tenant = row.current_tenant
          ? `${row.current_tenant.first_name} ${row.current_tenant.last_name}`.toLowerCase()
          : ''
        const owner = row.owner
          ? (row.owner.company_name ?? `${row.owner.first_name} ${row.owner.last_name}`).toLowerCase()
          : ''
        const pm = row.assigned_manager?.full_name?.toLowerCase() ?? ''
        if (
          !row.building.name.toLowerCase().includes(q) &&
          !row.unit_number.toLowerCase().includes(q) &&
          !addr.includes(q) &&
          !tenant.includes(q) &&
          !owner.includes(q) &&
          !pm.includes(q)
        ) return false
      }
      if (buildingFilter && row.building.id !== buildingFilter) return false
      if (managedFilter && row.managed_status !== managedFilter) return false
      if (availabilityFilter && row.status !== availabilityFilter) return false
      if (sourceFilter) {
        if (sourceFilter === 'reapit'   && !row.reapit_external_id)  return false
        if (sourceFilter === 'listonce' && !row.listonce_external_id) return false
        if (sourceFilter === 'manual'   && (row.reapit_external_id || row.listonce_external_id)) return false
      }
      return true
    })
  }, [allRows, search, buildingFilter, managedFilter, availabilityFilter, sourceFilter])

  useEffect(() => { setPage(1) }, [search, buildingFilter, managedFilter, availabilityFilter, sourceFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE))
  const paginatedRows = filteredRows.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalApartments = allRows.length
  const managedCount    = allRows.filter(r => r.managed_status !== 'external').length
  const externalCount   = allRows.filter(r => r.managed_status === 'external').length
  const availableCount  = allRows.filter(r => r.status === 'available').length
  const buildingCount   = new Set(allRows.map(r => r.building.id)).size

  function pct(n: number) {
    return totalApartments > 0 ? `${Math.round((n / totalApartments) * 100)}% of total` : '0% of total'
  }

  function updateFilter<T extends string>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  function toggleRow(id: string) {
    setSelectedId(prev => (prev === id ? null : id))
  }

  function pageNumbers(): number[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5]
    if (page >= totalPages - 3) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [page - 2, page - 1, page, page + 1, page + 2]
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Portfolio</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Master portfolio of all buildings and apartments across all sources.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted">
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Apartment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Apartments',   value: totalApartments, sub: `Across ${buildingCount} building${buildingCount !== 1 ? 's' : ''}` },
          { label: 'Managed by Us',      value: managedCount,    sub: pct(managedCount) },
          { label: 'Externally Managed', value: externalCount,   sub: pct(externalCount) },
          { label: 'Available',          value: availableCount,  sub: `${totalApartments > 0 ? ((availableCount / totalApartments) * 100).toFixed(1) : '0.0'}% of total` },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-line bg-surface shadow-sm p-4">
            <p className="text-xs text-ink-subtle font-medium">{card.label}</p>
            <p className="text-2xl font-bold mt-1 text-ink">{card.value}</p>
            <p className="text-xs text-ink-faint mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error.includes('managed_status') || error.includes('property_source_refs')
            ? 'Portfolio migration has not been applied. Run supabase/migrations/007_portfolio_source_tracking.sql to enable source tracking.'
            : error}
        </div>
      )}

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 rounded-xl border border-line bg-surface overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="flex flex-wrap gap-2.5">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by building, apartment, address, tenant, owner..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-canvas border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder:text-ink-subtle"
                />
              </div>
              <select value={buildingFilter} onChange={e => updateFilter(setBuildingFilter, e.target.value)} className={SELECT_CLS}>
                <option value="">Building: All</option>
                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={managedFilter} onChange={e => updateFilter(setManagedFilter, e.target.value)} className={SELECT_CLS}>
                <option value="">Managed Status: All</option>
                <option value="managed">Managed by Us</option>
                <option value="external">Externally Managed</option>
              </select>
              <select value={availabilityFilter} onChange={e => updateFilter(setAvailabilityFilter, e.target.value)} className={SELECT_CLS}>
                <option value="">Availability: All</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="on_hold">On Hold</option>
                <option value="maintenance_hold">Maintenance Hold</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="unavailable">Unavailable</option>
              </select>
              <select value={sourceFilter} onChange={e => updateFilter(setSourceFilter, e.target.value)} className={SELECT_CLS}>
                <option value="">Source: All</option>
                <option value="reapit">Reapit</option>
                <option value="listonce">ListOnce</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center px-4 py-2 bg-canvas/40 border-b border-line">
            <p className="text-xs text-ink-muted">
              {filteredRows.length.toLocaleString()} result{filteredRows.length !== 1 ? 's' : ''}
              {filteredRows.length !== allRows.length && (
                <span className="text-ink-faint"> (filtered from {allRows.length.toLocaleString()})</span>
              )}
            </p>
          </div>

          {paginatedRows.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
              <p className="text-sm text-ink-muted">
                {allRows.length === 0
                  ? 'No properties found. Add your first property to get started.'
                  : 'No properties match these filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-canvas border-b border-line">
                  <tr>
                    {TABLE_HEADERS.map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paginatedRows.map(row => {
                    const ownerDisplay = row.owner
                      ? (row.owner.company_name ?? `${row.owner.first_name} ${row.owner.last_name}`)
                      : null
                    const tenantDisplay = row.current_tenant
                      ? `${row.current_tenant.first_name} ${row.current_tenant.last_name}`
                      : null
                    const reapitRef = getRef(row.source_refs, 'reapit')
                    const listonceRef = getRef(row.source_refs, 'listonce')
                    const isSelected = row.id === selectedId

                    return (
                      <tr
                        key={row.id}
                        onClick={() => toggleRow(row.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-primary-soft border-l-[3px] border-l-primary'
                            : 'hover:bg-canvas/60'
                        )}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 max-w-[140px]">
                            <Building2 className="h-3.5 w-3.5 text-ink-faint shrink-0" />
                            <span className="font-medium text-ink text-xs truncate">{row.building.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-semibold text-ink text-xs">{row.unit_number}</span>
                        </td>
                        <td className="px-3 py-3 max-w-[180px]">
                          <span className="text-xs text-ink-muted truncate block">
                            {[row.building.address, row.building.suburb].filter(Boolean).join(', ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <ManagedBadge status={row.managed_status ?? 'managed'} />
                        </td>
                        <td className="px-3 py-3 max-w-[130px]">
                          {tenantDisplay
                            ? <span className="text-xs text-ink truncate block">{tenantDisplay}</span>
                            : <span className="text-xs text-ink-faint">—</span>}
                        </td>
                        <td className="px-3 py-3 max-w-[150px]">
                          {ownerDisplay
                            ? <span className="text-xs text-ink truncate block">{ownerDisplay}</span>
                            : <span className="text-xs text-ink-faint">—</span>}
                        </td>
                        <td className="px-3 py-3 max-w-[130px]">
                          {row.assigned_manager?.full_name
                            ? <span className="text-xs text-ink truncate block">{row.assigned_manager.full_name}</span>
                            : <span className="text-xs text-ink-faint">—</span>}
                        </td>
                        <td className="px-3 py-3">
                          <PropertyStatusBadge status={row.status as PropertyStatus} />
                        </td>
                        <td className="px-3 py-3"><SourceBadge source={row.owner_source} /></td>
                        <td className="px-3 py-3"><SourceBadge source={row.pm_source} /></td>
                        <td className="px-3 py-3"><SourceBadge source={row.tenant_source} /></td>
                        <td className="px-3 py-3">
                          <SyncBadge status={reapitRef?.sync_status ?? (row.reapit_external_id ? 'pending' : null)} />
                        </td>
                        <td className="px-3 py-3">
                          <SyncBadge status={listonceRef?.sync_status ?? (row.listonce_external_id ? 'pending' : null)} />
                        </td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <Link href={`/properties/${row.id}/edit`}>
                              <button className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-canvas" title="Edit">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                            <button className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-canvas" title="Documents">
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-canvas" title="More actions">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-line">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span>Rows per page</span>
                <span className="font-semibold">{PER_PAGE}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-md text-ink-subtle hover:bg-surface-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers().map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors',
                      page === n ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-muted'
                    )}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 7 && page < totalPages - 3 && (
                  <>
                    <span className="text-ink-faint text-xs px-1">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="min-w-[28px] h-7 rounded-md text-xs font-medium text-ink-muted hover:bg-surface-muted"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded-md text-ink-subtle hover:bg-surface-muted disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedProperty && (
          <div
            className="w-[400px] shrink-0 rounded-xl border border-line bg-surface overflow-hidden flex flex-col"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <PropertyDrawer property={selectedProperty} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
