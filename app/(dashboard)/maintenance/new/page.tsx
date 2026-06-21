import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import { NewJobForm } from '../_components/new-job-form'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewMaintenanceJobPage({ searchParams }: Props) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const options = await getMaintenanceFormOptions()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/maintenance" className="inline-flex items-center gap-1 text-[13px] text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />Maintenance
        </Link>
        <h1 className="text-xl font-semibold text-ink mt-2">New Maintenance Request</h1>
        <p className="text-[13px] text-ink-muted mt-0.5">Log a repair or maintenance job against a property.</p>
      </div>

      <NewJobForm
        options={options}
        defaultBuildingId={first(sp.building_id)}
        defaultPropertyId={first(sp.property_id)}
      />
    </div>
  )
}
