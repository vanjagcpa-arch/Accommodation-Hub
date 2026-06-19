export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  AlertTriangle,
  Calendar,
  Building2,
  Wrench,
  User,
} from 'lucide-react'
import { getTenant } from '@/lib/tenants/queries'
import { Badge, ApplicationStatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { tenant, error } = await getTenant(id)

  if (!tenant && !error) notFound()

  const isDbNotConfigured =
    error != null &&
    (error.includes('connect') ||
      error.includes('relation') ||
      error.includes('supabase') ||
      error.includes('NEXT_PUBLIC'))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link + header */}
      <div>
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </Link>

        {tenant && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-700 shrink-0">
                {`${tenant.first_name[0] ?? ''}${tenant.last_name[0] ?? ''}`.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink">
                  {tenant.first_name} {tenant.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={tenant.is_active ? 'success' : 'gray'} dot>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {tenant.open_job_count > 0 && (
                    <Badge variant="warning" dot>
                      {tenant.open_job_count} open job{tenant.open_job_count !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && isDbNotConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Database not configured</p>
            <p className="text-amber-700 mt-0.5">
              Connect Supabase and run migrations to load tenant data.
            </p>
          </div>
        </div>
      )}
      {error && !isDbNotConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {tenant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — contact + student + emergency */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <User className="h-4 w-4 text-ink-subtle" />
                  Contact
                </h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {tenant.email ? (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Mail className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                    <a href={`mailto:${tenant.email}`} className="hover:text-primary break-all">
                      {tenant.email}
                    </a>
                  </div>
                ) : (
                  <p className="text-ink-subtle text-xs">No email recorded</p>
                )}
                {tenant.phone && (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Phone className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                    {tenant.phone}
                  </div>
                )}
                {tenant.date_of_birth && (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Calendar className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                    {new Date(tenant.date_of_birth).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {tenant.nationality && (
                  <p className="text-ink-muted text-xs">
                    <span className="font-medium">Nationality:</span> {tenant.nationality}
                  </p>
                )}
              </CardContent>
            </Card>

            {(tenant.university || tenant.course || tenant.student_id) && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-ink-subtle" />
                    Student Info
                  </h2>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {tenant.university && (
                    <p className="text-ink-muted">
                      <span className="font-medium text-ink">University:</span>{' '}
                      {tenant.university}
                    </p>
                  )}
                  {tenant.course && (
                    <p className="text-ink-muted">
                      <span className="font-medium text-ink">Course:</span> {tenant.course}
                    </p>
                  )}
                  {tenant.student_id && (
                    <p className="text-ink-muted">
                      <span className="font-medium text-ink">Student ID:</span>{' '}
                      {tenant.student_id}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink">Emergency Contact</h2>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-ink-muted">
                  {tenant.emergency_contact_name && (
                    <p className="font-medium text-ink">{tenant.emergency_contact_name}</p>
                  )}
                  {tenant.emergency_contact_relationship && (
                    <p className="text-xs text-ink-subtle">{tenant.emergency_contact_relationship}</p>
                  )}
                  {tenant.emergency_contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                      {tenant.emergency_contact_phone}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {tenant.notes && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink">Notes</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">{tenant.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — occupancies + applications */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current / occupancy history */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-ink-subtle" />
                  Tenancy History
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                {tenant.occupancies.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-ink-subtle">No tenancy records found.</p>
                ) : (
                  <div className="divide-y divide-line">
                    {tenant.occupancies.map((occ) => (
                      <div key={occ.id} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {occ.property
                              ? `Unit ${occ.property.unit_number}${occ.property.building ? ` — ${occ.property.building.name}` : ''}`
                              : 'Unknown property'}
                          </p>
                          <p className="text-xs text-ink-subtle mt-0.5">
                            {new Date(occ.lease_start).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {' → '}
                            {occ.lease_end
                              ? new Date(occ.lease_end).toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Ongoing'}
                          </p>
                          {occ.rent_amount != null && (
                            <p className="text-xs text-ink-subtle mt-0.5">
                              ${occ.rent_amount.toLocaleString()} / wk
                            </p>
                          )}
                        </div>
                        <Badge variant={occ.is_current ? 'success' : 'gray'} dot>
                          {occ.is_current ? 'Current' : 'Past'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked applications */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink">Application History</h2>
              </CardHeader>
              <CardContent className="p-0">
                {tenant.applications.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-ink-subtle">No linked applications.</p>
                ) : (
                  <div className="divide-y divide-line">
                    {tenant.applications.map((app) => (
                      <div key={app.id} className="px-4 py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-ink">
                            Application
                            {app.preferred_move_in
                              ? ` — move in ${new Date(app.preferred_move_in).toLocaleDateString('en-AU', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}`
                              : ''}
                          </p>
                          <p className="text-xs text-ink-subtle mt-0.5">
                            Submitted{' '}
                            {new Date(app.created_at).toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ApplicationStatusBadge status={app.status} />
                          <Link href={`/applications/${app.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maintenance shortcut */}
            {tenant.open_job_count > 0 && (
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {tenant.open_job_count} open maintenance job{tenant.open_job_count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-ink-subtle">At current property</p>
                      </div>
                    </div>
                    <Link href={`/maintenance?tab=open`}>
                      <Button variant="ghost" size="sm">View Jobs</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
