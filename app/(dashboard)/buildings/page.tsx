export const dynamic = 'force-dynamic'

import { getBuildings } from '@/lib/buildings/queries'
import BuildingsClient from './_components/buildings-client'

export default async function BuildingsPage() {
  const { buildings, error } = await getBuildings()
  return <BuildingsClient buildings={buildings} error={error} />
}
