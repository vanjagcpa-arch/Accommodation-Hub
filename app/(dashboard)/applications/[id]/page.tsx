export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  AlertTriangle,
  Building2,
  Calendar,
  Zap,
  User,
} from 'lucide-react'
import { getApplication } from '@/lib/applications/queries'
import { ApplicationStatusBadge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ApplicationWorkflow } from './_components/application-workflow'
import type { Application } from '@/types'

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { application, error } = await getApplication(id)

  if (!application && !error) notFound()

  const isDbNotConfigured =
    error != null &&
    (error.includes('connect') ||
      error.includes('relation') ||
      error.includes('supabase') ||
      error.includes('NEXT_PUBLIC'))

  const app = application as (Application & {
    building?: { name: string; address?: string } | null
    property?: { unit_number: string; property_type?: string; bedrooms?: number; bathrooms?: number } | null
    agent?: { first_name: string; last_name: string; agency_name?: string; email?: string; phone?: string } | null
    assigned_manager?: { full_name: string | null; email?: string } | null
  }) | null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>

        {app && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ink">
                {app.applicant_first_name} {app.applicant_last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <ApplicationStatusBadge status={app.status} />
                <span className="text-xs text-ink-subtle">
                  Submitted{' '}
                  {new Date(app.created_at).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error banners */}
      {error && isDbNotConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Database not configured</p>
            <p className="text-amber-700 mt-0.5">
              Connect Supabase and run migrations to load application data.
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

      {app && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — workflow + quick details */}
          <div className="space-y-4">
            {/* Workflow actions */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink">Actions</h2>
              </CardHeader>
              <CardContent>
                <ApplicationWorkflow
                  applicationId={app.id}
                  status={app.status}
                  linkedTenantId={app.linked_tenant_id}
                />
              </CardContent>
            </Card>

            {/* Applicant contact */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <User className="h-4 w-4 text-ink-subtle" />
                  Applicant
                </h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Mail className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                  <a href={`mailto:${app.applicant_email}`} className="hover:text-primary break-all">
                    {app.applicant_email}
                  </a>
                </div>
                {app.applicant_phone && (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Phone className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                    {app.applicant_phone}
                  </div>
                )}
                {app.university && (
                  <div className="flex items-start gap-2 text-ink-muted">
                    <GraduationCap className="h-3.5 w-3.5 text-ink-subtle shrink-0 mt-0.5" />
                    <div>
                      <p>{app.university}</p>
                      {app.course && <p className="text-xs text-ink-subtle">{app.course}</p>}
                    </div>
                  </div>
                )}
                {app.student_status && (
                  <p className="text-xs text-ink-subtle capitalize">{app.student_status.replace(/_/g, ' ')} student</p>
                )}
              </CardContent>
            </Card>

            {/* Agent */}
            {app.agent && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink">Referring Agent</h2>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {app.agent.agency_name && (
                    <p className="font-medium text-ink">{app.agent.agency_name}</p>
                  )}
                  <p className="text-ink-muted">
                    {app.agent.first_name} {app.agent.last_name}
                  </p>
                  {app.agent.email && (
                    <a href={`mailto:${app.agent.email}`} className="text-xs text-ink-subtle hover:text-primary block">
                      {app.agent.email}
                    </a>
                  )}
                  {app.agent.phone && (
                    <p className="text-xs text-ink-subtle">{app.agent.phone}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right — property, notes, electricity */}
          <div className="lg:col-span-2 space-y-4">
            {/* Property preference */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-ink-subtle" />
                  Property Preference
                </h2>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {app.building && (
                  <div>
                    <p className="text-xs text-ink-subtle font-medium uppercase tracking-wide">Building</p>
                    <p className="text-ink-muted mt-0.5">{app.building.name}</p>
                    {app.building.address && (
                      <p className="text-xs text-ink-subtle">{app.building.address}</p>
                    )}
                  </div>
                )}
                {app.property && (
                  <div>
                    <p className="text-xs text-ink-subtle font-medium uppercase tracking-wide">Unit</p>
                    <p className="text-ink-muted mt-0.5">
                      Unit {app.property.unit_number}
                      {app.property.property_type ? ` — ${app.property.property_type}` : ''}
                    </p>
                    {(app.property.bedrooms != null || app.property.bathrooms != null) && (
                      <p className="text-xs text-ink-subtle">
                        {app.property.bedrooms != null && `${app.property.bedrooms} bed`}
                        {app.property.bedrooms != null && app.property.bathrooms != null && ' · '}
                        {app.property.bathrooms != null && `${app.property.bathrooms} bath`}
                      </p>
                    )}
                  </div>
                )}
                {app.preferred_move_in && (
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Calendar className="h-3.5 w-3.5 text-ink-subtle shrink-0" />
                    Preferred move-in:{' '}
                    {new Date(app.preferred_move_in).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {!app.building && !app.property && (
                  <p className="text-ink-subtle text-xs">No property preference recorded.</p>
                )}
              </CardContent>
            </Card>

            {/* Electricity consent */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Zap className="h-4 w-4 text-ink-subtle" />
                  Electricity
                </h2>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Setup required</span>
                  <span className={app.electricity_setup_required ? 'text-ink font-medium' : 'text-ink-subtle'}>
                    {app.electricity_setup_required ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Consent given</span>
                  <span className={app.electricity_consent_given ? 'text-green-700 font-medium' : 'text-ink-subtle'}>
                    {app.electricity_consent_given ? 'Yes' : 'No'}
                  </span>
                </div>
                {app.electricity_consent_timestamp && (
                  <p className="text-xs text-ink-subtle">
                    Consented{' '}
                    {new Date(app.electricity_consent_timestamp).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {app.electricity_consent_version && ` (v${app.electricity_consent_version})`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Rejection reason */}
            {app.status === 'rejected' && app.rejection_reason && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-red-700">Rejection Reason</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">{app.rejection_reason}</p>
                </CardContent>
              </Card>
            )}

            {/* Internal notes */}
            {app.internal_notes && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink">Internal Notes</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">{app.internal_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Assigned manager */}
            {app.assigned_manager && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-ink">Assigned Manager</h2>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="text-ink-muted">{app.assigned_manager.full_name ?? 'Unknown'}</p>
                  {app.assigned_manager.email && (
                    <p className="text-xs text-ink-subtle mt-0.5">{app.assigned_manager.email}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
