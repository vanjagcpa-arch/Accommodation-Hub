'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Tag } from 'lucide-react'
import type { MaintenanceService, MaintenanceServiceUnit, MaintenanceCategory } from '@/types'
import { createService, updateService, toggleServiceActive } from '@/lib/maintenance/actions'

const UNIT_LABELS: Record<MaintenanceServiceUnit, string> = {
  flat_rate: 'Flat rate',
  per_item: 'Per item',
  per_hour: 'Per hour',
  per_visit: 'Per visit',
  per_test: 'Per test',
  per_point: 'Per point',
}

const UNITS: MaintenanceServiceUnit[] = ['flat_rate', 'per_item', 'per_hour', 'per_visit', 'per_test', 'per_point']

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

interface Props {
  services: MaintenanceService[]
  categories: Pick<MaintenanceCategory, 'id' | 'name' | 'default_priority'>[]
  error: string | null
}

interface ModalState {
  open: boolean
  editing: MaintenanceService | null
}

export default function ServicesClient({ services, categories, error }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null })
  const [formError, setFormError] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<string>('all')

  const visible = catFilter === 'all'
    ? services
    : services.filter(s => s.category_id === catFilter)

  function openAdd() { setModal({ open: true, editing: null }); setFormError(null) }
  function openEdit(s: MaintenanceService) { setModal({ open: true, editing: s }); setFormError(null) }
  function closeModal() { setModal({ open: false, editing: null }); setFormError(null) }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setFormError(null)
    start(async () => {
      const res = modal.editing
        ? await updateService(modal.editing.id, { error: null }, fd)
        : await createService({ error: null }, fd)
      if (res.error) { setFormError(res.error); return }
      closeModal()
      router.refresh()
    })
  }

  function handleToggle(id: string, current: boolean) {
    start(async () => {
      const res = await toggleServiceActive(id, !current)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  const grouped: Record<string, MaintenanceService[]> = {}
  for (const s of visible) {
    const key = (s.category as any)?.name ?? 'Uncategorised'
    ;(grouped[key] ??= []).push(s)
  }

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              catFilter === 'all' ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            All ({services.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                catFilter === c.id ? 'bg-primary text-white' : 'border border-line bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />Add Service
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
          <p className="text-sm font-medium text-ink mb-1">No services yet</p>
          <p className="text-xs text-ink-muted">Add services like Test &amp; Tag, Gas Check, Appliance Inspection…</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">{cat}</h3>
              <div className="rounded-xl border border-line bg-surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-line bg-canvas">
                    <tr>
                      {['Service', 'Description', 'Unit', 'Price', 'Active'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                      ))}
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {items.map(s => (
                      <tr key={s.id} className={`hover:bg-canvas/50 ${!s.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                        <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{s.description ?? '—'}</td>
                        <td className="px-4 py-3 text-ink-muted">{UNIT_LABELS[s.unit] ?? s.unit}</td>
                        <td className="px-4 py-3 font-mono text-ink">{fmt(s.base_price)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(s.id, s.is_active)}
                            disabled={isPending}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                              s.is_active ? 'bg-primary' : 'bg-slate-200'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                              s.is_active ? 'translate-x-4' : 'translate-x-1'
                            }`} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => openEdit(s)} className="text-ink-subtle hover:text-ink">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">
                {modal.editing ? 'Edit Service' : 'Add Service'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={modal.editing?.name}
                  placeholder="e.g. Test &amp; Tag (per point)"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={modal.editing?.description ?? ''}
                  placeholder="What does this service cover?"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <select
                    name="category_id"
                    defaultValue={modal.editing?.category_id ?? ''}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">No category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Pricing unit</label>
                  <select
                    name="unit"
                    defaultValue={modal.editing?.unit ?? 'flat_rate'}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Base price (AUD) *</label>
                  <input
                    name="base_price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={modal.editing?.base_price ?? 0}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Sort order</label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={modal.editing?.sort_order ?? 0}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : modal.editing ? 'Save changes' : 'Add service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
