'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, MapPin, Clock, CheckCircle2, MessageSquare,
  ChevronRight, Calendar, Wrench, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from '@/components/ui/badge'
import { addJobComment, completeJob } from '@/lib/maintenance/actions'
import type { MaintenanceJob } from '@/types'
import type { ScheduleStaff, MyJobsResult } from '@/lib/maintenance/queries'

interface Props {
  staffId: string | null
  staffList: ScheduleStaff[]
  data: MyJobsResult | null
}

const PRIORITY_BORDER: Record<string, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-300',
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function JobCard({ job }: { job: MaintenanceJob }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [showComplete, setShowComplete] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleComplete() {
    start(async () => {
      const res = await completeJob(job.id, completionNotes)
      if (res.error) { setError(res.error); return }
      setShowComplete(false)
      router.refresh()
    })
  }

  function handleComment() {
    if (!comment.trim()) return
    start(async () => {
      const res = await addJobComment(job.id, comment, false)
      if (res.error) { setError(res.error); return }
      setComment('')
      setShowComment(false)
      router.refresh()
    })
  }

  const unit = (job.property as any)?.unit_number ?? null
  const building = (job.building as any)?.name ?? null

  return (
    <div className={`rounded-xl border border-line border-l-4 bg-surface shadow-card overflow-hidden ${
      PRIORITY_BORDER[job.priority] ?? 'border-l-slate-300'
    }`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <Link
              href={`/maintenance/${job.id}`}
              className="text-sm font-semibold text-ink hover:text-primary block truncate"
            >
              {job.title}
            </Link>
            {job.job_number && (
              <span className="text-[11px] font-mono text-ink-subtle">{job.job_number}</span>
            )}
          </div>
          <Link href={`/maintenance/${job.id}`} className="shrink-0 text-ink-subtle hover:text-ink">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <MaintenancePriorityBadge priority={job.priority} />
          <MaintenanceStatusBadge status={job.status} />
        </div>

        <div className="space-y-1.5 text-xs text-ink-muted">
          {(unit || building) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{[unit, building].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {job.scheduled_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{fmtDate(job.scheduled_date)}</span>
            </div>
          )}
          {job.preferred_access_window && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{job.preferred_access_window}</span>
            </div>
          )}
          {job.access_notes && (
            <div className="flex items-start gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{job.access_notes}</span>
            </div>
          )}
        </div>

        {error && <p className="mt-2 text-xs text-neg">{error}</p>}

        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-ink-muted"
            onClick={() => { setShowComment(!showComment); setShowComplete(false) }}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />Note
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-pos border-green-300 hover:bg-green-50"
            onClick={() => { setShowComplete(!showComplete); setShowComment(false) }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Complete
          </Button>
        </div>

        {showComplete && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <label className="text-xs font-medium text-ink-muted">Completion notes (optional)</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe what was done…"
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleComplete} disabled={pending}>
                {pending ? 'Saving…' : 'Mark Complete'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowComplete(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {showComment && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <label className="text-xs font-medium text-ink-muted">Add a note</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add update or note…"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleComment} disabled={pending || !comment.trim()}>
                {pending ? 'Posting…' : 'Post Note'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowComment(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, jobs }: { title: string; jobs: MaintenanceJob[] }) {
  if (jobs.length === 0) return null
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">{title}</h2>
      <div className="space-y-3">
        {jobs.map(job => <JobCard key={job.id} job={job} />)}
      </div>
    </div>
  )
}

export function MyJobsView({ staffId, staffList, data }: Props) {
  const router = useRouter()

  if (!staffId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="h-5 w-5 text-ink-subtle" />
            <p className="text-sm text-ink-muted">Select a staff profile to view assigned jobs:</p>
          </div>
          {staffList.length === 0 ? (
            <p className="text-sm text-ink-subtle">No maintenance staff profiles configured yet.</p>
          ) : (
            <select
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              defaultValue=""
              onChange={e => e.target.value && router.push(`/maintenance/my-jobs?staff=${e.target.value}`)}
            >
              <option value="">Choose staff member…</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.trade ? ` (${s.trade})` : ''}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>
    )
  }

  if (data?.error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        {data.error.includes('relation') || data.error.includes('connect')
          ? 'Configure Supabase and run migrations to enable this view.'
          : data.error}
      </div>
    )
  }

  const total = (data?.overdue.length ?? 0) + (data?.today.length ?? 0) + (data?.upcoming.length ?? 0)

  if (total === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-pos mx-auto mb-3" />
          <p className="text-sm font-medium text-ink">All clear!</p>
          <p className="text-sm text-ink-muted mt-1">No jobs currently assigned to you.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-7">
      {(data?.overdue.length ?? 0) > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-neg" />
            <h2 className="text-sm font-semibold text-neg uppercase tracking-wider">Overdue</h2>
          </div>
          <div className="space-y-3">
            {data!.overdue.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      )}
      <Section title="Today" jobs={data?.today ?? []} />
      <Section title="Upcoming" jobs={data?.upcoming ?? []} />
    </div>
  )
}
