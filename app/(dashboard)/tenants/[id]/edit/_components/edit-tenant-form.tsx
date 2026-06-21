'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateTenant, type ActionState } from '@/lib/tenants/actions'

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  student_id: string | null
  university: string | null
  course: string | null
  nationality: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  notes: string | null
}

interface Props {
  tenant: Tenant
}

export function EditTenantForm({ tenant }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateTenant, { error: null })

  useEffect(() => {
    if (state.ok) router.push(`/tenants/${tenant.id}`)
  }, [state.ok, router, tenant.id])

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={tenant.id} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-ink">{state.error}</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" required>First Name</Label>
              <Input id="first_name" name="first_name" defaultValue={tenant.first_name} required />
            </div>
            <div>
              <Label htmlFor="last_name" required>Last Name</Label>
              <Input id="last_name" name="last_name" defaultValue={tenant.last_name} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={tenant.email ?? ''} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={tenant.phone ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={tenant.date_of_birth ?? ''} />
            </div>
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" name="nationality" defaultValue={tenant.nationality ?? ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="university">University</Label>
              <Input id="university" name="university" defaultValue={tenant.university ?? ''} />
            </div>
            <div>
              <Label htmlFor="student_id">Student ID</Label>
              <Input id="student_id" name="student_id" defaultValue={tenant.student_id ?? ''} />
            </div>
          </div>
          <div>
            <Label htmlFor="course">Course / Program</Label>
            <Input id="course" name="course" defaultValue={tenant.course ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={tenant.emergency_contact_name ?? ''} />
            </div>
            <div>
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input id="emergency_contact_relationship" name="emergency_contact_relationship" defaultValue={tenant.emergency_contact_relationship ?? ''} placeholder="e.g. Parent, Sibling" />
            </div>
          </div>
          <div>
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" defaultValue={tenant.emergency_contact_phone ?? ''} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={tenant.notes ?? ''}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href={`/tenants/${tenant.id}`}><Button variant="outline" type="button">Cancel</Button></Link>
        <Button type="submit" loading={pending}>Save Changes</Button>
      </div>
    </form>
  )
}
