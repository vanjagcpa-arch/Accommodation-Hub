'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar, Plus, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MaintenancePriorityBadge, MaintenanceStatusBadge } from '@/components/ui/badge'
import { assignJobStaff } from '@/lib/maintenance/actions'
import { isOverdue } from '@/lib/maintenance/constants'
import type { MaintenanceJob } from '@/types'
import type { ScheduleStaff } from '@/lib/maintenance/queries'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
}

function getWeekDays(mondayStr: string): string[] {
  const start = new Date(mondayStr + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function shiftWeek(dateStr: string, weeks: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

function fmtShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

interface Props {
  weekStart: string
  byStaff: { staff: ScheduleStaff; jobs: MaintenanceJob[] }[]
  unscheduled: MaintenanceJob[]
  staff: ScheduleStaff[]
}

interface AssignModal {
  job: MaintenanceJob | null
  staffId: string
  date: string
}

export function ScheduleBoard({ weekStart, byStaff, unscheduled, staff }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [modal, setModal] = useState<AssignModal>({ job: null, staffId: '', date: '' })
  const [modalError, setModalError] = useState<string | null>(null)

  const days = getWeekDays(weekStart)
  const today = new Date().toISOString().slice(0, 10)
  const weekLabel = `${fmtShort(days[0])} – ${fmtShort(days[6])}`

  function openModal(job: MaintenanceJob) {
    setModal({ job, staffId: '', date: today })
    setModalError(null)
  }
  function closeModal() {
    setModal({ job: null, staffId: '', date: '' })
    setModalError(null)
  }
  function submitAssign() {
    if (!modal.job || !modal.staffId) { setModalError('Select a staff member.'); return }
    start(async () => {
      const res = await assignJobStaff(modal.job!.id, modal.staffId, modal.date || null, '')
      if (res.error) { setModalError(res.error); return }
      closeModal()
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/maintenance/schedule?week=${shiftWeek(weekStart, -1)}`)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="flex-1 text-center text-sm font-semibold text-ink">{weekLabel}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/maintenance/schedule?week=${shiftWeek(weekStart, 1)}`)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted"
          onClick={() => router.push('/maintenance/schedule')}
        >
          This week
        </Button>
      </div>

      {/* Schedule grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-muted/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-subtle w-44 shrink-0 border-r border-line">
                  Staff
                </th>
                {days.map((day, i) => (
                  <th
                    key={day}
                    className={`px-3 py-2.5 text-center min-w-[130px] ${
                      day === today ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`text-[11px] font-semibold uppercase tracking-wider ${
                      day === today ? 'text-primary' : 'text-ink-subtle'
                    }`}>
                      {DAY_LABELS[i]}
                    </div>
                    <div className={`text-xs font-medium mt-0.5 ${
                      day === today ? 'text-primary' : 'text-ink-faint'
                    }`}>
                      {fmtShort(day)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {byStaff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-ink-subtle">
                    No maintenance staff profiles configured. Add staff to enable scheduling.
                  </td>
                </tr>
              ) : byStaff.map(({ staff: s, jobs }) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 align-top border-r border-line bg-surface-muted/20">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ backgroundColor: s.color ?? '#6B7280' }}
                      >
                        {initials(s.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ink truncate">{s.full_name}</p>
                        {s.trade && (
                          <p className="text-[10px] text-ink-subtle truncate">{s.trade}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  {days.map(day => {
                    const dayJobs = jobs.filter(j => j.scheduled_date === day)
                    return (
                      <td
                        key={day}
                        className={`px-2 py-2 align-top border-l border-line/40 ${
                          day === today ? 'bg-primary/[0.025]' : ''
                        }`}
                      >
                        <div className="space-y-1.5">
                          {dayJobs.map(job => (
                            <Link key={job.id} href={`/maintenance/${job.id}`} className="block">
                              <div className="rounded-md border border-line bg-surface px-2 py-1.5 hover:border-primary/40 hover:shadow-sm transition-all">
                                <div className="flex items-start gap-1.5">
                                  <div className={`mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full ${
                                    PRIORITY_DOT[job.priority] ?? 'bg-slate-400'
                                  }`} />
                                  <p className="text-[11px] font-medium text-ink leading-tight line-clamp-2">
                                    {job.title}
                                  </p>
                                </div>
                                {((job.property as any)?.unit_number || (job.building as any)?.name) && (
                                  <p className="text-[10px] text-ink-subtle mt-0.5 pl-3 truncate">
                                    {(job.property as any)?.unit_number ?? ''}
                                    {(job.building as any)?.name ? ` · ${(job.building as any).name}` : ''}
                                  </p>
                                )}
                                {isOverdue(job.due_date, job.status) && (
                                  <div className="mt-1 flex items-center gap-1 pl-3">
                                    <AlertTriangle className="h-2.5 w-2.5 text-neg" />
                                    <span className="text-[10px] font-medium text-neg">Overdue</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Unscheduled jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unscheduled Jobs</CardTitle>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {unscheduled.length} open job{unscheduled.length !== 1 ? 's' : ''} without a scheduled date
              </p>
            </div>
            <Link href="/maintenance/new">
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4 mr-1" />New Job
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {unscheduled.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-subtle">All open jobs are scheduled.</p>
          ) : (
            <div className="divide-y divide-line">
              {unscheduled.map(job => (
                <div key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-muted/40">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[job.priority] ?? 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/maintenance/${job.id}`}
                      className="block text-sm font-medium text-ink hover:text-primary truncate"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-ink-subtle truncate">
                      {job.job_number && <span className="font-mono mr-2">{job.job_number}</span>}
                      {(job.property as any)?.unit_number ?? ''}
                      {(job.building as any)?.name ? ` · ${(job.building as any).name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <MaintenancePriorityBadge priority={job.priority} />
                    <MaintenanceStatusBadge status={job.status} />
                    <Button variant="outline" size="sm" onClick={() => openModal(job)}>
                      <Calendar className="h-3.5 w-3.5 mr-1" />Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign modal */}
      {modal.job && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line bg-surface shadow-xl p-6 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-ink">Assign Job</h2>
            <p className="text-sm text-ink-muted mt-0.5 mb-5 truncate">{modal.job.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">Staff Member</label>
                <select
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  value={modal.staffId}
                  onChange={e => setModal(p => ({ ...p, staffId: e.target.value }))}
                >
                  <option value="">Select staff member…</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}{s.trade ? ` (${s.trade})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-muted mb-1.5">Scheduled Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  value={modal.date}
                  onChange={e => setModal(p => ({ ...p, date: e.target.value }))}
                />
              </div>
              {modalError && <p className="text-sm text-neg">{modalError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button onClick={submitAssign} disabled={pending}>
                {pending ? 'Saving…' : 'Assign & Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
