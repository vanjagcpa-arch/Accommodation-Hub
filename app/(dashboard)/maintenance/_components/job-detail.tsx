'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ChevronLeft, MapPin, User, Calendar, AlertTriangle, Send, Database,
  CheckCircle2, Circle, Clock, DollarSign, Image as ImageIcon, Copy, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MaintenancePriorityBadge, MaintenanceStatusBadge, Badge } from '@/components/ui/badge'
import { STATUS_ORDER, STATUS_META, isOverdue } from '@/lib/maintenance/constants'
import { updateJobStatus, addJobComment, toggleChecklistItem, requestOwnerApproval, recordOwnerDecision } from '@/lib/maintenance/actions'
import type {
  MaintenanceJob, MaintenanceComment, MaintenanceStatusHistory,
  MaintenanceChecklistItem, MaintenanceCost, MaintenanceStatus,
} from '@/types'

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

type Tab = 'details' | 'activity' | 'checklist' | 'history' | 'costs' | 'photos'

interface Props {
  job: MaintenanceJob | null
  comments: MaintenanceComment[]
  history: MaintenanceStatusHistory[]
  checklist: MaintenanceChecklistItem[]
  costs: MaintenanceCost[]
  error: string | null
}

export function JobDetail({ job, comments, history, checklist, costs, error }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [status, setStatus] = useState<MaintenanceStatus | ''>(job?.status ?? '')
  const [statusNote, setStatusNote] = useState('')
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/maintenance" className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />Maintenance
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3">
          <Database className="h-4 w-4 text-warn mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink-muted">
            <span className="font-semibold text-ink">Couldn&apos;t load this job.</span> {error ?? 'Not found.'}
          </p>
        </div>
      </div>
    )
  }

  const overdue = isOverdue(job.due_date, job.status)
  const doneCount = checklist.filter((c) => c.is_done).length

  function runStatusUpdate() {
    if (!status || status === job!.status) return
    setActionError(null)
    startTransition(async () => {
      const r = await updateJobStatus(job!.id, status as MaintenanceStatus, statusNote)
      if (r.error) setActionError(r.error)
      else { setStatusNote(''); router.refresh() }
    })
  }
  function postComment() {
    if (!comment.trim()) return
    setActionError(null)
    startTransition(async () => {
      const r = await addJobComment(job!.id, comment, isInternal)
      if (r.error) setActionError(r.error)
      else { setComment(''); router.refresh() }
    })
  }
  function toggleItem(item: MaintenanceChecklistItem) {
    startTransition(async () => {
      const r = await toggleChecklistItem(item.id, job!.id, !item.is_done)
      if (r.error) setActionError(r.error)
      else router.refresh()
    })
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'activity', label: 'Activity', count: comments.length },
    { id: 'checklist', label: 'Checklist', count: checklist.length },
    { id: 'history', label: 'History', count: history.length },
    { id: 'costs', label: 'Costs' },
    { id: 'photos', label: 'Photos' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link href="/maintenance" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />Maintenance
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-ink font-medium font-mono">{job.job_number ?? job.id.slice(0, 8)}</span>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-xl border border-neg/30 bg-neg/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink">{actionError}</p>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-line bg-surface shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <MaintenancePriorityBadge priority={job.priority} />
              <MaintenanceStatusBadge status={job.status} />
              {overdue && <Badge variant="danger" dot>Overdue</Badge>}
            </div>
            <h1 className="text-xl font-semibold text-ink">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-ink-muted">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-ink-faint" />
                {job.property?.unit_number ? `Unit ${job.property.unit_number}` : 'No property'} · {job.building?.name ?? '—'}
              </span>
              {job.tenant && (
                <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-ink-faint" />
                  {job.tenant.first_name} {job.tenant.last_name}
                </span>
              )}
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-ink-faint" />
                Due: <strong className={overdue ? 'text-neg' : 'text-ink'}>{fmtDate(job.due_date)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Status updater */}
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <div>
            <label className="block text-[11px] font-medium text-ink-subtle mb-1">Update status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
              className="h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
            >
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
          <input
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Optional note for the timeline…"
            className="h-9 flex-1 min-w-[200px] rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
          />
          <Button onClick={runStatusUpdate} loading={pending} disabled={!status || status === job.status}>
            Update
          </Button>
        </div>
      </div>

      <OwnerApprovalPanel job={job} />

      {/* Tabs */}
      <div className="border-b border-line">
        <div className="flex -mb-px gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink hover:border-line-strong'
              }`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-surface-muted px-1 text-[10px] font-semibold text-ink-muted">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DETAILS */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold text-ink mb-1.5">Description</h3>
              <p className="text-[13px] text-ink-muted leading-relaxed">{job.description || 'No description provided.'}</p>
            </div>
            {job.access_notes && (
              <div className="p-3 bg-warn/5 border border-warn/20 rounded-lg">
                <h3 className="text-[12px] font-semibold text-ink mb-1">Access notes</h3>
                <p className="text-[13px] text-ink-muted">{job.access_notes}</p>
              </div>
            )}
            {job.internal_notes && (
              <div className="p-3 bg-surface-muted border border-line rounded-lg">
                <h3 className="text-[12px] font-semibold text-ink mb-1">Internal notes</h3>
                <p className="text-[13px] text-ink-muted">{job.internal_notes}</p>
              </div>
            )}
            {job.completion_notes && (
              <div className="p-3 bg-pos/5 border border-pos/20 rounded-lg">
                <h3 className="text-[12px] font-semibold text-ink mb-1">Completion notes</h3>
                <p className="text-[13px] text-ink-muted">{job.completion_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-0 rounded-lg border border-line divide-y divide-line text-[13px]">
            <Detail label="Assigned to">
              {job.assigned_staff?.full_name ?? <span className="text-ink-faint">Unassigned</span>}
              {job.assigned_staff?.trade && <span className="block text-[11px] text-ink-faint">{job.assigned_staff.trade}</span>}
            </Detail>
            <Detail label="Category">{job.category?.name ?? job.issue_type ?? '—'}</Detail>
            <Detail label="Scheduled">{fmtDateTime(job.scheduled_date)}</Detail>
            <Detail label="Preferred access">{job.preferred_access_window ?? '—'}</Detail>
            <Detail label="Reported by">{job.reported_by_name ?? '—'}</Detail>
            {job.tenant && (
              <Detail label="Tenant contact">
                {job.tenant.first_name} {job.tenant.last_name}
                {job.tenant_contact_visible && job.tenant.email
                  ? <span className="block text-[11px] text-ink-faint">{job.tenant.email}</span>
                  : <span className="block text-[11px] text-ink-faint italic">Contact hidden</span>}
              </Detail>
            )}
            <Detail label="Created">{fmtDateTime(job.created_at)}</Detail>
          </div>
        </div>
      )}

      {/* ACTIVITY / COMMENTS */}
      {activeTab === 'activity' && (
        <div className="space-y-4 max-w-3xl">
          {comments.length === 0 && <p className="text-[13px] text-ink-faint">No comments yet.</p>}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-ink-muted">
                {c.is_internal ? 'IN' : 'EX'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {c.is_internal
                    ? <span className="text-[11px] px-1.5 py-0.5 bg-surface-muted text-ink-subtle rounded">Internal</span>
                    : <span className="text-[11px] px-1.5 py-0.5 bg-primary-soft text-primary-active rounded">Shared</span>}
                  <span className="text-[11px] text-ink-faint">{fmtDateTime(c.created_at)}</span>
                </div>
                <div className={`text-[13px] text-ink p-3 rounded-lg border ${c.is_internal ? 'bg-surface-muted border-line' : 'bg-primary-soft/40 border-primary-ring/40'}`}>
                  {c.comment}
                </div>
              </div>
            </div>
          ))}

          <div className="border-t border-line pt-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="h-4 w-4 rounded border-line-strong text-primary" />
              <span className="text-[13px] text-ink-muted">Internal note (hidden from tenant &amp; referral agents)</span>
            </label>
            <div className="flex gap-3">
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment or update…"
                className="flex-1 rounded-lg border border-line-strong bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50 resize-none" />
              <Button className="self-end" onClick={postComment} loading={pending} disabled={!comment.trim()}>
                <Send className="h-4 w-4" />Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-2 max-w-2xl">
          {checklist.length === 0 && <p className="text-[13px] text-ink-faint">No checklist items on this job.</p>}
          {checklist.length > 0 && (
            <p className="text-[12px] text-ink-faint mb-2">{doneCount} of {checklist.length} complete</p>
          )}
          {checklist.map((item) => (
            <button key={item.id} onClick={() => toggleItem(item)} disabled={pending}
              className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-muted">
              {item.is_done ? <CheckCircle2 className="h-4 w-4 text-pos shrink-0" /> : <Circle className="h-4 w-4 text-ink-faint shrink-0" />}
              <span className={`flex-1 text-[13px] ${item.is_done ? 'text-ink-faint line-through' : 'text-ink'}`}>{item.label}</span>
              {item.requires_photo && <ImageIcon className="h-3.5 w-3.5 text-ink-faint" />}
            </button>
          ))}
        </div>
      )}

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-1 max-w-2xl">
          {history.length === 0 && <p className="text-[13px] text-ink-faint">No status history.</p>}
          {history.map((h) => (
            <div key={h.id} className="flex items-start gap-3 py-3 border-b border-line last:border-0">
              <Clock className="h-3.5 w-3.5 text-ink-faint mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-ink">
                    {h.from_status ? `${STATUS_META[h.from_status]?.label} → ` : ''}{STATUS_META[h.to_status]?.label ?? h.to_status}
                  </p>
                  <span className="text-[11px] text-ink-faint shrink-0">{fmtDateTime(h.created_at)}</span>
                </div>
                {h.note && <p className="text-[12px] text-ink-muted mt-0.5">{h.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COSTS */}
      {activeTab === 'costs' && (
        <div className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[11px] text-ink-subtle font-medium">Estimated</p>
              <p className="text-xl font-bold text-ink mt-0.5">{job.estimated_cost != null ? `$${job.estimated_cost.toFixed(2)}` : '—'}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[11px] text-ink-subtle font-medium">Actual</p>
              <p className="text-xl font-bold text-ink mt-0.5">{job.actual_cost != null ? `$${job.actual_cost.toFixed(2)}` : '—'}</p>
            </div>
          </div>
          {job.invoice_reference && (
            <p className="text-[13px] text-ink-muted">Invoice reference: <span className="font-mono text-ink">{job.invoice_reference}</span></p>
          )}
          <div className="space-y-2">
            {costs.length === 0 && <p className="text-[13px] text-ink-faint flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />No cost line items recorded yet.</p>}
            {costs.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
                <span className="text-ink">{c.description || c.cost_type}</span>
                <span className="font-medium text-ink">${Number(c.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHOTOS */}
      {activeTab === 'photos' && (
        <div className="max-w-2xl rounded-xl border border-dashed border-line-strong bg-surface-muted/50 p-8 text-center">
          <ImageIcon className="h-7 w-7 text-ink-faint mx-auto mb-2" />
          <p className="text-[13px] text-ink">Before / after photos</p>
          <p className="text-[12px] text-ink-faint mt-1">
            Uploads write to the private <code className="bg-surface-muted px-1 rounded">maintenance-photos</code> bucket.
            The capture flow ships with the maintenance staff mobile view (Phase 2).
          </p>
        </div>
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-ink-subtle mb-0.5">{label}</p>
      <div className="text-[13px] font-medium text-ink">{children}</div>
    </div>
  )
}

function OwnerApprovalPanel({ job }: { job: MaintenanceJob }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [emailed, setEmailed] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)

  const owner = job.property?.owner ?? null
  const ownerName = owner ? ([owner.first_name, owner.last_name].filter(Boolean).join(' ') || owner.company_name || 'the owner') : null
  const status = job.owner_approval_status
  const tokenLink = job.owner_approval_token && typeof window !== 'undefined'
    ? `${window.location.origin}/approve/${job.owner_approval_token}`
    : null

  function copy(value: string) {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  function send() {
    setError(null)
    start(async () => {
      const r = await requestOwnerApproval(job.id, note)
      if (r.error) { setError(r.error); return }
      setLink(r.link ?? null); setEmailed(r.emailed ?? false); setNote(''); router.refresh()
    })
  }
  function record(decision: 'approved' | 'declined') {
    setError(null)
    start(async () => {
      const r = await recordOwnerDecision(job.id, decision, note)
      if (r.error) { setError(r.error); return }
      setNote(''); router.refresh()
    })
  }

  // Decided
  if (status === 'approved' || status === 'declined') {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-[13px] font-semibold text-ink mb-2">Owner approval</h3>
        <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] ${status === 'approved' ? 'border-pos/30 bg-pos/5 text-pos' : 'border-neg/30 bg-neg/5 text-neg'}`}>
          {status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          Owner {status}{job.owner_approval_decided_at ? ` on ${fmtDate(job.owner_approval_decided_at)}` : ''}
        </div>
        {job.owner_approval_note && <p className="mt-2 text-[12px] text-ink-muted">“{job.owner_approval_note}”</p>}
      </div>
    )
  }

  // Pending
  if (status === 'pending') {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
        <h3 className="text-[13px] font-semibold text-ink">Owner approval</h3>
        <p className="text-[13px] text-ink-muted">
          Awaiting owner{ownerName ? ` (${ownerName})` : ''}{job.owner_approval_sent_at ? ` — sent ${fmtDate(job.owner_approval_sent_at)}` : ''}.
        </p>
        {tokenLink && (
          <div className="flex items-center gap-2">
            <code className="truncate rounded bg-surface-muted px-2 py-1 text-[12px] text-ink max-w-[320px]">{tokenLink}</code>
            <button onClick={() => copy(tokenLink)} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[12px] text-ink hover:bg-surface-muted">
              {copied ? <Check className="h-3.5 w-3.5 text-pos" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        )}
        <div className="border-t border-line pt-3">
          <p className="text-[12px] text-ink-faint mb-2">Owner replied another way? Record it here:</p>
          {error && <p className="text-[12px] text-neg mb-2">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => record('approved')} loading={pending}>Mark approved</Button>
            <Button size="sm" variant="outline" onClick={() => record('declined')} loading={pending}>Mark declined</Button>
          </div>
        </div>
      </div>
    )
  }

  // Not yet sent
  return (
    <div className="rounded-xl border border-line bg-surface p-5 space-y-3">
      <h3 className="text-[13px] font-semibold text-ink">Owner approval</h3>
      {owner ? (
        <p className="text-[13px] text-ink-muted">
          Send this job to <strong className="text-ink">{ownerName}</strong>{owner.email ? ` (${owner.email})` : ''} for approval. They&apos;ll get an email with a link to approve or decline.
        </p>
      ) : (
        <p className="text-[13px] text-ink-muted">This property has no owner on file — add one to request approval.</p>
      )}
      {link && (
        <div className="rounded-lg border border-pos/30 bg-pos/5 px-3 py-2 text-[12px] text-ink">
          {emailed ? 'Emailed to the owner.' : 'Email isn’t configured — share this link with the owner:'}
          <div className="mt-1 flex items-center gap-2">
            <code className="truncate rounded bg-surface-muted px-2 py-1 max-w-[320px]">{link}</code>
            <button onClick={() => copy(link)} className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5">
              {copied ? <Check className="h-3 w-3 text-pos" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional message to the owner…"
        className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50"
      />
      {error && <p className="text-[12px] text-neg">{error}</p>}
      <Button onClick={send} loading={pending} disabled={!owner}>
        <Send className="h-4 w-4" />Send to owner for approval
      </Button>
    </div>
  )
}
