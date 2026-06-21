'use client'

import { useActionState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCompany, type ActionState } from '@/lib/companies/actions'

export function SetupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createCompany, { error: null })

  return (
    <form action={formAction} className="bg-surface border border-line rounded-2xl p-6 shadow-panel space-y-4">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-neg/30 bg-neg/5 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink">{state.error}</p>
        </div>
      )}
      <div>
        <Label htmlFor="name" required>Company / Organisation Name</Label>
        <Input id="name" name="name" required placeholder="e.g. Metro Student Living" autoFocus />
      </div>
      <div>
        <Label htmlFor="abn">ABN</Label>
        <Input id="abn" name="abn" placeholder="12 345 678 901" />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" placeholder="123 Main St, Melbourne VIC 3000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="03 9000 0000" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="admin@company.com.au" />
        </div>
      </div>
      <Button type="submit" loading={pending} className="w-full mt-2">
        Create Workspace
      </Button>
    </form>
  )
}
