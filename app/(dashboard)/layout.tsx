import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import type { HeaderNotification } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

async function getSidebarData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const [profileRes, appCountRes, mainCountRes, urgentJobsRes, newAppsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewing']),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true),
      supabase
        .from('maintenance_jobs')
        .select('id, title, created_at')
        .in('priority', ['urgent', 'high'])
        .in('status', OPEN_STATUSES)
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('applications')
        .select('id, created_at, applicant_first_name, applicant_last_name')
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
        text: `Urgent maintenance: ${j.title}`,
        time: formatRelativeTime(j.created_at ?? ''),
        unread: !!j.created_at && j.created_at > fourHoursAgo,
      })),
      ...(newAppsRes.data ?? []).map(a => ({
        id: `app-${a.id}`,
        text: `New application: ${[a.applicant_first_name, a.applicant_last_name].filter(Boolean).join(' ') || 'Applicant'}`,
        time: formatRelativeTime(a.created_at ?? ''),
        unread: !!a.created_at && a.created_at > twoHoursAgo,
      })),
    ].sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0))

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
