'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Search, Mail, Phone, GraduationCap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { createTenant } from '@/lib/tenants/actions'
import type { TenantListItem } from '@/lib/tenants/queries'

interface Props {
  tenants: TenantListItem[]
  buildings: { id: string; name: string }[]
  error: string | null
  filters: {
    q?: string
    building?: string
    university?: string
    status?: string
  }
}

function isDbNotConfigured(err: string) {
  return (
    err.includes('connect') ||
    err.includes('relation') ||
    err.includes('supabase') ||
    err.includes('NEXT_PUBLIC')
  )
}

export default function TenantsClient({ tenants, buildings, error, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    if (value) sp.set(key, value)
    else sp.delete(key)
    router.push(`${pathname}?${sp.toString()}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTenant({ error: null }, formData)
      if (res.error) {
        setFormError(res.error)
      } else {
        setShowModal(false)
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  const activeCount = tenants.filter((t) => t.is_active).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tenants</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {activeCount} active tenant{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setShowModal(true); setFormError(null) }}>
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      {/* Error banner */}
      {error && isDbNotConfigured(error) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Database not configured</p>
            <p className="text-amber-700 mt-0.5">
              Connect Supabase and run migrations to load real tenant data.
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
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
              <input
                type="text"
                defaultValue={filters.q ?? ''}
                placeholder="Search by name, email, phone..."
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
              defaultValue={filters.status ?? ''}
              className="text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setParam('status', e.target.value)}
            >
              <option value="">Active Only</option>
              <option value="all">All Statuses</option>
              <option value="inactive">Inactive / Past</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tenants.length === 0 && !error ? (
            <div className="py-12 text-center text-ink-muted text-sm">
              No tenants found.{' '}
              {filters.q || filters.building || filters.status
                ? 'Try adjusting your filters.'
                : 'Add a tenant to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>University / Course</TableHead>
                  <TableHead>Current Property</TableHead>
                  <TableHead>Lease Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const initials = `${tenant.first_name[0] ?? ''}${tenant.last_name[0] ?? ''}`.toUpperCase()
                  const occ = tenant.current_occupancy
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700 shrink-0">
                            {initials}
                          </div>
                          <Link
                            href={`/tenants/${tenant.id}`}
                            className="font-medium text-ink text-sm hover:text-primary"
                          >
                            {tenant.first_name} {tenant.last_name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {tenant.email && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <Mail className="h-3 w-3 text-ink-subtle shrink-0" />
                              <a href={`mailto:${tenant.email}`} className="hover:text-primary truncate max-w-[160px]">
                                {tenant.email}
                              </a>
                            </div>
                          )}
                          {tenant.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
                              <Phone className="h-3 w-3 text-ink-subtle shrink-0" />
                              {tenant.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.university ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-ink-muted">
                              <GraduationCap className="h-3 w-3 text-ink-subtle shrink-0" />
                              <span className="truncate max-w-[140px]">{tenant.university}</span>
                            </div>
                            {tenant.course && (
                              <p className="text-xs text-ink-subtle truncate max-w-[160px]">{tenant.course}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-ink-subtle">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {occ?.property ? (
                          <>
                            <p className="text-sm font-medium text-ink-muted">
                              Unit {occ.property.unit_number}
                            </p>
                            <p className="text-xs text-ink-subtle">
                              {occ.property.building?.name ?? ''}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-ink-subtle">No active tenancy</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-ink-muted">
                        {occ?.lease_end
                          ? new Date(occ.lease_end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.is_active ? 'success' : 'gray'} dot>
                          {tenant.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Tenant modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface z-10 flex items-center justify-between px-6 py-4 border-b border-line">
              <h2 className="text-lg font-semibold text-ink">Add Tenant</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-subtle hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    First Name <span className="text-neg">*</span>
                  </label>
                  <input name="first_name" required className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Last Name <span className="text-neg">*</span>
                  </label>
                  <input name="last_name" required className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Email</label>
                <input name="email" type="email" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Phone</label>
                <input name="phone" type="tel" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Date of Birth</label>
                  <input name="date_of_birth" type="date" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Nationality</label>
                  <input name="nationality" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="pt-2 border-t border-line">
                <p className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wide">Student Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">University</label>
                    <input name="university" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Course</label>
                    <input name="course" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-ink-muted mb-1">Student ID</label>
                  <input name="student_id" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div className="pt-2 border-t border-line">
                <p className="text-xs font-semibold text-ink-muted mb-3 uppercase tracking-wide">Emergency Contact</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1">Name</label>
                      <input name="emergency_contact_name" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1">Phone</label>
                      <input name="emergency_contact_phone" type="tel" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Relationship</label>
                    <input name="emergency_contact_relationship" placeholder="e.g. Parent, Sibling, Friend" className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Notes</label>
                <textarea name="notes" rows={2} className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving…' : 'Add Tenant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
