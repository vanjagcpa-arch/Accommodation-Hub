'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, RefreshCw, CheckCircle, Send } from 'lucide-react'
import type { MaintenanceInvoice, MaintenanceInvoiceItem, MaintenanceInvoiceStatus, MaintenanceServiceUnit } from '@/types'
import type { InvoiceFormOptions } from '@/lib/maintenance/queries'
import {
  addInvoiceItem,
  removeInvoiceItem,
  updateInvoiceStatus,
  syncInvoiceToMyob,
} from '@/lib/maintenance/actions'

const STATUS_STYLES: Record<MaintenanceInvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-slate-100 text-slate-400',
}

const UNIT_LABELS: Record<MaintenanceServiceUnit, string> = {
  flat_rate: 'flat',
  per_item: '/item',
  per_hour: '/hr',
  per_visit: '/visit',
  per_test: '/test',
  per_point: '/point',
}

function fmt(n: number) {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface AddItemForm {
  mode: 'service' | 'manual'
  serviceId: string
  description: string
  quantity: string
  unit_price: string
  job_id: string
}

const EMPTY_FORM: AddItemForm = {
  mode: 'service',
  serviceId: '',
  description: '',
  quantity: '1',
  unit_price: '0',
  job_id: '',
}

interface Props {
  invoice: MaintenanceInvoice
  formOptions: InvoiceFormOptions & { error: string | null }
}

export default function InvoiceDetail({ invoice, formOptions }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [showAddItem, setShowAddItem] = useState(false)
  const [form, setForm] = useState<AddItemForm>(EMPTY_FORM)
  const [actionError, setActionError] = useState<string | null>(null)

  const items = (invoice.items ?? []) as MaintenanceInvoiceItem[]
  const gst = (invoice.subtotal * (invoice.tax_rate / 100))
  const total = invoice.subtotal + gst

  const owner = invoice.owner as any
  const property = invoice.property as any
  const ownerName = owner?.company_name || [owner?.first_name, owner?.last_name].filter(Boolean).join(' ') || '—'

  function act(fn: () => Promise<void>) {
    setActionError(null)
    start(async () => {
      try { await fn() } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Action failed')
      }
    })
  }

  function handleServiceChange(serviceId: string) {
    const svc = formOptions.services.find(s => s.id === serviceId)
    setForm(f => ({
      ...f,
      serviceId,
      description: svc?.name ?? f.description,
      unit_price: svc ? String(svc.base_price) : f.unit_price,
    }))
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const description = form.mode === 'service'
      ? (formOptions.services.find(s => s.id === form.serviceId)?.name ?? form.description)
      : form.description
    if (!description) return

    act(async () => {
      const res = await addInvoiceItem(invoice.id, {
        description,
        quantity: Number(form.quantity) || 1,
        unit_price: Number(form.unit_price) || 0,
        service_id: form.mode === 'service' ? form.serviceId || null : null,
        job_id: form.job_id || null,
      })
      if (res.error) throw new Error(res.error)
      setShowAddItem(false)
      setForm(EMPTY_FORM)
      router.refresh()
    })
  }

  function handleRemoveItem(itemId: string) {
    act(async () => {
      const res = await removeInvoiceItem(itemId, invoice.id)
      if (res.error) throw new Error(res.error)
      router.refresh()
    })
  }

  function handleStatus(status: MaintenanceInvoiceStatus) {
    act(async () => {
      const res = await updateInvoiceStatus(invoice.id, status)
      if (res.error) throw new Error(res.error)
      router.refresh()
    })
  }

  function handleMyobSync() {
    act(async () => {
      const res = await syncInvoiceToMyob(invoice.id)
      if (res.error) throw new Error(res.error)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/maintenance/invoices"
            className="mb-2 flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-ink font-mono">{invoice.invoice_number}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Issued {fmtDate(invoice.issued_date)}
            {invoice.due_date ? ` · Due ${fmtDate(invoice.due_date)}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status === 'draft' && (
            <button
              onClick={() => handleStatus('sent')}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
            >
              <Send className="h-4 w-4" />Mark Sent
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
            <button
              onClick={() => handleStatus('paid')}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />Mark Paid
            </button>
          )}
          {invoice.myob_sync_status !== 'synced' && invoice.status !== 'draft' && (
            <button
              onClick={handleMyobSync}
              disabled={isPending || invoice.myob_sync_status === 'pending'}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${invoice.myob_sync_status === 'pending' ? 'animate-spin' : ''}`} />
              {invoice.myob_sync_status === 'pending' ? 'Syncing…' : 'Sync to MYOB'}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
      )}

      {/* Invoice meta */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">Owner</p>
          <p className="text-sm font-semibold text-ink">{ownerName}</p>
          {owner?.email && <p className="text-xs text-ink-muted mt-0.5">{owner.email}</p>}
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">Property</p>
          <p className="text-sm font-semibold text-ink">{property?.unit_number ? `Unit ${property.unit_number}` : '—'}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">MYOB</p>
          <p className={`text-sm font-semibold capitalize ${
            invoice.myob_sync_status === 'synced' ? 'text-green-600' :
            invoice.myob_sync_status === 'failed' ? 'text-red-600' :
            invoice.myob_sync_status === 'pending' ? 'text-amber-600' : 'text-ink-muted'
          }`}>
            {invoice.myob_sync_status.replace('_', ' ')}
          </p>
          {invoice.myob_external_id && (
            <p className="text-xs text-ink-muted font-mono mt-0.5">{invoice.myob_external_id}</p>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-sm font-semibold text-ink">Line Items</h2>
          {invoice.status === 'draft' && (
            <button
              onClick={() => { setShowAddItem(true); setForm(EMPTY_FORM) }}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />Add Item
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-subtle">
            No line items yet.{invoice.status === 'draft' ? ' Add services or manual charges above.' : ''}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                {['Description', 'Unit', 'Qty', 'Unit Price', 'Line Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">{h}</th>
                ))}
                {invoice.status === 'draft' && <th className="px-4 py-3 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map(item => {
                const svc = item.service as any
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-ink">
                      <div>{item.description}</div>
                      {(item.job as any)?.job_number && (
                        <div className="text-xs text-ink-muted font-mono">{(item.job as any).job_number}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted text-xs">
                      {svc ? (UNIT_LABELS[svc.unit as MaintenanceServiceUnit] ?? svc.unit) : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{item.quantity}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{fmt(item.unit_price)}</td>
                    <td className="px-4 py-3 font-mono font-medium text-ink">{fmt(item.quantity * item.unit_price)}</td>
                    {invoice.status === 'draft' && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isPending}
                          className="text-ink-subtle hover:text-neg disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div className="border-t border-line bg-canvas px-5 py-4">
          <div className="ml-auto w-64 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-muted">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-muted">
              <span>GST ({invoice.tax_rate}%)</span>
              <span className="font-mono">{fmt(gst)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-ink border-t border-line pt-1.5">
              <span>Total</span>
              <span className="font-mono">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Notes</p>
          <p className="text-sm text-ink whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-base font-semibold text-ink">Add Line Item</h2>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="flex gap-2">
                {(['service', 'manual'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, mode: m }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.mode === m ? 'bg-primary text-white' : 'border border-line text-ink-muted hover:text-ink'
                    }`}
                  >
                    {m === 'service' ? 'From catalog' : 'Manual entry'}
                  </button>
                ))}
              </div>

              {form.mode === 'service' ? (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Service *</label>
                  <select
                    required
                    value={form.serviceId}
                    onChange={e => handleServiceChange(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select service…</option>
                    {formOptions.services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {fmt(s.base_price)} {UNIT_LABELS[s.unit as MaintenanceServiceUnit] ?? ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description *</label>
                  <input
                    required
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink mb-1">Link to job (optional)</label>
                <select
                  value={form.job_id}
                  onChange={e => setForm(f => ({ ...f, job_id: e.target.value }))}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">No linked job</option>
                  {formOptions.jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.job_number ? `${j.job_number} — ` : ''}{j.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Unit price (AUD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.unit_price}
                    onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {form.quantity && form.unit_price && (
                <p className="text-sm text-ink-muted">
                  Line total: <span className="font-mono font-medium text-ink">
                    {fmt((Number(form.quantity) || 0) * (Number(form.unit_price) || 0))}
                  </span>
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? 'Adding…' : 'Add item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
