'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Clock } from 'lucide-react'
import type { RecurringRuleRow } from '@/lib/maintenance/queries'
import { createRecurringRule, toggleRecurringRule, generateJobFromRule } from '@/lib/maintenance/actions'

type RuleFilter = 'all' | 'due_now' | 'due_soon' | 'inactive'

interface Props {
  rules: RecurringRuleRow[]
  buildings: { id: string; name: string }[]
  properties: { id: string; unit_number: string; building_id: string }[]
  staff: { id: string; full_name: string; trade: string | null }[]
  error: string | null
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly',
  monthly: 'Monthly', quarterly: 'Quarterly', biannual: 'Biannual', annual: 'Annual',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
}

function getRuleStatus(rule: RecurringRuleRow, today: string, soonStr: string): { label: string; cls: string } {
  if (!rule.is_active) return { label: 'Inactive', cls: 'bg-slate-100 text-slate-500' }
  if (!rule.next_due_date) return { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' }
  if (rule.next_due_date <= today) return { label: 'Due Now', cls: 'bg-red-100 text-red-700' }
  if (rule.next_due_date <= soonStr) return { label: 'Due Soon', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'Scheduled', cls: 'bg-blue-100 text-blue-700' }
}

export default function RecurringClient({ rules, buildings, properties, staff, error }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState<RuleFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().slice(0, 10)
  const soonDate = new Date()
  soonDate.setDate(soonDate.getDate() + 7)
  const soonStr = soonDate.toISOString().slice(0, 10)

  const filtered = rules.filter(r => {
    if (filter === 'inactive') return !r.is_active
    if (!r.is_active) return false
    if (filter === 'due_now') return !!r.next_due_date && r.next_due_date <= today
    if (filter === 'due_soon') return !!r.next_due_date && r.next_due_date > today && r.next_due_date <= soonStr
    return true
  })

  const counts = {
    all: rules.filter(r => r.is_active).length,
    due_now: rules.filter(r => r.is_active && !!r.next_due_date && r.next_due_date <= today).length,
    due_soon: rules.filter(r => r.is_active && !!r.next_due_date && r.next_due_date > today && r.next_due_date <= soonStr).length,
    inactive: rules.filter(r => !r.is_active).length,
  }

  const FILTERS: [RuleFilter, string][] = [
    ['all', `Active (${counts.all})`],
    ['due_now', `Due Now (${counts.due_now})`],
    ['due_soon', `Due Soon (${counts.due_soon})`],
    ['inactive', `Inactive (${counts.inactive})`],
  ]

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleRecurringRule(id, !current)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  function handleGenerate(ruleId: string) {
    setGenerating(ruleId)
    startTransition(async () => {
      await generateJobFromRule(ruleId)
    })
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setFormError(null)
    startTransition(async () => {
      const res = await createRecurringRule({ error: null }, formData)
      if (res.error) setFormError(res.error)
      else { setShowModal(false); router.refresh() }
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink">Recurring Maintenance</h1>
              <p className="text-sm text-ink-muted">{counts.all} active rules</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}

        <div className="flex gap-2 flex-wrap">
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
            <RefreshCw className="mx-auto h-10 w-10 text-ink-subtle mb-3" />
            <p className="text-sm text-ink-muted">No rules in this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(rule => {
              const status = getRuleStatus(rule, today, soonStr)
              return (
                <div key={rule.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-ink">{rule.title}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[rule.default_priority] ?? 'bg-slate-100 text-slate-600'}`}>
                          {rule.default_priority}
                        </span>
                      </div>
                      {rule.description && <p className="text-sm text-ink-muted mb-2">{rule.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-ink-subtle flex-wrap">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {FREQ_LABELS[rule.frequency] ?? rule.frequency}
                        </span>
                        {rule.next_due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Next: {rule.next_due_date}
                          </span>
                        )}
                        {rule.building && <span>{rule.building.name}</span>}
                        {rule.property && <span>Unit {rule.property.unit_number}</span>}
                        {rule.default_staff && <span>{rule.default_staff.full_name}</span>}
                        {rule.auto_create_job && <span className="text-primary font-medium">Auto-creates jobs</span>}
                        {rule.last_generated_at && <span>Last generated: {rule.last_generated_at.slice(0, 10)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {rule.is_active && (
                        <button
                          onClick={() => handleGenerate(rule.id)}
                          disabled={isPending}
                          className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-50"
                        >
                          {generating === rule.id ? 'Creating…' : 'Generate Now'}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(rule.id, rule.is_active)}
                        disabled={isPending}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          rule.is_active ? 'bg-primary' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          rule.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-line px-6 py-4 sticky top-0 bg-surface z-10">
              <h2 className="text-base font-semibold text-ink">New Recurring Rule</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Title *</label>
                <input name="title" required className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Frequency *</label>
                  <select name="frequency" required defaultValue="monthly" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Priority *</label>
                  <select name="default_priority" required defaultValue="medium" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Next Due Date</label>
                <input name="next_due_date" type="date" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Building</label>
                  <select name="building_id" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Any —</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Property</label>
                  <select name="property_id" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">— Any —</option>
                    {properties.map(p => <option key={p.id} value={p.id}>Unit {p.unit_number}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Default Staff</label>
                <select name="default_staff_id" className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">— Unassigned —</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.trade ? ` (${s.trade})` : ''}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="auto_create_job" type="checkbox" className="rounded border-line text-primary focus:ring-primary/50" />
                <span className="text-sm text-ink">Automatically create job when due</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink">Cancel</button>
                <button type="submit" disabled={isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
                  {isPending ? 'Creating…' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
