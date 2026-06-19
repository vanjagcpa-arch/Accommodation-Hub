import { NextResponse } from 'next/server'

const mockApplications = [
  { id: 'a1', applicant_first_name: 'Mei Lin', applicant_last_name: 'Chen', applicant_email: 'meilin.chen@student.unimelb.edu.au', building: 'Parkview Apartments', property: 'Unit 102', preferred_move_in: '2026-07-01', status: 'reviewing' },
  { id: 'a2', applicant_first_name: 'Arjun', applicant_last_name: 'Patel', applicant_email: 'arjun.p@student.rmit.edu.au', building: 'University Gardens', property: 'Unit 1B', preferred_move_in: '2026-07-01', status: 'new' },
  { id: 'a3', applicant_first_name: 'Sophie', applicant_last_name: 'Thompson', applicant_email: 'sophie.t@student.monash.edu', building: 'Hawthorn Court', property: 'Unit B01', preferred_move_in: '2026-08-01', status: 'approved' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let filtered = mockApplications
  if (status) filtered = filtered.filter(a => a.status === status)

  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('applications').select('*, buildings(name), properties(unit_number), agents(first_name, last_name, agency_name)')

  return NextResponse.json({ data: filtered, total: filtered.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  // TODO: Insert into Supabase, create audit log, send notification
  return NextResponse.json({ data: { id: 'new-application', ...body, status: 'new' }, message: 'Application submitted' }, { status: 201 })
}
