'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import PageAssistantButton from '@/components/ai/page-assistant-button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ApplicationStatusBadge } from '@/components/ui/badge'
import type { Application } from '@/types'

const PAGE_SIZE = 50

interface Props {
  applications: Application[]
  buildings: { id: string; name: string }[]
  agents: { id: string; first_name: string; last_name: string; agency_name: string | null }[]
  error: string | null
  filters: { tab?: string; q?: string; building?: string; agent?: string; page?: number }
  total: number
  page: number
}

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'approved', label: 'Approved' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
]

function isDbNotConfigured(err: string) {
  return (
    err.includes('connect') ||
    err.includes('relation') ||
    err.includes('supabase') ||
    err.includes('NEXT_PUBLIC')
  )
}

export default function ApplicationsClient({ applications, buildings, agents, error, filters, total, page }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function buildSearch(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (filters.tab) sp.set('tab', filters.tab)
    if (filters.q) sp.set('q', filters.q)
    if (filters.building) sp.set('building', filters.building)
    if (filters.agent) sp.set('agent', filters.agent)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) sp.set(k, v)
      else sp.delete(k)
    }
    return sp.toString()
  }

  function setParam(key: string, value: string) {
    // Reset to page 1 on filter/tab changes
    const qs = buildSearch({ [key]: value || undefined, page: undefined })
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  function goToPage(n: number) {
    const qs = buildSearch({ page: n > 1 ? String(n) : undefined })
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  const pageFrom = (page - 1) * PAGE_SIZE + 1
  const pageTo = Math.min(total, page * PAGE_SIZE)
  const activeTab = filters.tab ?? 'active'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Applications</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {total} application{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PageAssistantButton
            context={{ page: 'Applications' }}
            suggestedPrompts={['Which applications need review?', 'Which applicants are missing documents?', 'Draft a follow-up email for a missing document', 'Which applications are ready to approve?', 'Summarise active applications']}
          />
          <Link href="/applications/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>
      </div>

      {error && isDbNotConfigured(error) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Database not configured</p>
            <p className="text-amber-700 mt-0.5">
              Connect Supabase and run migrations to load real application data.
            </p>
          </div>
        </div>
      )}
      {error && !isDbNotConfigured(error) && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="space-y-3">
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-line">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setParam('tab', tab.id)}
                  className={[
                    '-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-ink'
                      : 'border-transparent text-ink-subtle hover:text-ink-muted',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
                <input
                  type="text"
                  defaultValue={filters.q ?? ''}
                  placeholder="Search applicant, email..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => setParam('q', e.target.value)}
                />
              </div>
              <select
                defaultValue={filters.building ?? ''}
                className="text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setParam('building', e.target.value)}
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select
                defaultValue={filters.agent ?? ''}
                className="text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setParam('agent', e.target.value)}
              >
                <option value="">All Agents</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.agency_name ? `${a.agency_name} — ` : ''}{a.first_name} {a.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {applications.length === 0 && !error ? (
            <div className="py-12 text-center text-ink-muted text-sm">
              No applications found.{' '}
              {filters.q || filters.building || filters.agent
                ? 'Try adjusting your filters.'
                : 'Submit a new application to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Move-in</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link href={`/applications/${app.id}`} className="block hover:text-primary">
                        <p className="font-medium text-ink text-sm">
                          {app.applicant_first_name} {app.applicant_last_name}
                        </p>
                        <p className="text-xs text-ink-subtle">{app.applicant_email}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {app.property ? (
                        <>
                          <p className="text-sm font-medium text-ink-muted">
                            Unit {(app.property as { unit_number: string }).unit_number}
                          </p>
                          <p className="text-xs text-ink-subtle">
                            {app.building ? (app.building as { name: string }).name : ''}
                          </p>
                        </>
                      ) : app.building ? (
                        <>
                          <p className="text-xs text-ink-subtle">Any unit</p>
                          <p className="text-xs text-ink-subtle">
                            {(app.building as { name: string }).name}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted max-w-[140px] truncate">
                      {app.university ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {app.preferred_move_in
                        ? new Date(app.preferred_move_in).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {app.agent
                        ? (app.agent as { agency_name?: string; first_name: string; last_name: string }).agency_name ??
                          `${(app.agent as { first_name: string; last_name: string }).first_name} ${(app.agent as { last_name: string }).last_name}`
                        : 'Direct'}
                    </TableCell>
                    <TableCell className="text-xs text-ink-subtle">
                      {new Date(app.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line">
            <span className="text-xs text-ink-muted">
              Showing {pageFrom}–{pageTo} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-line text-xs text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={pageTo >= total}
                className="px-3 py-1.5 rounded-md border border-line text-xs text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
