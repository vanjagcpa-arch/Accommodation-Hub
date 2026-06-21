'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { updateMaintenanceJob, type ActionState } from '@/lib/maintenance/actions'
import { PRIORITY_ORDER, PRIORITY_META } from '@/lib/maintenance/constants'
import type { MaintenanceJob, MaintenanceFormOptions } from '@/types'

const selectClass =
  'flex h-9 w-full appearance-none rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50'

interface Props {
  job: MaintenanceJob
  options: MaintenanceFormOptions
}

export function EditJobForm({ job, options }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateMaintenanceJob, { error: null })
  const [building, setBuilding] = useState(job.building_id ?? '')
  const [priority, setPriority] = useState(job.priority ?? 'medium')

  const properties = building
    ? options.properties.filter((p) => p.building_id === building)
    : options.properties

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={job.id} />

      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-neg/30 bg-neg/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-neg mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink">{state.error}</p>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" required>Title</Label>
            <Input id="title" name="title" required defaultValue={job.title} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Category</Label>
              <select id="category_id" name="category_id" className={selectClass} defaultValue={job.category_id ?? ''}>
                <option value="">Select category…</option>
                {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" name="priority" className={selectClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-ink-faint">Target response: within {PRIORITY_META[priority as keyof typeof PRIORITY_META]?.slaHours ?? 72}h</p>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea id="description" name="description" rows={3}
              defaultValue={job.description ?? ''}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50 resize-none" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="building_id">Building</Label>
              <select id="building_id" name="building_id" className={selectClass} value={building} onChange={(e) => setBuilding(e.target.value)}>
                <option value="">Select building…</option>
                {options.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="property_id">Property / Room</Label>
              <select id="property_id" name="property_id" className={selectClass} defaultValue={job.property_id ?? ''}>
                <option value="">Select property…</option>
                {properties.map((p) => <option key={p.id} value={p.id}>Unit {p.unit_number}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="tenant_id">Tenant</Label>
              <select id="tenant_id" name="tenant_id" className={selectClass} defaultValue={job.tenant_id ?? ''}>
                <option value="">No tenant / common area</option>
                {options.tenants.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="reported_by_name">Reported by</Label>
              <Input id="reported_by_name" name="reported_by_name" defaultValue={job.reported_by_name ?? ''} placeholder="e.g. Tenant, manager, inspection" />
            </div>
          </div>
          <div>
            <Label htmlFor="preferred_access_window">Preferred access</Label>
            <Input id="preferred_access_window" name="preferred_access_window" defaultValue={job.preferred_access_window ?? ''} placeholder="e.g. Weekdays 9am–4pm" />
          </div>
          <div>
            <Label htmlFor="access_notes">Access notes</Label>
            <textarea id="access_notes" name="access_notes" rows={2}
              defaultValue={job.access_notes ?? ''}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50 resize-none" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimated_cost">Estimated cost (AUD)</Label>
              <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" min="0" defaultValue={job.estimated_cost ?? ''} />
            </div>
            <div>
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={job.due_date ?? ''} />
            </div>
            <div>
              <Label htmlFor="scheduled_date">Scheduled date/time</Label>
              <Input id="scheduled_date" name="scheduled_date" type="datetime-local"
                defaultValue={job.scheduled_date ? job.scheduled_date.slice(0, 16) : ''} />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <select id="source" name="source" className={selectClass} defaultValue={job.source ?? 'manager'}>
                <option value="manager">Manager</option>
                <option value="tenant">Tenant</option>
                <option value="inspection">Inspection</option>
                <option value="recurring">Recurring</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="internal_notes">Internal notes</Label>
            <textarea id="internal_notes" name="internal_notes" rows={2}
              defaultValue={job.internal_notes ?? ''}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring/50 resize-none" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Link href={`/maintenance/${job.id}`} className="text-[13px] text-ink-muted hover:text-ink">Cancel</Link>
        <Button type="submit" loading={pending}>Save Changes</Button>
      </div>
    </form>
  )
}
