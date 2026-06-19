'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { PRIORITY_ORDER, PRIORITY_META, STATUS_ORDER, STATUS_META } from '@/lib/maintenance/constants'
import type { MaintenanceFormOptions } from '@/types'

interface Props {
  params: Record<string, string | undefined>
  buildings: MaintenanceFormOptions['buildings']
  categories: MaintenanceFormOptions['categories']
  staff: MaintenanceFormOptions['staff']
}

export function JobsFilters({ params, buildings, categories, staff }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(params.q ?? '')

  function push(patch: Record<string, string | undefined>) {
    const merged = { ...params, ...patch }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v)
    const qs = sp.toString()
    router.push(qs ? `/maintenance?${qs}` : '/maintenance')
  }

  const selectClass =
    'text-[13px] border border-line-strong rounded-lg px-3 py-1.5 bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-ring/50'

  const hasFilters = Boolean(
    params.q || params.building || params.category || params.staff || params.priority || params.status || params.due
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); push({ q: q || undefined }) }}
        className="relative flex-1 min-w-[200px]"
      >
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search job, number, description..."
          className="w-full pl-9 pr-4 py-2 text-[13px] bg-surface border border-line-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-ring/50 focus:border-primary text-ink placeholder:text-ink-faint"
        />
      </form>

      <select className={selectClass} value={params.building ?? ''} onChange={(e) => push({ building: e.target.value || undefined })}>
        <option value="">All buildings</option>
        {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <select className={selectClass} value={params.category ?? ''} onChange={(e) => push({ category: e.target.value || undefined })}>
        <option value="">All categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select className={selectClass} value={params.staff ?? ''} onChange={(e) => push({ staff: e.target.value || undefined })}>
        <option value="">All staff</option>
        <option value="unassigned">Unassigned</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
      </select>

      <select className={selectClass} value={params.priority ?? ''} onChange={(e) => push({ priority: e.target.value || undefined })}>
        <option value="">All priorities</option>
        {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
      </select>

      <select className={selectClass} value={params.status ?? ''} onChange={(e) => push({ status: e.target.value || undefined })}>
        <option value="">All statuses</option>
        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
      </select>

      {hasFilters && (
        <button
          onClick={() => { setQ(''); router.push(`/maintenance?tab=${params.tab ?? 'open'}`) }}
          className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink px-2 py-1.5 rounded-lg hover:bg-surface-muted"
        >
          <X className="h-3.5 w-3.5" />Clear
        </button>
      )}
    </div>
  )
}
