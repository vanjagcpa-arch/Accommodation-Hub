import { notFound } from 'next/navigation'
import { getMaintenanceJob } from '@/lib/maintenance/queries'
import { JobDetail } from '../_components/job-detail'

export const dynamic = 'force-dynamic'

export default async function MaintenanceJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getMaintenanceJob(id)
  if (!data.job && !data.error) notFound()

  return (
    <JobDetail
      job={data.job}
      comments={data.comments}
      history={data.history}
      checklist={data.checklist}
      costs={data.costs}
      error={data.error}
    />
  )
}
