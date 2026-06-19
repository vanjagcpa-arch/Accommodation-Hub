import Link from 'next/link'
import { ChevronLeft, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function NewApplicationPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/applications" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Applications
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">New Application</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Application</h1>
        <p className="text-slate-500 text-sm mt-0.5">Submit a new tenancy application</p>
      </div>

      <form className="space-y-6">
        {/* Applicant Details */}
        <Card>
          <CardHeader><CardTitle>Applicant Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" required>First Name</Label>
                <Input id="first_name" name="applicant_first_name" placeholder="First name" required />
              </div>
              <div>
                <Label htmlFor="last_name" required>Last Name</Label>
                <Input id="last_name" name="applicant_last_name" placeholder="Last name" required />
              </div>
            </div>
            <div>
              <Label htmlFor="email" required>Email Address</Label>
              <Input id="email" name="applicant_email" type="email" placeholder="applicant@example.com" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="applicant_phone" type="tel" placeholder="04xx xxx xxx" />
            </div>
          </CardContent>
        </Card>

        {/* Student Information */}
        <Card>
          <CardHeader><CardTitle>Student Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="student_status">Student Status</Label>
              <Select id="student_status" name="student_status" placeholder="Select status">
                <option value="domestic">Domestic Student</option>
                <option value="international">International Student</option>
                <option value="graduate">Graduate</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University / Institution</Label>
                <Select id="university" name="university" placeholder="Select university">
                  <option>University of Melbourne</option>
                  <option>RMIT University</option>
                  <option>Monash University</option>
                  <option>Swinburne University</option>
                  <option>Victoria University</option>
                  <option>Deakin University</option>
                  <option>La Trobe University</option>
                  <option>Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="course">Course / Program</Label>
                <Input id="course" name="course" placeholder="e.g. Master of Engineering" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Preference */}
        <Card>
          <CardHeader><CardTitle>Property Preference</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="building_id">Preferred Building</Label>
              <Select id="building_id" name="building_id" placeholder="Select building">
                <option value="b1">Parkview Apartments — Southbank</option>
                <option value="b2">University Gardens — Carlton</option>
                <option value="b3">Flinders House — Melbourne CBD</option>
                <option value="b4">Brunswick Studios — Brunswick</option>
                <option value="b5">Fitzroy Terrace — Fitzroy</option>
                <option value="b6">Monash Towers — Caulfield East</option>
                <option value="b7">St Kilda Residences — St Kilda</option>
                <option value="b8">Hawthorn Court — Hawthorn</option>
                <option value="b9">Docklands Point — Docklands</option>
                <option value="b10">Footscray Heights — Footscray</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="property_id">Specific Property (optional)</Label>
              <Select id="property_id" name="property_id" placeholder="Any available property">
                <option value="">Any available property in selected building</option>
                <option value="p2">Unit 102 — Studio — $1,650/wk — Available 1 Jul</option>
                <option value="p4">Unit 202 — 1 Bedroom — $2,100/wk — Available 15 Jul</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="preferred_move_in" required>Preferred Move-in Date</Label>
              <Input id="preferred_move_in" name="preferred_move_in" type="date" required />
            </div>
          </CardContent>
        </Card>

        {/* Electricity Consent */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div>
                <CardTitle>Electricity Setup &amp; Consent</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  For eligible properties, Metro Student Housing can arrange electricity setup on the tenant's behalf with our energy partner.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="electricity_setup_required"
                name="electricity_setup_required"
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <label htmlFor="electricity_setup_required" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Request electricity account setup
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tick this if the tenant needs us to arrange an electricity account for their new property.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm font-semibold text-amber-800">Electricity Consent Declaration</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                By ticking the box below, the applicant consents to Metro Student Housing arranging an electricity account with our nominated energy provider on their behalf. The applicant understands that:
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
          </CardContent>
        </Card>

        {/* Agent / Source */}
        <Card>
          <CardHeader><CardTitle>Referral Source</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="agent_id">Referring Agent</Label>
              <Select id="agent_id" name="agent_id" placeholder="Select agent (or Direct)">
                <option value="">Direct (no agent)</option>
                <option value="ag1">CBD Referrals — Emma Davis</option>
                <option value="ag2">Suburban Lets — Michael Brown</option>
                <option value="ag3">StudyLink Realty — Rachel Wong</option>
                <option value="ag4">Marine Lets — David Park</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="internal_notes">Notes (internal only)</Label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={4}
                placeholder="Internal notes about this application — not visible to applicant or agent..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-4">
          <Link href="/applications"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit">Submit Application</Button>
        </div>
      </form>
    </div>
  )
}
