import { NextResponse } from 'next/server'

const mockProperties = [
  { id: 'p1', unit_number: '101', building_id: 'b1', building_name: 'Parkview Apartments', property_type: 'Studio', bedrooms: 0, bathrooms: 1, rent_amount: 1650, status: 'occupied' },
  { id: 'p2', unit_number: '102', building_id: 'b1', building_name: 'Parkview Apartments', property_type: 'Studio', bedrooms: 0, bathrooms: 1, rent_amount: 1650, status: 'available', available_date: '2026-07-01' },
  { id: 'p3', unit_number: '201', building_id: 'b1', building_name: 'Parkview Apartments', property_type: '1 Bedroom', bedrooms: 1, bathrooms: 1, rent_amount: 2100, status: 'occupied' },
  { id: 'p4', unit_number: '1B', building_id: 'b2', building_name: 'University Gardens', property_type: 'Studio', bedrooms: 0, bathrooms: 1, rent_amount: 1450, status: 'available', available_date: '2026-07-01' },
  { id: 'p5', unit_number: 'G01', building_id: 'b4', building_name: 'Brunswick Studios', property_type: 'Studio', bedrooms: 0, bathrooms: 1, rent_amount: 1200, status: 'available', available_date: '2026-06-25' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const buildingId = searchParams.get('building_id')

  let filtered = mockProperties
  if (status) filtered = filtered.filter(p => p.status === status)
  if (buildingId) filtered = filtered.filter(p => p.building_id === buildingId)

  // TODO: Replace with Supabase query:
  // const supabase = await createClient()
  // let query = supabase.from('properties').select('*, buildings(name), profiles!assigned_manager_id(full_name)')
  // if (status) query = query.eq('status', status)
  // if (buildingId) query = query.eq('building_id', buildingId)
  // const { data, error } = await query

  return NextResponse.json({ data: filtered, total: filtered.length })
}

export async function POST(request: Request) {
  const body = await request.json()
  // TODO: Insert into Supabase
  return NextResponse.json({ data: { id: 'new-property', ...body }, message: 'Property created' }, { status: 201 })
}
