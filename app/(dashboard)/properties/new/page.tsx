import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function NewPropertyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/properties" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Properties
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">New Property</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Property</h1>
        <p className="text-slate-500 text-sm mt-0.5">Add a new property to a building</p>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="building_id" required>Building</Label>
              <Select id="building_id" name="building_id" placeholder="Select building" required>
                <option value="b1">Parkview Apartments — 45 Park Street, Southbank</option>
                <option value="b2">University Gardens — 12 Swanston Street, Carlton</option>
                <option value="b3">Flinders House — 88 Flinders Lane, Melbourne</option>
                <option value="b4">Brunswick Studios — 201 Sydney Road, Brunswick</option>
                <option value="b5">Fitzroy Terrace — 55 Johnston Street, Fitzroy</option>
                <option value="b6">Monash Towers — 900 Dandenong Road, Caulfield East</option>
                <option value="b7">St Kilda Residences — 14 Acland Street, St Kilda</option>
                <option value="b8">Hawthorn Court — 72 Glenferrie Road, Hawthorn</option>
                <option value="b9">Docklands Point — 3 Waterfront Way, Docklands</option>
                <option value="b10">Footscray Heights — 120 Nicholson Street, Footscray</option>
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

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="agent_visible"
                name="agent_visible"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <label htmlFor="agent_visible" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Visible to agents
                </label>
                <p className="text-xs text-slate-500">Allow referral agents to see this property in their availability view</p>
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
                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-slate-700">{feature}</span>
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
            <div>
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={3}
                placeholder="Internal notes (not visible to agents)..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
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
          <Button type="submit">Create Property</Button>
        </div>
      </form>
    </div>
  )
}
