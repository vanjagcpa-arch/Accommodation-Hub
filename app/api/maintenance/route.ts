import { NextResponse } from 'next/server'

const mockJobs = [
  { id: 'm1', title: 'Water damage - ceiling stain', building: 'Parkview Apartments', property: 'Unit 301', priority: 'urgent', status: 'in_progress', due_date: '2026-06-22' },
  { id: 'm2', title: 'Air conditioner not cooling', building: 'Parkview Apartments', property: 'Unit 101', priority: 'high', status: 'new', due_date: '2026-06-25' },
  { id: 'm3', title: 'Broken window lock', building: 'Monash Towers', property: 'Unit 501', priority: 'high', status: 'scheduled', due_date: '2026-06-26' },
  { id: 'm4', title: 'Leaking tap in bathroom', building: 'University Gardens', property: 'Unit 1A', priority: 'medium', status: 'assigned', due_date: '2026-06-27' },
  { id: 'm5', title: 'Dishwasher leaking', building: 'Brunswick Studios', property: 'Unit G02', priority: 'high', status: 'waiting_parts', due_date: '2026-06-28' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  let filtered = mockJobs
  if (status) filtered = filtered.filter(j => j.status === status)
  if (priority) filtered = filtered.filter(j => j.priority === priority)

  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('maintenance_jobs').select('*, buildings(name), properties(unit_number), profiles!assigned_to(full_name)')

  return NextResponse.json({ data: filtered, total: filtered.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  // TODO: Insert into Supabase + create audit log
  return NextResponse.json({ data: { id: 'new-job', ...body, status: 'new' }, message: 'Maintenance job created' }, { status: 201 })
}
