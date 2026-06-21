export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getMaintenanceJob, getMaintenanceFormOptions } from '@/lib/maintenance/queries'
import { EditJobForm } from './_components/edit-job-form'

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [{ job, error }, options] = await Promise.all([
    getMaintenanceJob(id),
    getMaintenanceFormOptions(),
  ])

  if (!job && !error) notFound()
  if (!job) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href="/maintenance" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />Maintenance
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {error ?? 'Job not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/maintenance" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Maintenance
        </Link>
        <span className="text-ink-faint">/</span>
        <Link href={`/maintenance/${id}`} className="text-sm text-ink-muted hover:text-ink font-mono">
          {job.job_number ?? id.slice(0, 8)}
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm text-ink font-medium">Edit</span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-ink">Edit Job</h1>
        <p className="text-ink-muted text-sm mt-0.5 truncate">{job.title}</p>
      </div>

      <EditJobForm job={job} options={options} />
    </div>
  )
}
