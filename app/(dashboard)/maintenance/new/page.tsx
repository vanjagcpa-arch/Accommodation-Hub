import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function NewMaintenanceJobPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/maintenance" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Maintenance
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">New Job</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Maintenance Job</h1>
        <p className="text-slate-500 text-sm mt-0.5">Log a new maintenance request or task</p>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" required>Job Title</Label>
              <Input id="title" name="title" placeholder="Brief description of the issue" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue_type">Issue Type</Label>
                <Select id="issue_type" name="issue_type" placeholder="Select type">
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="HVAC">HVAC / Air Conditioning</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Security">Security</option>
                  <option value="Structural">Structural</option>
                  <option value="Pest">Pest Control</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="General">General</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" required>Priority</Label>
                <Select id="priority" name="priority" defaultValue="medium">
                  <option value="urgent">Urgent — Needs immediate attention</option>
                  <option value="high">High — Within 24-48 hours</option>
                  <option value="medium">Medium — Within 1 week</option>
                  <option value="low">Low — When convenient</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Detailed description of the issue, including when it started, any relevant observations..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="building_id">Building</Label>
              <Select id="building_id" name="building_id" placeholder="Select building">
                <option value="b1">Parkview Apartments</option>
                <option value="b2">University Gardens</option>
                <option value="b3">Flinders House</option>
                <option value="b4">Brunswick Studios</option>
                <option value="b5">Fitzroy Terrace</option>
                <option value="b6">Monash Towers</option>
                <option value="b7">St Kilda Residences</option>
                <option value="b8">Hawthorn Court</option>
                <option value="b9">Docklands Point</option>
                <option value="b10">Footscray Heights</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="property_id">Property (Unit)</Label>
              <Select id="property_id" name="property_id" placeholder="Select unit">
                <option value="p1">Unit 101 — Studio</option>
                <option value="p2">Unit 102 — Studio</option>
                <option value="p3">Unit 201 — 1 Bedroom</option>
                <option value="p4">Unit 202 — 1 Bedroom</option>
                <option value="p5">Unit 301 — 2 Bedroom</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="tenant_id">Tenant (if applicable)</Label>
              <Select id="tenant_id" name="tenant_id" placeholder="Select tenant">
                <option value="t1">Wei Zhang — Unit 101, Parkview Apts</option>
                <option value="t2">Priya Sharma — Unit 1A, University Gardens</option>
                <option value="t3">Carlos Rodriguez — Unit 501, Monash Towers</option>
                <option value="t4">Emma Wilson — Unit A02, Hawthorn Court</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scheduling &amp; Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select id="assigned_to" name="assigned_to" placeholder="Assign to a team member">
                  <option value="">Unassigned</option>
                  <option value="t1">Bob Plumber (Maintenance Staff)</option>
                  <option value="t2">Jake Trades (Maintenance Staff)</option>
                  <option value="t3">Mike Fix (Maintenance Staff)</option>
                  <option value="t4">Sarah Chen (Manager)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
            </div>

            <div>
              <Label htmlFor="scheduled_date">Scheduled Date/Time</Label>
              <Input id="scheduled_date" name="scheduled_date" type="datetime-local" />
            </div>

            <div>
              <Label htmlFor="access_notes">Access Notes</Label>
              <Input id="access_notes" name="access_notes" placeholder="e.g. Key in lockbox code 1234, tenant available after 2pm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="internal_notes">Notes</Label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={3}
                placeholder="Internal notes, contractor contact, cost estimates..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-4">
          <Link href="/maintenance"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit">Create Job</Button>
        </div>
      </form>
    </div>
  )
}
