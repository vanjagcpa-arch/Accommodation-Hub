import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getMyJobs, getStaffList } from '@/lib/maintenance/queries'
import { MyJobsView } from '../_components/my-jobs-view'

export const dynamic = 'force-dynamic'

export default async function MyJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string | string[] }>
}) {
  const sp = await searchParams
  const staffParam = Array.isArray(sp.staff) ? sp.staff[0] : sp.staff
  let staffId = staffParam ?? null

  if (!staffId) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('maintenance_staff_profiles')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()
        staffId = data?.id ?? null
      }
    } catch { /* Supabase not configured */ }
  }

  const [staffList, jobsData] = await Promise.all([
    getStaffList(),
    staffId ? getMyJobs(staffId) : Promise.resolve(null),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">My Jobs</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {jobsData?.staffProfile
              ? `${jobsData.staffProfile.full_name}${
                  jobsData.staffProfile.trade ? ` · ${jobsData.staffProfile.trade}` : ''
                }`
              : 'Your assigned maintenance jobs'}
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Job</Button>
        </Link>
      </div>
      <MyJobsView staffId={staffId} staffList={staffList} data={jobsData} />
    </div>
  )
}
