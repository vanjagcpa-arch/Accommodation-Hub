import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function NewBuildingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/buildings" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Buildings
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">New Building</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Building</h1>
        <p className="text-slate-500 text-sm mt-0.5">Create a new building in your portfolio</p>
      </div>

      <form className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
          </CardHeader>
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
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

        {/* Management */}
        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_manager_id">Primary Manager</Label>
              <Select id="primary_manager_id" name="primary_manager_id" placeholder="Select manager">
                <option value="m1">Sarah Chen (Internal Manager)</option>
                <option value="m2">James Mitchell (Internal Manager)</option>
                <option value="m3">Tom Walsh (Internal Manager)</option>
                <option value="m4">Priya Nair (External Manager)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Internal notes about this building..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* External IDs */}
        <Card>
          <CardHeader>
            <CardTitle>External System IDs</CardTitle>
          </CardHeader>
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link href="/buildings">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit">Create Building</Button>
        </div>
      </form>
    </div>
  )
}
