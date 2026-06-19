export const dynamic = 'force-dynamic'

import { getApplications, getApplicationFormOptions } from '@/lib/applications/queries'
import ApplicationsClient from './_components/applications-client'

type PageProps = {
  searchParams: Promise<{ tab?: string; q?: string; building?: string; agent?: string }>
}

export default async function ApplicationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = {
    tab: params.tab ?? 'active',
    q: params.q,
    building: params.building,
    agent: params.agent,
  }

  const [{ applications, error }, options] = await Promise.all([
    getApplications(filters),
    getApplicationFormOptions(),
  ])

  return (
    <ApplicationsClient
      applications={applications}
      buildings={options.buildings}
      agents={options.agents}
      error={error}
      filters={filters}
    />
  )
}
