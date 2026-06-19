'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { createApplication } from '@/lib/applications/actions'

interface Property {
  id: string
  unit_number: string
  bedrooms: number
  bathrooms: number
  rent_amount: number | null
  status: string
}

interface Props {
  buildings: { id: string; name: string }[]
  agents: { id: string; first_name: string; last_name: string; agency_name: string | null }[]
  managers: { id: string; full_name: string | null }[]
  properties: Property[]
  selectedBuilding: string | null
  optionsError: string | null
}

const UNIVERSITIES = [
  'University of Melbourne',
  'RMIT University',
  'Monash University',
  'Swinburne University',
  'Victoria University',
  'Deakin University',
  'La Trobe University',
  'Other',
]

export default function NewApplicationClient({
  buildings,
  agents,
  managers,
  properties,
  selectedBuilding,
  optionsError,
}: Props) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [electricityChecked, setElectricityChecked] = useState(false)

  function onBuildingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const buildingId = e.target.value
    if (buildingId) {
      router.push(`/applications/new?building=${buildingId}`)
    } else {
      router.push('/applications/new')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createApplication({ error: null }, formData)
      if (res.error) {
        setFormError(res.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push('/applications')
        router.refresh()
      }
    })
  }

  const isDbNotConfigured =
    optionsError != null &&
    (optionsError.includes('connect') ||
      optionsError.includes('relation') ||
      optionsError.includes('supabase') ||
      optionsError.includes('NEXT_PUBLIC'))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/applications" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Applications
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="text-sm text-ink font-medium">New Application</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">New Application</h1>
        <p className="text-ink-muted text-sm mt-0.5">Submit a new tenancy application</p>
      </div>

      {optionsError && isDbNotConfigured && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Database not configured</p>
            <p className="text-amber-700 mt-0.5">
              Building and agent options require a connected Supabase database.
            </p>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {formError}
          </div>
        )}

        {/* Applicant Details */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Applicant Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  First Name <span className="text-neg">*</span>
                </label>
                <input
                  name="applicant_first_name"
                  required
                  placeholder="First name"
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Last Name <span className="text-neg">*</span>
                </label>
                <input
                  name="applicant_last_name"
                  required
                  placeholder="Last name"
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Email Address <span className="text-neg">*</span>
              </label>
              <input
                name="applicant_email"
                type="email"
                required
                placeholder="applicant@example.com"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Phone Number</label>
              <input
                name="applicant_phone"
                type="tel"
                placeholder="04xx xxx xxx"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Student Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Student Status</label>
              <select
                name="student_status"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select status…</option>
                <option value="domestic">Domestic Student</option>
                <option value="international">International Student</option>
                <option value="graduate">Graduate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">University / Institution</label>
                <select
                  name="university"
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select university…</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Course / Program</label>
                <input
                  name="course"
                  placeholder="e.g. Master of Engineering"
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Preference */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Property Preference</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Preferred Building</label>
              <select
                name="building_id"
                defaultValue={selectedBuilding ?? ''}
                onChange={onBuildingChange}
                className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select building…</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Specific Unit (optional)
              </label>
              <select
                name="property_id"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any available unit in selected building</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    Unit {p.unit_number}
                    {p.bedrooms != null ? ` — ${p.bedrooms} bed` : ''}
                    {p.rent_amount != null ? ` — $${p.rent_amount.toLocaleString()}/wk` : ''}
                    {p.status !== 'available' ? ` (${p.status.replace(/_/g, ' ')})` : ''}
                  </option>
                ))}
              </select>
              {selectedBuilding && properties.length === 0 && (
                <p className="text-xs text-ink-subtle mt-1">No active units found for this building.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Preferred Move-in Date <span className="text-neg">*</span>
              </label>
              <input
                name="preferred_move_in"
                type="date"
                required
                className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Electricity */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Electricity Setup &amp; Consent</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              For eligible properties, we can arrange electricity setup on the tenant's behalf with our energy partner.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-canvas rounded-lg border border-line">
              <input
                type="checkbox"
                id="electricity_setup_required"
                name="electricity_setup_required"
                onChange={(e) => setElectricityChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-line text-primary focus:ring-primary"
              />
              <div>
                <label htmlFor="electricity_setup_required" className="text-sm font-medium text-ink cursor-pointer">
                  Request electricity account setup
                </label>
                <p className="text-xs text-ink-muted mt-0.5">
                  Tick this if the tenant needs us to arrange an electricity account for their new property.
                </p>
              </div>
            </div>

            {electricityChecked && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Electricity Consent Declaration</p>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  By ticking the box below, the applicant consents to Metro Student Housing arranging an electricity
                  account with our nominated energy provider on their behalf. The applicant understands that:
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside ml-2">
                  <li>Usage will be billed to the tenant at the property's embedded network rate</li>
                  <li>Charges will be processed via Ezidebit direct debit</li>
                  <li>This consent covers the duration of the tenancy</li>
                  <li>The consent can be revoked with 14 days written notice</li>
                </ul>
                <div className="flex items-start gap-3 pt-2 border-t border-amber-200">
                  <input
                    type="checkbox"
                    id="electricity_consent_given"
                    name="electricity_consent_given"
                    className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="electricity_consent_given" className="text-xs font-medium text-amber-800 cursor-pointer">
                    I (the applicant) consent to electricity account setup as described above (v1.0 — June 2026)
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Source */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Referral Source</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Referring Agent</label>
              <select
                name="agent_id"
                className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Direct (no agent)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.agency_name ? `${a.agency_name} — ` : ''}{a.first_name} {a.last_name}
                  </option>
                ))}
              </select>
            </div>
            {managers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Assign to Manager</label>
                <select
                  name="assigned_manager_id"
                  className="w-full text-sm border border-line rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-ink">Internal Notes</h2>
          </CardHeader>
          <CardContent>
            <textarea
              name="internal_notes"
              rows={4}
              placeholder="Internal notes — not visible to applicant or agent…"
              className="w-full text-sm border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-4">
          <Link href="/applications">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Submitting…' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  )
}
