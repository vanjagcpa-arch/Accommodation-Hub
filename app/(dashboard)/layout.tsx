import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import type { HeaderNotification } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

async function getSidebarData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()

    const [profileRes, appCountRes, mainCountRes, urgentJobsRes, newAppsRes] = await Promise.all([
      supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewing']),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true),
      supabase
        .from('maintenance_jobs')
        .select('id, title, priority, created_at')
        .in('priority', ['urgent', 'high'])
        .in('status', OPEN_STATUSES)
        .eq('is_active', true)
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('applications')
        .select('id, applicant_first_name, applicant_last_name, created_at')
        .eq('status', 'new')
        .gte('created_at', sevenDaysAgoISO)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    let companyName = 'AccomHub'
    if (profileRes.data?.company_id) {
      const compRes = await supabase.from('companies').select('name').eq('id', profileRes.data.company_id).maybeSingle()
      if (compRes.data?.name) companyName = compRes.data.name
    }

    const urgentNotifs: HeaderNotification[] = (urgentJobsRes.data ?? []).map(j => ({
      id: j.id,
      text: `${j.priority === 'urgent' ? 'Urgent' : 'High priority'} job: ${j.title}`,
      time: formatRelativeTime(j.created_at),
      unread: Date.now() - new Date(j.created_at).getTime() < 4 * 3600000,
    }))

    const appNotifs: HeaderNotification[] = (newAppsRes.data ?? []).map(a => ({
      id: a.id,
      text: `New application: ${a.applicant_first_name} ${a.applicant_last_name}`,
      time: formatRelativeTime(a.created_at),
      unread: Date.now() - new Date(a.created_at).getTime() < 2 * 3600000,
    }))

    const notifications = [...urgentNotifs, ...appNotifs].slice(0, 6)

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
