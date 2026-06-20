'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import type { ContractorRow } from '@/lib/maintenance/queries'
import { createContractor, toggleStaffActive } from '@/lib/maintenance/actions'

type Filter = 'all' | 'internal' | 'external'

interface Props {
  contractors: ContractorRow[]
  error: string | null
}

export default function ContractorsClient({ contractors, error }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const internalCount = contractors.filter(c => c.is_internal).length
  const externalCount = contractors.filter(c => !c.is_internal).length

  const filtered = contractors.filter(c => {
    if (filter === 'internal') return c.is_internal
    if (filter === 'external') return !c.is_internal
    return true
  })

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleStaffActive(id, !current)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setFormError(null)
    startTransition(async () => {
      const res = await createContractor({ error: null }, formData)
      if (res.error) setFormError(res.error)
      else { setShowModal(false); router.refresh() }
    })
  }

  const FILTERS: [Filter, string][] = [
    ['all', `All (${contractors.length})`],
    ['internal', `Internal (${internalCount})`],
    ['external', `External (${externalCount})`],
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">Contractors</h1>
              <p className="text-sm text-ink-muted">{contractors.length} staff &amp; contractors</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
        )}

        <div className="flex gap-2">
          {FILTERS.map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-surface border border-line text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
            <p className="text-sm text-ink-muted">No contractors found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line">
                <tr>
                  {['Name', 'Trade', 'Email', 'Phone'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                  ))}
                  {['Open Jobs', 'Type', 'Active'].map(h => (
                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-canvas/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />}
                        <span className="font-medium text-ink">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{c.trade ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-muted">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {c.open_jobs > 0
                        ? <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{c.open_jobs}</span>
                        : <span className="text-ink-subtle">0</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.is_internal ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {c.is_internal ? 'Internal' : 'External'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(c.id, c.is_active)}
                        disabled={isPending}
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          c.is_active ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          c.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Add Contractor / Staff</h2>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Full Name *</label>
                <input name="full_name" required className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Email</label>
                  <input name="email" type="email" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Phone</label>
                  <input name="phone" type="tel" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Trade</label>
                  <input name="trade" placeholder="e.g. Plumbing" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Colour</label>
                  <input name="color" type="color" defaultValue="#6B7280" className="w-full h-9 rounded-lg border border-line px-1 py-1 cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Type</label>
                <select name="is_internal" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="true">Internal (employee)</option>
                  <option value="false">External (contractor)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink">Cancel</button>
                <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                  {isPending ? 'Adding…' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
