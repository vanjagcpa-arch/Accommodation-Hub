import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { OPEN_STATUSES } from '@/lib/maintenance/constants'

async function getSidebarData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileRes, appCountRes, mainCountRes] = await Promise.all([
      supabase.from('profiles').select('full_name, role, company_id').eq('id', user.id).maybeSingle(),
      supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['new', 'reviewing']),
      supabase.from('maintenance_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES).eq('is_active', true),
    ])

    let companyName = 'AccomHub'
    if (profileRes.data?.company_id) {
      const compRes = await supabase.from('companies').select('name').eq('id', profileRes.data.company_id).maybeSingle()
      if (compRes.data?.name) companyName = compRes.data.name
    }

    return {
      userName: profileRes.data?.full_name ?? user.email ?? 'User',
      userRole: profileRes.data?.role ?? 'read_only',
      companyName,
      appCount: appCountRes.count ?? 0,
      mainCount: mainCountRes.count ?? 0,
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
          <Header />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="px-5 py-6 lg:px-8 lg:py-7">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
