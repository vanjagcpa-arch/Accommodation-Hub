import { NextResponse } from 'next/server'

const mockTenants = [
  { id: 't1', first_name: 'Wei', last_name: 'Zhang', email: 'wei.zhang@student.unimelb.edu.au', phone: '0412 345 678', university: 'University of Melbourne', property: 'Unit 101', building: 'Parkview Apartments' },
  { id: 't2', first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@student.rmit.edu.au', phone: '0423 456 789', university: 'RMIT University', property: 'Unit 1A', building: 'University Gardens' },
  { id: 't3', first_name: 'Carlos', last_name: 'Rodriguez', email: 'carlos.r@student.monash.edu', phone: '0434 567 890', university: 'Monash University', property: 'Unit 501', building: 'Monash Towers' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  let filtered = mockTenants
  if (search) {
    filtered = filtered.filter(t =>
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('tenants').select('*, occupancies!inner(property_id, properties(unit_number, buildings(name)))')

  return NextResponse.json({ data: filtered, total: filtered.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  // TODO: Insert into Supabase
  return NextResponse.json({ data: { id: 'new-tenant', ...body }, message: 'Tenant created' }, { status: 201 })
}
