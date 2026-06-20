'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import type { MaintenanceInvoice, MaintenanceInvoiceStatus } from '@/types'
import type { InvoiceFormOptions } from '@/lib/maintenance/queries'
import { createInvoice } from '@/lib/maintenance/actions'

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
]

const STATUS_STYLES: Record<MaintenanceInvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-400 line-through',
}

const MYOB_STYLES: Record<string, string> = {
  not_synced: 'text-ink-subtle',
  pending: 'text-amber-600',
  synced: 'text-green-600',
  failed: 'text-red-600',
}

const MYOB_LABELS: Record<string, string> = {
  not_synced: 'Not synced',
  pending: 'Pending',
  synced: 'Synced',
  failed: 'Failed',
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ownerLabel(inv: MaintenanceInvoice) {
  const o = inv.owner as any
  if (!o) return '—'
  return o.company_name || [o.first_name, o.last_name].filter(Boolean).join(' ') || '—'
}

interface Props {
  invoices: MaintenanceInvoice[]
  error: string | null
  currentStatus: string
  formOptions: InvoiceFormOptions & { error: string | null }
}

export default function InvoicesClient({ invoices, error, currentStatus, formOptions }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setFormError(null)
    start(async () => {
      const res = await createInvoice({ error: null }, fd)
      if (res.error) { setFormError(res.error); return }
      setShowModal(false)
      const id = (res as any).id as string | undefined
      if (id) router.push(`/maintenance/invoices/${id}`)
      else router.refresh()
    })
  }

  return (
    <div className="p-6 space-y-5">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(t => (
            <Link
              key={t.key}
              href={`/maintenance/invoices?status=${t.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                currentStatus === t.key
                  ? 'bg-primary text-white'
                  : 'border border-line bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(null) }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />New Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
          <p className="text-sm font-medium text-ink mb-1">No invoices</p>
          <p className="text-xs text-ink-muted">Create your first owner invoice to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                {['Invoice #', 'Owner', 'Property', 'Issued', 'Due', 'Amount', 'Status', 'MYOB'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-canvas/50">
                  <td className="px-4 py-3">
                    <Link href={`/maintenance/invoices/${inv.id}`} className="font-mono text-primary hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{ownerLabel(inv)}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {(inv.property as any)?.unit_number ? `Unit ${(inv.property as any).unit_number}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{fmtDate(inv.issued_date)}</td>
                  <td className="px-4 py-3 text-ink-muted">{fmtDate(inv.due_date)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{fmt(inv.subtotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[inv.status] ?? ''}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${MYOB_STYLES[inv.myob_sync_status] ?? ''}`}>
                    {MYOB_LABELS[inv.myob_sync_status] ?? inv.myob_sync_status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">New Invoice</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Owner *</label>
                <select
                  name="owner_id"
                  required
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select owner…</option>
                  {formOptions.owners.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.company_name || [o.first_name, o.last_name].filter(Boolean).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Property</label>
                <select
                  name="property_id"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">No specific property</option>
                  {formOptions.properties.map(p => (
                    <option key={p.id} value={p.id}>Unit {p.unit_number}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Issue date</label>
                  <input
                    name="issued_date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Due date</label>
                  <input
                    name="due_date"
                    type="date"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">GST rate (%)</label>
                <input
                  name="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="10"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Creating…' : 'Create invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
