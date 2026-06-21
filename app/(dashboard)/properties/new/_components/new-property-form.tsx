'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createProperty, type ActionState } from '@/lib/properties/actions'

interface Props {
  buildings: { id: string; name: string; address: string | null; suburb: string | null }[]
  owners: { id: string; first_name: string; last_name: string; company_name: string | null }[]
}

export function NewPropertyForm({ buildings, owners }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createProperty, { error: null })

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
          <p className="text-sm text-ink">{state.error}</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="building_id" required>Building</Label>
            <Select id="building_id" name="building_id" placeholder="Select building" required>
              {buildings.length === 0
                ? <option value="" disabled>No buildings available</option>
                : buildings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.address ? ` — ${b.address}${b.suburb ? `, ${b.suburb}` : ''}` : ''}
                    </option>
                  ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit_number" required>Unit Number</Label>
              <Input id="unit_number" name="unit_number" placeholder="e.g. 101, G01, A" required />
            </div>
            <div>
              <Label htmlFor="property_type">Property Type</Label>
              <Select id="property_type" name="property_type" placeholder="Select type">
                <option value="Studio">Studio</option>
                <option value="1 Bedroom">1 Bedroom</option>
                <option value="2 Bedroom">2 Bedroom</option>
                <option value="3 Bedroom">3 Bedroom</option>
                <option value="4 Bedroom">4 Bedroom</option>
                <option value="Room">Room (Shared)</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="owner_id">Owner / Landlord</Label>
            <Select id="owner_id" name="owner_id">
              <option value="">No owner assigned</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>
                  {o.first_name} {o.last_name}{o.company_name ? ` (${o.company_name})` : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min="0" max="10" defaultValue="1" />
            </div>
            <div>
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min="0.5" max="5" step="0.5" defaultValue="1" />
            </div>
            <div>
              <Label htmlFor="floor_level">Floor Level</Label>
              <Input id="floor_level" name="floor_level" type="number" min="-2" max="100" placeholder="0 = ground" />
            </div>
          </div>

          <div>
            <Label htmlFor="size_sqm">Size (m²)</Label>
            <Input id="size_sqm" name="size_sqm" type="number" step="0.1" placeholder="e.g. 48.5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Financials</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rent_amount">Weekly Rent (AUD)</Label>
              <Input id="rent_amount" name="rent_amount" type="number" step="0.01" placeholder="e.g. 1650.00" />
            </div>
            <div>
              <Label htmlFor="bond_amount">Bond Amount (AUD)</Label>
              <Input id="bond_amount" name="bond_amount" type="number" step="0.01" placeholder="e.g. 3300.00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Availability &amp; Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="available">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="on_hold">On Hold</option>
                <option value="maintenance_hold">Maintenance Hold</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="available_date">Available Date</Label>
              <Input id="available_date" name="available_date" type="date" />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-muted rounded-lg border border-line">
            <input
              type="checkbox"
              id="agent_visible"
              name="agent_visible"
              defaultChecked
              className="w-4 h-4 rounded border-line text-primary focus:ring-primary"
            />
            <div>
              <label htmlFor="agent_visible" className="text-sm font-medium text-ink cursor-pointer">
                Visible to agents
              </label>
              <p className="text-xs text-ink-muted">Allow referral agents to see this property in their availability view</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Features</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Air conditioning', 'Balcony', 'Built-in robes', 'Dishwasher',
              'Furnished', 'Gym access', 'Parking', 'Study desk', 'Intercom',
              'Courtyard access', 'Bike storage', 'High-speed internet',
            ].map((feature) => (
              <label key={feature} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="features"
                  value={feature}
                  className="w-4 h-4 rounded border-line text-primary focus:ring-primary"
                />
                <span className="text-sm text-ink">{feature}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Public Notes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Notes visible to agents and tenants..."
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <textarea
              id="internal_notes"
              name="internal_notes"
              rows={3}
              placeholder="Internal notes (not visible to agents)..."
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
              <Input id="reapit_external_id" name="reapit_external_id" placeholder="Reapit property ID" />
            </div>
            <div>
              <Label htmlFor="listonce_external_id">ListOnce ID</Label>
              <Input id="listonce_external_id" name="listonce_external_id" placeholder="ListOnce ID" />
            </div>
          </div>
          <div>
            <Label htmlFor="ezidebit_code">Ezidebit Code</Label>
            <Input id="ezidebit_code" name="ezidebit_code" placeholder="Ezidebit property code" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Link href="/properties"><Button variant="outline" type="button">Cancel</Button></Link>
        <Button type="submit" loading={pending}>Create Property</Button>
      </div>
    </form>
  )
}
