import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-full bg-canvas p-2 sm:p-3 lg:p-4">
      <div className="flex h-full w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
        <Sidebar />
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
