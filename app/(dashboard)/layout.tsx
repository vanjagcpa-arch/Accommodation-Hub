import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import type { HeaderNotification } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

async function getSidebarData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [profileRes, appCountRes, mainCountRes, urgentJobsRes, newAppsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewing']),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true),
      supabase.from('maintenance_jobs')
        .select('id, title, created_at, priority')
        .in('status', OPEN_STATUSES)
        .eq('is_active', true)
        .in('priority', ['urgent', 'high'])
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('applications')
        .select('id, applicant_first_name, applicant_last_name, created_at')
        .eq('status', 'new')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    let companyName = 'AccomHub'
    if (profileRes.data?.company_id) {
      const compRes = await supabase.from('companies').select('name').eq('id', profileRes.data.company_id).maybeSingle()
      if (compRes.data?.name) companyName = compRes.data.name
    }

    const notifications: HeaderNotification[] = [
      ...(urgentJobsRes.data ?? []).map(j => ({
        id: `job-${j.id}`,
        text: `${j.priority === 'urgent' ? 'Urgent' : 'High priority'} job: ${j.title}`,
        time: formatRelativeTime(j.created_at),
        unread: true,
      })),
      ...(newAppsRes.data ?? []).map(a => ({
        id: `app-${a.id}`,
        text: `New application: ${a.applicant_first_name} ${a.applicant_last_name}`,
        time: formatRelativeTime(a.created_at),
        unread: true,
      })),
    ].sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1))

    return {
      userName: profileRes.data?.full_name ?? user.email ?? 'User',
      userRole: profileRes.data?.role ?? 'read_only',
      companyName,
      appCount: appCountRes.count ?? 0,
      mainCount: mainCountRes.count ?? 0,
      notifications,
    }
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const data = await getSidebarData()

  return (
    <div className="h-screen w-full bg-canvas p-2 sm:p-3 lg:p-4">
      <div className="flex h-full w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
        <Sidebar
          companyName={data?.companyName ?? 'AccomHub'}
          userName={data?.userName ?? 'User'}
          userRole={data?.userRole ?? 'read_only'}
          appCount={data?.appCount ?? 0}
          mainCount={data?.mainCount ?? 0}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header notifications={data?.notifications ?? []} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-5 py-6 lg:px-8 lg:py-7">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
