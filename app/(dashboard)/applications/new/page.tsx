export const dynamic = 'force-dynamic'

import { getApplicationFormOptions, getPropertiesForBuilding } from '@/lib/applications/queries'
import NewApplicationClient from './_components/new-application-client'

type PageProps = {
  searchParams: Promise<{ building?: string }>
}

export default async function NewApplicationPage({ searchParams }: PageProps) {
  const { building } = await searchParams

  const [options, propertiesResult] = await Promise.all([
    getApplicationFormOptions(),
    building ? getPropertiesForBuilding(building) : Promise.resolve({ properties: [], error: null }),
  ])

  return (
    <NewApplicationClient
      buildings={options.buildings}
      agents={options.agents}
      managers={options.managers}
      properties={propertiesResult.properties}
      selectedBuilding={building ?? null}
      optionsError={options.error}
    />
  )
}
