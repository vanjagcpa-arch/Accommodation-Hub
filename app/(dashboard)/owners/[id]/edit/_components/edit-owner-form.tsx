'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { updateOwner, type ActionState } from '@/lib/owners/actions'

interface Owner {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  notes: string | null
}

interface Props {
  owner: Owner
}

export function EditOwnerForm({ owner }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateOwner, { error: null })

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={owner.id} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-ink">{state.error}</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Owner Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" required>First Name</Label>
              <Input id="first_name" name="first_name" defaultValue={owner.first_name} required />
            </div>
            <div>
              <Label htmlFor="last_name" required>Last Name</Label>
              <Input id="last_name" name="last_name" defaultValue={owner.last_name} required />
            </div>
          </div>
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" name="company_name" defaultValue={owner.company_name ?? ''} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={owner.email ?? ''} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={owner.phone ?? ''} />
            </div>
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
            defaultValue={owner.notes ?? ''}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/owners"><Button variant="outline" type="button">Cancel</Button></Link>
        <Button type="submit" loading={pending}>Save Changes</Button>
      </div>
    </form>
  )
}
