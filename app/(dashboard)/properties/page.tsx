export const dynamic = 'force-dynamic'

import { getProperties } from '@/lib/properties/queries'
import { getBuildings } from '@/lib/buildings/queries'
import PropertiesClient from './_components/properties-client'

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const filters = {
    q: first(sp.q),
    buildingId: first(sp.building),
    status: first(sp.status),
    type: first(sp.type),
  }

  const [{ properties, error }, { buildings }] = await Promise.all([
    getProperties(filters),
    getBuildings(),
  ])

  return (
    <PropertiesClient
      properties={properties}
      buildings={buildings}
      error={error}
      activeFilters={filters}
    />
  )
}
