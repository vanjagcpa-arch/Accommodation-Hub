import { NextResponse } from 'next/server'

const mockBuildings = [
  { id: 'b1', name: 'Parkview Apartments', address: '45 Park Street, Southbank VIC 3006', total_properties: 12, occupied: 9 },
  { id: 'b2', name: 'University Gardens', address: '12 Swanston Street, Carlton VIC 3053', total_properties: 20, occupied: 16 },
  { id: 'b3', name: 'Flinders House', address: '88 Flinders Lane, Melbourne VIC 3000', total_properties: 8, occupied: 6 },
  { id: 'b4', name: 'Brunswick Studios', address: '201 Sydney Road, Brunswick VIC 3056', total_properties: 15, occupied: 11 },
  { id: 'b5', name: 'Monash Towers', address: '900 Dandenong Road, Caulfield East VIC 3145', total_properties: 24, occupied: 20 },
]

export async function GET() {
  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('buildings').select('*, profiles!primary_manager_id(full_name)').eq('is_active', true)
  return NextResponse.json({ data: mockBuildings, total: mockBuildings.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  // TODO: Insert into Supabase
  // const supabase = await createClient()
  // const { data, error } = await supabase.from('buildings').insert(body).select().single()
  return NextResponse.json({ data: { id: 'new-building', ...body }, message: 'Building created' }, { status: 201 })
}
