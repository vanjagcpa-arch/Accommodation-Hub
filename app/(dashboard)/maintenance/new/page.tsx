import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import { NewJobForm } from '../_components/new-job-form'

export const dynamic = 'force-dynamic'

export default async function NewMaintenanceJobPage() {
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

      <NewJobForm options={options} />
    </div>
  )
}
