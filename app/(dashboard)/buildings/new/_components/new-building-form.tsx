'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createBuilding, type ActionState } from '@/lib/buildings/actions'

interface Props {
  managers: { id: string; full_name: string | null }[]
}

export function NewBuildingForm({ managers }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createBuilding, { error: null })

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-ink">{state.error}</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Building Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" required>Building Name</Label>
            <Input id="name" name="name" placeholder="e.g. Parkview Apartments" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Brief description of the building..."
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address" required>Street Address</Label>
            <Input id="address" name="address" placeholder="e.g. 45 Park Street" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suburb" required>Suburb</Label>
              <Input id="suburb" name="suburb" placeholder="e.g. Southbank" required />
            </div>
            <div>
              <Label htmlFor="state" required>State</Label>
              <Select id="state" name="state" placeholder="Select state" required>
                <option value="VIC">Victoria (VIC)</option>
                <option value="NSW">New South Wales (NSW)</option>
                <option value="QLD">Queensland (QLD)</option>
                <option value="SA">South Australia (SA)</option>
                <option value="WA">Western Australia (WA)</option>
                <option value="TAS">Tasmania (TAS)</option>
                <option value="ACT">ACT</option>
                <option value="NT">Northern Territory (NT)</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode" required>Postcode</Label>
              <Input id="postcode" name="postcode" placeholder="e.g. 3006" maxLength={4} required />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select id="country" name="country" defaultValue="Australia">
                <option value="Australia">Australia</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primary_manager_id">Primary Manager</Label>
            <Select id="primary_manager_id" name="primary_manager_id" placeholder="Select manager">
              {managers.length === 0
                ? <option value="" disabled>No staff profiles found</option>
                : managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name ?? '(no name)'}</option>
                  ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 bg-surface-muted rounded-lg border border-line cursor-pointer">
              <input
                type="checkbox"
                name="manages_electricity"
                defaultChecked
                className="mt-0.5 w-4 h-4 rounded border-line text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-ink">Electricity billing</p>
                <p className="text-xs text-ink-muted">Include in electricity module</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 bg-surface-muted rounded-lg border border-line cursor-pointer">
              <input
                type="checkbox"
                name="manages_maintenance"
                defaultChecked
                className="mt-0.5 w-4 h-4 rounded border-line text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-ink">Maintenance</p>
                <p className="text-xs text-ink-muted">Include in maintenance module</p>
              </div>
            </label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Internal notes about this building..."
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>External System IDs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reapit_external_id">Reapit ID</Label>
              <Input id="reapit_external_id" name="reapit_external_id" placeholder="Reapit building ID" />
            </div>
            <div>
              <Label htmlFor="listonce_external_id">ListOnce ID</Label>
              <Input id="listonce_external_id" name="listonce_external_id" placeholder="ListOnce ID" />
            </div>
          </div>
          <div>
            <Label htmlFor="myob_external_id">MYOB ID</Label>
            <Input id="myob_external_id" name="myob_external_id" placeholder="MYOB identifier" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/buildings"><Button variant="outline" type="button">Cancel</Button></Link>
        <Button type="submit" loading={pending}>Create Building</Button>
      </div>
    </form>
  )
}
